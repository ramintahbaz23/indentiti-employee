// Application State
let state = {
    workOrders: workOrdersData,
    filteredWorkOrders: workOrdersData,
    displayedWorkOrders: [],
    sortColumn: null,
    sortDirection: 'asc',
    currentView: 'table', // 'table' or 'card'
    currentPage: 1,
    pageSize: 10,
    filters: {
        status: 'all',
        priority: 'all',
        trade: 'all',
        dateRange: 'all',
        location: 'all'
    },
    activeFilterTags: [],
    searchQuery: ''
};

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusClass(status) {
    const statusMap = {
        'New': 'new',
        'Assigned': 'assigned',
        'Scheduled': 'scheduled',
        'On-site/In Progress': 'in-progress',
        'Dispatched': 'dispatched',
        'Work Complete': 'completed',
        'Proposal Submitted': 'pending-approval',
        'Proposal Pending Approval': 'pending-approval',
        'Pending Schedule': 'pending-approval'
    };
    return statusMap[status] || 'new';
}

function getPriorityClass(priority) {
    if (!priority) return 'medium';
    // Map NPW1 to medium for CSS class
    const normalizedPriority = priority === 'NPW1' ? 'Medium' : priority;
    return normalizedPriority.toLowerCase();
}

function formatPriorityDisplay(priority) {
    if (!priority) return '';
    // Display "Medium" as "NPW1"
    return priority === 'Medium' ? 'NPW1' : priority;
}

// Filter Functions
function filterWorkOrders() {
    let filtered = [...state.workOrders];

    // Search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(wo => 
            wo.id.toLowerCase().includes(query) ||
            wo.issue.toLowerCase().includes(query) ||
            wo.storeName.toLowerCase().includes(query) ||
            wo.city.toLowerCase().includes(query) ||
            wo.state.toLowerCase().includes(query)
        );
    }

    // Status filter
    if (state.filters.status !== 'all') {
        filtered = filtered.filter(wo => wo.status === state.filters.status);
    }

    // Priority filter
    if (state.filters.priority !== 'all') {
        filtered = filtered.filter(wo => {
            // Handle NPW1 mapping - it should match Medium priority
            if (state.filters.priority === 'Medium') {
                return wo.priority === 'Medium' || wo.priority === 'NPW1';
            }
            return wo.priority === state.filters.priority;
        });
    }

    // Trade filter
    if (state.filters.trade !== 'all') {
        filtered = filtered.filter(wo => wo.trade === state.filters.trade);
    }

    // Location filter
    if (state.filters.location !== 'all') {
        filtered = filtered.filter(wo => wo.state === state.filters.location);
    }

    // Date range filter
    if (state.filters.dateRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (state.filters.dateRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case '7days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'thisWeek':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        
        if (startDate) {
            filtered = filtered.filter(wo => new Date(wo.createdDate) >= startDate);
        }
    }

    // Sort - First prioritize by days overdue (3 days first, then 1 day), then apply user sort
    filtered.sort((a, b) => {
        // First, prioritize overdue work orders by days overdue (descending: 3 days before 1 day)
        const aDaysOverdue = (a.isOverdue && a.daysOverdue) ? a.daysOverdue : 0;
        const bDaysOverdue = (b.isOverdue && b.daysOverdue) ? b.daysOverdue : 0;
        
        if (aDaysOverdue !== bDaysOverdue) {
            return bDaysOverdue - aDaysOverdue; // Descending: higher days overdue first
        }
        
        // If both have same days overdue (or both are 0), apply user-specified sort
        if (state.sortColumn) {
            let aVal, bVal;
            
            switch (state.sortColumn) {
                case 'woNumber':
                    aVal = a.id;
                    bVal = b.id;
                    break;
                case 'status':
                    aVal = a.status;
                    bVal = b.status;
                    break;
                case 'priority':
                    // Priority order: Critical > High > Medium/NPW1 > Low
                    const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'NPW1': 2, 'Low': 1 };
                    aVal = priorityOrder[a.priority] || 0;
                    bVal = priorityOrder[b.priority] || 0;
                    break;
                case 'issue':
                    aVal = a.issue;
                    bVal = b.issue;
                    break;
                case 'trade':
                    aVal = a.trade;
                    bVal = b.trade;
                    break;
                case 'location':
                    aVal = `${a.city}, ${a.state}`;
                    bVal = `${b.city}, ${b.state}`;
                    break;
                case 'created':
                    aVal = new Date(a.createdDate);
                    bVal = new Date(b.createdDate);
                    break;
                case 'endDate':
                    aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    break;
                case 'nte':
                    aVal = a.nteAmount || 0;
                    bVal = b.nteAmount || 0;
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
            return 0;
        }
        
        // If no user sort specified, maintain the overdue priority order
        return 0;
    });

    state.filteredWorkOrders = filtered;
    state.currentPage = 1;
    updateActiveFilterTags();
    renderCurrentView();
}

function renderCurrentView() {
    if (state.currentView === 'table') {
        renderTable();
    } else {
        renderWorkOrders();
    }
    updateTotalCount();
}

function updateActiveFilterTags() {
    const tags = [];
    
    if (state.filters.status !== 'all') {
        tags.push({ type: 'status', label: `Status: ${state.filters.status}`, value: state.filters.status });
    }
    if (state.filters.priority !== 'all') {
        tags.push({ type: 'priority', label: `Priority: ${state.filters.priority}`, value: state.filters.priority });
    }
    if (state.filters.trade !== 'all') {
        tags.push({ type: 'trade', label: `Trade: ${state.filters.trade}`, value: state.filters.trade });
    }
    if (state.filters.location !== 'all') {
        tags.push({ type: 'location', label: `Location: ${state.filters.location}`, value: state.filters.location });
    }
    if (state.filters.dateRange !== 'all') {
        const dateLabels = {
            'today': 'Today',
            '7days': 'Last 7 Days',
            '30days': 'Last 30 Days',
            'thisWeek': 'This Week',
            'thisMonth': 'This Month'
        };
        tags.push({ type: 'dateRange', label: `Date: ${dateLabels[state.filters.dateRange]}`, value: state.filters.dateRange });
    }
    
    state.activeFilterTags = tags;
    renderActiveFilters();
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

function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    
    if (state.activeFilterTags.length === 0) {
        container.innerHTML = '';
        updateFilterBadge();
        return;
    }
    
    container.innerHTML = state.activeFilterTags.map(tag => `
        <div class="filter-tag">
            <span>${tag.label}</span>
            <span class="filter-tag-remove" data-filter-type="${tag.type}">×</span>
        </div>
    `).join('');
    
    // Attach remove listeners
    container.querySelectorAll('.filter-tag-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.filterType;
            state.filters[filterType] = 'all';
            const filterElement = document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
            if (filterElement) filterElement.value = 'all';
            filterWorkOrders();
        });
    });
    
    updateFilterBadge();
}

function getPaginatedWorkOrders() {
    const start = (state.currentPage - 1) * state.pageSize;
    return state.filteredWorkOrders.slice(start, start + state.pageSize);
}

function renderTable() {
    const tbody = document.getElementById('workOrdersTableBody');
    
    if (state.filteredWorkOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 3rem;">
                    <div style="color: #706e6b;">No work orders found matching your criteria.</div>
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }
    
    const pageWorkOrders = getPaginatedWorkOrders();
    tbody.innerHTML = pageWorkOrders.map(wo => {
        // Determine status class and text based on metrics
        let statusClass = 'new';
        let statusText = wo.status;
        
        // Check for Needs Attention: Past Due OR New
        if (wo.isOverdue || wo.status === 'New') {
            statusClass = 'needs-attention';
            statusText = 'Action Needed';
        }
        // Check for In Progress: On-site/In Progress OR Dispatched
        else if (wo.status === 'On-site/In Progress' || wo.status === 'Dispatched') {
            statusClass = 'in-progress';
            statusText = 'In Progress';
        }
        // Check for New: Status is New (but not if it's already marked as Needs Attention)
        else if (wo.status === 'New') {
            statusClass = 'new';
            statusText = 'New';
        }
        // Check for Awaiting Approval: Proposal Submitted, Proposal Pending Approval, Pending Schedule, or Awaiting Parts
        else if (wo.status === 'Proposal Submitted' || wo.status === 'Proposal Pending Approval' || wo.status === 'Pending Schedule' || wo.status === 'Awaiting Parts') {
            statusClass = 'on-hold';
            statusText = 'Awaiting Approval';
        }
        else {
            statusClass = getStatusClass(wo.status);
            statusText = wo.status;
        }
        
        const location = `${wo.city}, ${wo.state}`;
        const storeLocation = `${location} ${wo.storeName}`;
        const isActionNeeded = statusClass === 'needs-attention';
        
        return `
            <tr class="${isActionNeeded ? 'row-action-needed' : ''}">
                <td>
                    <a href="#" class="wo-number" data-id="${wo.id}">${wo.id}</a>
                </td>
                <td>
                    ${wo.isOverdue && wo.daysOverdue ? `
                        <div class="status-with-tooltip">
                            <span class="status-text status-${statusClass}">${statusText}</span>
                            <div class="hover-tooltip">
                                ${wo.daysOverdue} ${wo.daysOverdue === 1 ? 'day' : 'days'} overdue
                            </div>
                        </div>
                    ` : `
                        <span class="status-text status-${statusClass}">${statusText}</span>
                    `}
                </td>
                <td>
                    <span class="priority-badge priority-${getPriorityClass(wo.priority)}">
                        ${formatPriorityDisplay(wo.priority) || '-'}
                    </span>
                </td>
                <td>${wo.issue}</td>
                <td>${formatDate(wo.createdDate)}</td>
                <td>${wo.dueDate ? formatDate(wo.dueDate) : '-'}</td>
                <td>${wo.trade}</td>
                <td>${storeLocation}</td>
                <td>${wo.nteAmount ? formatCurrency(wo.nteAmount) : '-'}</td>
            </tr>
        `;
    }).join('');
    
    renderPagination();
    attachTableListeners();
}

function attachTableListeners() {
    // Work order number clicks
    document.querySelectorAll('.wo-number').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const woId = e.target.dataset.id;
            console.log(`Opening work order ${woId}`);
        });
    });
}

function renderWorkOrders() {
    const grid = document.getElementById('workOrdersGrid');
    
    if (state.filteredWorkOrders.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-title">No Work Orders Found</div>
                <div class="empty-state-description">
                    No work orders match your current filters. Try adjusting your search criteria.
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = state.filteredWorkOrders.map(wo => {
        const statusClass = getStatusClass(wo.status);
        const priorityClass = getPriorityClass(wo.priority);
        const location = `${wo.city}, ${wo.state}`;
        
        // Show appropriate badge based on work order state - matching metrics
        let badgeHtml;
        
        // Check for Needs Attention: Past Due OR New
        if (wo.isOverdue || wo.status === 'New') {
            badgeHtml = `<span class="status-badge status-needs-attention">ACTION NEEDED</span>`;
        }
        // Check for In Progress: On-site/In Progress OR Dispatched
        else if (wo.status === 'On-site/In Progress' || wo.status === 'Dispatched') {
            badgeHtml = `<span class="status-badge status-in-progress">IN PROGRESS</span>`;
        }
        // Check for New: Status is New (but not if it's already marked as Needs Attention)
        else if (wo.status === 'New') {
            badgeHtml = `<span class="status-badge status-new-badge">NEW</span>`;
        }
        // Check for Awaiting Approval: Proposal Submitted, Proposal Pending Approval, Pending Schedule, or Awaiting Parts
        else if (wo.status === 'Proposal Submitted' || wo.status === 'Proposal Pending Approval' || wo.status === 'Pending Schedule' || wo.status === 'Awaiting Parts') {
            badgeHtml = `<span class="status-badge status-on-hold">AWAITING APPROVAL</span>`;
        }
        else {
            // Default to status badge
            badgeHtml = `<span class="status-badge status-${statusClass}">${wo.status}</span>`;
        }

        const isActionNeeded = wo.isOverdue || wo.status === 'New';
        return `
            <div class="work-order-card priority-${priorityClass}${isActionNeeded ? ' action-needed' : ''}" data-wo-id="${wo.id}">
                <div class="work-order-header">
                    <div class="work-order-header-top">
                        <span class="work-order-number" data-id="${wo.id}">${wo.id}</span>
                        ${badgeHtml}
                    </div>
                    <div class="work-order-title">
                        ${wo.issue}
                    </div>
                    <div class="work-order-classification">
                        ${wo.trade}
                    </div>
                </div>
                <div class="work-order-body">
                    <div class="work-order-details">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value location-value">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            ${location}
                        </span>
                        
                        <span class="detail-label">Store:</span>
                        <span class="detail-value">${wo.storeName}</span>
                        
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${formatDate(wo.createdDate)}</span>
                        
                        ${wo.dueDate ? `
                            <span class="detail-label">Due Date:</span>
                            <span class="detail-value">${formatDate(wo.dueDate)}</span>
                        ` : ''}
                        
                        ${wo.nteAmount ? `
                            <span class="detail-label">NTE:</span>
                            <span class="detail-value">${formatCurrency(wo.nteAmount)}</span>
                        ` : ''}
                    </div>
                </div>
                ${wo.isOverdue && wo.daysOverdue ? `
                    <div class="overdue-badge-bottom-right">
                        ${wo.daysOverdue} ${wo.daysOverdue === 1 ? 'day' : 'days'} overdue
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Attach event listeners
    attachWorkOrderListeners();
}

function attachWorkOrderListeners() {
    // Make entire cards clickable - navigate to details page
    document.querySelectorAll('.work-order-card[data-wo-id]').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on interactive elements
            if (e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            const woId = card.dataset.woId;
            window.location.href = `work-order-details.html?id=${woId}`;
        });
    });
}

function updateTotalCount() {
    const count = state.filteredWorkOrders.length;
    const countElement = document.getElementById('totalCount');
    if (countElement) {
        countElement.textContent = `${count} ${count === 1 ? 'work order' : 'work orders'}`;
    }
}

function getTotalPages() {
    return Math.max(1, Math.ceil(state.filteredWorkOrders.length / state.pageSize));
}

function renderPagination() {
    const total = state.filteredWorkOrders.length;
    const totalPages = getTotalPages();
    const start = total === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, total);

    const infoEl = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('paginationPrev');
    const nextBtn = document.getElementById('paginationNext');
    const numbersEl = document.getElementById('paginationNumbers');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (infoEl) {
        infoEl.textContent = total === 0 ? '0 work orders' : `${start}–${end} of ${total} work orders`;
    }
    if (prevBtn) {
        prevBtn.disabled = state.currentPage <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = state.currentPage >= totalPages;
    }
    if (pageSizeSelect) {
        pageSizeSelect.value = String(state.pageSize);
    }

    // Page number buttons (show up to 5 pages around current)
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
                renderTable();
            });
        });
    }
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
    
    // Filter dropdowns
    document.getElementById('filterStatus').addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        filterWorkOrders();
    });
    
    const filterPriority = document.getElementById('filterPriority');
    if (filterPriority) {
        filterPriority.addEventListener('change', (e) => {
            state.filters.priority = e.target.value;
            filterWorkOrders();
        });
    }
    
    document.getElementById('filterTrade').addEventListener('change', (e) => {
        state.filters.trade = e.target.value;
        filterWorkOrders();
    });
    
    document.getElementById('filterDateRange').addEventListener('change', (e) => {
        state.filters.dateRange = e.target.value;
        filterWorkOrders();
    });
    
    document.getElementById('filterLocation').addEventListener('change', (e) => {
        state.filters.location = e.target.value;
        filterWorkOrders();
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        filterWorkOrders();
    });
    
    // Clear all filters
    document.getElementById('clearAll').addEventListener('click', (e) => {
        e.preventDefault();
        state.filters = {
            status: 'all',
            priority: 'all',
            trade: 'all',
            dateRange: 'all',
            location: 'all'
        };
        state.searchQuery = '';
        
        document.getElementById('filterStatus').value = 'all';
        const filterPriorityEl = document.getElementById('filterPriority');
        if (filterPriorityEl) filterPriorityEl.value = 'all';
        document.getElementById('filterTrade').value = 'all';
        document.getElementById('filterDateRange').value = 'all';
        document.getElementById('filterLocation').value = 'all';
        document.getElementById('searchInput').value = '';
        
        filterWorkOrders();
    });
    
    // Sortable columns
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (state.sortColumn === column) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortColumn = column;
                state.sortDirection = 'asc';
            }
            
            // Update sort icons
            document.querySelectorAll('.sort-icon').forEach(icon => {
                icon.textContent = '⇅';
            });
            th.querySelector('.sort-icon').textContent = state.sortDirection === 'asc' ? '↑' : '↓';
            
            filterWorkOrders();
        });
    });
    
    // Pagination
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            state.pageSize = parseInt(e.target.value, 10);
            state.currentPage = 1;
            renderTable();
        });
    }
    const paginationPrev = document.getElementById('paginationPrev');
    if (paginationPrev) {
        paginationPrev.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderTable();
            }
        });
    }
    const paginationNext = document.getElementById('paginationNext');
    if (paginationNext) {
        paginationNext.addEventListener('click', () => {
            if (state.currentPage < getTotalPages()) {
                state.currentPage++;
                renderTable();
            }
        });
    }
    
    // Initial render - show table view by default
    document.getElementById('tableContainer').style.display = 'block';
    document.getElementById('workOrdersGrid').style.display = 'none';
    filterWorkOrders();
    renderSidebarNavigation();
});

// Sidebar Navigation - Recent Work Orders
function getRecentWorkOrders() {
    try {
        const stored = localStorage.getItem('recentWorkOrders');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function renderSidebarNavigation() {
    const container = document.getElementById('workOrderChildren');
    if (!container) return;
    
    const recent = getRecentWorkOrders();
    
    if (recent.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    
    let html = '';
    if (recent.length > 0) {
        html += `<div class="recent-work-orders-label">Recently Viewed</div>`;
        recent.slice(0, 5).forEach(wo => {
            html += `
                <a href="work-order-details.html?id=${wo.id}" class="nav-item-child">
                    ${wo.id}
                </a>
            `;
        });
    }
    
    container.innerHTML = html;
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        // Create toast element if it doesn't exist
        const toastEl = document.createElement('div');
        toastEl.id = 'toast';
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
    }
    
    const toastEl = document.getElementById('toast');
    toastEl.textContent = message;
    toastEl.className = `toast ${type} show`;
    
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// File upload functionality
let uploadedFiles = [];

function renderUploadedFiles() {
    const container = document.getElementById('uploadedFilesList');
    if (!container) return;
    
    if (uploadedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = uploadedFiles.map((file, index) => `
        <div class="uploaded-file-item">
            <span class="uploaded-file-name">${file.name}</span>
            <button type="button" class="uploaded-file-remove" data-index="${index}">Remove</button>
        </div>
    `).join('');
    
    // Add remove handlers
    container.querySelectorAll('.uploaded-file-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            uploadedFiles.splice(index, 1);
            renderUploadedFiles();
        });
    });
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    if (!fileInput || !fileUploadArea) return;
    
    // Click to upload
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showToast(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
            return;
        }
        
        // Check file type
        const allowedTypes = ['image/', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const isValidType = allowedTypes.some(type => file.type.startsWith(type) || file.name.toLowerCase().endsWith(type));
        
        if (!isValidType) {
            showToast(`File "${file.name}" is not a supported file type.`, 'error');
            return;
        }
        
        uploadedFiles.push(file);
    });
    
    renderUploadedFiles();
    
    if (fileList.length > 0) {
        showToast(`${fileList.length} file(s) added successfully`, 'success');
    }
}

// Modal handlers
document.addEventListener('DOMContentLoaded', () => {
    // New Work Order button
    const newWorkOrderBtn = document.getElementById('newWorkOrderBtn');
    if (newWorkOrderBtn) {
        newWorkOrderBtn.addEventListener('click', () => {
            // Reset form and clear edit ID
            const form = document.getElementById('newWorkOrderForm');
            if (form) {
                form.reset();
                form.removeAttribute('data-edit-id');
                const clearAccount = document.getElementById('clearAccount');
                if (clearAccount) clearAccount.style.display = 'none';
                const modalTitle = document.querySelector('#newWorkOrderModal .modal-title');
                if (modalTitle) modalTitle.textContent = 'Work Order Number';
                // Clear uploaded files
                uploadedFiles = [];
                renderUploadedFiles();
            }
            
            const modal = document.getElementById('newWorkOrderModal');
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                // Prevent body scroll on mobile
                if (window.innerWidth <= 768) {
                    document.body.style.position = 'fixed';
                    document.body.style.width = '100%';
                }
            }
        });
    }

    // Close modal handlers
    function closeModal() {
        const modal = document.getElementById('newWorkOrderModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            // Remove any fixed positioning that might have been added
            document.body.style.position = '';
            document.body.style.width = '';
            const form = document.getElementById('newWorkOrderForm');
            if (form) {
                form.reset();
                form.removeAttribute('data-edit-id');
                const clearAccount = document.getElementById('clearAccount');
                if (clearAccount) clearAccount.style.display = 'none';
                const modalTitle = document.querySelector('#newWorkOrderModal .modal-title');
                if (modalTitle) modalTitle.textContent = 'Work Order Number';
                // Clear uploaded files
                uploadedFiles = [];
                renderUploadedFiles();
            }
        }
    }

    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    
    const cancelWorkOrder = document.getElementById('cancelWorkOrder');
    if (cancelWorkOrder) cancelWorkOrder.addEventListener('click', closeModal);

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('newWorkOrderModal');
            if (modal && modal.style.display === 'flex') {
                closeModal();
            }
        }
    });

    // Clear account input
    const accountInput = document.getElementById('account');
    if (accountInput) {
        accountInput.addEventListener('input', (e) => {
            const clearBtn = document.getElementById('clearAccount');
            if (clearBtn) {
                clearBtn.style.display = e.target.value ? 'flex' : 'none';
            }
        });
    }

    const clearAccount = document.getElementById('clearAccount');
    if (clearAccount) {
        clearAccount.addEventListener('click', () => {
            const account = document.getElementById('account');
            if (account) {
                account.value = '';
                clearAccount.style.display = 'none';
            }
        });
    }

    // Helper function to map priority from form format to display format
    function mapPriorityToDisplay(priorityFormValue) {
        if (!priorityFormValue) return 'Medium';
        
        const priorityMap = {
            'P1 - Priority 1 Hour': 'Critical',
            'P2 - Priority 2 Hours': 'Critical',
            'P3 - Priority 3 Hours': 'High',
            'P4 - Priority 4 Hours': 'High',
            'P5 - Priority 5 Hours': 'Medium',
            'P6 - Priority 6 Hours': 'Medium',
            'P7 - Priority 7 Hours': 'Low',
            'P8 - Priority 8 Hours': 'Low',
            'P9 - Priority 9 Hours': 'Low',
            'P10 - Priority 10 Hours': 'Low'
        };
        
        return priorityMap[priorityFormValue] || 'Medium';
    }

    // Save Work Order
    function saveWorkOrder(closeAfterSave = true) {
        const form = document.getElementById('newWorkOrderForm');
        if (!form) return;
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get form values
        const formData = new FormData(form);
        const priorityFormValue = formData.get('priority');
        const priorityDisplay = mapPriorityToDisplay(priorityFormValue);
        
        // Check if we're editing an existing work order
        const editId = form.dataset.editId;
        const isEdit = !!editId;
        
        let workOrderId;
        let workOrder;
        
        if (isEdit) {
            // Update existing work order
            workOrderId = editId;
            workOrder = state.workOrders.find(wo => wo.id === workOrderId);
            if (!workOrder) {
                showToast('Work order not found', 'error');
                return;
            }
            
            // Update existing work order
            workOrder.priority = priorityDisplay;
            workOrder.trade = formData.get('trade');
            workOrder.issue = formData.get('issue') || 'Work Order';
            workOrder.storeName = formData.get('account') || null;
            workOrder.nteAmount = formData.get('originalNTE') ? parseFloat(formData.get('originalNTE')) : null;
            workOrder.status = 'New';
            
            showToast(`Work order ${workOrderId} updated successfully!`, 'success');
        } else {
            // Create new work order
            workOrderId = 'WO-' + String(Math.floor(Math.random() * 1000000)).padStart(8, '0');
            
            workOrder = {
                id: workOrderId,
                status: 'New',
                priority: priorityDisplay,
                trade: formData.get('trade'),
                issue: formData.get('issue') || 'Work Order',
                storeName: formData.get('account') || null,
                nteAmount: formData.get('originalNTE') ? parseFloat(formData.get('originalNTE')) : null,
                dueDate: null,
                scheduledDate: null,
                completedDate: null,
                invoiceAmount: null,
                createdDate: new Date(),
                isOverdue: false,
                daysOverdue: 0,
                city: '',
                state: ''
            };
            
            // Add to the beginning of work orders array (most recent first)
            state.workOrders.unshift(workOrder);
            
            showToast(`Work order ${workOrderId} created successfully!`, 'success');
        }
        
        // Refresh the filtered work orders and re-render
        filterWorkOrders();
        renderTable();
        updateTotalCount();
        
        if (closeAfterSave) {
            // Close modal and reset form
            closeModal();
        } else {
            // Reset form but keep modal open for "Save & New"
            form.reset();
            form.removeAttribute('data-edit-id');
            const clearAccount = document.getElementById('clearAccount');
            if (clearAccount) clearAccount.style.display = 'none';
            const modalTitle = document.querySelector('#newWorkOrderModal .modal-title');
            if (modalTitle) modalTitle.textContent = 'Work Order Number';
            // Clear uploaded files
            uploadedFiles = [];
            renderUploadedFiles();
            
            // Focus on first field for quick entry
            setTimeout(() => {
                const account = document.getElementById('account');
                if (account) account.focus();
            }, 100);
        }
    }

    // Save button - closes modal after saving
    const saveWorkOrderBtn = document.getElementById('saveWorkOrder');
    if (saveWorkOrderBtn) {
        saveWorkOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveWorkOrder(true);
        });
    }

    // Save & New button - keeps modal open for another entry
    const saveAndNewWorkOrderBtn = document.getElementById('saveAndNewWorkOrder');
    if (saveAndNewWorkOrderBtn) {
        saveAndNewWorkOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveWorkOrder(false);
        });
    }
    
    // Setup file upload
    setupFileUpload();
});

