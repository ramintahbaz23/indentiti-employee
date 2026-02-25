import { LightningElement, api, track } from 'lwc';

/**
 * Unified triage zone: readiness status bar (top) + needs attention table (below).
 * Dark background to separate from rest of page. Filters attention list by category when a signal is clicked.
 */
export default class TriageZone extends LightningElement {
    @api items = [];
    @api quoteReadiness = { draft: 0, pendingReview: 0, approvedNotSent: 0, sent: 0, conflict: 0 };
    @api mediaReadiness = { missingPrework: 0, missingPostwork: 0, needsPDF: 0 };
    @api mallAwareness = { malls: [] };
    /** Also accept mallSummary from dashboard: [{ mallId, mallName, activeCount }] → mapped to malls */
    @api mallSummary = [];

    @track triageFilterCategory = ''; // 'quote' | 'media' | 'mall' | ''

    get mallAwarenessForBar() {
        const base = this.mallAwareness?.malls?.length
            ? this.mallAwareness
            : { malls: (this.mallSummary || []).map((m) => ({ name: m.mallName, count: m.activeCount })) };
        return {
            ...base,
            complianceUnacknowledgedCount: this.mallAwareness?.complianceUnacknowledgedCount ?? 0,
        };
    }

    get filteredAttentionItems() {
        const list = this.items || [];
        const cat = this.triageFilterCategory;
        if (!cat) return list;
        const categoryMap = {
            quote: ['quotePending', 'quoteConflict'],
            media: ['mediaMissing', 'mediaNotConsolidated'],
            mall: ['mallAlert'],
        };
        const allowed = categoryMap[cat];
        if (!allowed) return list;
        return list.filter((item) => allowed.includes(item.category));
    }

    get firstItemId() {
        const list = this.filteredAttentionItems;
        return list.length > 0 ? list[0].workOrderId : null;
    }

    handleTriageFilterChange(event) {
        this.triageFilterCategory = event.detail?.category ?? '';
    }

    handleViewWorkOrder(event) {
        this.dispatchEvent(
            new CustomEvent('viewworkorder', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            })
        );
    }
}
