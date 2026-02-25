import { LightningElement, track } from 'lwc';

export default class NeedsAttentionTable extends LightningElement {
    @track items = [
        { id: '1', category: 'Emergency Tickets', workOrder: 'WO-00000001', client: 'Acme Corp', status: 'Open', reason: 'Safety issue', slaAge: '0d', action: 'Open WO', priority: 'p1' },
        { id: '2', category: 'Escalations', workOrder: 'WO-00000002', client: 'Retail Co', status: 'In Progress', reason: 'Client escalation', slaAge: '2d', action: 'Respond', priority: 'p2' },
        { id: '3', category: 'Unread Client Note', workOrder: 'WO-00000007', client: 'Metro Signs', status: 'In Progress', reason: 'Client note via portal, unread', slaAge: '1d', action: 'Read & Respond', priority: 'p2' },
        { id: '4', category: 'Missing Required Media', workOrder: 'WO-00000003', client: 'Mall Tenant A', status: 'Scheduled', reason: 'Pre-work photos missing', slaAge: '5d', action: 'Upload Media', priority: 'p3' },
        { id: '5', category: 'Media Not Consolidated', workOrder: 'WO-00000007', client: 'Child WO Parent', status: 'Scheduled', reason: 'Child photos not rolled up', slaAge: '2d', action: 'Consolidate', priority: 'p2' },
        { id: '6', category: 'Quotes Pending Send', workOrder: 'WO-00000004', client: 'Store B', status: 'Pending', reason: 'Quote approved, not sent', slaAge: '1d', action: 'Send Quote', priority: 'p3' },
        { id: '7', category: 'Mall Alert / Compliance', workOrder: 'WO-00000006', client: 'Mall West', status: 'Open', reason: 'Compliance requirements not acknowledged', slaAge: '0d', action: 'Acknowledge', priority: 'p1' },
        { id: '8', category: 'Quote Status Conflict', workOrder: 'WO-00000005', client: 'Chain X', status: 'On Hold', reason: 'Status mismatch', slaAge: '3d', action: 'Resolve', priority: 'p2' }
    ];

    @track expandedRow = null;

    get itemCount() {
        return this.items.length;
    }

    get cardTitle() {
        return `Needs Attention (${this.itemCount})`;
    }

    handleRowToggle(event) {
        const rowId = event.currentTarget.dataset.id;
        this.expandedRow = this.expandedRow === rowId ? null : rowId;
    }

    get itemsWithState() {
        const expandedId = this.expandedRow;
        return this.items.map(item => ({
            ...item,
            isExpanded: expandedId === item.id,
            categoryClass: this.getCategoryClass(item.priority),
            drawerKey: item.id + '-drawer',
            isExpandedIcon: expandedId === item.id ? 'utility:chevrondown' : 'utility:chevronright'
        }));
    }

    handleAction(event) {
        const id = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('viewworkorder', { detail: { id }, bubbles: true, composed: true }));
    }

    getCategoryClass(priority) {
        if (priority === 'p1') return 'slds-text-color_error';
        if (priority === 'p2') return 'category-amber';
        return 'category-blue';
    }
}
