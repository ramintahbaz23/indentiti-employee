import { LightningElement, track } from 'lwc';

export default class WorkOrderAlertBanner extends LightningElement {
    @track isVisible = true;

    handleDismiss() {
        this.isVisible = false;
    }
}
