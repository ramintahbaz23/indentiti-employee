import { LightningElement } from 'lwc';

export default class WorkOrderFinancialSummary extends LightningElement {
    get financial() {
        return {
            nteAmount: '$550.00',
            quoteAmount: '$520.00',
            quoteStatus: 'Awaiting Approval',
            quoteStatusClass: 'slds-text-color_weak',
            quoteDate: '02/23/2026',
            invoiceTotal: '$0.00',
            balanceDue: '$520.00',
            paymentStatus: 'Unpaid',
            poNumber: 'PO-2026-0042'
        };
    }
}
