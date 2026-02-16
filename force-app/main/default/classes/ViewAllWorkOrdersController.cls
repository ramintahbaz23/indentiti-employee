public with sharing class ViewAllWorkOrdersController {

    @AuraEnabled(cacheable=false)
    public static PaginatedResult getWorkOrdersPaginated(Map<String, Object> filters, String searchQuery, String sortColumn, String sortDirection, Integer pageSize, Integer pageNumber) {
        try {
            if (pageSize == null || pageSize < 1) pageSize = 10;
            if (pageNumber == null || pageNumber < 1) pageNumber = 1;

            String whereClause = buildWhereClause(filters, searchQuery);
            String orderClause = buildOrderClause(sortColumn, sortDirection);
            Integer offset = (pageNumber - 1) * pageSize;

            String countQuery = 'SELECT COUNT() FROM Work_Order__c ' + whereClause;
            Integer totalCount = Database.countQuery(countQuery);

            String dataQuery = 'SELECT Id, Name, Status__c, Priority__c, Trade__c, Issue__c, Store_Name__c, City__c, State__c, NTE_Amount__c, Scheduled_Date__c, Contractor_Name__c, Completed_Date__c, Invoice_Amount__c, Due_Date__c, Is_Overdue__c, Days_Overdue__c, CreatedDate FROM Work_Order__c ' + whereClause + orderClause + ' LIMIT ' + pageSize + ' OFFSET ' + offset;

            List<Work_Order__c> workOrders = Database.query(dataQuery);
            List<WorkOrderRow> rows = new List<WorkOrderRow>();
            for (Work_Order__c wo : workOrders) {
                rows.add(new WorkOrderRow(wo));
            }

            PaginatedResult result = new PaginatedResult();
            result.data = rows;
            result.totalCount = totalCount;
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching work orders: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static WorkOrderDashboardController.FilterOptions getFilterOptions() {
        return WorkOrderDashboardController.getFilterOptions();
    }

    private static String buildWhereClause(Map<String, Object> filters, String searchQuery) {
        List<String> conditions = new List<String>();

        if (filters != null) {
            if (filters.containsKey('status') && filters.get('status') != null && String.valueOf(filters.get('status')) != 'All Statuses') {
                conditions.add('Status__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('status'))) + '\'');
            }
            if (filters.containsKey('priority') && filters.get('priority') != null && String.valueOf(filters.get('priority')) != 'All Priorities') {
                conditions.add('Priority__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('priority'))) + '\'');
            }
            if (filters.containsKey('trade') && filters.get('trade') != null && String.valueOf(filters.get('trade')) != 'All Trades') {
                conditions.add('Trade__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('trade'))) + '\'');
            }
            if (filters.containsKey('location') && filters.get('location') != null && String.valueOf(filters.get('location')) != 'All Locations') {
                conditions.add('State__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('location'))) + '\'');
            }
            if (filters.containsKey('contractor') && filters.get('contractor') != null && String.valueOf(filters.get('contractor')) != 'All Contractors') {
                conditions.add('Contractor_Name__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('contractor'))) + '\'');
            }
            if (filters.containsKey('dateRange') && filters.get('dateRange') != null) {
                String dateRange = String.valueOf(filters.get('dateRange'));
                Date startDate = null;
                if (dateRange == 'Today') startDate = Date.today();
                else if (dateRange == 'Last 7 Days') startDate = Date.today().addDays(-7);
                else if (dateRange == 'Last 30 Days') startDate = Date.today().addDays(-30);
                else if (dateRange == 'This Week') startDate = Date.today().toStartOfWeek();
                else if (dateRange == 'This Month') startDate = Date.today().toStartOfMonth();
                if (startDate != null) {
                    DateTime startDateTime = DateTime.newInstance(startDate, Time.newInstance(0, 0, 0, 0));
                    conditions.add('CreatedDate >= ' + startDateTime.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\''));
                }
            }
        }

        if (String.isNotBlank(searchQuery)) {
            String term = '%' + String.escapeSingleQuotes(searchQuery.trim()) + '%';
            conditions.add('(Name LIKE \'' + term + '\' OR Issue__c LIKE \'' + term + '\' OR Store_Name__c LIKE \'' + term + '\' OR City__c LIKE \'' + term + '\' OR State__c LIKE \'' + term + '\' OR Contractor_Name__c LIKE \'' + term + '\' OR Trade__c LIKE \'' + term + '\')');
        }

        if (conditions.isEmpty()) return '';
        return 'WHERE ' + String.join(conditions, ' AND ') + ' ';
    }

    private static String buildOrderClause(String sortColumn, String sortDirection) {
        String dir = (sortDirection == 'desc') ? 'DESC' : 'ASC';
        String field = 'CreatedDate';
        if (sortColumn == 'workOrderNumber') field = 'Name';
        else if (sortColumn == 'status') field = 'Status__c';
        else if (sortColumn == 'priority') field = 'Priority__c';
        else if (sortColumn == 'issue') field = 'Issue__c';
        else if (sortColumn == 'createdDate') field = 'CreatedDate';
        else if (sortColumn == 'trade') field = 'Trade__c';
        else if (sortColumn == 'storeName') field = 'Store_Name__c';
        else if (sortColumn == 'contractorName') field = 'Contractor_Name__c';
        else if (sortColumn == 'nteAmount') field = 'NTE_Amount__c';
        return ' ORDER BY ' + field + ' ' + dir + ' ';
    }

    public class PaginatedResult {
        @AuraEnabled public List<WorkOrderRow> data;
        @AuraEnabled public Integer totalCount;
    }

    public class WorkOrderRow {
        @AuraEnabled public String id;
        @AuraEnabled public String workOrderNumber;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public String issue;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String trade;
        @AuraEnabled public String location;
        @AuraEnabled public String contractorName;
        @AuraEnabled public String nteAmount;

        public WorkOrderRow(Work_Order__c wo) {
            this.id = wo.Id;
            this.workOrderNumber = wo.Name;
            this.status = wo.Status__c != null ? wo.Status__c : '';
            this.priority = wo.Priority__c != null ? wo.Priority__c : '';
            this.issue = wo.Issue__c != null ? wo.Issue__c : '';
            this.createdDate = wo.CreatedDate != null ? wo.CreatedDate.format('MM/dd/yyyy') : '';
            this.trade = wo.Trade__c != null ? wo.Trade__c : '';
            String loc = '';
            if (wo.City__c != null) loc = wo.City__c;
            if (wo.State__c != null) loc += (loc != '' ? ', ' : '') + wo.State__c;
            if (wo.Store_Name__c != null) loc += (loc != '' ? ' ' : '') + wo.Store_Name__c;
            this.location = loc;
            this.contractorName = wo.Contractor_Name__c != null ? wo.Contractor_Name__c : '-';
            this.nteAmount = wo.NTE_Amount__c != null ? '$' + String.valueOf(wo.NTE_Amount__c.setScale(2)) : '-';
        }
    }
}
