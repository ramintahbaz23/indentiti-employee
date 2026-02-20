import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getMetricCounts from '@salesforce/apex/WorkOrderDashboardController.getMetricCounts';
import getFilterOptions from '@salesforce/apex/WorkOrderDashboardController.getFilterOptions';
import getWorkOrders from '@salesforce/apex/WorkOrderDashboardController.getWorkOrders';

export default class DashboardContainer extends LightningElement {
    @track metrics = {
        urgent: 0,
        pendingApproval: 0,
        newCount: 0,
        needsFollowUp: 0
    };
    
    @track filterOptions = {};
    @track workOrders = [];
    @track isLoading = false;
    @track isLoadingMetrics = true;
    @track isLoadingFilters = true;
    
    currentFilters = {
        status: 'All Statuses',
        priority: 'All Priorities',
        trade: 'All Trades',
        dateRange: 'Last 30 Days',
        location: 'All Locations',
        quickFilter: ''
    };

    @wire(getMetricCounts)
    wiredMetrics({ error, data }) {
        this.isLoadingMetrics = false;
        if (data) {
            this.metrics = data;
        } else if (error) {
            this.showErrorToast('Error Loading Metrics', error.body?.message || 'Failed to load dashboard metrics');
        }
    }

    @wire(getFilterOptions)
    wiredFilterOptions({ error, data }) {
        this.isLoadingFilters = false;
        if (data) {
            this.filterOptions = data;
        } else if (error) {
            this.showErrorToast('Error Loading Filters', error.body?.message || 'Failed to load filter options');
        }
    }

    connectedCallback() {
        this.loadWorkOrders();
    }

    loadWorkOrders() {
        this.isLoading = true;
        const filters = {
            status: this.currentFilters.status,
            priority: this.currentFilters.priority,
            trade: this.currentFilters.trade,
            dateRange: this.currentFilters.dateRange,
            location: this.currentFilters.location,
            quickFilter: this.currentFilters.quickFilter
        };

        getWorkOrders({ filters })
            .then(result => {
                this.workOrders = result || [];
                this.isLoading = false;
            })
            .catch(error => {
                this.showErrorToast('Error Loading Work Orders', error.body?.message || 'Failed to load work orders');
                this.workOrders = [];
                this.isLoading = false;
            });
    }

    handleMetricClick(event) {
        const metric = event.detail.metric;
        // Reset filters
        this.currentFilters = {
            status: 'All Statuses',
            priority: 'All Priorities',
            trade: 'All Trades',
            dateRange: 'Last 30 Days',
            location: 'All Locations',
            quickFilter: ''
        };

        // Set quick filter based on metric clicked
        if (metric === 'Urgent') {
            this.currentFilters.quickFilter = 'Urgent';
        } else if (metric === 'Pending Approval') {
            this.currentFilters.quickFilter = 'Pending Approval';
        } else if (metric === 'New') {
            this.currentFilters.quickFilter = 'New';
        } else if (metric === 'Needs Follow Up') {
            this.currentFilters.quickFilter = 'Needs Follow Up';
        }

        // Note: Filter bar will update via @api properties on next render

        this.loadWorkOrders();
    }

    handleFilterChange(event) {
        this.currentFilters = {
            status: event.detail.status || 'All Statuses',
            priority: event.detail.priority || 'All Priorities',
            trade: event.detail.trade || 'All Trades',
            dateRange: event.detail.dateRange || 'Last 30 Days',
            location: event.detail.location || 'All Locations',
            quickFilter: event.detail.quickFilter || ''
        };
        this.loadWorkOrders();
    }

    handleFilterClick() {
        // TODO: Open filter modal/dropdown
        this.showToast('Info', 'Filter options coming soon', 'info');
    }

    handleNewWorkOrder() {
        console.log('New Work Order clicked');
        // TODO: Implement navigation to new work order page/modal
        this.showToast('Info', 'New Work Order functionality coming soon', 'info');
    }

    handleExport() {
        console.log('Export clicked');
        // TODO: Implement export functionality
        this.showToast('Info', 'Export functionality coming soon', 'info');
    }

    handleWorkOrderAction(event) {
        const { workOrderId, action } = event.detail;
        console.log(`Action ${action} clicked for work order ${workOrderId}`);
        // TODO: Implement action handlers
        this.showToast('Info', `${action} action clicked for work order ${workOrderId}`, 'info');
    }

    handleWorkOrderClick(event) {
        const { workOrderId } = event.detail;
        console.log(`Work order ${workOrderId} clicked`);
        // TODO: Navigate to work order detail page
        this.showToast('Info', `Navigate to work order ${workOrderId}`, 'info');
    }

    handleViewAll(event) {
        event.preventDefault();
        console.log('View All clicked');
        // TODO: Navigate to full work orders list view
        this.showToast('Info', 'View All functionality coming soon', 'info');
    }

    get workOrderCount() {
        return this.workOrders ? this.workOrders.length : 0;
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    showErrorToast(title, message) {
        this.showToast(title, message, 'error');
    }
}

