// Application State
let state = {
    workOrders: workOrdersData,
    filteredWorkOrders: workOrdersData,
    displayedWorkOrders: [],
    sortColumn: null,
    sortDirection: 'asc',
    currentView: 'table', // 'table' or 'card'
    filters: {
        status: 'all',
        trade: 'all',
        dateRange: 'all',
        location: 'all',
        contractor: 'all'
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
            wo.state.toLowerCase().includes(query) ||
            (wo.contractorName && wo.contractorName.toLowerCase().includes(query))
        );
    }

    // Status filter
    if (state.filters.status !== 'all') {
        filtered = filtered.filter(wo => wo.status === state.filters.status);
    }

    // Trade filter
    if (state.filters.trade !== 'all') {
        filtered = filtered.filter(wo => wo.trade === state.filters.trade);
    }

    // Location filter
    if (state.filters.location !== 'all') {
        filtered = filtered.filter(wo => wo.state === state.filters.location);
    }

    // Contractor filter
    if (state.filters.contractor !== 'all') {
        filtered = filtered.filter(wo => wo.contractorName === state.filters.contractor);
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
                case 'dueDate':
                    aVal = a.dueDate ? new Date(a.dueDate) : new Date(0);
                    bVal = b.dueDate ? new Date(b.dueDate) : new Date(0);
                    break;
                case 'contractor':
                    aVal = a.contractorName || '';
                    bVal = b.contractorName || '';
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
    if (state.filters.trade !== 'all') {
        tags.push({ type: 'trade', label: `Trade: ${state.filters.trade}`, value: state.filters.trade });
    }
    if (state.filters.location !== 'all') {
        tags.push({ type: 'location', label: `Location: ${state.filters.location}`, value: state.filters.location });
    }
    if (state.filters.contractor !== 'all') {
        tags.push({ type: 'contractor', label: `Contractor: ${state.filters.contractor}`, value: state.filters.contractor });
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

function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    
    if (state.activeFilterTags.length === 0) {
        container.innerHTML = '';
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
            document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`).value = 'all';
            filterWorkOrders();
        });
    });
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
        return;
    }
    
    tbody.innerHTML = state.filteredWorkOrders.map(wo => {
        // Determine status class and text based on metrics
        let statusClass = 'new';
        let statusText = wo.status;
        
        // Check for Needs Attention: Past Due OR (New without contractor)
        if (wo.isOverdue || (wo.status === 'New' && !wo.contractorName)) {
            statusClass = 'needs-attention';
            statusText = 'Needs Attention';
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
        // Check for On Hold: Proposal Submitted, Proposal Pending Approval, Pending Schedule, or Awaiting Parts
        else if (wo.status === 'Proposal Submitted' || wo.status === 'Proposal Pending Approval' || wo.status === 'Pending Schedule' || wo.status === 'Awaiting Parts') {
            statusClass = 'on-hold';
            statusText = 'On Hold';
        }
        else {
            statusClass = getStatusClass(wo.status);
            statusText = wo.status;
        }
        
        const location = `${wo.city}, ${wo.state}`;
        const storeLocation = `${location} ${wo.storeName}`;
        
        return `
            <tr>
                <td><input type="checkbox" class="row-checkbox" data-id="${wo.id}"></td>
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
                <td>${wo.issue}</td>
                <td>${formatDate(wo.dueDate)}</td>
                <td>${wo.trade}</td>
                <td>${storeLocation}</td>
                <td>${wo.contractorName || '-'}</td>
                <td>${formatDate(wo.createdDate)}</td>
                <td>${wo.nteAmount ? formatCurrency(wo.nteAmount) : '-'}</td>
            </tr>
        `;
    }).join('');
    
    // Attach event listeners
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
        
        // Check for Needs Attention: Past Due OR (New without contractor)
        if (wo.isOverdue || (wo.status === 'New' && !wo.contractorName)) {
            badgeHtml = `<span class="status-badge status-needs-attention">NEEDS ATTENTION</span>`;
        }
        // Check for In Progress: On-site/In Progress OR Dispatched
        else if (wo.status === 'On-site/In Progress' || wo.status === 'Dispatched') {
            badgeHtml = `<span class="status-badge status-in-progress">IN PROGRESS</span>`;
        }
        // Check for New: Status is New (but not if it's already marked as Needs Attention)
        else if (wo.status === 'New') {
            badgeHtml = `<span class="status-badge status-new-badge">NEW</span>`;
        }
        // Check for On Hold: Proposal Submitted, Proposal Pending Approval, Pending Schedule, or Awaiting Parts
        else if (wo.status === 'Proposal Submitted' || wo.status === 'Proposal Pending Approval' || wo.status === 'Pending Schedule' || wo.status === 'Awaiting Parts') {
            badgeHtml = `<span class="status-badge status-on-hold">ON HOLD</span>`;
        }
        else {
            // Default to status badge
            badgeHtml = `<span class="status-badge status-${statusClass}">${wo.status}</span>`;
        }

        return `
            <div class="work-order-card priority-${priorityClass}" data-wo-id="${wo.id}">
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
                        
                        ${wo.contractorName ? `
                            <span class="detail-label">Contractor:</span>
                            <span class="detail-value">${wo.contractorName}</span>
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Filter dropdowns
    document.getElementById('filterStatus').addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        filterWorkOrders();
    });
    
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
    
    document.getElementById('filterContractor').addEventListener('change', (e) => {
        state.filters.contractor = e.target.value;
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
            trade: 'all',
            dateRange: 'all',
            location: 'all',
            contractor: 'all'
        };
        state.searchQuery = '';
        
        document.getElementById('filterStatus').value = 'all';
        document.getElementById('filterTrade').value = 'all';
        document.getElementById('filterDateRange').value = 'all';
        document.getElementById('filterLocation').value = 'all';
        document.getElementById('filterContractor').value = 'all';
        document.getElementById('searchInput').value = '';
        
        filterWorkOrders();
    });
    
    // View toggle
    document.getElementById('cardViewBtn').addEventListener('click', () => {
        state.currentView = 'card';
        document.getElementById('cardViewBtn').classList.add('active');
        document.getElementById('tableViewBtn').classList.remove('active');
        document.getElementById('workOrdersGrid').style.display = 'grid';
        document.getElementById('tableContainer').style.display = 'none';
        renderWorkOrders();
        updateTotalCount();
    });
    
    document.getElementById('tableViewBtn').addEventListener('click', () => {
        state.currentView = 'table';
        document.getElementById('tableViewBtn').classList.add('active');
        document.getElementById('cardViewBtn').classList.remove('active');
        document.getElementById('tableContainer').style.display = 'block';
        document.getElementById('workOrdersGrid').style.display = 'none';
        renderTable();
        updateTotalCount();
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
    
    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        document.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });
    
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

