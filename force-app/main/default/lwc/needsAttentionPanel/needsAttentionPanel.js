import { LightningElement, api } from 'lwc';

const BADGE_CLASS = {
    emergency: 'slds-badge slds-badge_error',
    escalation: 'slds-badge slds-badge_warning',
    slaBreach: 'slds-badge slds-badge_error',
    mediaMissing: 'slds-badge slds-badge_warning',
    quotePending: 'slds-badge slds-badge_inverse',
    quoteConflict: 'slds-badge slds-badge_warning',
    mallAlert: 'slds-badge slds-badge_lightest',
};

const CATEGORY_SHORT_LABEL = {
    emergency: 'Emergency',
    escalation: 'Escalation',
    slaBreach: 'SLA',
    mediaMissing: 'Media',
    quotePending: 'Quote',
    quoteConflict: 'Quote',
    mallAlert: 'Mall',
};

export default class NeedsAttentionPanel extends LightningElement {
    @api items = [];
    @api firstItemId = null;

    get hasItems() {
        return this.items && this.items.length > 0;
    }

    get hasPrimaryAction() {
        return !!this.firstItemId;
    }

    handleOpenFirst() {
        if (!this.firstItemId) return;
        this.dispatchEvent(
            new CustomEvent('viewworkorder', {
                detail: { workOrderId: this.firstItemId, id: this.firstItemId },
                bubbles: true,
                composed: true,
            })
        );
    }

    get itemsWithBadgeClass() {
        if (!this.items) return [];
        return this.items.map(row => ({
            ...row,
            badgeClass: BADGE_CLASS[row.category] || 'slds-badge slds-badge_lightest',
            categoryShortLabel: CATEGORY_SHORT_LABEL[row.category] || row.categoryLabel,
        }));
    }

    handleView(event) {
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
