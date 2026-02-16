public with sharing class InvoicesController {

    @AuraEnabled(cacheable=false)
    public static PaginatedResult getInvoicesPaginated(Map<String, Object> filters, String searchQuery, String sortColumn, String sortDirection, Integer pageSize, Integer pageNumber) {
        PaginatedResult result = new PaginatedResult();
        result.data = new List<InvoiceRow>();
        result.totalCount = 0;
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Decimal> getSummaryMetrics() {
        Map<String, Decimal> m = new Map<String, Decimal>();
        m.put('total', 0);
        m.put('paidAmount', 0);
        m.put('paidTax', 0);
        return m;
    }

    public class PaginatedResult {
        @AuraEnabled public List<InvoiceRow> data;
        @AuraEnabled public Integer totalCount;
    }

    public class InvoiceRow {
        @AuraEnabled public String id;
        @AuraEnabled public String ticketNumber;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String invoiceNumber;
        @AuraEnabled public String total;
        @AuraEnabled public String status;
    }
}
