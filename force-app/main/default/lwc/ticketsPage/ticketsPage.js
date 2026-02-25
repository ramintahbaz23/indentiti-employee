import { LightningElement, track } from 'lwc';

export default class TicketsPage extends LightningElement {
    @track activeTab = 'all';
    @track searchTerm = '';
    @track currentPage = 1;
    @track pageSize = 25;
    @track allSelected = false;
    @track tabs = [
        { label: 'All Tickets (5)', value: 'all', cssClass: 'filter-tab filter-tab_active' },
        { label: 'Pending (3)', value: 'Pending', cssClass: 'filter-tab' },
        { label: 'Approved (2)', value: 'Approved', cssClass: 'filter-tab' },
        { label: 'Rejected (0)', value: 'Rejected', cssClass: 'filter-tab' }
    ];

    pageSizeOptions = [
        { label: '10 per page', value: '10' },
        { label: '25 per page', value: '25' },
        { label: '50 per page', value: '50' }
    ];

    kpis = [
        { id: '1', label: 'PENDING REQUESTS', value: '3', valueClass: 'kpi-value' },
        { id: '2', label: 'APPROVED', value: '2', valueClass: 'kpi-value' },
        { id: '3', label: 'REJECTED', value: '0', valueClass: 'kpi-value' },
        { id: '4', label: 'TOTAL COUNT', value: '5', valueClass: 'kpi-value kpi-value_total' }
    ];

    @track tickets = [
        { id: '1', workOrderNumber: 'WO-00149331', detailUrl: '#', created: '02/20/2026', priority: 'CRITICAL', priorityClass: 'priority-critical', trade: 'Plumbing', storeLocation: 'Cerritos, CA Warhammer', assignedTo: 'Mark Johnson', slaAge: '0d', slaClass: 'sla-red', total: '$500.00', grandTotal: '$540.00', statusLabel: 'Pending', statusBadgeClass: 'slds-badge', selected: false },
        { id: '2', workOrderNumber: 'WO-00150125', detailUrl: '#', created: '02/13/2026', priority: 'NPW1', priorityClass: 'priority-npw1', trade: 'Janitorial', storeLocation: 'Irvine, CA Purple Store', assignedTo: 'Sarah Johnson', slaAge: '2d', slaClass: 'sla-amber', total: '$410.00', grandTotal: '$442.80', statusLabel: 'Manager Approved', statusBadgeClass: 'slds-badge slds-theme_success', selected: false },
        { id: '3', workOrderNumber: 'WO-00150298', detailUrl: '#', created: '02/07/2026', priority: 'NPW1', priorityClass: 'priority-npw1', trade: 'Electrical', storeLocation: 'Portland, OR Purple Store', assignedTo: 'Mark Johnson', slaAge: '5d', slaClass: 'sla-neutral', total: '$1,090.00', grandTotal: '$1,177.20', statusLabel: 'Client Approved', statusBadgeClass: 'slds-badge slds-theme_success', selected: false },
        { id: '4', workOrderNumber: 'WO-00149887', detailUrl: '#', created: '02/22/2026', priority: 'NPW1', priorityClass: 'priority-npw1', trade: 'Lighting', storeLocation: 'Bakersfield, CA Purple Store', assignedTo: 'Sarah Johnson', slaAge: '1d', slaClass: 'sla-amber', total: '$2,450.00', grandTotal: '$2,646.00', statusLabel: 'Pending', statusBadgeClass: 'slds-badge', selected: false },
        { id: '5', workOrderNumber: 'WO-00150438', detailUrl: '#', created: '02/12/2026', priority: 'NPW1', priorityClass: 'priority-npw1', trade: 'Fire Services', storeLocation: 'Miami, FL Purple Store', assignedTo: 'Mark Johnson', slaAge: '3d', slaClass: 'sla-neutral', total: '$4,550.00', grandTotal: '$4,914.00', statusLabel: 'Pending', statusBadgeClass: 'slds-badge', selected: false }
    ];

    get pageSizeValue() {
        return String(this.pageSize);
    }

    get totalCount() {
        return this.tickets.length;
    }

    get filteredTicketsAll() {
        let results = this.tickets;
        if (this.activeTab !== 'all') {
            results = results.filter(t => t.statusLabel.toLowerCase().includes(this.activeTab.toLowerCase()));
        }
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            results = results.filter(t =>
                t.workOrderNumber.toLowerCase().includes(term) ||
                t.trade.toLowerCase().includes(term) ||
                t.storeLocation.toLowerCase().includes(term)
            );
        }
        return results;
    }

    get filteredTickets() {
        const all = this.filteredTicketsAll;
        const start = (this.currentPage - 1) * this.pageSize;
        return all.slice(start, start + this.pageSize);
    }

    get paginationLabel() {
        const total = this.filteredTicketsAll.length;
        const start = total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, total);
        return total === 0 ? '0 requests' : `${start}–${end} of ${total} requests`;
    }

    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage * this.pageSize >= this.filteredTicketsAll.length;
    }

    handleTabClick(event) {
        this.activeTab = event.currentTarget.dataset.value;
        this.currentPage = 1;
        this.tabs = this.tabs.map(tab => ({
            ...tab,
            cssClass: tab.value === this.activeTab ? 'filter-tab filter-tab_active' : 'filter-tab'
        }));
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
    }

    handleSelectAll() {
        this.allSelected = !this.allSelected;
        this.tickets = this.tickets.map(t => ({ ...t, selected: this.allSelected }));
    }

    handleSelectAllCheckbox(event) {
        const checked = event.target.checked;
        this.allSelected = checked;
        this.tickets = this.tickets.map(t => ({ ...t, selected: checked }));
    }

    handleRowCheckboxChange(event) {
        const id = event.target.dataset.id;
        this.tickets = this.tickets.map(t => (t.id === id ? { ...t, selected: event.target.checked } : t));
    }

    handleExport() {}
    handleCreate() {}
    handleFilters() {}
    handlePrevious() {
        if (this.currentPage > 1) this.currentPage--;
    }
    handleNext() {
        this.currentPage++;
    }
    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.currentPage = 1;
    }
}
