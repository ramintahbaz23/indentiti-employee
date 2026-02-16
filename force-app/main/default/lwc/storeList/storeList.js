import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getStoresPaginated from '@salesforce/apex/StoreListController.getStoresPaginated';

const TABLE_COLUMNS = [
    { fieldName: 'accountName', label: 'Account Name', sortable: true },
    { fieldName: 'storeNumber', label: 'Store Number', sortable: true },
    { fieldName: 'phone', label: 'Phone', sortable: false },
    { fieldName: 'shippingStreet', label: 'Shipping Street', sortable: false },
    { fieldName: 'city', label: 'City', sortable: true },
    { fieldName: 'state', label: 'State', sortable: true },
    { fieldName: 'parentCompany', label: 'Parent Company', sortable: false },
    { fieldName: 'account', label: 'Account', sortable: false }
];

export default class StoreList extends LightningElement {
    @track tableColumns = TABLE_COLUMNS;
    @track tableData = [];
    @track totalCount = 0;
    @track pageSize = 10;
    @track currentPage = 1;
    @track sortColumn = 'accountName';
    @track sortDirection = 'asc';
    @track searchQuery = '';
    @track isLoading = false;
    @track filterState = 'all';
    stateOptions = [{ label: 'All States', value: 'all' }];

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        getStoresPaginated({
            filters: { state: this.filterState },
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
                this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: error.body?.message || 'Failed to load stores', variant: 'error' }));
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
        this.filterState = event.detail.value || 'all';
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
        if (id) this.dispatchEvent(new CustomEvent('navigatetorecord', { detail: { recordId: id } }));
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
}
