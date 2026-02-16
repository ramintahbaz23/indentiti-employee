import { LightningElement, api } from 'lwc';

export default class DataTable extends LightningElement {
    @api columns = [];
    @api data = [];
    @api keyField = 'id';
    @api sortColumn = '';
    @api sortDirection = 'asc';
    @api isLoading = false;

    get hasData() {
        return this.data && this.data.length > 0;
    }

    get processedColumns() {
        const cols = this.columns || [];
        const sortCol = this.sortColumn || '';
        const dir = this.sortDirection || 'asc';
        return cols.map(col => ({
            ...col,
            sortable: col.sortable !== false,
            sortIcon: col.sortable !== false && col.fieldName === sortCol
                ? (dir === 'asc' ? 'utility:arrowup' : 'utility:arrowdown')
                : ''
        }));
    }

    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        if (field) {
            this.dispatchEvent(new CustomEvent('sort', {
                detail: { fieldName: field }
            }));
        }
    }

    handleRowClick(event) {
        const id = event.currentTarget.dataset.id;
        if (id) {
            this.dispatchEvent(new CustomEvent('rowclick', {
                detail: { id }
            }));
        }
    }
}
