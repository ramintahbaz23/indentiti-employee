import { LightningElement, track, wire } from 'lwc';
import getInvoicesPaginated from '@salesforce/apex/InvoicesController.getInvoicesPaginated';
import getSummaryMetrics from '@salesforce/apex/InvoicesController.getSummaryMetrics';

const TABLE_COLUMNS = [
    { fieldName: 'ticketNumber', label: 'Ticket #', sortable: true },
    { fieldName: 'createdDate', label: 'Created', sortable: true },
    { fieldName: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { fieldName: 'total', label: 'Total', sortable: false },
    { fieldName: 'status', label: 'Status', sortable: true }
];

export default class InvoicesPage extends LightningElement {
    @track tableColumns = TABLE_COLUMNS;
    @track tableData = [];
    @track totalCount = 0;
    @track pageSize = 10;
    @track currentPage = 1;
    @track sortColumn = 'createdDate';
    @track sortDirection = 'desc';
    @track searchQuery = '';
    @track isLoading = false;
    @track summary = { total: 0, paidAmount: 0, paidTax: 0 };

    get summaryTotal() { return this.formatCurrency(this.summary.total); }
    get summaryPaid() { return this.formatCurrency(this.summary.paidAmount); }
    get summaryTax() { return this.formatCurrency(this.summary.paidTax); }

    formatCurrency(val) { return val != null ? '$' + Number(val).toFixed(2) : '$0.00'; }

    @wire(getSummaryMetrics)
    wiredSummary({ data }) { if (data) this.summary = data; }

    connectedCallback() { this.loadData(); }

    loadData() {
        this.isLoading = true;
        getInvoicesPaginated({ filters: {}, searchQuery: this.searchQuery, sortColumn: this.sortColumn, sortDirection: this.sortDirection, pageSize: this.pageSize, pageNumber: this.currentPage })
            .then(r => { this.tableData = r.data || []; this.totalCount = r.totalCount || 0; this.isLoading = false; })
            .catch(() => { this.tableData = []; this.totalCount = 0; this.isLoading = false; });
    }

    handleSearchChange(e) { this.searchQuery = e.target.value || ''; this.currentPage = 1; this.loadData(); }
    handleSort(e) { const f = e.detail.fieldName; if (this.sortColumn === f) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; else { this.sortColumn = f; this.sortDirection = 'asc'; } this.loadData(); }
    handleRowClick(e) { if (e.detail.id) this.dispatchEvent(new CustomEvent('navigatetorecord', { detail: { recordId: e.detail.id } })); }
    handlePageSizeChange(e) { this.pageSize = e.detail.pageSize; this.currentPage = 1; this.loadData(); }
    handlePageChange(e) { this.currentPage = e.detail.page; this.loadData(); }
}
