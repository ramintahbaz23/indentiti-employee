// Application State
let state = {
    estimates: [],
    filteredEstimates: [],
    displayedEstimates: [],
    sortColumn: null,
    sortDirection: 'asc',
    filters: {
        created: '',
        expirationDate: '',
        status: 'all'
    },
    searchQuery: '',
    pageSize: 25,
    currentPage: 1,
    selectedEstimates: new Set(),
    activeFilterTags: []
};

// Bill for Work Incurred - modal with reason + submit (like reject modal)
var currentBillEstimateId = null;

window.showBillModal = function(estimateId) {
    currentBillEstimateId = estimateId || null;
    var el = document.getElementById('billModalSimple');
    if (!el) {
        el = document.createElement('div');
        el.id = 'billModalSimple';
        el.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;align-items:center;justify-content:center;';
        el.innerHTML = [
            '<div style="background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);width:90%;max-width:500px;max-height:90vh;overflow-y:auto;">',
            '  <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #dddbda;display:flex;justify-content:space-between;align-items:center;">',
            '    <h2 style="margin:0;font-size:1.125rem;font-weight:600;color:#181818;">Bill for Work Incurred</h2>',
            '    <button type="button" id="billModalCloseBtn" aria-label="Close" style="background:none;border:none;color:#706e6b;cursor:pointer;padding:4px;">&times;</button>',
            '  </div>',
            '  <div style="padding:1.5rem;">',
            '    <p id="billModalMessage" style="font-size:0.875rem;color:#3e3e3c;margin:0 0 1rem;line-height:1.5;">Please provide a reason for this billing request.</p>',
            '    <label style="display:block;font-size:0.875rem;font-weight:600;color:#3e3e3c;margin-bottom:0.5rem;">Reason <span style="color:#c23934;">*</span></label>',
            '    <textarea id="billModalReason" placeholder="Enter reason for billing request..." style="width:100%;min-height:100px;padding:0.75rem;border:1px solid #dddbda;border-radius:4px;font-size:0.875rem;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>',
            '  </div>',
            '  <div style="padding:1rem 1.5rem;border-top:1px solid #dddbda;display:flex;justify-content:flex-end;gap:0.75rem;">',
            '    <button type="button" id="billModalCancelBtn" style="padding:0.625rem 1.25rem;border-radius:4px;font-size:0.875rem;font-weight:600;cursor:pointer;background:#fff;color:#3e3e3c;border:1px solid #dddbda;">Cancel</button>',
            '    <button type="button" id="billModalSubmitBtn" style="padding:0.625rem 1.25rem;border-radius:4px;font-size:0.875rem;font-weight:600;cursor:pointer;background:var(--sf-brand,#003366);color:#fff;border:none;" disabled>Submit</button>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
        var reasonEl = document.getElementById('billModalReason');
        var submitBtn = document.getElementById('billModalSubmitBtn');
        document.getElementById('billModalCloseBtn').onclick = closeBillModal;
        document.getElementById('billModalCancelBtn').onclick = closeBillModal;
        submitBtn.onclick = function() {
            var reason = (reasonEl && reasonEl.value.trim()) || '';
            if (!reason) { alert('Please enter a reason to continue.'); return; }
            var est = state.estimates.find(function(e) { return e.id === currentBillEstimateId; });
            if (est) alert('Billing submitted for ' + est.workOrderNumber + '\nReason: ' + reason);
            closeBillModal();
        };
        el.onclick = function(e) { if (e.target === el) closeBillModal(); };
        reasonEl.addEventListener('input', function() { submitBtn.disabled = !reasonEl.value.trim(); });
        document.addEventListener('keydown', function escBill(e) {
            if (e.key === 'Escape' && el.style.display === 'flex') closeBillModal();
        });
    }
    var reasonEl = document.getElementById('billModalReason');
    var submitBtn = document.getElementById('billModalSubmitBtn');
    var msgEl = document.getElementById('billModalMessage');
    if (reasonEl) reasonEl.value = '';
    if (submitBtn) submitBtn.disabled = true;
    var est = state.estimates.find(function(e) { return e.id === estimateId; });
    if (msgEl && est) msgEl.textContent = 'Work Order: ' + est.workOrderNumber + ' — Please provide a reason for this billing request.';
    else if (msgEl) msgEl.textContent = 'Please provide a reason for this billing request.';
    el.style.display = 'flex';
}

function closeBillModal() {
    currentBillEstimateId = null;
    var el = document.getElementById('billModalSimple');
    if (el) el.style.display = 'none';
}

// Utility Functions
function formatCurrency(amount) {
    if (amount == null || amount === '' || amount === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + 
           ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getStatusSLDSClass(status) {
    const statusMap = {
        'Pending': 'slds-badge_lightest',
        'Approved': 'slds-badge_success',
        'Rejected': 'slds-badge_error',
        'Revision Needed': 'slds-badge_warning'
    };
    return statusMap[status] || 'slds-badge_lightest';
}

function getStatusColor(status) {
    const colorMap = {
        'Pending': '#706e6b',
        'Approved': '#04844b',
        'Rejected': '#c23934',
        'Revision Needed': '#fe9339',
        'Draft': '#706e6b'
    };
    return colorMap[status] || '#706e6b';
}

function getApproverRole(approvedBy) {
    // Map approver names to roles
    const roleMap = {
        'Mark Johnson': 'Manager Approved',
        'John Smith': 'Client Approved',
        'Sarah Johnson': 'Client Approved',
        'Manager': 'Manager Approved',
        'Client': 'Client Approved'
    };
    
    // Check if exact match exists
    if (roleMap[approvedBy]) {
        return roleMap[approvedBy];
    }
    
    // Check if name contains role keywords
    const lowerName = approvedBy.toLowerCase();
    if (lowerName.includes('manager') || lowerName.includes('mark')) {
        return 'Manager Approved';
    }
    if (lowerName.includes('client') || lowerName.includes('john') || lowerName.includes('sarah')) {
        return 'Client Approved';
    }
    
    // Default fallback
    return approvedBy || 'Approved';
}

// Filter Functions
function filterEstimates() {
    let filtered = [...state.estimates];

    // Search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(est => 
            (est.workOrderNumber && est.workOrderNumber.toLowerCase().includes(query)) ||
            (est.brand && est.brand.toLowerCase().includes(query)) ||
            (est.comment && est.comment.toLowerCase().includes(query))
        );
    }

    // Created date filter
    if (state.filters.created) {
        const filterDate = new Date(state.filters.created);
        filtered = filtered.filter(est => {
            const estDate = new Date(est.created);
            return estDate.toDateString() === filterDate.toDateString();
        });
    }

    // Expiration date filter
    if (state.filters.expirationDate) {
        const filterDate = new Date(state.filters.expirationDate);
        filtered = filtered.filter(est => {
            if (!est.expirationDate) return false;
            const estDate = new Date(est.expirationDate);
            return estDate.toDateString() === filterDate.toDateString();
        });
    }

    // Status filter
    if (state.filters.status !== 'all') {
        filtered = filtered.filter(est => est.status === state.filters.status);
    }

    // Sort
    if (state.sortColumn) {
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (state.sortColumn) {
                case 'workOrderNumber':
                    aVal = a.workOrderNumber || '';
                    bVal = b.workOrderNumber || '';
                    break;
                case 'created':
                    aVal = new Date(a.created);
                    bVal = new Date(b.created);
                    break;
                case 'estimationDate':
                    aVal = a.estimationDate ? new Date(a.estimationDate) : new Date(0);
                    bVal = b.estimationDate ? new Date(b.estimationDate) : new Date(0);
                    break;
                case 'brand':
                    aVal = a.brand || '';
                    bVal = b.brand || '';
                    break;
                case 'total':
                    aVal = a.total || 0;
                    bVal = b.total || 0;
                    break;
                case 'taxAmount':
                    aVal = a.taxAmount || 0;
                    bVal = b.taxAmount || 0;
                    break;
                case 'grandTotal':
                    aVal = a.grandTotal || 0;
                    bVal = b.grandTotal || 0;
                    break;
                case 'status':
                    aVal = a.status;
                    bVal = b.status;
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    state.filteredEstimates = filtered;
    state.currentPage = 1;
    
    // Pagination
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    state.displayedEstimates = filtered.slice(startIndex, endIndex);
    
    updateActiveFilterTags();
    renderTable();
    renderPagination();
    updateTotalCount();
    updateSummary();
    updateCardActiveStates();
}

function updateActiveFilterTags() {
    const tags = [];
    
    if (state.filters.created) {
        tags.push({ type: 'created', label: `Created: ${state.filters.created}`, value: state.filters.created });
    }
    if (state.filters.expirationDate) {
        tags.push({ type: 'expirationDate', label: `Expiration: ${state.filters.expirationDate}`, value: state.filters.expirationDate });
    }
    if (state.filters.status !== 'all') {
        tags.push({ type: 'status', label: `Status: ${state.filters.status}`, value: state.filters.status });
    }
    
    state.activeFilterTags = tags;
    updateFilterBadge();
}

function updateFilterBadge() {
    const badge = document.getElementById('filterBadge');
    const filterBtn = document.getElementById('filterToggleBtn');
    const filtersSection = document.getElementById('filtersSection');
    const activeCount = state.activeFilterTags.length;
    
    if (badge && filterBtn) {
        if (activeCount > 0) {
            badge.textContent = activeCount.toString();
            badge.style.display = 'inline-block';
            filterBtn.classList.add('active');
            // Auto-expand filters section if filters are active
            if (filtersSection) {
                filtersSection.classList.add('expanded');
                filterBtn.classList.add('expanded');
            }
        } else {
            badge.style.display = 'none';
            filterBtn.classList.remove('active');
            // Only remove expanded class if section is actually closed
            if (filtersSection && !filtersSection.classList.contains('expanded')) {
                filterBtn.classList.remove('expanded');
            }
        }
    }
}

function renderTable() {
    const tbody = document.getElementById('estimatesTableBody');
    
    if (!tbody) return;
    
    if (state.filteredEstimates.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 3rem;">
                    <div style="color: #706e6b;">No requests found matching your criteria.</div>
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }
    
    tbody.innerHTML = state.displayedEstimates.map(est => {
        const isSelected = state.selectedEstimates.has(est.id);
        
        // Status display - plain text with color, show approver if approved
        const statusColor = getStatusColor(est.status);
        let statusText = est.status;
        if (est.status === 'Approved' && est.approvedBy) {
            // Map approver name to role
            const approverRole = getApproverRole(est.approvedBy);
            statusText = `${est.status} (${approverRole})`;
        }
        const statusDisplay = `<span style="color: ${statusColor}; font-weight: 500;">${statusText}</span>`;
        
        // Actions dropdown
        const actionsDropdown = `
            <div class="actions-dropdown-container" style="position: relative;">
                <button class="actions-dropdown-btn" onclick="toggleEstimateActionsDropdown('${est.id}')" data-estimate-id="${est.id}" aria-haspopup="true" aria-expanded="false" title="Actions">
                    <svg class="slds-icon slds-icon_x-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="actions-dropdown-menu" id="estimateActionsDropdown-${est.id}" style="display: none;">
                    <a href="#" onclick="approveEstimate('${est.id}'); return false;" class="actions-dropdown-item"><span class="actions-dropdown-item-icon icon-approve" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Approve</a>
                    <a href="#" class="actions-dropdown-item bill-for-work-incurred-trigger" data-action="bill-for-work-incurred" data-estimate-id="${est.id}"><span class="actions-dropdown-item-icon icon-bill" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg></span>Bill for Work Incurred</a>
                    <button type="button" class="actions-dropdown-item actions-dropdown-item-btn" onclick="event.stopPropagation(); window.rejectEstimate('${est.id}');"><span class="actions-dropdown-item-icon icon-reject" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>Reject</button>
                    <a href="work-order-details.html?id=${encodeURIComponent(est.workOrderNumber)}" class="actions-dropdown-item"><span class="actions-dropdown-item-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>View</a>
                    <a href="#" onclick="downloadEstimate('${est.id}'); return false;" class="actions-dropdown-item"><span class="actions-dropdown-item-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>Download</a>
                </div>
            </div>
        `;
        
        return `
            <tr data-estimate-id="${est.id}">
                <td>
                    <input type="checkbox" class="estimate-checkbox" data-estimate-id="${est.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td><a href="work-order-details.html?id=${encodeURIComponent(est.workOrderNumber)}" class="work-order-number">${est.workOrderNumber}</a></td>
                <td>${formatDateTime(est.created)}</td>
                <td>${est.estimationDate ? formatDate(est.estimationDate) : (est.expirationDate ? formatDate(est.expirationDate) : '<span class="empty-cell">Empty</span>')}</td>
                <td>${est.brand || '<span class="empty-cell">Empty</span>'}</td>
                <td class="amount">${formatCurrency(est.total)}</td>
                <td class="amount">${formatCurrency(est.taxAmount)}</td>
                <td class="amount">${formatCurrency(est.grandTotal)}</td>
                <td>${statusDisplay}</td>
                <td>${est.comment || '<span class="empty-cell">Empty</span>'}</td>
                <td>${actionsDropdown}</td>
            </tr>
        `;
    }).join('');
    
    // Attach event listeners
    attachTableListeners();
    updateSelectAllCheckbox();
    updateColumnVisibility();
}

function updateColumnVisibility() {
    // Map column IDs to their index in the table (0 = checkbox, 1 = first data column, etc.)
    const columnMap = {
        'colWorkOrder': 1,
        'colCreated': 2,
        'colEstimation': 3,
        'colBrand': 4,
        'colTotal': 5,
        'colTaxAmount': 6,
        'colGrandTotal': 7,
        'colStatus': 8,
        'colComment': 9,
        'colActions': 10
    };
    
    const table = document.querySelector('table');
    if (!table) return;
    
    const headerCells = table.querySelectorAll('thead th');
    const bodyRows = table.querySelectorAll('tbody tr');
    
    Object.keys(columnMap).forEach(colId => {
        const checkbox = document.getElementById(colId);
        const colIndex = columnMap[colId];
        
        if (checkbox && headerCells[colIndex] && colIndex < headerCells.length) {
            // Update header visibility
            headerCells[colIndex].style.display = checkbox.checked ? '' : 'none';
            
            // Update body cell visibility
            bodyRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[colIndex] && colIndex < cells.length) {
                    cells[colIndex].style.display = checkbox.checked ? '' : 'none';
                }
            });
        }
    });
}

function attachTableListeners() {
    // Checkbox listeners
    document.querySelectorAll('.estimate-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const estId = e.target.dataset.estimateId;
            if (e.target.checked) {
                state.selectedEstimates.add(estId);
            } else {
                state.selectedEstimates.delete(estId);
            }
            updateSelectAllCheckbox();
        });
    });

    // Sortable column headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (state.sortColumn === column) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortColumn = column;
                state.sortDirection = 'asc';
            }
            updateSortIcons();
            filterEstimates();
        });
    });
}

function updateSortIcons() {
    document.querySelectorAll('.sortable').forEach(header => {
        const icon = header.querySelector('.sort-icon');
        const column = header.dataset.sort;
        if (state.sortColumn === column) {
            icon.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
        } else {
            icon.textContent = '⇅';
        }
    });
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) return;
    
    const allCheckboxes = document.querySelectorAll('.estimate-checkbox');
    const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    
    selectAllCheckbox.checked = checkedCount === allCheckboxes.length && allCheckboxes.length > 0;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    updateCsvButtonLabel();
}

function updateCsvButtonLabel() {
    const btn = document.getElementById('csvAllBtn');
    if (!btn) return;
    const n = state.selectedEstimates.size;
    btn.textContent = n === 0 ? 'CSV (ALL)' : `CSV (${n})`;
}

function updateTotalCount() {
    const count = state.filteredEstimates.length;
    const countElement = document.getElementById('totalCount');
    if (countElement) {
        countElement.textContent = `${count} ${count === 1 ? 'request' : 'requests'}`;
    }
}

function updateSummary() {
    // Use all estimates for summary counts, not filtered
    const pending = state.estimates.filter(est => est.status === 'Pending').length;
    const approved = state.estimates.filter(est => est.status === 'Approved').length;
    const rejected = state.estimates.filter(est => est.status === 'Rejected').length;
    const totalCount = state.estimates.length;
    
    const pendingEl = document.getElementById('summaryPending');
    const approvedEl = document.getElementById('summaryApproved');
    const rejectedEl = document.getElementById('summaryRejected');
    const countEl = document.getElementById('summaryCount');
    
    if (pendingEl) pendingEl.textContent = pending.toString();
    if (approvedEl) approvedEl.textContent = approved.toString();
    if (rejectedEl) rejectedEl.textContent = rejected.toString();
    if (countEl) countEl.textContent = totalCount.toString();
}

function updateCardActiveStates() {
    // Remove active class from all cards
    document.querySelectorAll('.metric-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to the card matching current filter
    const currentStatus = state.filters.status;
    const activeCard = document.querySelector(`.metric-card[data-filter-status="${currentStatus}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
}

function getTotalPages() {
    return Math.max(1, Math.ceil(state.filteredEstimates.length / state.pageSize));
}

function renderPagination() {
    const total = state.filteredEstimates.length;
    const totalPages = getTotalPages();
    const start = total === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, total);

    const infoEl = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('paginationPrev');
    const nextBtn = document.getElementById('paginationNext');
    const numbersEl = document.getElementById('paginationNumbers');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (infoEl) {
        infoEl.textContent = total === 0 ? '0 requests' : `${start}–${end} of ${total} requests`;
    }
    if (prevBtn) prevBtn.disabled = state.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = state.currentPage >= totalPages;
    if (pageSizeSelect) pageSizeSelect.value = String(state.pageSize);

    if (numbersEl) {
        if (totalPages <= 1) {
            numbersEl.innerHTML = '';
            return;
        }
        const maxButtons = 5;
        let firstPage = Math.max(1, state.currentPage - Math.floor(maxButtons / 2));
        let lastPage = Math.min(totalPages, firstPage + maxButtons - 1);
        if (lastPage - firstPage + 1 < maxButtons) {
            firstPage = Math.max(1, lastPage - maxButtons + 1);
        }
        numbersEl.innerHTML = Array.from({ length: lastPage - firstPage + 1 }, (_, i) => {
            const p = firstPage + i;
            const active = p === state.currentPage ? ' active' : '';
            return `<button type="button" class="pagination-number${active}" data-page="${p}">${p}</button>`;
        }).join('');
        numbersEl.querySelectorAll('.pagination-number').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentPage = parseInt(btn.dataset.page, 10);
                refreshPaginationView();
            });
        });
    }
}

function refreshPaginationView() {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    state.displayedEstimates = state.filteredEstimates.slice(startIndex, startIndex + state.pageSize);
    renderTable();
    renderPagination();
}

// Estimate Actions
function approveEstimate(estimateId) {
    const estimate = state.estimates.find(est => est.id === estimateId);
    if (estimate) {
        estimate.status = 'Approved';
        estimate.approvedBy = 'Mark Johnson';
        estimate.approvedDate = new Date();
        filterEstimates();
    }
}

// Simple modal created in JS and appended to body
function showSimpleModal(opts) {
    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;padding:1.5rem;border-radius:8px;max-width:420px;width:90%;box-shadow:0 4px 24px rgba(0,0,0,0.25);';
    box.innerHTML = '<h2 style="margin:0 0 0.75rem;font-size:1.25rem;font-weight:600;">' + (opts.title || '') + '</h2>' +
        (opts.message ? '<p style="margin:0 0 1rem;font-size:0.875rem;color:#555;">' + opts.message + '</p>' : '') +
        '<textarea class="simple-modal-textarea" style="width:100%;min-height:90px;padding:0.75rem;border:1px solid #ccc;border-radius:4px;font-size:0.875rem;margin-bottom:1rem;box-sizing:border-box;resize:vertical;font-family:inherit;" placeholder="' + (opts.placeholder || '') + '"></textarea>' +
        '<div style="display:flex;justify-content:flex-end;gap:0.5rem;">' +
        '<button type="button" class="simple-modal-cancel" style="padding:0.5rem 1rem;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-size:0.875rem;">Cancel</button>' +
        '<button type="button" class="simple-modal-confirm" style="padding:0.5rem 1rem;border:none;border-radius:4px;background:#003366;color:#fff;cursor:pointer;font-size:0.875rem;">' + (opts.confirmLabel || 'Confirm') + '</button>' +
        '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function closeModal() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
    });
    box.addEventListener('click', function(e) { e.stopPropagation(); });
    box.querySelector('.simple-modal-cancel').addEventListener('click', closeModal);
    box.querySelector('.simple-modal-confirm').addEventListener('click', function() {
        var ta = box.querySelector('.simple-modal-textarea');
        var val = ta ? ta.value.trim() : '';
        if (opts.required !== false && !val) {
            alert(opts.requiredMessage || 'Please enter a value.');
            if (ta) ta.focus();
            return;
        }
        if (opts.onConfirm) opts.onConfirm(val);
        closeModal();
    });
    box.querySelector('.simple-modal-textarea').focus();
}

let currentRejectionEstimateId = null;

function rejectEstimate(estimateId) {
    currentRejectionEstimateId = estimateId;
    document.querySelectorAll('.actions-dropdown-menu').forEach(function(menu) {
        menu.style.display = 'none';
    });
    showSimpleModal({
        title: 'Reject Request',
        message: 'Please provide a reason for rejecting this request.',
        placeholder: 'Enter reason for rejection...',
        confirmLabel: 'Reject Request',
        required: true,
        requiredMessage: 'Please provide a reason for rejection.',
        onConfirm: function(reason) {
            var est = state.estimates.find(function(e) { return e.id === currentRejectionEstimateId; });
            if (est) {
                est.status = 'Rejected';
                est.rejectedBy = 'Mark Johnson';
                est.rejectedDate = new Date();
                est.rejectionReason = reason;
                est.comment = 'Rejected: ' + reason;
                filterEstimates();
            }
            currentRejectionEstimateId = null;
        }
    });
}
window.rejectEstimate = rejectEstimate;

function closeRejectionModal() {}
window.closeRejectionModal = closeRejectionModal;

function confirmRejection() {}
window.confirmRejection = confirmRejection;

let currentRevisionEstimateId = null;

function revisionNeededEstimate(estimateId) {
    currentRevisionEstimateId = estimateId;
    document.querySelectorAll('.actions-dropdown-menu').forEach(function(menu) {
        menu.style.display = 'none';
    });
    showSimpleModal({
        title: 'Revision Needed',
        message: 'Describe what revisions are needed.',
        placeholder: 'Describe what revisions are needed...',
        confirmLabel: 'Submit',
        required: true,
        requiredMessage: 'Please describe what revisions are needed.',
        onConfirm: function(details) {
            var est = state.estimates.find(function(e) { return e.id === currentRevisionEstimateId; });
            if (est) {
                est.status = 'Revision Needed';
                est.comment = details;
                filterEstimates();
            }
            currentRevisionEstimateId = null;
        }
    });
}
window.revisionNeededEstimate = revisionNeededEstimate;

function closeRevisionModal() {}
window.closeRevisionModal = closeRevisionModal;

function confirmRevision() {}
window.confirmRevision = confirmRevision;

function exportToCsv() {
    const headers = [
        'Work Order #',
        'Created',
        'Estimation',
        'Brand',
        'Total',
        'Tax Amount',
        'Grand Total',
        'Status',
        'Comment'
    ];
    const toExport = state.selectedEstimates.size > 0
        ? state.filteredEstimates.filter(est => state.selectedEstimates.has(est.id))
        : state.filteredEstimates;
    const rows = toExport.map(est => [
        est.workOrderNumber,
        formatDate(est.created),
        est.estimationDate ? formatDate(est.estimationDate) : (est.expirationDate ? formatDate(est.expirationDate) : ''),
        est.brand,
        est.total,
        est.taxAmount,
        est.grandTotal,
        est.status,
        est.comment
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approval-requests_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Filter toggle button
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filtersSection = document.getElementById('filtersSection');
    
    if (filterToggleBtn && filtersSection) {
        filterToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filtersSection.classList.toggle('expanded');
            const isExpanded = filtersSection.classList.contains('expanded');
            filterToggleBtn.setAttribute('aria-expanded', isExpanded);
            // Add/remove expanded class to button for border styling
            if (isExpanded) {
                filterToggleBtn.classList.add('expanded');
            } else {
                filterToggleBtn.classList.remove('expanded');
            }
        });
    }
    
    // Initialize state
    if (typeof approvalRequestsData !== 'undefined' && approvalRequestsData && Array.isArray(approvalRequestsData)) {
        state.estimates = approvalRequestsData;
        state.filteredEstimates = approvalRequestsData;
    } else {
        console.error('approvalRequestsData is not defined or is not an array');
        state.estimates = [];
        state.filteredEstimates = [];
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            state.currentPage = 1;
            filterEstimates();
        });
    }
    
    // Filter inputs
    const filterCreated = document.getElementById('filterCreated');
    if (filterCreated) {
        filterCreated.addEventListener('change', (e) => {
            state.filters.created = e.target.value;
            state.currentPage = 1;
            filterEstimates();
        });
    }
    
    const filterExpiration = document.getElementById('filterExpiration');
    if (filterExpiration) {
        filterExpiration.addEventListener('change', (e) => {
            state.filters.expirationDate = e.target.value;
            state.currentPage = 1;
            filterEstimates();
        });
    }
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            state.filters.status = e.target.value;
            state.currentPage = 1;
            filterEstimates();
            updateCardActiveStates();
        });
    }
    
    // Metric card click handlers for filtering
    const cardPending = document.getElementById('cardPending');
    const cardApproved = document.getElementById('cardApproved');
    const cardRejected = document.getElementById('cardRejected');
    const cardAll = document.getElementById('cardAll');
    
    function handleCardClick(status) {
        // Toggle: if clicking the same status, clear filter (set to 'all')
        if (state.filters.status === status) {
            state.filters.status = 'all';
        } else {
            state.filters.status = status;
        }
        
        // Update status dropdown to match
        if (filterStatus) {
            filterStatus.value = state.filters.status;
        }
        
        state.currentPage = 1;
        filterEstimates();
        updateCardActiveStates();
    }
    
    if (cardPending) {
        cardPending.addEventListener('click', () => handleCardClick('Pending'));
    }
    
    if (cardApproved) {
        cardApproved.addEventListener('click', () => handleCardClick('Approved'));
    }
    
    if (cardRejected) {
        cardRejected.addEventListener('click', () => handleCardClick('Rejected'));
    }
    
    if (cardAll) {
        cardAll.addEventListener('click', () => handleCardClick('all'));
    }
    
    // Clear all filters
    const clearAll = document.getElementById('clearAll');
    if (clearAll) {
        clearAll.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters = {
                created: '',
                expirationDate: '',
                status: 'all'
            };
            state.searchQuery = '';
            if (searchInput) searchInput.value = '';
            if (filterCreated) filterCreated.value = '';
            if (filterExpiration) filterExpiration.value = '';
            if (filterStatus) filterStatus.value = 'all';
            state.currentPage = 1;
            filterEstimates();
            updateCardActiveStates();
        });
    }
    
    // Select All checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.estimate-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const estId = cb.dataset.estimateId;
                if (e.target.checked) {
                    state.selectedEstimates.add(estId);
                } else {
                    state.selectedEstimates.delete(estId);
                }
            });
            updateSelectAllCheckbox();
        });
    }
    
    // CSV export
    const csvAllBtn = document.getElementById('csvAllBtn');
    if (csvAllBtn) {
        csvAllBtn.addEventListener('click', () => {
            exportToCsv();
        });
    }
    
    // Pagination
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            state.pageSize = parseInt(e.target.value);
            state.currentPage = 1;
            filterEstimates();
        });
    }
    
    const paginationPrev = document.getElementById('paginationPrev');
    if (paginationPrev) {
        paginationPrev.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                refreshPaginationView();
            }
        });
    }
    const paginationNext = document.getElementById('paginationNext');
    if (paginationNext) {
        paginationNext.addEventListener('click', () => {
            if (state.currentPage < getTotalPages()) {
                state.currentPage++;
                refreshPaginationView();
            }
        });
    }
    
    
    // Rejection Modal Event Listeners
    const rejectionModal = document.getElementById('rejectionModal');
    const closeRejectionModalBtn = document.getElementById('closeRejectionModal');
    const cancelRejectionBtn = document.getElementById('cancelRejectionBtn');
    const confirmRejectionBtn = document.getElementById('confirmRejectionBtn');
    const rejectionReasonTextarea = document.getElementById('rejectionReason');
    
    if (closeRejectionModalBtn) {
        closeRejectionModalBtn.addEventListener('click', closeRejectionModal);
    }
    
    if (cancelRejectionBtn) {
        cancelRejectionBtn.addEventListener('click', closeRejectionModal);
    }
    
    if (confirmRejectionBtn) {
        confirmRejectionBtn.addEventListener('click', confirmRejection);
    }
    
    // Close modal when clicking outside
    if (rejectionModal) {
        rejectionModal.addEventListener('click', (e) => {
            if (e.target === rejectionModal) {
                closeRejectionModal();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (rejectionModal && rejectionModal.classList.contains('show')) {
            closeRejectionModal();
        } else if (revisionModalEl && revisionModalEl.classList.contains('show')) {
            closeRevisionModal();
        }
    });
    
    // Enable/disable confirm button based on textarea content
    if (rejectionReasonTextarea && confirmRejectionBtn) {
        rejectionReasonTextarea.addEventListener('input', (e) => {
            confirmRejectionBtn.disabled = !e.target.value.trim();
        });
        confirmRejectionBtn.disabled = true;
    }

    // Revision Needed Modal Event Listeners
    const revisionModalEl = document.getElementById('revisionModal');
    const closeRevisionModalBtn = document.getElementById('closeRevisionModal');
    const cancelRevisionBtn = document.getElementById('cancelRevisionBtn');
    const confirmRevisionBtn = document.getElementById('confirmRevisionBtn');
    const revisionDetailsTextarea = document.getElementById('revisionDetails');
    if (closeRevisionModalBtn) closeRevisionModalBtn.addEventListener('click', closeRevisionModal);
    if (cancelRevisionBtn) cancelRevisionBtn.addEventListener('click', closeRevisionModal);
    if (confirmRevisionBtn) confirmRevisionBtn.addEventListener('click', confirmRevision);
    if (revisionModalEl) {
        revisionModalEl.addEventListener('click', (e) => {
            if (e.target === revisionModalEl) closeRevisionModal();
        });
    }
    if (revisionDetailsTextarea && confirmRevisionBtn) {
        revisionDetailsTextarea.addEventListener('input', (e) => {
            confirmRevisionBtn.disabled = !e.target.value.trim();
        });
        confirmRevisionBtn.disabled = true;
    }

    // Desktop dropdown hover for Accounting menu
    const accountingDropdown = document.querySelector('.nav-item-dropdown');
    if (accountingDropdown) {
        const dropdownMenu = accountingDropdown.querySelector('.nav-dropdown-menu');
        const accountingNavItem = accountingDropdown.querySelector('.nav-item');
        
        if (dropdownMenu && accountingNavItem) {
            let hideTimeout = null;
            
            // Function to position dropdown
            const positionDropdown = () => {
                const rect = accountingNavItem.getBoundingClientRect();
                dropdownMenu.style.top = (rect.bottom + 4) + 'px';
                dropdownMenu.style.left = rect.left + 'px';
            };

            // Function to show dropdown
            const showDropdown = () => {
                if (window.innerWidth > 768) {
                    clearTimeout(hideTimeout);
                    positionDropdown();
                    dropdownMenu.style.display = 'block';
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.visibility = 'visible';
                }
            };

            // Function to hide dropdown with delay
            const hideDropdown = () => {
                if (window.innerWidth > 768) {
                    hideTimeout = setTimeout(() => {
                        dropdownMenu.style.display = 'none';
                        dropdownMenu.style.opacity = '0';
                        dropdownMenu.style.visibility = 'hidden';
                    }, 150); // 150ms delay before hiding
                }
            };

            // Show dropdown on hover (desktop)
            accountingDropdown.addEventListener('mouseenter', showDropdown);
            accountingDropdown.addEventListener('mouseleave', hideDropdown);

            // Keep dropdown visible when hovering over it
            dropdownMenu.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    clearTimeout(hideTimeout);
                    dropdownMenu.style.display = 'block';
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.visibility = 'visible';
                }
            });

            dropdownMenu.addEventListener('mouseleave', hideDropdown);

            // Mobile: toggle dropdown on click
            accountingNavItem.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    accountingDropdown.classList.toggle('open');
                }
            });
        }
    }
    
    // Initial render
    filterEstimates();
    updateTotalCount();
    updateSummary();
    updateSortIcons();
    updateCardActiveStates();
    updateFilterBadge();
    updateCsvButtonLabel();
});

// Toggle estimate actions dropdown
window.toggleEstimateActionsDropdown = function(estimateId) {
    const dropdown = document.getElementById(`estimateActionsDropdown-${estimateId}`);
    if (!dropdown) return;
    
    // Close all other dropdowns
    document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
        if (menu.id !== `estimateActionsDropdown-${estimateId}`) {
            menu.style.display = 'none';
        }
    });
    
    // Toggle current dropdown
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
};

// Bill for Work Incurred: open modal (both mousedown and click, capture phase)
function handleBillForWorkIncurred(e) {
    var item = e.target.closest('.bill-for-work-incurred-trigger') || e.target.closest('[data-action="bill-for-work-incurred"]');
    if (!item) return;
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('.actions-dropdown-menu').forEach(function(m) { m.style.display = 'none'; });
    var estimateId = item.getAttribute('data-estimate-id') || (function() {
        var menu = item.closest('.actions-dropdown-menu');
        return menu && menu.id ? menu.id.replace('estimateActionsDropdown-', '') : null;
    })();
    if (typeof window.showBillModal === 'function') window.showBillModal(estimateId);
}
document.addEventListener('mousedown', handleBillForWorkIncurred, true);
document.addEventListener('click', handleBillForWorkIncurred, true);

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.actions-dropdown-container')) {
        document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Download estimate function
function downloadEstimate(estimateId) {
    const estimate = state.estimates.find(est => est.id === estimateId);
    if (estimate) {
        alert(`Downloading request ${estimate.workOrderNumber}`);
        // In a real implementation, this would trigger a download
    }
}

