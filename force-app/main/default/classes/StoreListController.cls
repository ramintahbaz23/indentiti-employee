public with sharing class StoreListController {

    @AuraEnabled(cacheable=false)
    public static PaginatedResult getStoresPaginated(Map<String, Object> filters, String searchQuery, String sortColumn, String sortDirection, Integer pageSize, Integer pageNumber) {
        try {
            if (pageSize == null || pageSize < 1) pageSize = 10;
            if (pageNumber == null || pageNumber < 1) pageNumber = 1;

            String whereClause = buildWhereClause(filters, searchQuery);
            String orderClause = buildOrderClause(sortColumn, sortDirection);
            Integer offset = (pageNumber - 1) * pageSize;

            String countQuery = 'SELECT COUNT() FROM Account ' + whereClause;
            Integer totalCount = Database.countQuery(countQuery);

            String dataQuery = 'SELECT Id, Name, AccountNumber, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, ParentId FROM Account ' + whereClause + orderClause + ' LIMIT ' + pageSize + ' OFFSET ' + offset;

            List<Account> accounts = Database.query(dataQuery);
            List<StoreRow> rows = new List<StoreRow>();
            for (Account a : accounts) {
                rows.add(new StoreRow(a));
            }

            PaginatedResult result = new PaginatedResult();
            result.data = rows;
            result.totalCount = totalCount;
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching stores: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static StoreDetail getStore(Id recordId) {
        try {
            Account a = [SELECT Id, Name, AccountNumber, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode FROM Account WHERE Id = :recordId LIMIT 1];
            StoreDetail d = new StoreDetail();
            d.id = a.Id;
            d.accountName = a.Name;
            d.storeNumber = a.AccountNumber;
            d.phone = a.Phone;
            d.shippingStreet = a.BillingStreet;
            d.city = a.BillingCity;
            d.state = a.BillingState;
            d.zipCode = a.BillingPostalCode;
            return d;
        } catch (Exception e) {
            throw new AuraHandledException('Error loading store: ' + e.getMessage());
        }
    }

    private static String buildWhereClause(Map<String, Object> filters, String searchQuery) {
        List<String> conditions = new List<String>();
        if (String.isNotBlank(searchQuery)) {
            String term = '%' + String.escapeSingleQuotes(searchQuery.trim()) + '%';
            conditions.add('(Name LIKE \'' + term + '\' OR AccountNumber LIKE \'' + term + '\' OR BillingCity LIKE \'' + term + '\' OR BillingState LIKE \'' + term + '\')');
        }
        if (filters != null && filters.containsKey('state') && filters.get('state') != null && String.valueOf(filters.get('state')) != 'all') {
            conditions.add('BillingState = \'' + String.escapeSingleQuotes(String.valueOf(filters.get('state'))) + '\'');
        }
        if (conditions.isEmpty()) return '';
        return 'WHERE ' + String.join(conditions, ' AND ') + ' ';
    }

    private static String buildOrderClause(String sortColumn, String sortDirection) {
        String dir = (sortDirection == 'desc') ? 'DESC' : 'ASC';
        String field = 'Name';
        if (sortColumn == 'storeNumber') field = 'AccountNumber';
        else if (sortColumn == 'city') field = 'BillingCity';
        else if (sortColumn == 'state') field = 'BillingState';
        return ' ORDER BY ' + field + ' ' + dir + ' ';
    }

    public class PaginatedResult {
        @AuraEnabled public List<StoreRow> data;
        @AuraEnabled public Integer totalCount;
    }

    public class StoreRow {
        @AuraEnabled public String id;
        @AuraEnabled public String accountName;
        @AuraEnabled public String storeNumber;
        @AuraEnabled public String phone;
        @AuraEnabled public String shippingStreet;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String parentCompany;
        @AuraEnabled public String account;

        public StoreRow(Account a) {
            this.id = a.Id;
            this.accountName = a.Name != null ? a.Name : '-';
            this.storeNumber = a.AccountNumber != null ? a.AccountNumber : '-';
            this.phone = a.Phone != null ? a.Phone : '-';
            this.shippingStreet = a.BillingStreet != null ? a.BillingStreet : '-';
            this.city = a.BillingCity != null ? a.BillingCity : '-';
            this.state = a.BillingState != null ? a.BillingState : '-';
            this.parentCompany = '-';
            this.account = a.Name != null ? a.Name : '-';
        }
    }

    public class StoreDetail {
        @AuraEnabled public String id;
        @AuraEnabled public String accountName;
        @AuraEnabled public String storeNumber;
        @AuraEnabled public String phone;
        @AuraEnabled public String shippingStreet;
        @AuraEnabled public String city;
        @AuraEnabled public String state;
        @AuraEnabled public String zipCode;
    }
}
