public with sharing class WorkOrderDetailController {

    @AuraEnabled(cacheable=true)
    public static WorkOrderDetail getWorkOrder(Id recordId) {
        try {
            Work_Order__c wo = [SELECT Id, Name, Status__c, Priority__c, Trade__c, Issue__c, Store_Name__c, City__c, State__c, NTE_Amount__c, Scheduled_Date__c, Due_Date__c, Contractor_Name__c, Completed_Date__c, Invoice_Amount__c, CreatedDate FROM Work_Order__c WHERE Id = :recordId LIMIT 1];
            WorkOrderDetail detail = new WorkOrderDetail();
            detail.id = wo.Id;
            detail.workOrderNumber = wo.Name;
            detail.status = wo.Status__c;
            detail.priority = wo.Priority__c;
            detail.trade = wo.Trade__c;
            detail.issue = wo.Issue__c;
            detail.storeName = wo.Store_Name__c;
            detail.city = wo.City__c;
            detail.state = wo.State__c;
            detail.nteAmount = wo.NTE_Amount__c;
            detail.scheduledDate = wo.Scheduled_Date__c;
            detail.dueDate = wo.Due_Date__c;
            detail.contractorName = wo.Contractor_Name__c;
            detail.completedDate = wo.Completed_Date__c;
            detail.invoiceAmount = wo.Invoice_Amount__c;
            detail.createdDate = wo.CreatedDate;
            return detail;
        } catch (Exception e) {
            throw new AuraHandledException('Error loading work order: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<EstimateRow> getEstimates(Id workOrderId) {
        return new List<EstimateRow>();
    }

    @AuraEnabled(cacheable=true)
    public static List<InvoiceRow> getInvoices(Id workOrderId) {
        return new List<InvoiceRow>();
    }

    public class WorkOrderDetail {
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
        @AuraEnabled public Date scheduledDate;
        @AuraEnabled public Date dueDate;
        @AuraEnabled public String contractorName;
        @AuraEnabled public Date completedDate;
        @AuraEnabled public Decimal invoiceAmount;
        @AuraEnabled public DateTime createdDate;
    }

    public class EstimateRow {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String status;
        @AuraEnabled public Decimal total;
        @AuraEnabled public String updatedDate;
    }

    public class InvoiceRow {
        @AuraEnabled public String id;
        @AuraEnabled public String invoiceNumber;
        @AuraEnabled public String status;
        @AuraEnabled public Decimal total;
        @AuraEnabled public String updatedDate;
    }
}
