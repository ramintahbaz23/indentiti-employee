public with sharing class WorkOrderDashboardController {
    
    @AuraEnabled(cacheable=true)
    public static MetricCounts getMetricCounts() {
        MetricCounts counts = new MetricCounts();
        
        try {
            // Urgent - Past Due OR (New without contractor) OR In Progress
            counts.urgent = [
                SELECT COUNT() 
                FROM Work_Order__c 
                WHERE (Is_Overdue__c = true 
                OR (Status__c = 'New' AND (Contractor_Name__c = null OR Contractor_Name__c = ''))
                OR Status__c = 'On-site/In Progress')
            ];
            
            // Pending Approval - Proposal Submitted, Proposal Pending Approval, or On Hold (Pending Schedule)
            counts.pendingApproval = [
                SELECT COUNT() 
                FROM Work_Order__c 
                WHERE Status__c = 'Proposal Submitted' 
                OR Status__c = 'Proposal Pending Approval'
                OR Status__c = 'Pending Schedule'
            ];
            
            // New - Status is New
            counts.newCount = [
                SELECT COUNT() 
                FROM Work_Order__c 
                WHERE Status__c = 'New'
            ];
            
            // Needs Follow Up - Work orders older than 7 days, not completed/invoiced, without contractor
            Date followUpDate = Date.today().addDays(-7);
            DateTime followUpDateTime = DateTime.newInstance(followUpDate, Time.newInstance(0, 0, 0, 0));
            counts.needsFollowUp = [
                SELECT COUNT() 
                FROM Work_Order__c 
                WHERE CreatedDate < :followUpDateTime
                AND Status__c != 'Work Complete'
                AND Status__c != 'Invoice Submitted'
                AND (Contractor_Name__c = null OR Contractor_Name__c = '')
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching metric counts: ' + e.getMessage());
        }
        
        return counts;
    }
    
    @AuraEnabled(cacheable=false)
    public static List<WorkOrderWrapper> getWorkOrders(Map<String, Object> filters) {
        try {
            String whereClause = buildWhereClause(filters);
            String query = 'SELECT Id, Name, Status__c, Priority__c, Trade__c, Issue__c, ' +
                          'Store_Name__c, City__c, State__c, NTE_Amount__c, ' +
                          'Scheduled_Date__c, Contractor_Name__c, Completed_Date__c, ' +
                          'Invoice_Amount__c, Due_Date__c, Is_Overdue__c, Days_Overdue__c, ' +
                          'CreatedDate ' +
                          'FROM Work_Order__c ' +
                          whereClause +
                          ' ORDER BY CreatedDate DESC LIMIT 500';
            
            List<Work_Order__c> workOrders = Database.query(query);
            List<WorkOrderWrapper> wrappers = new List<WorkOrderWrapper>();
            
            for (Work_Order__c wo : workOrders) {
                wrappers.add(new WorkOrderWrapper(wo));
            }
            
            return wrappers;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching work orders: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static FilterOptions getFilterOptions() {
        FilterOptions options = new FilterOptions();
        
        try {
            // Get picklist values for Status
            Schema.DescribeFieldResult statusField = Work_Order__c.Status__c.getDescribe();
            List<Schema.PicklistEntry> statusEntries = statusField.getPicklistValues();
            options.statuses = new List<String>();
            for (Schema.PicklistEntry entry : statusEntries) {
                options.statuses.add(entry.getLabel());
            }
            
            // Get picklist values for Priority
            Schema.DescribeFieldResult priorityField = Work_Order__c.Priority__c.getDescribe();
            List<Schema.PicklistEntry> priorityEntries = priorityField.getPicklistValues();
            options.priorities = new List<String>();
            for (Schema.PicklistEntry entry : priorityEntries) {
                options.priorities.add(entry.getLabel());
            }
            
            // Get picklist values for Trade
            Schema.DescribeFieldResult tradeField = Work_Order__c.Trade__c.getDescribe();
            List<Schema.PicklistEntry> tradeEntries = tradeField.getPicklistValues();
            options.trades = new List<String>();
            for (Schema.PicklistEntry entry : tradeEntries) {
                options.trades.add(entry.getLabel());
            }
            
            // Get unique States from existing work orders
            List<AggregateResult> stateResults = [
                SELECT State__c 
                FROM Work_Order__c 
                WHERE State__c != null 
                GROUP BY State__c 
                ORDER BY State__c
            ];
            options.states = new List<String>();
            for (AggregateResult ar : stateResults) {
                String state = (String)ar.get('State__c');
                if (state != null && state != '') {
                    options.states.add(state);
                }
            }
            
            // Get unique Contractors from existing work orders
            List<AggregateResult> contractorResults = [
                SELECT Contractor_Name__c 
                FROM Work_Order__c 
                WHERE Contractor_Name__c != null 
                GROUP BY Contractor_Name__c 
                ORDER BY Contractor_Name__c
            ];
            options.contractors = new List<String>();
            for (AggregateResult ar : contractorResults) {
                String contractor = (String)ar.get('Contractor_Name__c');
                if (contractor != null && contractor != '') {
                    options.contractors.add(contractor);
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching filter options: ' + e.getMessage());
        }
        
        return options;
    }
    
    private static String buildWhereClause(Map<String, Object> filters) {
        List<String> conditions = new List<String>();
        
        if (filters != null) {
            // Status filter
            if (filters.containsKey('status') && filters.get('status') != null && String.valueOf(filters.get('status')) != 'All Statuses') {
                conditions.add('Status__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('status'))) + '\'');
            }
            
            // Priority filter
            if (filters.containsKey('priority') && filters.get('priority') != null && String.valueOf(filters.get('priority')) != 'All Priorities') {
                conditions.add('Priority__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('priority'))) + '\'');
            }
            
            // Trade filter
            if (filters.containsKey('trade') && filters.get('trade') != null && String.valueOf(filters.get('trade')) != 'All Trades') {
                conditions.add('Trade__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('trade'))) + '\'');
            }
            
            // Location/State filter
            if (filters.containsKey('location') && filters.get('location') != null && String.valueOf(filters.get('location')) != 'All Locations') {
                conditions.add('State__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('location'))) + '\'');
            }
            
            // Contractor filter
            if (filters.containsKey('contractor') && filters.get('contractor') != null && String.valueOf(filters.get('contractor')) != 'All Contractors') {
                conditions.add('Contractor_Name__c = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('contractor'))) + '\'');
            }
            
            // Date range filter
            if (filters.containsKey('dateRange') && filters.get('dateRange') != null) {
                String dateRange = String.valueOf(filters.get('dateRange'));
                Date startDate;
                
                if (dateRange == 'Today') {
                    startDate = Date.today();
                } else if (dateRange == 'Last 7 Days') {
                    startDate = Date.today().addDays(-7);
                } else if (dateRange == 'Last 30 Days') {
                    startDate = Date.today().addDays(-30);
                } else if (dateRange == 'This Week') {
                    startDate = Date.today().toStartOfWeek();
                } else if (dateRange == 'This Month') {
                    startDate = Date.today().toStartOfMonth();
                }
                
                if (startDate != null) {
                    DateTime startDateTime = DateTime.newInstance(startDate, Time.newInstance(0, 0, 0, 0));
                    String dateStr = startDateTime.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
                    conditions.add('CreatedDate >= ' + dateStr);
                }
            }
            
            // Quick filter: Metric-based filters
            if (filters.containsKey('quickFilter') && filters.get('quickFilter') != null) {
                String quickFilter = String.valueOf(filters.get('quickFilter'));
                if (quickFilter == 'Urgent') {
                    conditions.add('(Is_Overdue__c = true OR (Status__c = \'New\' AND (Contractor_Name__c = null OR Contractor_Name__c = \'\')) OR Status__c = \'On-site/In Progress\')');
                } else if (quickFilter == 'Pending Approval') {
                    conditions.add('(Status__c = \'Proposal Submitted\' OR Status__c = \'Proposal Pending Approval\' OR Status__c = \'Pending Schedule\')');
                } else if (quickFilter == 'New') {
                    conditions.add('Status__c = \'New\'');
                } else if (quickFilter == 'Needs Follow Up') {
                    Date followUpDate = Date.today().addDays(-7);
                    DateTime followUpDateTime = DateTime.newInstance(followUpDate, Time.newInstance(0, 0, 0, 0));
                    String dateStr = followUpDateTime.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
                    conditions.add('CreatedDate < ' + dateStr + ' AND Status__c != \'Work Complete\' AND Status__c != \'Invoice Submitted\' AND (Contractor_Name__c = null OR Contractor_Name__c = \'\')');
                }
            }
        }
        
        if (conditions.isEmpty()) {
            return '';
        }
        
        return 'WHERE ' + String.join(conditions, ' AND ') + ' ';
    }
    
    // Wrapper classes
    public class MetricCounts {
        @AuraEnabled public Integer urgent = 0;
        @AuraEnabled public Integer pendingApproval = 0;
        @AuraEnabled public Integer newCount = 0;
        @AuraEnabled public Integer needsFollowUp = 0;
    }
    
    public class FilterOptions {
        @AuraEnabled public List<String> statuses = new List<String>();
        @AuraEnabled public List<String> priorities = new List<String>();
        @AuraEnabled public List<String> trades = new List<String>();
        @AuraEnabled public List<String> states = new List<String>();
        @AuraEnabled public List<String> contractors = new List<String>();
    }
    
    public class WorkOrderWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String workOrderNumber;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public String trade;
        @AuraEnabled public String issue;
        @AuraEnabled public String storeName;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public Decimal nteAmount;
        @AuraEnabled public DateTime scheduledDate;
        @AuraEnabled public String contractorName;
        @AuraEnabled public Date completedDate;
        @AuraEnabled public Decimal invoiceAmount;
        @AuraEnabled public Date dueDate;
        @AuraEnabled public Boolean isOverdue;
        @AuraEnabled public Integer daysOverdue;
        @AuraEnabled public DateTime createdDate;
        
        public WorkOrderWrapper(Work_Order__c wo) {
            this.id = wo.Id;
            this.workOrderNumber = wo.Name;
            this.status = wo.Status__c;
            this.priority = wo.Priority__c;
            this.trade = wo.Trade__c;
            this.issue = wo.Issue__c;
            this.storeName = wo.Store_Name__c;
            this.city = wo.City__c;
            this.state = wo.State__c;
            this.nteAmount = wo.NTE_Amount__c != null ? wo.NTE_Amount__c : 550.00;
            this.scheduledDate = wo.Scheduled_Date__c;
            this.contractorName = wo.Contractor_Name__c;
            this.completedDate = wo.Completed_Date__c;
            this.invoiceAmount = wo.Invoice_Amount__c;
            this.dueDate = wo.Due_Date__c;
            this.isOverdue = wo.Is_Overdue__c;
            this.daysOverdue = wo.Days_Overdue__c != null ? wo.Days_Overdue__c.intValue() : 0;
            this.createdDate = wo.CreatedDate;
        }
    }
}

