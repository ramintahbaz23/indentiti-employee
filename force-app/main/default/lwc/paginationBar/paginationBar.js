import { LightningElement, api } from 'lwc';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [
    { label: '10 per page', value: '10' },
    { label: '25 per page', value: '25' },
    { label: '50 per page', value: '50' },
    { label: '100 per page', value: '100' }
];

export default class PaginationBar extends LightningElement {
    @api totalCount = 0;
    @api pageSize = DEFAULT_PAGE_SIZE;
    @api currentPage = 1;
    @api label = 'items';

    pageSizeOptions = PAGE_SIZE_OPTIONS;

    get pageSizeValue() {
        return String(this.pageSize || DEFAULT_PAGE_SIZE);
    }

    get totalPages() {
        if (this.pageSize <= 0) return 1;
        return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    }

    get start() {
        if (this.totalCount === 0) return 0;
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get end() {
        return Math.min(this.currentPage * this.pageSize, this.totalCount);
    }

    get infoText() {
        if (this.totalCount === 0) return `0 ${this.label}`;
        return `${this.start}–${this.end} of ${this.totalCount} ${this.label}`;
    }

    get isPreviousDisabled() {
        return this.currentPage <= 1;
    }

    get isNextDisabled() {
        return this.currentPage >= this.totalPages;
    }

    get pageNumbers() {
        const total = this.totalPages;
        if (total <= 1) return [];
        const maxButtons = 5;
        let first = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let last = Math.min(total, first + maxButtons - 1);
        if (last - first + 1 < maxButtons) {
            first = Math.max(1, last - maxButtons + 1);
        }
        const pages = [];
        for (let p = first; p <= last; p++) {
            pages.push({
                num: p,
                variant: p === this.currentPage ? 'brand' : 'neutral'
            });
        }
        return pages;
    }

    handlePageSizeChange(event) {
        const newSize = parseInt(event.detail.value, 10);
        this.dispatchEvent(new CustomEvent('pagesizechange', {
            detail: { pageSize: newSize }
        }));
    }

    handlePrevious() {
        if (!this.isPreviousDisabled) {
            this.dispatchEvent(new CustomEvent('pagechange', {
                detail: { page: this.currentPage - 1 }
            }));
        }
    }

    handleNext() {
        if (!this.isNextDisabled) {
            this.dispatchEvent(new CustomEvent('pagechange', {
                detail: { page: this.currentPage + 1 }
            }));
        }
    }

    handlePageClick(event) {
        const page = parseInt(event.currentTarget.dataset.page, 10);
        if (!isNaN(page) && page >= 1 && page <= this.totalPages) {
            this.dispatchEvent(new CustomEvent('pagechange', {
                detail: { page }
            }));
        }
    }
}
