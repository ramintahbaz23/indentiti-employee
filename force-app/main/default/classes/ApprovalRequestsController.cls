public with sharing class ApprovalRequestsController {

    @AuraEnabled(cacheable=false)
    public static PaginatedResult getApprovalRequestsPaginated(Map<String, Object> filters, String searchQuery, String sortColumn, String sortDirection, Integer pageSize, Integer pageNumber) {
        PaginatedResult result = new PaginatedResult();
        result.data = new List<ApprovalRequestRow>();
        result.totalCount = 0;
        return result;
    }

    public class PaginatedResult {
        @AuraEnabled public List<ApprovalRequestRow> data;
        @AuraEnabled public Integer totalCount;
    }

    public class ApprovalRequestRow {
        @AuraEnabled public String id;
        @AuraEnabled public String workOrderNumber;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String status;
        @AuraEnabled public String grandTotal;
    }
}
