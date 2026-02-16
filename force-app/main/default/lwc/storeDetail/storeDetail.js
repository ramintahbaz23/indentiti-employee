import { LightningElement, api, track } from 'lwc';
import getStore from '@salesforce/apex/StoreListController.getStore';

export default class StoreDetail extends LightningElement {
    _recordId;
    @api get recordId() { return this._recordId; }
    set recordId(val) { this._recordId = val; if (val) this.load(); }
    @track detail = null;
    @track isLoading = false;

    get hasRecordId() { return this._recordId && this._recordId.length > 0; }
    get storeTitle() { return this.detail ? this.detail.accountName : 'Store Detail'; }

    load() {
        if (!this._recordId) return;
        this.isLoading = true;
        getStore({ recordId: this._recordId })
            .then(result => { this.detail = result; this.isLoading = false; })
            .catch(() => { this.detail = null; this.isLoading = false; });
    }
}
