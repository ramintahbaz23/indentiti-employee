import { LightningElement, track } from 'lwc';

export default class WorkOrderDetail extends LightningElement {
    @track workOrder = {
        id: 'WO-00000001',
        title: 'Work Order WO-00000001',
        subtitle: 'Heating System Repair',
        status: 'action-needed',
        statusLabel: 'Open',
        priority: 'NPW1',
        issue: 'Heating System Repair',
        createdOn: '02/23/2026 12:08 PM',
        originalEta: '03/04/2026 12:08 PM',
        scheduled: '02/28/2026 12:08 PM',
        division: 'Facility Maintenance',
        classification: 'General Maintenance',
        nteAmount: '$550.00',
        quoteDate: '-',
        completeDate: '-',
        recall: 'NO',
        weather: 'Sunny, 45°F',
        storeLocalTime: '12:08 PM EST',
        requestedBy: 'Mark Johnson',
        description: 'Manager reports needing several ceiling tiles cut and replaced in back of store.'
    };

    @track showAlert = true;

    get headerButtons() {
        const configs = {
            'action-needed': ['Print View', 'Create Child Work Order', 'Dispatch', 'Decline'],
            'awaiting-approval': ['Print View', 'Create Child Work Order', 'Approve', 'Reject'],
            'awaiting-estimate': ['Print View', 'Create Child Work Order', 'Create Estimate'],
            'in-progress': ['Print View', 'Create Child Work Order', 'Escalate'],
            'on-hold': ['Print View', 'Create Child Work Order', 'Resume', 'Decline'],
            'completed': ['Print View']
        };
        return configs[this.workOrder.status] || configs['action-needed'];
    }

    handleDismissAlert() {
        this.showAlert = false;
    }
}
