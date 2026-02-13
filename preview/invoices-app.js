// Application State
let state = {
    invoices: invoicesData || [],
    filteredInvoices: invoicesData || [],
    displayedInvoices: [],
    sortColumn: null,
    sortDirection: 'asc',
    filters: {
        created: '',
        paidDate: '',
        corporate: '',
        status: 'all'
    },
    searchQuery: '',
    pageSize: 25,
    currentPage: 1,
    selectedInvoices: new Set(),
    activeFilterTags: []
};

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
        'Paid': 'slds-badge_success',
        'Unpaid': 'slds-badge_warning'
    };
    return statusMap[status] || 'slds-badge_lightest';
}

function getStatusColor(status) {
    const colorMap = {
        'Pending': '#706e6b',
        'Approved': '#04844b',
        'Rejected': '#c23934',
        'Paid': '#04844b',
        'Unpaid': '#ffb75d',
        'Sent': '#0070d2',
        'Draft': '#706e6b'
    };
    return colorMap[status] || '#706e6b';
}

function getApproverRole(approvedBy) {
    // Map approver names to roles
    const roleMap = {
        'Mark Thomas': 'Manager Approved',
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
function filterInvoices() {
    let filtered = [...state.invoices];

    // Search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(inv => 
            inv.ticketNumber.toLowerCase().includes(query) ||
            inv.invoiceNumber.toLowerCase().includes(query) ||
            (inv.trackingNumber && inv.trackingNumber.toLowerCase().includes(query)) ||
            (inv.brand && inv.brand.toLowerCase().includes(query)) ||
            (inv.comment && inv.comment.toLowerCase().includes(query))
        );
    }

    // Created date filter
    if (state.filters.created) {
        const filterDate = new Date(state.filters.created);
        filtered = filtered.filter(inv => {
            const invDate = new Date(inv.created);
            return invDate.toDateString() === filterDate.toDateString();
        });
    }

    // Paid date filter
    if (state.filters.paidDate) {
        const filterDate = new Date(state.filters.paidDate);
        filtered = filtered.filter(inv => {
            if (!inv.paidDate) return false;
            const invDate = new Date(inv.paidDate);
            return invDate.toDateString() === filterDate.toDateString();
        });
    }

    // Corporate filter
    if (state.filters.corporate) {
        const query = state.filters.corporate.toLowerCase();
        filtered = filtered.filter(inv => 
            (inv.brand && inv.brand.toLowerCase().includes(query))
        );
    }

    // Status filter
    if (state.filters.status !== 'all') {
        filtered = filtered.filter(inv => inv.status === state.filters.status);
    }

    // Sort
    if (state.sortColumn) {
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (state.sortColumn) {
                case 'ticketNumber':
                    aVal = a.ticketNumber;
                    bVal = b.ticketNumber;
                    break;
                case 'created':
                    aVal = new Date(a.created);
                    bVal = new Date(b.created);
                    break;
                case 'trackingNumber':
                    aVal = a.trackingNumber || '';
                    bVal = b.trackingNumber || '';
                    break;
                case 'invoiceDate':
                    aVal = a.invoiceDate ? new Date(a.invoiceDate) : new Date(0);
                    bVal = b.invoiceDate ? new Date(b.invoiceDate) : new Date(0);
                    break;
                case 'invoiceNumber':
                    aVal = a.invoiceNumber;
                    bVal = b.invoiceNumber;
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
                case 'paidAmount':
                    aVal = a.paidAmount || 0;
                    bVal = b.paidAmount || 0;
                    break;
                case 'checkAch':
                    aVal = a.checkAch || '';
                    bVal = b.checkAch || '';
                    break;
                case 'paidDate':
                    aVal = a.paidDate ? new Date(a.paidDate) : new Date(0);
                    bVal = b.paidDate ? new Date(b.paidDate) : new Date(0);
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

    state.filteredInvoices = filtered;
    state.currentPage = 1;
    
    // Pagination
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    state.displayedInvoices = filtered.slice(startIndex, endIndex);
    
    updateActiveFilterTags();
    renderTable();
    renderPagination();
    updateTotalCount();
    updateSummary();
}

function updateActiveFilterTags() {
    const tags = [];
    
    if (state.filters.created) {
        tags.push({ type: 'created', label: `Created: ${state.filters.created}`, value: state.filters.created });
    }
    if (state.filters.paidDate) {
        tags.push({ type: 'paidDate', label: `Paid Date: ${state.filters.paidDate}`, value: state.filters.paidDate });
    }
    if (state.filters.corporate) {
        tags.push({ type: 'corporate', label: `Corporate: ${state.filters.corporate}`, value: state.filters.corporate });
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
    const tbody = document.getElementById('invoicesTableBody');
    
    if (!tbody) return;
    
    if (state.filteredInvoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15" style="text-align: center; padding: 3rem;">
                    <div style="color: #706e6b;">No invoices found matching your criteria.</div>
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }
    
    tbody.innerHTML = state.displayedInvoices.map(inv => {
        const isSelected = state.selectedInvoices.has(inv.id);
        
        // Status display - plain text with color, show approver if approved
        const statusColor = getStatusColor(inv.status);
        let statusText = inv.status;
        if (inv.status === 'Approved' && inv.approvedBy) {
            // Map approver name to role
            const approverRole = getApproverRole(inv.approvedBy);
            statusText = `${inv.status} (${approverRole})`;
        }
        const statusDisplay = `<span style="color: ${statusColor}; font-weight: 500;">${statusText}</span>`;
        
        // Actions dropdown
        const actionsDropdown = `
            <div class="actions-dropdown-container" style="position: relative;">
                <button class="actions-dropdown-btn" onclick="toggleActionsDropdown('${inv.id}')" data-invoice-id="${inv.id}" aria-haspopup="true" aria-expanded="false" title="Actions">
                    <svg class="slds-icon slds-icon_x-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="actions-dropdown-menu" id="actionsDropdown-${inv.id}" style="display: none;">
                    <a href="#" onclick="approveInvoice('${inv.id}'); return false;" class="actions-dropdown-item"><span class="actions-dropdown-item-icon icon-approve" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>Approve</a>
                    <a href="#" onclick="rejectInvoice('${inv.id}'); return false;" class="actions-dropdown-item"><span class="actions-dropdown-item-icon icon-reject" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>Reject</a>
                    <a href="work-order-details.html?id=${inv.ticketNumber}" class="actions-dropdown-item"><span class="actions-dropdown-item-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>View</a>
                    <a href="#" onclick="downloadInvoice('${inv.id}'); return false;" class="actions-dropdown-item"><span class="actions-dropdown-item-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>Download</a>
                </div>
            </div>
        `;
        
        return `
            <tr data-invoice-id="${inv.id}">
                <td>
                    <input type="checkbox" class="invoice-checkbox" data-invoice-id="${inv.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td><a href="#" class="ticket-number" data-id="${inv.id}">${inv.ticketNumber}</a></td>
                <td>${formatDateTime(inv.created)}</td>
                <td>${inv.trackingNumber || '<span class="empty-cell">Empty</span>'}</td>
                <td>${inv.invoiceDate ? formatDate(inv.invoiceDate) : '<span class="empty-cell">Empty</span>'}</td>
                <td>
                    <a href="#" class="invoice-number" data-id="${inv.id}">${inv.invoiceNumber}</a>
                </td>
                <td>${inv.brand}</td>
                <td class="amount">${formatCurrency(inv.total)}</td>
                <td class="amount">${formatCurrency(inv.taxAmount)}</td>
                <td class="amount">${formatCurrency(inv.grandTotal)}</td>
                <td class="amount">${inv.paidAmount > 0 ? formatCurrency(inv.paidAmount) : '<span class="empty-cell">Empty</span>'}</td>
                <td>${inv.checkAch || '<span class="empty-cell">Empty</span>'}</td>
                <td>${inv.paidDate ? formatDate(inv.paidDate) : '<span class="empty-cell">Empty</span>'}</td>
                <td>${statusDisplay}</td>
                <td>${inv.comment || '<span class="empty-cell">Empty</span>'}</td>
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
        'colTicket': 1,
        'colCreated': 2,
        'colTracking': 3,
        'colInvoiceDate': 4,
        'colInvoiceNumber': 5,
        'colBrand': 6,
        'colTotal': 7,
        'colTaxAmount': 8,
        'colGrandTotal': 9,
        'colPaidAmount': 10,
        'colCheckAch': 11,
        'colPaidDate': 12,
        'colStatus': 13,
        'colComment': 14,
        'colActions': 15
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
    // Handle invoice number clicks (could navigate to invoice details if needed)
    document.querySelectorAll('.invoice-number').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const invId = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;
            console.log(`Opening invoice ${invId}`);
            // TODO: Navigate to invoice details page if needed
        });
    });
    
    // Handle ticket number clicks - navigate to work order details
    document.querySelectorAll('.ticket-number').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const invId = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;
            const invoice = state.invoices.find(inv => inv.id === invId);
            if (invoice && invoice.ticketNumber) {
                // Navigate to work order details page with the ticket number (work order ID)
                window.location.href = `work-order-details.html?id=${encodeURIComponent(invoice.ticketNumber)}`;
            }
        });
    });
    
    // Checkbox listeners
    document.querySelectorAll('.invoice-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const invId = e.target.dataset.invoiceId;
            if (e.target.checked) {
                state.selectedInvoices.add(invId);
            } else {
                state.selectedInvoices.delete(invId);
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
            filterInvoices();
        });
    });
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) return;
    
    const allCheckboxes = document.querySelectorAll('.invoice-checkbox');
    const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    
    selectAllCheckbox.checked = checkedCount === allCheckboxes.length && allCheckboxes.length > 0;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
}

function updateTotalCount() {
    const count = state.filteredInvoices.length;
    const countElement = document.getElementById('totalCount');
    if (countElement) {
        countElement.textContent = `${count} ${count === 1 ? 'invoice' : 'invoices'}`;
    }
}

function updateSummary() {
    const total = state.filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const paidAmount = state.filteredInvoices
        .filter(inv => inv.paidAmount > 0)
        .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const paidTax = state.filteredInvoices
        .filter(inv => inv.paidAmount > 0)
        .reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
    
    const totalEl = document.getElementById('summaryTotal');
    const paidAmountEl = document.getElementById('summaryPaidAmount');
    const paidTaxEl = document.getElementById('summaryPaidTax');
    
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (paidAmountEl) paidAmountEl.textContent = formatCurrency(paidAmount);
    if (paidTaxEl) paidTaxEl.textContent = formatCurrency(paidTax);
}

function getTotalPages() {
    return Math.max(1, Math.ceil(state.filteredInvoices.length / state.pageSize));
}

function renderPagination() {
    const total = state.filteredInvoices.length;
    const totalPages = getTotalPages();
    const start = total === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, total);

    const infoEl = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('paginationPrev');
    const nextBtn = document.getElementById('paginationNext');
    const numbersEl = document.getElementById('paginationNumbers');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (infoEl) {
        infoEl.textContent = total === 0 ? '0 invoices' : `${start}–${end} of ${total} invoices`;
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
    state.displayedInvoices = state.filteredInvoices.slice(startIndex, startIndex + state.pageSize);
    renderTable();
    renderPagination();
}

// Invoice Actions
function approveInvoice(invoiceId) {
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        invoice.status = 'Approved';
        invoice.approvedBy = 'Mark Thomas'; // Set approver when approving
        filterInvoices();
    }
}

// Store current invoice ID being rejected
let currentRejectionInvoiceId = null;

function rejectInvoice(invoiceId) {
    currentRejectionInvoiceId = invoiceId;
    const modal = document.getElementById('rejectionModal');
    const textarea = document.getElementById('rejectionReason');
    const confirmBtn = document.getElementById('confirmRejectionBtn');
    if (modal && textarea) {
        textarea.value = '';
        modal.classList.add('show');
        textarea.focus();
        // Disable confirm button initially
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
    }
}

function closeRejectionModal() {
    const modal = document.getElementById('rejectionModal');
    const textarea = document.getElementById('rejectionReason');
    const confirmBtn = document.getElementById('confirmRejectionBtn');
    if (modal) {
        modal.classList.remove('show');
    }
    if (textarea) {
        textarea.value = '';
    }
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }
    currentRejectionInvoiceId = null;
}

function confirmRejection() {
    const textarea = document.getElementById('rejectionReason');
    const reason = textarea ? textarea.value.trim() : '';
    
    if (!reason) {
        alert('Please provide a reason for rejection.');
        if (textarea) {
            textarea.focus();
        }
        return;
    }
    
    if (!currentRejectionInvoiceId) {
        return;
    }
    
    const invoice = state.invoices.find(inv => inv.id === currentRejectionInvoiceId);
    if (invoice) {
        invoice.status = 'Rejected';
        invoice.comment = `Rejected: ${reason}`;
        filterInvoices();
        closeRejectionModal();
    }
}


function exportToCsv() {
    const headers = [
        'Ticket #',
        'Created',
        'Tracking #',
        'Invoice Date',
        'Invoice #',
        'Brand',
        'Total',
        'Tax Amount',
        'Grand Total',
        'Paid Amount',
        'Check # / ACH #',
        'Paid Date',
        'Status',
        'Comment'
    ];
    
    const rows = state.filteredInvoices.map(inv => [
        inv.ticketNumber,
        formatDate(inv.created),
        inv.trackingNumber,
        formatDate(inv.invoiceDate),
        inv.invoiceNumber,
        inv.brand,
        inv.total,
        inv.taxAmount,
        inv.grandTotal,
        inv.paidAmount,
        inv.checkAch,
        formatDate(inv.paidDate),
        inv.status,
        inv.comment
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
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
    if (typeof invoicesData !== 'undefined') {
        state.invoices = invoicesData;
        state.filteredInvoices = invoicesData;
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            state.currentPage = 1;
            filterInvoices();
        });
    }
    
    // Filter inputs
    const filterCreated = document.getElementById('filterCreated');
    if (filterCreated) {
        filterCreated.addEventListener('change', (e) => {
            state.filters.created = e.target.value;
            state.currentPage = 1;
            filterInvoices();
        });
    }
    
    const filterPaidDate = document.getElementById('filterPaidDate');
    if (filterPaidDate) {
        filterPaidDate.addEventListener('change', (e) => {
            state.filters.paidDate = e.target.value;
            state.currentPage = 1;
            filterInvoices();
        });
    }
    
    const filterCorporate = document.getElementById('filterCorporate');
    if (filterCorporate) {
        filterCorporate.addEventListener('input', (e) => {
            state.filters.corporate = e.target.value;
            state.currentPage = 1;
            filterInvoices();
        });
    }
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            state.filters.status = e.target.value;
            state.currentPage = 1;
            filterInvoices();
        });
    }
    
    // Clear all filters
    const clearAll = document.getElementById('clearAll');
    if (clearAll) {
        clearAll.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters = {
                created: '',
                paidDate: '',
                corporate: '',
                status: 'all'
            };
            state.searchQuery = '';
            if (searchInput) searchInput.value = '';
            if (filterCreated) filterCreated.value = '';
            if (filterPaidDate) filterPaidDate.value = '';
            if (filterCorporate) filterCorporate.value = '';
            if (filterStatus) filterStatus.value = 'all';
            state.currentPage = 1;
            filterInvoices();
        });
    }
    
    // Select All checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.invoice-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const invId = cb.dataset.invoiceId;
                if (e.target.checked) {
                    state.selectedInvoices.add(invId);
                } else {
                    state.selectedInvoices.delete(invId);
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
            filterInvoices();
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
        if (e.key === 'Escape' && rejectionModal && rejectionModal.classList.contains('show')) {
            closeRejectionModal();
        }
    });
    
    // Enable/disable confirm button based on textarea content
    if (rejectionReasonTextarea && confirmRejectionBtn) {
        rejectionReasonTextarea.addEventListener('input', (e) => {
            confirmRejectionBtn.disabled = !e.target.value.trim();
        });
        // Initially disable the button
        confirmRejectionBtn.disabled = true;
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
    filterInvoices();
    updateTotalCount();
    updateSummary();
    updateColumnVisibility();
    updateFilterBadge();
});

// Toggle actions dropdown
window.toggleActionsDropdown = function(invoiceId) {
    const dropdown = document.getElementById(`actionsDropdown-${invoiceId}`);
    if (!dropdown) return;
    
    // Close all other dropdowns
    document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
        if (menu.id !== `actionsDropdown-${invoiceId}`) {
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

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.actions-dropdown-container')) {
        document.querySelectorAll('.actions-dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Download invoice function
function downloadInvoice(invoiceId) {
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        alert(`Downloading invoice ${invoice.invoiceNumber}`);
        // In a real implementation, this would trigger a download
    }
}
