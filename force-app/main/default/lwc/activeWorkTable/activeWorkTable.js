import { LightningElement, api } from 'lwc';

const STATUS_BADGE = {
    Open: 'slds-badge slds-badge_lightest',
    'In Progress': 'slds-badge slds-badge_inverse',
    Scheduled: 'slds-badge slds-badge_lightest',
    Pending: 'slds-badge slds-badge_warning',
    'On Hold': 'slds-badge slds-badge_lightest',
};

const QUOTE_BADGE = {
    Draft: 'slds-badge slds-badge_lightest',
    'Pending Review': 'slds-badge slds-badge_warning',
    Approved: 'slds-badge slds-badge_success',
    Sent: 'slds-badge slds-badge_success',
};

export default class ActiveWorkTable extends LightningElement {
    @api rows = [];
    @api statusOptions = [];
    @api priorityOptions = [];
    @api mallOptions = [];
    @api filters = {};
    @api isLoading = false;
    @api hasActiveFilters = false;

    get selectedStatus() {
        return this.filters?.status || '';
    }
    get selectedPriority() {
        return this.filters?.priority || '';
    }
    get selectedMall() {
        return this.filters?.mall || '';
    }
    get mediaMissingChecked() {
        return !!this.filters?.mediaMissing;
    }
    get quoteNeedsActionChecked() {
        return !!this.filters?.quoteNeedsAction;
    }

    get statusOptionsWithAll() {
        const opts = (this.statusOptions || []).map(s => (typeof s === 'string' ? { label: s, value: s } : s));
        return [{ label: 'All Statuses', value: '' }, ...opts];
    }
    get priorityOptionsWithAll() {
        return [{ label: 'All Priorities', value: '' }, ...(this.priorityOptions || [])];
    }
    get mallOptionsWithAll() {
        return [{ label: 'All Malls', value: '' }, ...(this.mallOptions || [])];
    }

    get hasRows() {
        return this.rows && this.rows.length > 0;
    }

    get rowsWithFormatted() {
        if (!this.rows) return [];
        return this.rows.map(r => ({
            ...r,
            statusBadgeClass: STATUS_BADGE[r.status] || 'slds-badge slds-badge_lightest',
            quoteBadgeClass: QUOTE_BADGE[r.quoteStatus] || 'slds-badge slds-badge_lightest',
            lastUpdatedFormatted: this.formatDate(r.lastUpdated),
            mediaStatusKey: r.mediaMissing ? 'missing' : 'complete',
            mediaStatusLabel: r.mediaMissing ? 'Missing' : `Complete (${r.mediaCount || 0})`,
            quoteStatusKey: this.getQuoteStatusKey(r.quoteStatus, r.hasQuoteConflict),
        }));
    }

    getQuoteStatusKey(quoteStatus, hasConflict) {
        if (hasConflict) return 'conflict';
        if (quoteStatus === 'Draft') return 'draft';
        if (quoteStatus === 'Pending Review') return 'pending';
        if (quoteStatus === 'Approved' || quoteStatus === 'Sent') return 'ok';
        return 'neutral';
    }

    formatDate(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return iso;
        }
    }

    dispatchFilter(updates) {
        this.dispatchEvent(
            new CustomEvent('filterchange', {
                detail: { ...this.filters, ...updates },
                bubbles: true,
                composed: true,
            })
        );
    }

    handleStatusChange(event) {
        this.dispatchFilter({ status: event.target.value || '' });
    }
    handlePriorityChange(event) {
        this.dispatchFilter({ priority: event.target.value || '' });
    }
    handleMallChange(event) {
        this.dispatchFilter({ mall: event.target.value || '' });
    }
    handleMediaMissingChange(event) {
        this.dispatchFilter({ mediaMissing: event.target.checked });
    }
    handleQuoteNeedsActionChange(event) {
        this.dispatchFilter({ quoteNeedsAction: event.target.checked });
    }

    handleRowClick(event) {
        const id = event.currentTarget.dataset.id;
        if (id && !event.target.closest('a')) {
            this.dispatchEvent(new CustomEvent('rowclick', { detail: { id, workOrderId: id }, bubbles: true, composed: true }));
        }
    }
    handleWoLinkClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const id = event.target.dataset.id;
        if (id) {
            this.dispatchEvent(new CustomEvent('rowclick', { detail: { id, workOrderId: id }, bubbles: true, composed: true }));
        }
    }
}
