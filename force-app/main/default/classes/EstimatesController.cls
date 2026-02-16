public with sharing class EstimatesController {

    @AuraEnabled(cacheable=false)
    public static PaginatedResult getEstimatesPaginated(Map<String, Object> filters, String searchQuery, String sortColumn, String sortDirection, Integer pageSize, Integer pageNumber) {
        PaginatedResult result = new PaginatedResult();
        result.data = new List<EstimateRow>();
        result.totalCount = 0;
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getMetricCounts() {
        Map<String, Integer> m = new Map<String, Integer>();
        m.put('total', 0);
        m.put('pending', 0);
        m.put('approved', 0);
        m.put('rejected', 0);
        return m;
    }

    public class PaginatedResult {
        @AuraEnabled public List<EstimateRow> data;
        @AuraEnabled public Integer totalCount;
    }

    public class EstimateRow {
        @AuraEnabled public String id;
        @AuraEnabled public String workOrderNumber;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String estimationDate;
        @AuraEnabled public String brand;
        @AuraEnabled public String total;
        @AuraEnabled public String taxAmount;
        @AuraEnabled public String grandTotal;
        @AuraEnabled public String status;
    }
}
