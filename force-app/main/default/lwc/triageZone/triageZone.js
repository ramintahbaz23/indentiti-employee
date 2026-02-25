/**
 * Triage Zone LWC
 *
 * Apex dependency (implement in your org):
 * - getNeedsAttentionItems() @AuraEnabled(cacheable=true)
 *   Returns List<NeedsAttentionItem> where NeedsAttentionItem has:
 *   id (String), category (String), workOrderNumber (String), clientAccount (String),
 *   status (String), reason (String), slaAge (String or Integer), actionLabel (String)
 */
import { LightningElement, wire, track } from 'lwc';
import getNeedsAttentionItems from '@salesforce/apex/TriageZoneController.getNeedsAttentionItems';

export default class TriageZone extends LightningElement {
    @track items = [];
    @track error;
    @track expandedRowId = null;

    @wire(getNeedsAttentionItems)
    wiredItems({ error, data }) {
        if (data) {
            this.items = Array.isArray(data) ? data : [];
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.items = [];
        }
    }

    get hasItems() {
        return this.items && this.items.length > 0;
    }

    get itemCount() {
        return this.items ? this.items.length : 0;
    }

    get headerLabel() {
        return `Needs Attention (${this.itemCount})`;
    }

    get errorMessage() {
        if (!this.error) return '';
        const body = this.error.body || this.error;
        return body.message || body.pageMessage || this.error.message || 'An error occurred.';
    }

    get isLoading() {
        return this.items.length === 0 && !this.error;
    }

    get itemsWithCategoryClass() {
        if (!this.items) return [];
        const expandedId = this.expandedRowId;
        return this.items.map((item) => ({
            ...item,
            categoryCssClass: this.getCategoryCssClass(item.category),
            isExpanded: expandedId === item.id,
            idDrawer: item.id + '-drawer',
            isExpandedIcon: expandedId === item.id ? 'utility:chevrondown' : 'utility:chevronright',
        }));
    }

    getCategoryCssClass(category) {
        if (!category) return 'category-default';
        const c = category.toLowerCase().replace(/\s+/g, '');
        if (
            c.includes('emergency') ||
            c.includes('mallalert') ||
            c.includes('mall') ||
            c.includes('compliance')
        ) {
            return 'category-p1';
        }
        if (
            c.includes('escalation') ||
            c.includes('unreadclient') ||
            c.includes('quotestatus') ||
            c.includes('mediaconsolidat')
        ) {
            return 'category-p2';
        }
        if (c.includes('missingmedia') || c.includes('quotespending')) {
            return 'category-p3';
        }
        return 'category-default';
    }

    handleToggleRow(event) {
        const id = event.currentTarget.dataset.id;
        this.expandedRowId = this.expandedRowId === id ? null : id;
    }

    handleAction(event) {
        const id = event.currentTarget.dataset.id;
        // Dispatch custom event for parent to handle navigation / action
        this.dispatchEvent(
            new CustomEvent('triagetaction', {
                detail: { id },
                bubbles: true,
                composed: true,
            })
        );
    }

    handleFilters() {
        this.dispatchEvent(new CustomEvent('filter'));
    }

    handleExport() {
        this.dispatchEvent(new CustomEvent('export'));
    }
}
