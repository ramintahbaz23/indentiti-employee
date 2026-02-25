import { LightningElement, track } from 'lwc';

export default class WorkOrderActivityLog extends LightningElement {
    @track activeFilter = 'all';

    get entries() {
        return [
            { id: '1', name: 'Sarah Johnson', initials: 'SJ', type: 'Internal', typeClass: 'internal', message: 'Contacted store manager to confirm access to back storage area. Awaiting confirmation.', time: '4 days ago' },
            { id: '2', name: 'Client Portal', initials: 'CL', type: 'Client', typeClass: 'client', message: 'Store manager confirmed access. Work can proceed on scheduled date.', time: '3 days ago' },
            { id: '3', name: 'System', initials: 'SY', type: 'System', typeClass: 'system', message: 'Status updated to Action Needed. Quote approved, pending dispatch.', time: '2 days ago' },
            { id: '4', name: 'Mark Johnson', initials: 'MJ', type: 'Internal', typeClass: 'internal', message: 'Reviewed quote. Ready to dispatch pending mall compliance sign-off.', time: '1 day ago' }
        ];
    }

    get filteredEntries() {
        if (this.activeFilter === 'all') return this.entries;
        return this.entries.filter(e => e.type.toLowerCase() === this.activeFilter);
    }

    showAll() { this.activeFilter = 'all'; }
    showInternal() { this.activeFilter = 'internal'; }
    showClient() { this.activeFilter = 'client'; }
    showSystem() { this.activeFilter = 'system'; }
}
