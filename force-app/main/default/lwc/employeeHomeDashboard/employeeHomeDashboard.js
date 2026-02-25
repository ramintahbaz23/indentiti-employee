import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// TODO: Replace with Apex when backend is ready
// import getNeedsAttention from '@salesforce/apex/EmployeeHomeController.getNeedsAttention';
// import getActiveWork from '@salesforce/apex/EmployeeHomeController.getActiveWork';
// import getQuoteReadiness from '@salesforce/apex/EmployeeHomeController.getQuoteReadiness';
// import getMediaReadiness from '@salesforce/apex/EmployeeHomeController.getMediaReadiness';
// import getMallAwareness from '@salesforce/apex/EmployeeHomeController.getMallAwareness';

const PRIORITY_ORDER = {
    emergency: 1,
    escalation: 2,
    unreadClientNote: 3,
    slaBreach: 4,
    mediaMissing: 5,
    mediaNotConsolidated: 6,
    quotePending: 7,
    mallAlert: 8,
    quoteConflict: 9,
};

export default class EmployeeHomeDashboard extends NavigationMixin(LightningElement) {
    @track needsAttentionItems = [];
    @track activeWorkRows = [];
    @track quoteReadiness = { draft: 0, pendingReview: 0, approvedNotSent: 0, sent: 0, statusConflict: 0 };
    @track mediaReadiness = { missingPrework: 0, missingPostwork: 0, childOnlyNotReviewed: 0, needsConsolidatedPdf: 0 };
    @track mallSummary = [];
    @track mallAwareness = { complianceUnacknowledgedCount: 0 };
    @track filters = {
        status: '',
        priority: '',
        mall: '',
        mediaMissing: false,
        quoteNeedsAction: false,
    };
    @track isLoading = false;
    @track hasError = false;
    @track errorMessage = '';

    _allNeedsAttention = [];
    _allActiveWork = [];
    _allMallSummary = [];

    connectedCallback() {
        this.loadMockData();
    }

    loadMockData() {
        this.hasError = false;
        this.errorMessage = '';
        this.isLoading = true;
        // TODO: Wire to Apex - getNeedsAttention(), getActiveWork(), etc. On error: set hasError, errorMessage, then isLoading = false.
        try {
            this._allNeedsAttention = this.getMockNeedsAttention();
            this._allActiveWork = this.getMockActiveWork();
            const quoteMedia = this.getMockQuoteAndMediaCounts();
            this.quoteReadiness = quoteMedia.quote;
            this.mediaReadiness = quoteMedia.media;
            this._allMallSummary = this.getMockMallSummary();
            this.mallAwareness = { complianceUnacknowledgedCount: 2 };
            this.applyFilters();
        } catch (e) {
            this.hasError = true;
            this.errorMessage = e?.message || 'Something went wrong loading the dashboard.';
        }
        this.isLoading = false;
    }

    handleRetry() {
        this.loadMockData();
    }

    getMockNeedsAttention() {
        return [
            { id: 'na1', workOrderNumber: 'WO-00000001', workOrderId: 'wo1', account: 'Acme Corp', category: 'emergency', categoryLabel: 'Emergency Tickets', status: 'Open', reason: 'Safety issue', ageDays: 0, slaAtRisk: true },
            { id: 'na2', workOrderNumber: 'WO-00000002', workOrderId: 'wo2', account: 'Retail Co', category: 'escalation', categoryLabel: 'Escalations', status: 'In Progress', reason: 'Client escalation', ageDays: 2, slaAtRisk: false },
            { id: 'na2b', workOrderNumber: 'WO-00000007', workOrderId: 'wo7', account: 'Metro Signs', category: 'unreadClientNote', categoryLabel: 'Unread Client Note', status: 'In Progress', reason: 'Client note via portal, unread', ageDays: 1, slaAtRisk: false },
            { id: 'na3', workOrderNumber: 'WO-00000003', workOrderId: 'wo3', account: 'Mall Tenant A', category: 'mediaMissing', categoryLabel: 'Missing Required Media', status: 'Scheduled', reason: 'Pre-work photos missing', ageDays: 5, slaAtRisk: true },
            { id: 'na3b', workOrderNumber: 'WO-00000007', workOrderId: 'wo7', account: 'Child WO Parent', category: 'mediaNotConsolidated', categoryLabel: 'Media Not Consolidated', status: 'Scheduled', reason: 'Child photos not rolled up', ageDays: 2, slaAtRisk: false },
            { id: 'na4', workOrderNumber: 'WO-00000004', workOrderId: 'wo4', account: 'Store B', category: 'quotePending', categoryLabel: 'Quotes Pending Send', status: 'Pending', reason: 'Quote approved, not sent', ageDays: 1, slaAtRisk: false },
            { id: 'na5', workOrderNumber: 'WO-00000005', workOrderId: 'wo5', account: 'Chain X', category: 'quoteConflict', categoryLabel: 'Quote Status Conflict', status: 'On Hold', reason: 'Status mismatch', ageDays: 3, slaAtRisk: false },
            { id: 'na6', workOrderNumber: 'WO-00000006', workOrderId: 'wo6', account: 'Mall West', category: 'mallAlert', categoryLabel: 'Mall Alert / Compliance', status: 'Open', reason: 'Compliance requirements not acknowledged', ageDays: 0, slaAtRisk: false },
        ];
    }

    getMockActiveWork() {
        return [
            { id: 'wo1', workOrderNumber: 'WO-00000001', status: 'Open', priority: 'Critical', mall: 'Westfield Mall', mediaCount: 12, quoteStatus: 'Draft', hasEscalation: true, slaAgeDays: 0, lastUpdated: '2025-02-24T10:00:00Z', mediaMissing: true, quoteNeedsAction: true, mallId: 'mall1', hasQuoteConflict: false },
            { id: 'wo2', workOrderNumber: 'WO-00000002', status: 'In Progress', priority: 'High', mall: 'Galleria', mediaCount: 8, quoteStatus: 'Submitted', hasEscalation: true, slaAgeDays: 2, lastUpdated: '2025-02-23T14:30:00Z', mediaMissing: false, quoteNeedsAction: false, mallId: 'mall2', hasQuoteConflict: false },
            { id: 'wo3', workOrderNumber: 'WO-00000003', status: 'Scheduled', priority: 'Medium', mall: 'Westfield Mall', mediaCount: 5, quoteStatus: 'Approved', hasEscalation: false, slaAgeDays: 5, lastUpdated: '2025-02-22T09:00:00Z', mediaMissing: true, quoteNeedsAction: true, mallId: 'mall1', hasQuoteConflict: false },
            { id: 'wo4', workOrderNumber: 'WO-00000004', status: 'Pending', priority: 'High', mall: 'Plaza Center', mediaCount: 3, quoteStatus: 'Draft', hasEscalation: false, slaAgeDays: 1, lastUpdated: '2025-02-24T08:00:00Z', mediaMissing: false, quoteNeedsAction: true, mallId: 'mall3', hasQuoteConflict: false },
            { id: 'wo5', workOrderNumber: 'WO-00000005', status: 'On Hold', priority: 'Low', mall: 'Galleria', mediaCount: 6, quoteStatus: 'Sent', hasEscalation: false, slaAgeDays: 3, lastUpdated: '2025-02-21T16:00:00Z', mediaMissing: false, quoteNeedsAction: false, mallId: 'mall2', hasQuoteConflict: true },
            { id: 'wo6', workOrderNumber: 'WO-00000006', status: 'Open', priority: 'Critical', mall: 'Westfield Mall', mediaCount: 10, quoteStatus: 'Pending Review', hasEscalation: false, slaAgeDays: 0, lastUpdated: '2025-02-24T11:00:00Z', mediaMissing: true, quoteNeedsAction: true, mallId: 'mall1', hasQuoteConflict: false },
        ];
    }

    getMockQuoteAndMediaCounts() {
        return {
            quote: { draft: 2, pendingReview: 1, approvedNotSent: 1, sent: 2, statusConflict: 1 },
            media: { missingPrework: 2, missingPostwork: 1, notConsolidated: 1, childOnlyNotReviewed: 1, needsConsolidatedPdf: 1 },
        };
    }

    getMockMallSummary() {
        return [
            { mallId: 'mall1', mallName: 'Westfield Mall', activeCount: 3, hasWarning: true },
            { mallId: 'mall2', mallName: 'Galleria', activeCount: 2, hasWarning: true },
            { mallId: 'mall3', mallName: 'Plaza Center', activeCount: 1, hasWarning: false },
        ];
    }

    applyFilters() {
        let needs = [...this._allNeedsAttention];
        needs.sort((a, b) => (PRIORITY_ORDER[a.category] || 99) - (PRIORITY_ORDER[b.category] || 99));
        this.needsAttentionItems = needs;

        let work = this._allActiveWork.filter(row => {
            if (this.filters.status && row.status !== this.filters.status) return false;
            if (this.filters.priority && row.priority !== this.filters.priority) return false;
            if (this.filters.mall && row.mall !== this.filters.mall) return false;
            if (this.filters.mediaMissing && !row.mediaMissing) return false;
            if (this.filters.quoteNeedsAction && !row.quoteNeedsAction) return false;
            return true;
        });
        this.activeWorkRows = work;

        let malls = this._allMallSummary;
        this.mallSummary = malls;
    }

    handleFilterChange(event) {
        const detail = event.detail || {};
        this.filters = {
            ...this.filters,
            status: detail.status !== undefined ? detail.status : this.filters.status,
            priority: detail.priority !== undefined ? detail.priority : this.filters.priority,
            mall: detail.mall !== undefined ? detail.mall : this.filters.mall,
            mediaMissing: detail.mediaMissing !== undefined ? detail.mediaMissing : this.filters.mediaMissing,
            quoteNeedsAction: detail.quoteNeedsAction !== undefined ? detail.quoteNeedsAction : this.filters.quoteNeedsAction,
        };
        this.applyFilters();
    }

    /** Alias for template: filtered rows for My Active Work table */
    get filteredActiveWorkRows() {
        return this.activeWorkRows || [];
    }

    /** True when any Active Work table filter is active */
    get hasActiveFilters() {
        const f = this.filters || {};
        return !!(f.status || f.priority || f.mall || f.mediaMissing || f.quoteNeedsAction);
    }

    handleViewWorkOrder(event) {
        const id = event.detail?.workOrderId || event.detail?.id;
        if (!id) return;
        const isSalesforceId = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(id);
        if (isSalesforceId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: { recordId: id, objectApiName: 'Work_Order__c', actionName: 'view' },
            });
        } else {
            this.dispatchEvent(new ShowToastEvent({ title: 'View Work Order', message: `Would open record: ${id}`, variant: 'info' }));
        }
    }

    get statusOptions() {
        const statuses = [...new Set(this._allActiveWork.map(r => r.status))];
        return statuses.map(s => ({ label: s, value: s }));
    }

    get priorityOptions() {
        return [
            { label: 'Critical', value: 'Critical' },
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' },
        ];
    }

    get mallOptions() {
        return this._allMallSummary.map(m => ({ label: m.mallName, value: m.mallName }));
    }

    handleNewWorkOrder() {
        // TODO: Navigate to new Work Order create page or open modal
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Work_Order__c', actionName: 'new' },
        });
    }
}
