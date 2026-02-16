import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFilterOptions from '@salesforce/apex/ViewAllWorkOrdersController.getFilterOptions';
import getWorkOrdersPaginated from '@salesforce/apex/ViewAllWorkOrdersController.getWorkOrdersPaginated';

const TABLE_COLUMNS = [
    { fieldName: 'workOrderNumber', label: 'Work Order #', sortable: true },
    { fieldName: 'status', label: 'Status', sortable: true },
    { fieldName: 'priority', label: 'Priority', sortable: true },
    { fieldName: 'issue', label: 'Issue', sortable: true },
    { fieldName: 'createdDate', label: 'Created', sortable: true },
    { fieldName: 'trade', label: 'Trade', sortable: true },
    { fieldName: 'location', label: 'Location', sortable: true },
    { fieldName: 'contractorName', label: 'Contractor', sortable: true },
    { fieldName: 'nteAmount', label: 'NTE', sortable: true }
];

const DATE_RANGE_OPTIONS = [
    { label: 'All Time', value: 'All Time' },
    { label: 'Today', value: 'Today' },
    { label: 'Last 7 Days', value: 'Last 7 Days' },
    { label: 'Last 30 Days', value: 'Last 30 Days' },
    { label: 'This Week', value: 'This Week' },
    { label: 'This Month', value: 'This Month' }
];

export default class ViewAllWorkOrders extends LightningElement {
    @track tableColumns = TABLE_COLUMNS;
    @track tableData = [];
    @track totalCount = 0;
    @track pageSize = 10;
    @track currentPage = 1;
    @track sortColumn = 'createdDate';
    @track sortDirection = 'desc';
    @track searchQuery = '';
    @track isLoading = false;
    @track filters = {
        status: 'All Statuses',
        priority: 'All Priorities',
        trade: 'All Trades',
        dateRange: 'Last 30 Days',
        location: 'All Locations',
        contractor: 'All Contractors'
    };

    statusOptions = [{ label: 'All Statuses', value: 'All Statuses' }];
    priorityOptions = [{ label: 'All Priorities', value: 'All Priorities' }];
    tradeOptions = [{ label: 'All Trades', value: 'All Trades' }];
    dateRangeOptions = DATE_RANGE_OPTIONS;

    @wire(getFilterOptions)
    wiredFilterOptions({ error, data }) {
        if (data) {
            this.statusOptions = [{ label: 'All Statuses', value: 'All Statuses' }, ...(data.statuses || []).map(s => ({ label: s, value: s }))];
            this.priorityOptions = [{ label: 'All Priorities', value: 'All Priorities' }, ...(data.priorities || []).map(p => ({ label: p, value: p }))];
            this.tradeOptions = [{ label: 'All Trades', value: 'All Trades' }, ...(data.trades || []).map(t => ({ label: t, value: t }))];
        }
        if (error) this.showToast('Error', error.body?.message || 'Failed to load filters', 'error');
    }

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        getWorkOrdersPaginated({
            filters: this.filters,
            searchQuery: this.searchQuery,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
            pageSize: this.pageSize,
            pageNumber: this.currentPage
        })
            .then(result => {
                this.tableData = result.data || [];
                this.totalCount = result.totalCount || 0;
                this.isLoading = false;
            })
            .catch(error => {
                this.showToast('Error', error.body?.message || 'Failed to load work orders', 'error');
                this.tableData = [];
                this.totalCount = 0;
                this.isLoading = false;
            });
    }

    handleSearchChange(event) {
        this.searchQuery = event.target.value || '';
        this.currentPage = 1;
        this.loadData();
    }

    handleFilterChange(event) {
        const filterName = event.target.name;
        if (filterName) this.filters[filterName] = event.detail.value;
        this.currentPage = 1;
        this.loadData();
    }

    handleSort(event) {
        const field = event.detail.fieldName;
        if (this.sortColumn === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = field;
            this.sortDirection = 'asc';
        }
        this.loadData();
    }

    handleRowClick(event) {
        const id = event.detail.id;
        if (id) {
            this.dispatchEvent(new CustomEvent('navigatetorecord', { detail: { recordId: id } }));
            this.showToast('Info', 'Navigate to work order ' + id, 'info');
        }
    }

    handlePageSizeChange(event) {
        this.pageSize = event.detail.pageSize;
        this.currentPage = 1;
        this.loadData();
    }

    handlePageChange(event) {
        this.currentPage = event.detail.page;
        this.loadData();
    }

    handleExport() {
        this.showToast('Info', 'Export coming soon', 'info');
    }

    handleNewWorkOrder() {
        this.showToast('Info', 'New Work Order coming soon', 'info');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
