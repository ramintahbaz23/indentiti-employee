import { LightningElement, api } from 'lwc';

/**
 * Single horizontal readiness bar with three signals: Quotes, Media, Malls.
 * Clicking a signal dispatches triagefilterchange to filter the needs-attention table below.
 * Data shape: quoteReadiness { draft, pendingReview, approvedNotSent, sent, conflict },
 *            mediaReadiness { missingPrework, missingPostwork, needsPDF },
 *            mallAwareness { malls: [{ name, count }] }.
 */
export default class ReadinessStatusBar extends LightningElement {
    @api quoteReadiness = { draft: 0, pendingReview: 0, approvedNotSent: 0, sent: 0, conflict: 0 };
    @api mediaReadiness = { missingPrework: 0, missingPostwork: 0, needsPDF: 0, notConsolidated: 0 };
    @api mallAwareness = { malls: [], complianceUnacknowledgedCount: 0 };
    /** Current filter category from parent: 'quote' | 'media' | 'mall' | '' */
    @api selectedCategory = '';

    get isQuoteSelected() {
        return this.selectedCategory === 'quote';
    }
    get isMediaSelected() {
        return this.selectedCategory === 'media';
    }
    get isMallSelected() {
        return this.selectedCategory === 'mall';
    }

    get quoteStatus() {
        const q = this.quoteReadiness || {};
        const conflict = q.conflict ?? q.statusConflict ?? 0;
        const notSent = (q.approvedNotSent ?? 0) + (q.pendingReview ?? 0) + (q.draft ?? 0);
        if (conflict > 0) return 'red';
        if (notSent > 0) return 'amber';
        return 'green';
    }
    get quoteSummary() {
        const q = this.quoteReadiness || {};
        const conflict = q.conflict ?? q.statusConflict ?? 0;
        const notSent = (q.approvedNotSent ?? 0) + (q.pendingReview ?? 0) + (q.draft ?? 0);
        if (conflict > 0) return `${conflict} conflict(s)`;
        if (notSent > 0) return `${notSent} need action`;
        return 'All sent';
    }
    get quoteChips() {
        const q = this.quoteReadiness || {};
        const chips = [];
        if ((q.draft ?? 0) > 0) chips.push({ key: 'draft', label: `${q.draft} Draft` });
        if ((q.pendingReview ?? 0) > 0) chips.push({ key: 'pr', label: `${q.pendingReview} Pending` });
        if ((q.approvedNotSent ?? 0) > 0) chips.push({ key: 'ans', label: `${q.approvedNotSent} Not sent` });
        if ((q.sent ?? 0) > 0) chips.push({ key: 'sent', label: `${q.sent} Sent` });
        if ((q.conflict ?? q.statusConflict ?? 0) > 0) chips.push({ key: 'conflict', label: `${q.conflict ?? q.statusConflict} Conflict` });
        return chips;
    }

    get mediaStatus() {
        const m = this.mediaReadiness || {};
        const missing = (m.missingPrework ?? 0) + (m.missingPostwork ?? 0);
        const notConsolidated = m.notConsolidated ?? m.needsPDF ?? m.needsConsolidatedPdf ?? 0;
        const total = missing + notConsolidated;
        if (total === 0) return 'green';
        if (missing > 0) return 'red';
        return 'amber';
    }
    get mediaSummary() {
        const m = this.mediaReadiness || {};
        const missing = (m.missingPrework ?? 0) + (m.missingPostwork ?? 0);
        const notConsolidated = m.notConsolidated ?? m.needsPDF ?? m.needsConsolidatedPdf ?? 0;
        if (missing === 0 && notConsolidated === 0) return 'All complete';
        const parts = [];
        if (missing > 0) parts.push(`${missing} Missing`);
        if (notConsolidated > 0) parts.push(`${notConsolidated} Not Consolidated`);
        return parts.join(' · ');
    }
    get mediaChips() {
        return [];
    }

    get mallStatus() {
        const count = this.mallAwareness?.complianceUnacknowledgedCount ?? 0;
        return count === 0 ? 'green' : 'amber';
    }
    get mallSummary() {
        const count = this.mallAwareness?.complianceUnacknowledgedCount ?? 0;
        if (count === 0) return 'All malls cleared';
        return `${count} WOs — compliance unacknowledged`;
    }
    get mallChips() {
        return [];
    }

    dispatchFilter(category) {
        const next = this.selectedCategory === category ? '' : category;
        this.dispatchEvent(
            new CustomEvent('triagefilterchange', {
                detail: { category: next },
                bubbles: true,
                composed: true,
            })
        );
    }
    handleQuoteClick() {
        this.dispatchFilter('quote');
    }
    handleMediaClick() {
        this.dispatchFilter('media');
    }
    handleMallClick() {
        this.dispatchFilter('mall');
    }
}
