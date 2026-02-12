// Next Step UI Functions - Render Primary CTA and More Actions

/**
 * Render the next step UI based on resolver output
 */
function renderNextStepUI(nextStepData) {
    if (!nextStepData || !nextStepData.primaryCta) {
        // Hide primary CTA if no next step
        const primaryBtn = document.getElementById('primaryCtaBtn');
        if (primaryBtn) {
            primaryBtn.style.display = 'none';
        }
        const nextStepLabel = document.getElementById('nextStepLabel');
        if (nextStepLabel) {
            nextStepLabel.textContent = 'No action needed';
        }
        return;
    }

    // Update next step label
    const nextStepLabel = document.getElementById('nextStepLabel');
    const nextStepReason = document.getElementById('nextStepReason');
    const primaryBtn = document.getElementById('primaryCtaBtn');
    const primaryLabel = document.getElementById('primaryCtaLabel');

    if (nextStepLabel) {
        nextStepLabel.textContent = nextStepData.nextStepLabel || nextStepData.primaryCta.label;
    }
    if (nextStepReason && nextStepData.reason) {
        nextStepReason.textContent = nextStepData.reason;
        nextStepReason.style.display = 'block';
    } else if (nextStepReason) {
        nextStepReason.style.display = 'none';
    }

    // Update primary CTA button
    if (primaryBtn && primaryLabel) {
        primaryLabel.textContent = nextStepData.primaryCta.label;
        primaryBtn.style.display = 'inline-flex';
        primaryBtn.dataset.action = nextStepData.primaryCta.action;
        if (nextStepData.primaryCta.estimateId) {
            primaryBtn.dataset.estimateId = nextStepData.primaryCta.estimateId;
        }
        if (nextStepData.primaryCta.invoiceId) {
            primaryBtn.dataset.invoiceId = nextStepData.primaryCta.invoiceId;
        }
    }

    // Render More Actions dropdown
    renderMoreActions(nextStepData.moreActions || []);
    
    // Show/hide Dispatch and Decline buttons
    const dispatchBtn = document.getElementById('dispatchBtn');
    const declineBtn = document.getElementById('declineBtn');
    
    if (dispatchBtn) {
        const shouldShow = nextStepData.showDispatch || false;
        dispatchBtn.style.display = shouldShow ? 'inline-flex' : 'none';
        console.log('Dispatch button visibility:', shouldShow, 'showDispatch:', nextStepData.showDispatch);
    }
    if (declineBtn) {
        const shouldShow = nextStepData.showDecline || false;
        declineBtn.style.display = shouldShow ? 'inline-flex' : 'none';
        console.log('Decline button visibility:', shouldShow, 'showDecline:', nextStepData.showDecline);
    }
}

/**
 * Render More Actions dropdown menu
 */
function renderMoreActions(actions) {
    const moreContent = document.getElementById('moreActionsContent');
    if (!moreContent) return;

    if (!actions || actions.length === 0) {
        moreContent.innerHTML = '<div class="dropdown-menu-item" style="color: #706e6b; cursor: default;">No additional actions</div>';
        return;
    }

    moreContent.innerHTML = actions.map(action => {
        const disabled = action.requiresConfirm ? '' : '';
        return `
            <button class="dropdown-menu-item" 
                    data-action="${action.action}"
                    ${action.estimateId ? `data-estimate-id="${action.estimateId}"` : ''}
                    ${action.invoiceId ? `data-invoice-id="${action.invoiceId}"` : ''}
                    ${action.requiresConfirm ? 'data-requires-confirm="true"' : ''}
                    ${disabled}>
                ${action.label}
            </button>
        `;
    }).join('');
}

/**
 * Toggle More Actions dropdown
 */
function toggleMoreActionsDropdown() {
    const menu = document.getElementById('moreActionsMenu');
    if (menu) {
        const isVisible = menu.style.display !== 'none';
        menu.style.display = isVisible ? 'none' : 'block';
    }
}

/**
 * Close More Actions dropdown
 */
function closeMoreActionsDropdown() {
    const menu = document.getElementById('moreActionsMenu');
    if (menu) {
        menu.style.display = 'none';
    }
}

/**
 * Render Estimates table in Estimates tab
 */
function renderEstimatesTable(workOrderId) {
    const tableContainer = document.getElementById('estimatesTable');
    if (!tableContainer) return;

    const estimates = getWorkOrderEstimates(workOrderId);

    if (!estimates || estimates.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state">No estimates found. <button class="link-button" id="createEstimateEmptyBtn">Create Estimate</button></div>';
        // Ensure bottom button is visible
        const footer = tableContainer.parentElement.querySelector('.related-list-footer');
        if (footer) {
            footer.style.display = 'block';
        }
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${estimates.map(est => {
                    const normalizedStatus = normalizeEstimateStatus(est.status);
                    const statusClass = normalizedStatus || 'draft';
                    return `
                        <tr>
                            <td><a href="estimates.html?id=${est.id}" style="color: var(--sf-brand); text-decoration: none;">${est.id}</a></td>
                            <td><span class="status-badge-small ${statusClass}">${normalizedStatus || est.status}</span></td>
                            <td>${formatCurrency(est.grandTotal || est.total)}</td>
                            <td>${formatDate(est.created)}</td>
                            <td>
                                <a href="estimates.html?id=${est.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">View</a>
                                ${normalizedStatus === 'draft' ? `<a href="#" class="edit-estimate" data-id="${est.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Edit</a>` : ''}
                                ${normalizedStatus === 'draft' ? `<a href="#" class="send-estimate" data-id="${est.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Send</a>` : ''}
                                ${normalizedStatus === 'rejected' ? `<a href="#" class="revise-estimate" data-id="${est.id}" style="color: var(--sf-brand);">Revise</a>` : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
    
    // Ensure bottom button is visible
    const footer = tableContainer.parentElement.querySelector('.related-list-footer');
    if (footer) {
        footer.style.display = 'block';
    }
}

/**
 * Render Invoices table in Invoices tab
 */
function renderInvoicesTable(workOrderId) {
    const tableContainer = document.getElementById('invoicesTable');
    if (!tableContainer) return;

    const invoices = getWorkOrderInvoices(workOrderId);
    const estimates = getWorkOrderEstimates(workOrderId);
    const approvedEstimate = findEstimateByStatus(estimates, 'approved');

    // Hide/show the "New Invoice" button in header based on approved estimate
    const newInvoiceBtn = document.getElementById('newInvoiceBtn');
    if (newInvoiceBtn) {
        if (!approvedEstimate) {
            newInvoiceBtn.style.display = 'none';
        } else {
            newInvoiceBtn.style.display = 'inline-flex';
        }
    }

    if (!invoices || invoices.length === 0) {
        if (!approvedEstimate) {
            tableContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <div style="margin-bottom: 1rem; color: #706e6b; font-size: 0.875rem; line-height: 1.5;">
                        <strong style="color: #181818; display: block; margin-bottom: 0.5rem;">Cannot create invoice yet</strong>
                        An approved estimate is required before creating an invoice. This ensures accurate billing and prevents discrepancies between estimated and actual costs.
                    </div>
                </div>
            `;
        } else {
            tableContainer.innerHTML = '<div class="empty-state">No invoices found. <button class="link-button" id="createInvoiceEmptyBtn">Create Invoice</button></div>';
        }
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Number</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${invoices.map(inv => {
                    const normalizedStatus = normalizeInvoiceStatus(inv.status);
                    const statusClass = normalizedStatus || 'draft';
                    return `
                        <tr>
                            <td><a href="invoices.html?id=${inv.id}" style="color: var(--sf-brand); text-decoration: none;">${inv.invoiceNumber || inv.id}</a></td>
                            <td><span class="status-badge-small ${statusClass}">${normalizedStatus || inv.status}</span></td>
                            <td>${formatCurrency(inv.grandTotal || inv.total)}</td>
                            <td>${formatDate(inv.created || inv.invoiceDate)}</td>
                            <td>
                                <a href="invoices.html?id=${inv.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">View</a>
                                ${normalizedStatus === 'draft' ? `<a href="#" class="edit-invoice" data-id="${inv.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Edit</a>` : ''}
                                ${normalizedStatus === 'draft' ? `<a href="#" class="send-invoice" data-id="${inv.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Send</a>` : ''}
                                ${normalizedStatus === 'sent' ? `<a href="#" class="record-payment" data-id="${inv.id}" style="color: var(--sf-brand);">Record Payment</a>` : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
}

/**
 * Handle primary CTA action
 */
function handlePrimaryCtaAction(action, data) {
    console.log('Primary CTA action:', action, data);
    
    switch (action) {
        case 'createEstimate':
            openCreateEstimateModal();
            break;
        case 'finishEstimate':
            window.location.href = `estimates.html?id=${data.estimateId}&action=edit`;
            break;
        case 'sendEstimate':
            showToast('Sending estimate...', 'info');
            break;
        case 'viewEstimate':
            window.location.href = `estimates.html?id=${data.estimateId}`;
            break;
        case 'reviseEstimate':
            window.location.href = `estimates.html?workOrderId=${workOrderId}&reviseFrom=${data.estimateId}`;
            break;
        case 'createInvoice':
            window.location.href = `invoices.html?workOrderId=${workOrderId}&action=create`;
            break;
        case 'createInvoiceWithOverride':
            showInvoiceOverrideModal();
            break;
        case 'finishInvoice':
            window.location.href = `invoices.html?id=${data.invoiceId}&action=edit`;
            break;
        case 'recordPayment':
            window.location.href = `invoices.html?id=${data.invoiceId}&action=recordPayment`;
            break;
        case 'startWork':
            if (currentWorkOrder) {
                currentWorkOrder.status = 'in_progress';
                renderWorkOrder();
                showToast('Work started', 'success');
            }
            break;
        case 'markComplete':
            if (currentWorkOrder) {
                currentWorkOrder.status = 'action_needed';
                currentWorkOrder.actionNeededReason = 'ready_to_invoice';
                renderWorkOrder();
                showToast('Work marked complete', 'success');
            }
            break;
        case 'markActionNeeded':
            if (currentWorkOrder) {
                currentWorkOrder.status = 'action_needed';
                renderWorkOrder();
                showToast('Marked as action needed', 'success');
            }
            break;
        case 'resolveIssue':
            showToast('Opening action needed panel...', 'info');
            break;
        default:
            console.warn('Unknown action:', action);
    }
}

/**
 * Show invoice override confirmation modal
 */
function showInvoiceOverrideModal() {
    const choice = confirm('No approved estimate exists. Create an estimate first to confirm charges.\n\nClick OK to create estimate first, or Cancel to create invoice anyway.');
    if (choice) {
        openCreateEstimateModal();
    } else {
        window.location.href = `invoices.html?workOrderId=${workOrderId}&action=create&override=true`;
    }
}

/**
 * Open Create Estimate Modal
 */
window.openCreateEstimateModal = function() {
    const modal = document.getElementById('createEstimateModal');
    if (!modal) return;
    
    // Get workOrderId from global scope or URL
    const woId = typeof workOrderId !== 'undefined' ? workOrderId : new URLSearchParams(window.location.search).get('id');
    
    // Only show modal for WO-00149331
    if (woId !== 'WO-00149331') {
        window.location.href = `estimates.html?workOrderId=${woId}&action=create`;
        return;
    }
    
    // Populate modal with work order data
    const wo = typeof currentWorkOrder !== 'undefined' ? currentWorkOrder : null;
    if (wo) {
        // Update modal title - extract number from WO-00149331 format
        const modalTitle = document.getElementById('estimateModalTitle');
        if (modalTitle) {
            const ticketNumber = wo.id ? wo.id.replace('WO-', '') : '1097471';
            modalTitle.textContent = `Ticket #${ticketNumber} | Tracking #${wo.id || 'WR1097471'}`;
        }
        
        // Populate store info
        const storeInfoName = document.getElementById('storeInfoName');
        const storeInfoNumber = document.getElementById('storeInfoNumber');
        const storeInfoPhone = document.getElementById('storeInfoPhone');
        const storeInfoAddress = document.getElementById('storeInfoAddress');
        
        if (storeInfoName) storeInfoName.textContent = wo.storeName || 'Purple';
        if (storeInfoNumber) storeInfoNumber.textContent = wo.storeMall || 'NY-02-Woodbury Common';
        if (storeInfoPhone) storeInfoPhone.textContent = wo.storePhone || '+1 845-335-6335';
        if (storeInfoAddress) storeInfoAddress.textContent = wo.storeAddress || '664 Racetrack Lane, Central Valley, New York, United States, 10917';
    } else {
        // Use default values if work order not loaded
        const modalTitle = document.getElementById('estimateModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Ticket #1097471 | Tracking #WR1097471';
        }
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

/**
 * Close Create Estimate Modal
 */
window.closeCreateEstimateModal = function() {
    const modal = document.getElementById('createEstimateModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Clear form fields
        const invoiceNumber = document.getElementById('estimateInvoiceNumber');
        const user = document.getElementById('estimateUser');
        const assessment = document.getElementById('estimateAssessment');
        const scope = document.getElementById('estimateScope');
        
        if (invoiceNumber) invoiceNumber.value = '';
        if (user) user.value = '';
        if (assessment) assessment.value = '';
        if (scope) scope.value = '';
    }
};
