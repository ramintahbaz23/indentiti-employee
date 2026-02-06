import { LightningElement, api } from 'lwc';

export default class WorkOrderGrid extends LightningElement {
    @api workOrders = [];
    @api isLoading = false;

    get hasWorkOrders() {
        return this.workOrders && this.workOrders.length > 0;
    }

    get workOrderCount() {
        return this.workOrders ? this.workOrders.length : 0;
    }

    handleWorkOrderAction(event) {
        // Re-dispatch to parent
        this.dispatchEvent(new CustomEvent('workorderaction', {
            detail: event.detail
        }));
    }

    handleWorkOrderClick(event) {
        // Re-dispatch to parent
        this.dispatchEvent(new CustomEvent('workorderclick', {
            detail: event.detail
        }));
    }
}


