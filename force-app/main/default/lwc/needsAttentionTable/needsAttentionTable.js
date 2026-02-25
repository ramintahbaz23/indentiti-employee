import { LightningElement, api } from 'lwc';

const CATEGORY_SHORT_LABEL = {
    emergency: 'Emergency',
    escalation: 'Escalation',
    unreadClientNote: 'Unread Client Note',
    slaBreach: 'SLA',
    mediaMissing: 'Media',
    mediaNotConsolidated: 'Media Not Consolidated',
    quotePending: 'Quote',
    quoteConflict: 'Quote',
    mallAlert: 'Mall',
};

/** P2 = amber: escalation, quoteConflict, mediaNotConsolidated, unreadClientNote */
function getPriorityTier(row) {
    const isP1 =
        row.category === 'emergency' ||
        row.category === 'mallAlert' ||
        (row.slaAtRisk && (row.ageDays === 0 || row.ageDays === '0'));
    if (isP1) return 'p1';
    const isP2 =
        row.category === 'escalation' ||
        row.category === 'quoteConflict' ||
        row.category === 'mediaNotConsolidated' ||
        row.category === 'unreadClientNote';
    if (isP2) return 'p2';
    return 'p3';
}

/** Contextual action label per category */
function getActionLabel(row) {
    switch (row.category) {
        case 'emergency':
            return 'Open WO';
        case 'escalation':
            return 'Respond';
        case 'unreadClientNote':
            return 'Read & Respond →';
        case 'mediaMissing':
            return 'Upload Media';
        case 'mediaNotConsolidated':
            return 'Consolidate →';
        case 'quotePending':
            return 'Send Quote';
        case 'mallAlert':
            return 'Acknowledge →';
        case 'quoteConflict':
            return 'Resolve';
        default:
            return 'Open WO';
    }
}

export default class NeedsAttentionTable extends LightningElement {
    @api items = [];

    get hasItems() {
        return this.items && this.items.length > 0;
    }

    get itemsWithMeta() {
        if (!this.items) return [];
        return this.items.map((row) => {
            const tier = getPriorityTier(row);
            return {
                ...row,
                rowClass: `slds-hint-parent needs-attention-row category-priority-${tier}`,
                categoryBadgeClass: `slds-text-body_regular category-badge category-priority-${tier}`,
                categoryShortLabel: CATEGORY_SHORT_LABEL[row.category] || row.categoryLabel,
                actionLabel: getActionLabel(row),
            };
        });
    }

    handleAction(event) {
        const workOrderId = event.currentTarget?.dataset?.id || event.target?.dataset?.id;
        this.dispatchEvent(
            new CustomEvent('viewworkorder', {
                detail: { workOrderId, id: workOrderId },
                bubbles: true,
                composed: true,
            })
        );
    }
}
