import { LightningElement, api } from 'lwc';

export default class FilterBar extends LightningElement {
    @api filterOptions = {};
    @api selectedStatus = 'All Statuses';
    @api selectedPriority = 'All Priorities';
    @api selectedTrade = 'All Trades';
    @api selectedDateRange = 'Last 30 Days';
    @api selectedLocation = 'All Locations';
    @api selectedContractor = 'All Contractors';
    @api activeQuickFilter = '';

    get statusOptions() {
        return ['All Statuses', ...(this.filterOptions.statuses || [])];
    }

    get priorityOptions() {
        return ['All Priorities', ...(this.filterOptions.priorities || [])];
    }

    get tradeOptions() {
        return ['All Trades', ...(this.filterOptions.trades || [])];
    }

    get dateRangeOptions() {
        return [
            'Last 30 Days',
            'Last 7 Days',
            'Today',
            'This Week',
            'This Month',
            'Custom Range'
        ];
    }

    get locationOptions() {
        return [
            { label: 'All Locations', value: 'All Locations' },
            ...(this.filterOptions.states || []).map(state => ({ label: state, value: state }))
        ];
    }

    get contractorOptions() {
        return [
            { label: 'All Contractors', value: 'All Contractors' },
            ...(this.filterOptions.contractors || []).map(contractor => ({ label: contractor, value: contractor }))
        ];
    }

    get quickFilters() {
        return [
            { label: 'My Assignments', value: 'My Assignments' },
            { label: 'Past Due', value: 'Past Due' },
            { label: 'Due This Week', value: 'Due This Week' },
            { label: 'Needs Approval', value: 'Needs Approval' },
            { label: 'Recently Updated', value: 'Recently Updated' }
        ];
    }

    handleStatusChange(event) {
        this.selectedStatus = event.target.value;
        this.dispatchFilterChange();
    }

    handlePriorityChange(event) {
        this.selectedPriority = event.target.value;
        this.dispatchFilterChange();
    }

    handleTradeChange(event) {
        this.selectedTrade = event.target.value;
        this.dispatchFilterChange();
    }

    handleDateRangeChange(event) {
        this.selectedDateRange = event.target.value;
        this.dispatchFilterChange();
    }

    handleLocationChange(event) {
        this.selectedLocation = event.target.value;
        this.dispatchFilterChange();
    }

    handleContractorChange(event) {
        this.selectedContractor = event.target.value;
        this.dispatchFilterChange();
    }

    handleQuickFilterClick(event) {
        const value = event.currentTarget.dataset.value;
        if (this.activeQuickFilter === value) {
            this.activeQuickFilter = '';
        } else {
            this.activeQuickFilter = value;
        }
        this.dispatchFilterChange();
    }

    dispatchFilterChange() {
        this.dispatchEvent(new CustomEvent('filterchange', {
            detail: {
                status: this.selectedStatus,
                priority: this.selectedPriority,
                trade: this.selectedTrade,
                dateRange: this.selectedDateRange,
                location: this.selectedLocation,
                contractor: this.selectedContractor,
                quickFilter: this.activeQuickFilter
            }
        }));
    }

    getQuickFilterClass(filterValue) {
        return this.activeQuickFilter === filterValue ? 'quick-filter-btn active' : 'quick-filter-btn';
    }
}

