// Next Step Resolver - Primary CTA Logic for Work Orders
// This file contains the resolver function and helper utilities

/**
 * Normalize estimate status from old format to new enum
 */
function normalizeEstimateStatus(status) {
    if (!status) return null;
    const normalized = status.toLowerCase().trim();
    const statusMap = {
        'pending': 'sent',
        'approved': 'approved',
        'rejected': 'rejected',
        'draft': 'draft',
        'sent': 'sent',
        'expired': 'expired'
    };
    return statusMap[normalized] || normalized;
}

/**
 * Normalize invoice status from old format to new enum
 */
function normalizeInvoiceStatus(status) {
    if (!status) return null;
    const normalized = status.toLowerCase().trim();
    const statusMap = {
        'paid': 'paid',
        'pending': 'sent',
        'sent': 'sent',
        'draft': 'draft',
        'void': 'void'
    };
    return statusMap[normalized] || normalized;
}

/**
 * Normalize work order status from old format to new enum
 * Old: "New", "Dispatched", "On-site/In Progress", "Work Complete", etc.
 * New: "new", "action_needed", "in_progress", "awaiting_approval", "awaiting_estimate"
 */
function normalizeWorkOrderStatus(status) {
    if (!status) return 'new';
    const normalized = status.toLowerCase().trim();
    
    // Map old statuses to new enums
    const statusMap = {
        'new': 'new',
        'dispatched': 'in_progress',
        'on-site/in progress': 'in_progress',
        'on-site/in-progress': 'in_progress',
        'assigned': 'in_progress',
        'scheduled': 'in_progress',
        'in progress': 'in_progress',
        'in_progress': 'in_progress',
        'work complete': 'action_needed',
        'completed': 'action_needed',
        'invoice submitted': 'action_needed',
        'proposal submitted': 'awaiting_approval',
        'proposal pending approval': 'awaiting_approval',
        'awaiting approval': 'awaiting_approval',
        'awaiting_approval': 'awaiting_approval',
        'pending schedule': 'awaiting_estimate',
        'awaiting parts': 'awaiting_estimate',
        'awaiting estimate': 'awaiting_estimate',
        'awaiting_estimate': 'awaiting_estimate',
        'needs attention': 'action_needed',
        'action needed': 'action_needed',
        'action_needed': 'action_needed',
        'declined': 'action_needed',
        'on hold': 'awaiting_approval'
    };
    
    // Check exact match first
    if (statusMap[normalized]) {
        return statusMap[normalized];
    }
    
    // Check partial matches
    if (normalized.includes('in progress') || normalized.includes('in-progress')) {
        return 'in_progress';
    }
    if (normalized.includes('awaiting approval') || normalized.includes('pending approval')) {
        return 'awaiting_approval';
    }
    if (normalized.includes('awaiting estimate') || normalized.includes('pending estimate')) {
        return 'awaiting_estimate';
    }
    if (normalized.includes('complete') || normalized.includes('finished')) {
        return 'action_needed';
    }
    if (normalized.includes('action') || normalized.includes('attention') || normalized.includes('needs')) {
        return 'action_needed';
    }
    
    // Default to 'new'
    return 'new';
}

/**
 * Find estimates for a work order
 */
function getWorkOrderEstimates(workOrderId) {
    if (!workOrderId || !window.estimatesData) return [];
    return estimatesData.filter(est => est.workOrderNumber === workOrderId)
        .sort((a, b) => new Date(b.created) - new Date(a.created));
}

/**
 * Find invoices for a work order
 */
function getWorkOrderInvoices(workOrderId) {
    if (!workOrderId || !window.invoicesData) return [];
    return invoicesData.filter(inv => inv.ticketNumber === workOrderId)
        .sort((a, b) => new Date(b.created) - new Date(a.created));
}

/**
 * Get most recent estimate matching status criteria
 */
function findEstimateByStatus(estimates, statuses) {
    if (!Array.isArray(statuses)) statuses = [statuses];
    for (const est of estimates) {
        const normalizedStatus = normalizeEstimateStatus(est.status);
        if (statuses.includes(normalizedStatus)) {
            return est;
        }
    }
    return null;
}

/**
 * Get most recent invoice matching status criteria
 */
function findInvoiceByStatus(invoices, statuses) {
    if (!Array.isArray(statuses)) statuses = [statuses];
    for (const inv of invoices) {
        const normalizedStatus = normalizeInvoiceStatus(inv.status);
        if (statuses.includes(normalizedStatus)) {
            return inv;
        }
    }
    return null;
}

/**
 * Check if any invoice has a specific status
 */
function hasInvoiceWithStatus(invoices, status) {
    const normalizedStatus = normalizeInvoiceStatus(status);
    return invoices.some(inv => normalizeInvoiceStatus(inv.status) === normalizedStatus);
}

/**
 * Resolve next step CTA based on work order status and related estimates/invoices
 */
function resolveNextStep({ workOrderStatus, actionNeededReason, estimates, invoices, workOrderId }) {
    const normalizedStatus = (workOrderStatus || 'new').toLowerCase().trim();
    
    // Define estimates
    const activeEstimate = findEstimateByStatus(estimates, ['draft', 'sent', 'approved']);
    const approvedEstimate = findEstimateByStatus(estimates, 'approved');
    const draftEstimate = findEstimateByStatus(estimates, 'draft');
    const sentEstimate = findEstimateByStatus(estimates, 'sent');
    const rejectedEstimate = findEstimateByStatus(estimates, 'rejected');
    
    // Define invoices
    const activeInvoice = findInvoiceByStatus(invoices, ['draft', 'sent']);
    const draftInvoice = findInvoiceByStatus(invoices, 'draft');
    const sentInvoice = findInvoiceByStatus(invoices, 'sent');
    const paidInvoiceExists = hasInvoiceWithStatus(invoices, 'paid');
    
    // Check if needs dispatch decision (status new or action_needed-for-dispatch)
    const needsDispatchDecision = normalizedStatus === 'new' || (normalizedStatus === 'action_needed' && actionNeededReason === 'for-dispatch');
    
    let primaryCta = null;
    let secondaryActions = [];
    let nextStepLabel = '';
    let reason = '';
    let showDispatch = false;
    let showDecline = false;
    
    // PRIORITY 1: Invoice-related actions (always highest priority)
    // If invoice draft/sent exists → invoice CTAs (not estimate, not dispatch)
    if (draftInvoice || sentInvoice) {
        if (draftInvoice) {
            primaryCta = {
                label: 'Finish Invoice',
                action: 'finishInvoice',
                invoiceId: draftInvoice.id
            };
            secondaryActions = [
                { label: 'Send Invoice', action: 'sendInvoice', invoiceId: draftInvoice.id }
            ];
            nextStepLabel = 'Finish Invoice';
            reason = 'Draft invoice exists';
        } else if (sentInvoice) {
            primaryCta = {
                label: 'Record Payment',
                action: 'recordPayment',
                invoiceId: sentInvoice.id
            };
            secondaryActions = [
                { label: 'View Invoice', action: 'viewInvoice', invoiceId: sentInvoice.id }
            ];
            nextStepLabel = 'Record Payment';
            reason = 'Invoice sent, awaiting payment';
        }
        // Don't show dispatch/decline when invoice exists
        showDispatch = false;
        showDecline = false;
    }
    // PRIORITY 2: Dispatch decision needed
    // Else if work order needs dispatch decision (unassigned + status new/action_needed-for-dispatch)
    // → show Dispatch + Decline
    else if (needsDispatchDecision) {
        showDispatch = true;
        showDecline = true;
        // Don't show primary CTA when dispatch/decline are shown
        primaryCta = null;
        nextStepLabel = 'Dispatch Decision Required';
        reason = 'Work order needs to be dispatched or declined';
        console.log('Showing Dispatch/Decline buttons - isUnassigned:', isUnassigned, 'normalizedStatus:', normalizedStatus);
    }
    // PRIORITY 3: No approved estimate exists
    // Else if no approved estimate exists → show Create Estimate (or Finish Estimate if draft)
    else if (!approvedEstimate) {
        if (draftEstimate) {
            primaryCta = { label: 'Finish Estimate', action: 'finishEstimate', estimateId: draftEstimate.id };
            nextStepLabel = 'Finish Estimate';
            reason = 'Draft estimate exists';
        } else {
            primaryCta = { label: 'Create Estimate', action: 'createEstimate' };
            nextStepLabel = 'Create Estimate';
            reason = 'Estimate required';
        }
        showDispatch = false;
        showDecline = false;
    }
    // PRIORITY 4: Approved estimate exists and work is ready to bill
    // Else if approved estimate exists and work is ready to bill → show Create Invoice
    else if (approvedEstimate) {
        // Check if work is ready to bill (in_progress or action_needed with ready_to_invoice)
        const isReadyToBill = normalizedStatus === 'in_progress' || 
                              (normalizedStatus === 'action_needed' && actionNeededReason === 'ready_to_invoice');
        
        if (isReadyToBill) {
            primaryCta = { label: 'Create Invoice', action: 'createInvoice' };
            nextStepLabel = 'Create Invoice';
            reason = 'Work complete, ready to invoice';
        } else {
            // Work not ready to bill yet, show appropriate action
            if (normalizedStatus === 'new') {
                primaryCta = { label: 'Start Work', action: 'startWork' };
                nextStepLabel = 'Start Work';
            } else if (normalizedStatus === 'awaiting_approval') {
                primaryCta = { label: 'View Estimate', action: 'viewEstimate', estimateId: approvedEstimate.id };
                nextStepLabel = 'View Estimate';
                reason = 'Waiting on customer approval';
            } else {
                primaryCta = { label: 'Continue Work', action: 'continueWork' };
                nextStepLabel = 'Continue Work';
            }
        }
        showDispatch = false;
        showDecline = false;
    }
    
    // Always add common secondary actions to "More" menu
    const moreActions = [];
    moreActions.push({ label: 'Create Estimate', action: 'createEstimate' });
    if (approvedEstimate) {
        moreActions.push({ label: 'Create Invoice', action: 'createInvoice', requiresConfirm: false });
    } else {
        moreActions.push({ label: 'Create Invoice', action: 'createInvoiceWithOverride', requiresConfirm: true });
    }
    
    // Add contextual actions
    if (draftEstimate) {
        moreActions.push({ label: 'Send Estimate', action: 'sendEstimate', estimateId: draftEstimate.id });
    }
    if (sentEstimate) {
        moreActions.push({ label: 'Resend Estimate', action: 'resendEstimate', estimateId: sentEstimate.id });
    }
    if (sentInvoice) {
        moreActions.push({ label: 'Void Invoice', action: 'voidInvoice', invoiceId: sentInvoice.id });
    }
    if (draftInvoice) {
        moreActions.push({ label: 'Void Invoice', action: 'voidInvoice', invoiceId: draftInvoice.id });
    }
    
    return {
        primaryCta,
        secondaryActions,
        moreActions,
        nextStepLabel,
        reason,
        intent: primaryCta?.action || 'none',
        showDispatch,
        showDecline
    };
}
