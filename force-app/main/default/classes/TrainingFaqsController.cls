public with sharing class TrainingFaqsController {

    @AuraEnabled(cacheable=true)
    public static List<FaqItem> getFaqs() {
        List<FaqItem> items = new List<FaqItem>();
        return items;
    }

    public class FaqItem {
        @AuraEnabled public String id;
        @AuraEnabled public String question;
        @AuraEnabled public String answer;
    }
}
