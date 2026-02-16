import { LightningElement, track, wire } from 'lwc';
import getEstimatesPaginated from '@salesforce/apex/EstimatesController.getEstimatesPaginated';
import getMetricCounts from '@salesforce/apex/EstimatesController.getMetricCounts';

const TABLE_COLUMNS = [
    { fieldName: 'workOrderNumber', label: 'Work Order #', sortable: true },
    { fieldName: 'createdDate', label: 'Created', sortable: true },
    { fieldName: 'estimationDate', label: 'Estimation', sortable: true },
    { fieldName: 'brand', label: 'Brand', sortable: true },
    { fieldName: 'total', label: 'Total', sortable: false },
    { fieldName: 'taxAmount', label: 'Tax', sortable: false },
    { fieldName: 'grandTotal', label: 'Grand Total', sortable: false },
    { fieldName: 'status', label: 'Status', sortable: true }
];

export default class EstimatesPage extends LightningElement {
    @track tableColumns = TABLE_COLUMNS;
    @track tableData = [];
    @track totalCount = 0;
    @track pageSize = 10;
    @track currentPage = 1;
    @track sortColumn = 'createdDate';
    @track sortDirection = 'desc';
    @track searchQuery = '';
    @track isLoading = false;
    @track metrics = { total: 0, pending: 0, approved: 0, rejected: 0 };

    get metricsTotal() { return this.metrics.total || 0; }
    get metricsPending() { return this.metrics.pending || 0; }
    get metricsApproved() { return this.metrics.approved || 0; }
    get metricsRejected() { return this.metrics.rejected || 0; }

    @wire(getMetricCounts)
    wiredMetrics({ data }) { if (data) this.metrics = data; }

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getEstimatesPaginated({ filters: {}, searchQuery: this.searchQuery, sortColumn: this.sortColumn, sortDirection: this.sortDirection, pageSize: this.pageSize, pageNumber: this.currentPage })
            .then(r => { this.tableData = r.data || []; this.totalCount = r.totalCount || 0; this.isLoading = false; })
            .catch(() => { this.tableData = []; this.totalCount = 0; this.isLoading = false; });
    }

    handleSearchChange(e) { this.searchQuery = e.target.value || ''; this.currentPage = 1; this.loadData(); }
    handleSort(e) { const f = e.detail.fieldName; if (this.sortColumn === f) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; else { this.sortColumn = f; this.sortDirection = 'asc'; } this.loadData(); }
    handleRowClick(e) { if (e.detail.id) this.dispatchEvent(new CustomEvent('navigatetorecord', { detail: { recordId: e.detail.id } })); }
    handlePageSizeChange(e) { this.pageSize = e.detail.pageSize; this.currentPage = 1; this.loadData(); }
    handlePageChange(e) { this.currentPage = e.detail.page; this.loadData(); }
}
