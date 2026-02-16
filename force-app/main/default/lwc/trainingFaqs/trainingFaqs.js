import { LightningElement, track, wire } from 'lwc';
import getFaqs from '@salesforce/apex/TrainingFaqsController.getFaqs';

export default class TrainingFaqs extends LightningElement {
    @track faqItems = [];

    get hasFaqs() {
        return this.faqItems && this.faqItems.length > 0;
    }

    get activeSections() {
        return this.faqItems.map(f => f.id).join(',');
    }

    @wire(getFaqs)
    wiredFaqs({ data }) {
        if (data) this.faqItems = data;
    }
}
