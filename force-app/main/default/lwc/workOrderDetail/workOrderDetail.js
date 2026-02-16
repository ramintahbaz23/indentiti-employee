import { LightningElement, api, track } from 'lwc';
import getWorkOrder from '@salesforce/apex/WorkOrderDetailController.getWorkOrder';
import getEstimates from '@salesforce/apex/WorkOrderDetailController.getEstimates';
import getInvoices from '@salesforce/apex/WorkOrderDetailController.getInvoices';

export default class WorkOrderDetail extends LightningElement {
    _recordId;
    @api get recordId() { return this._recordId; }
    set recordId(val) {
        this._recordId = val;
        if (val) this.load();
    }
    @track detail = null;
    @track estimates = [];
    @track invoices = [];
    @track isLoading = true;
    @track error;

    get hasRecordId() {
        return this._recordId && this._recordId.length > 0;
    }

    get workOrderTitle() {
        return this.detail ? `Work Order: ${this.detail.workOrderNumber}` : 'Work Order Detail';
    }

    get formattedNteAmount() {
        if (!this.detail || this.detail.nteAmount == null) return '–';
        return '$' + Number(this.detail.nteAmount).toFixed(2);
    }

    get hasEstimates() {
        return this.estimates && this.estimates.length > 0;
    }

    get hasInvoices() {
        return this.invoices && this.invoices.length > 0;
    }

    get estimatesCount() {
        return this.estimates ? this.estimates.length : 0;
    }

    get invoicesCount() {
        return this.invoices ? this.invoices.length : 0;
    }

    load() {
        if (!this._recordId) return;
        this.isLoading = true;
        Promise.all([
            getWorkOrder({ recordId: this._recordId }),
            getEstimates({ workOrderId: this._recordId }),
            getInvoices({ workOrderId: this._recordId })
        ])
            .then(([wo, est, inv]) => {
                this.detail = wo;
                this.estimates = est || [];
                this.invoices = inv || [];
                this.isLoading = false;
            })
            .catch(err => {
                this.error = err.body?.message || err.message;
                this.detail = null;
                this.isLoading = false;
            });
    }
}
