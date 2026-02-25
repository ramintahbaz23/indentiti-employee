import { LightningElement, track } from 'lwc';

export default class WorkOrderListView extends LightningElement {
    @track activeTab = 'all';
    @track searchTerm = '';
    @track currentPage = 1;
    @track activeFilters = [];
    @track tabs = [
        { label: 'All (13)', value: 'all', cssClass: 'filter-tab filter-tab_active' },
        { label: 'Action Needed (3)', value: 'Action Needed', cssClass: 'filter-tab' },
        { label: 'In Progress (2)', value: 'In Progress', cssClass: 'filter-tab' },
        { label: 'Awaiting Approval (1)', value: 'Awaiting Approval', cssClass: 'filter-tab' },
        { label: 'Completed (5)', value: 'Completed', cssClass: 'filter-tab' }
    ];
    pageSize = 10;

    workOrders = [
        { id: '1', workOrderNumber: 'WO-00150298', detailUrl: '#', statusLabel: 'Action Needed', statusClass: 'status-action-needed', priority: 'CRITICAL', priorityClass: 'priority-critical', issue: 'Power Outage Investigation', createdDate: 'Feb 25, 2026', endDate: 'Feb 24, 2026', trade: 'Electrical', storeLocation: 'Portland, OR Purple Store #2105', nte: '$1,200.00' },
        { id: '2', workOrderNumber: 'WO-00149331', detailUrl: '#', statusLabel: 'Action Needed', statusClass: 'status-action-needed', priority: 'CRITICAL', priorityClass: 'priority-critical', issue: 'Toilet Repair - Emergency', createdDate: 'Feb 20, 2026', endDate: 'Feb 28, 2026', trade: 'Plumbing', storeLocation: 'Cerritos, CA Warhammer - Rancho Vista #0407', nte: '$550.00' },
        { id: '3', workOrderNumber: 'WO-00150125', detailUrl: '#', statusLabel: 'In Progress', statusClass: 'status-in-progress', priority: 'NPW1', priorityClass: 'priority-npw1', issue: 'Window Cleaning - Quarterly', createdDate: 'Feb 22, 2026', endDate: 'Feb 27, 2026', trade: 'Janitorial/Cleaning Services', storeLocation: 'Irvine, CA Purple Store #0982', nte: '$450.00' },
        { id: '4', workOrderNumber: 'WO-00149887', detailUrl: '#', statusLabel: 'Awaiting Approval', statusClass: 'status-awaiting-approval', priority: 'NPW1', priorityClass: 'priority-npw1', issue: 'Interior Lighting Upgrade', createdDate: 'Feb 20, 2026', endDate: 'Mar 11, 2026', trade: 'Lighting', storeLocation: 'Bakersfield, CA Purple Store #0484', nte: '$2,450.00' },
        { id: '5', workOrderNumber: 'WO-00150438', detailUrl: '#', statusLabel: 'Awaiting Estimate', statusClass: 'status-awaiting-estimate', priority: 'NPW1', priorityClass: 'priority-npw1', issue: 'Sprinkler System Installation', createdDate: 'Feb 22, 2026', endDate: 'Mar 18, 2026', trade: 'Fire Services', storeLocation: 'Miami, FL Purple Store #3201', nte: '$5,000.00' },
        { id: '6', workOrderNumber: 'WO-00150466', detailUrl: '#', statusLabel: 'Completed', statusClass: 'status-completed', priority: 'NPW1', priorityClass: 'priority-npw1', issue: 'Door Locks', createdDate: 'Jan 11, 2026', endDate: 'Jan 26, 2026', trade: 'Locks / Safes / Security', storeLocation: 'Glendale, CA Warhammer - Central Avenue #0215', nte: '$980.00' },
        { id: '7', workOrderNumber: 'WO-00150321', detailUrl: '#', statusLabel: 'Completed', statusClass: 'status-completed', priority: 'LOW', priorityClass: 'priority-low', issue: 'Cleaning - PM', createdDate: 'Jan 21, 2026', endDate: 'Feb 5, 2026', trade: 'Janitorial/Cleaning Services', storeLocation: 'Glendale, CA Warhammer - Central Avenue #0215', nte: '$963.13' },
        { id: '8', workOrderNumber: 'WO-00150245', detailUrl: '#', statusLabel: 'Completed', statusClass: 'status-completed', priority: 'NPW1', priorityClass: 'priority-npw1', issue: 'Ceiling Tiles', createdDate: 'Jan 28, 2026', endDate: 'Feb 10, 2026', trade: 'General Maintenance', storeLocation: 'Glendale, CA Warhammer - Central Avenue #0215', nte: '$550.00' },
        { id: '9', workOrderNumber: 'WO-00150189', detailUrl: '#', statusLabel: 'Completed', statusClass: 'status-completed', priority: 'HIGH', priorityClass: 'priority-high', issue: 'Interior Lighting', createdDate: 'Feb 3, 2026', endDate: 'Feb 15, 2026', trade: 'Lighting', storeLocation: 'Glendale, CA Warhammer - Central Avenue #0215', nte: '$1,200.00' },
        { id: '10', workOrderNumber: 'WO-00150134', detailUrl: '#', statusLabel: 'Completed', statusClass: 'status-completed', priority: 'NPW1', priorityClass: 'priority-npw1', issue: 'Door Repair', createdDate: 'Feb 7, 2026', endDate: 'Feb 20, 2026', trade: 'Doors', storeLocation: 'Glendale, CA Warhammer - Central Avenue #0215', nte: '$750.00' }
    ];

    get filteredWorkOrdersAll() {
        let results = this.workOrders;
        if (this.activeTab !== 'all') {
            results = results.filter(wo => wo.statusLabel === this.activeTab);
        }
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            results = results.filter(wo =>
                wo.workOrderNumber.toLowerCase().includes(term) ||
                wo.issue.toLowerCase().includes(term) ||
                wo.storeLocation.toLowerCase().includes(term)
            );
        }
        return results;
    }

    get filteredWorkOrders() {
        const all = this.filteredWorkOrdersAll;
        const start = (this.currentPage - 1) * this.pageSize;
        return all.slice(start, start + this.pageSize);
    }

    get paginationLabel() {
        const total = this.filteredWorkOrdersAll.length;
        const start = total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, total);
        return total === 0 ? '0 work orders' : `${start}–${end} of ${total} work orders`;
    }

    get isPreviousDisabled() { return this.currentPage === 1; }
    get isNextDisabled() { return this.currentPage * this.pageSize >= this.filteredWorkOrdersAll.length; }

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

    handleFilters() {}
    handleExport() {}
    handleNew() {}
    handlePrevious() { if (this.currentPage > 1) this.currentPage--; }
    handleNext() { this.currentPage++; }

    handleRemoveFilter(event) {
        const filterId = event.currentTarget.dataset.id;
        this.activeFilters = this.activeFilters.filter(f => f.id !== filterId);
    }
}
