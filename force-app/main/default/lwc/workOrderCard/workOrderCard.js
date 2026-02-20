import { LightningElement, api } from 'lwc';

export default class WorkOrderCard extends LightningElement {
    @api workOrder;

    get priorityClass() {
        if (!this.workOrder || !this.workOrder.priority) return 'priority-low';
        const priority = this.workOrder.priority.toLowerCase();
        return `priority-${priority}`;
    }

    get statusClass() {
        if (!this.workOrder || !this.workOrder.status) return '';
        const status = this.workOrder.status.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
        return `status-${status}`;
    }

    get statusBadgeClass() {
        if (!this.workOrder) return 'status-badge';
        
        // Check for Urgent: Past Due OR New OR In Progress
        if (this.workOrder.isOverdue || 
            this.workOrder.status === 'New' || 
            this.workOrder.status === 'On-site/In Progress') {
            return 'status-badge status-urgent';
        }
        
        // Check for Pending Approval: Proposal Submitted, Proposal Pending Approval, or Pending Schedule
        if (this.workOrder.status === 'Proposal Submitted' || 
            this.workOrder.status === 'Proposal Pending Approval' ||
            this.workOrder.status === 'Pending Schedule') {
            return 'status-badge status-pending-approval';
        }
        
        // Check for New: Status is New
        if (this.workOrder.status === 'New') {
            return 'status-badge status-new-badge';
        }
        
        // Check for Needs Follow Up: Older than 7 days, not completed/invoiced
        if (this.workOrder.createdDate) {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() - 7);
            const createdDate = new Date(this.workOrder.createdDate);
            if (createdDate < followUpDate &&
                this.workOrder.status !== 'Work Complete' &&
                this.workOrder.status !== 'Invoice Submitted') {
                return 'status-badge status-needs-follow-up';
            }
        }
        
        return `status-badge ${this.statusClass}`;
    }

    get statusBadgeText() {
        if (!this.workOrder) return '';
        
        // Check for Urgent: Past Due OR New OR In Progress
        if (this.workOrder.isOverdue || 
            this.workOrder.status === 'New' || 
            this.workOrder.status === 'On-site/In Progress') {
            return 'URGENT';
        }
        
        // Check for Pending Approval: Proposal Submitted, Proposal Pending Approval, or Pending Schedule
        if (this.workOrder.status === 'Proposal Submitted' || 
            this.workOrder.status === 'Proposal Pending Approval' ||
            this.workOrder.status === 'Pending Schedule') {
            return 'PENDING APPROVAL';
        }
        
        // Check for New: Status is New
        if (this.workOrder.status === 'New') {
            return 'NEW';
        }
        
        // Check for Needs Follow Up: Older than 7 days, not completed/invoiced
        if (this.workOrder.createdDate) {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() - 7);
            const createdDate = new Date(this.workOrder.createdDate);
            if (createdDate < followUpDate &&
                this.workOrder.status !== 'Work Complete' &&
                this.workOrder.status !== 'Invoice Submitted') {
                return 'NEEDS FOLLOW UP';
            }
        }
        
        return this.workOrder.status || '';
    }

    get cardClass() {
        return `work-order-card ${this.priorityClass}`;
    }

    get priorityIndicatorClass() {
        if (!this.workOrder || !this.workOrder.priority) return 'priority-indicator low';
        const priority = this.workOrder.priority.toLowerCase();
        return `priority-indicator ${priority}`;
    }

    get locationDisplay() {
        if (!this.workOrder) return '';
        const parts = [];
        if (this.workOrder.city) parts.push(this.workOrder.city);
        if (this.workOrder.state) parts.push(this.workOrder.state);
        return parts.join(', ');
    }

    get displayTrade() {
        return this.workOrder?.trade || 'General Maintenance';
    }

    get formattedNteAmount() {
        const amount = this.workOrder?.nteAmount || 550.00;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    get formattedInvoiceAmount() {
        if (!this.workOrder || !this.workOrder.invoiceAmount) return '';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.workOrder.invoiceAmount);
    }

    get formattedCreatedDate() {
        if (!this.workOrder || !this.workOrder.createdDate) return '';
        const date = new Date(this.workOrder.createdDate);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    get formattedScheduledDate() {
        if (!this.workOrder || !this.workOrder.scheduledDate) return '';
        const date = new Date(this.workOrder.scheduledDate);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
               ' - ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    get formattedCompletedDate() {
        if (!this.workOrder || !this.workOrder.completedDate) return '';
        const date = new Date(this.workOrder.completedDate);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    get showOverdueWarning() {
        return this.workOrder && this.workOrder.isOverdue && this.workOrder.daysOverdue > 0;
    }

    get overdueText() {
        if (!this.workOrder || !this.workOrder.daysOverdue) return '';
        const days = this.workOrder.daysOverdue;
        return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
    }


    handleWorkOrderClick(event) {
        // Prevent event bubbling if clicking on interactive elements
        const target = event.target;
        const isInteractiveElement = target.tagName === 'A' || 
                                   target.closest('a') || 
                                   target.closest('lightning-icon');
        
        if (isInteractiveElement) {
            return;
        }

        this.dispatchEvent(new CustomEvent('workorderclick', {
            detail: {
                workOrderId: this.workOrder.id
            }
        }));
    }
}

