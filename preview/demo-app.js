// Application State - Initialize after data loads
let state = {
    workOrders: typeof workOrdersData !== 'undefined' ? workOrdersData : [],
    filteredWorkOrders: typeof workOrdersData !== 'undefined' ? workOrdersData : [],
    displayedWorkOrders: [],
    filters: {
        status: 'all',
        priority: 'all',
        trade: 'all',
        dateRange: 'all',
        quickFilter: null
    },
    activeMetric: null
};

// Initialize state with work orders data once it's available
function initializeState() {
    if (typeof workOrdersData !== 'undefined' && workOrdersData && Array.isArray(workOrdersData)) {
        state.workOrders = workOrdersData;
        state.filteredWorkOrders = workOrdersData;
        console.log('State initialized with', workOrdersData.length, 'work orders');
    } else {
        console.error('workOrdersData is not available:', typeof workOrdersData, workOrdersData);
    }
}

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
           ' - ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
}

function getPriorityClass(priority) {
    if (!priority) return 'low';
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
    if (!state.workOrders || state.workOrders.length === 0) {
        console.warn('No work orders in state.workOrders:', state.workOrders);
        return;
    }
    let filtered = [...state.workOrders];

    // If a metric is selected, show ALL work orders matching that metric (ignore other filters)
    if (state.activeMetric) {
        switch (state.activeMetric) {
            case 'needsAttention':
                filtered = filtered.filter(wo => 
                    wo.isOverdue || wo.status === 'New'
                );
                break;
            case 'inProgress':
                filtered = filtered.filter(wo => 
                    wo.status === 'On-site/In Progress' || 
                    wo.status === 'Dispatched'
                );
                break;
            case 'new':
                filtered = filtered.filter(wo => wo.status === 'New');
                break;
            case 'onHold':
                filtered = filtered.filter(wo => 
                    wo.status === 'Proposal Submitted' || 
                    wo.status === 'Proposal Pending Approval' ||
                    wo.status === 'Pending Schedule' ||
                    wo.status === 'Awaiting Parts'
                );
                break;
        }
    } else {
        // Only apply other filters when no metric is selected
        
        // Status filter
        if (state.filters.status !== 'all') {
            filtered = filtered.filter(wo => wo.status === state.filters.status);
        }

        // Priority filter
        if (state.filters.priority !== 'all') {
            filtered = filtered.filter(wo => wo.priority === state.filters.priority);
        }

        // Trade filter
        if (state.filters.trade !== 'all') {
            filtered = filtered.filter(wo => wo.trade === state.filters.trade);
        }

        // Quick filter
        if (state.filters.quickFilter) {
            switch (state.filters.quickFilter) {
                case 'urgent':
                    filtered = filtered.filter(wo => 
                        wo.isOverdue || 
                        wo.status === 'New' || 
                        wo.status === 'On-site/In Progress'
                    );
                    break;
                case 'pendingApproval':
                    filtered = filtered.filter(wo => 
                        wo.status === 'Proposal Submitted' || 
                        wo.status === 'Proposal Pending Approval' ||
                        wo.status === 'Pending Schedule'
                    );
                    break;
                case 'new':
                    filtered = filtered.filter(wo => wo.status === 'New');
                    break;
                case 'needsFollowUp':
                    const followUpDate = new Date();
                    followUpDate.setDate(followUpDate.getDate() - 7);
                    filtered = filtered.filter(wo => 
                        new Date(wo.createdDate) < followUpDate &&
                        wo.status !== 'Work Complete' &&
                        wo.status !== 'Invoice Submitted'
                    );
                    break;
                case 'dueThisWeek':
                    const today = new Date();
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    filtered = filtered.filter(wo => 
                        wo.dueDate && 
                        new Date(wo.dueDate) >= today && 
                        new Date(wo.dueDate) <= nextWeek
                    );
                    break;
                case 'recentlyUpdated':
                    const recentDate = new Date();
                    recentDate.setDate(recentDate.getDate() - 3);
                    filtered = filtered.filter(wo => 
                        new Date(wo.createdDate) >= recentDate
                    );
                    break;
            }
        }

        // Default to showing all active work orders (Needs Attention, In Progress, New, On Hold) when no specific filters are active
        // Apply this filter to show the 4 metric categories by default
        const isDefaultView = state.filters.status === 'all' && 
                              state.filters.priority === 'all' && 
                              state.filters.trade === 'all' && 
                              !state.filters.quickFilter &&
                              !state.activeMetric;
        
        if (isDefaultView) {
            // Show all work orders that match any of the 4 metrics
            filtered = filtered.filter(wo => 
                // Needs Attention
                wo.isOverdue || wo.status === 'New' ||
                // In Progress
                wo.status === 'On-site/In Progress' || 
                wo.status === 'Dispatched' ||
                // New (all new work orders)
                wo.status === 'New' ||
                // On Hold
                wo.status === 'Proposal Submitted' || 
                wo.status === 'Proposal Pending Approval' ||
                wo.status === 'Pending Schedule' ||
                wo.status === 'Awaiting Parts'
            );
        }

        // Date range filter - only apply if user has explicitly set other filters
        // Don't apply dateRange when showing default view (the 4 metrics)
        
        if (state.filters.dateRange !== 'all' && !isDefaultView) {
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
    }

    // Sort by priority/urgency: Past Due (by days overdue) > Need Assignment > In Progress > Others
    filtered.sort((a, b) => {
        // Past Due first - prioritize by days overdue (3 days before 1 day)
        const aDaysOverdue = (a.isOverdue && a.daysOverdue) ? a.daysOverdue : 0;
        const bDaysOverdue = (b.isOverdue && b.daysOverdue) ? b.daysOverdue : 0;
        
        if (aDaysOverdue > 0 && bDaysOverdue === 0) return -1;
        if (aDaysOverdue === 0 && bDaysOverdue > 0) return 1;
        if (aDaysOverdue > 0 && bDaysOverdue > 0) {
            // Both overdue - sort by days overdue descending (3 days before 1 day)
            return bDaysOverdue - aDaysOverdue;
        }
        
        // Needs Attention second (New)
        const aNeedsAttention = a.status === 'New';
        const bNeedsAttention = b.status === 'New';
        if (aNeedsAttention && !bNeedsAttention) return -1;
        if (!aNeedsAttention && bNeedsAttention) return 1;
        
        // In Progress third
        const aInProgress = a.status === 'On-site/In Progress' || a.status === 'Dispatched';
        const bInProgress = b.status === 'On-site/In Progress' || b.status === 'Dispatched';
        if (aInProgress && !bInProgress) return -1;
        if (!aInProgress && bInProgress) return 1;
        
        // Then by priority: Critical > High > Medium/NPW1 > Low
        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'NPW1': 2, 'Low': 3 };
        const aPriority = priorityOrder[a.priority] ?? 3;
        const bPriority = priorityOrder[b.priority] ?? 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Finally by creation date (newest first)
        return new Date(b.createdDate) - new Date(a.createdDate);
    });

    state.filteredWorkOrders = filtered;
    renderWorkOrders();
    updateWorkOrderCount();
    
    // Metrics should stay static - they show totals from all work orders, not filtered
    // Don't call updateMetricsFromFiltered() here
}


// Render Functions
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
        
        // Handle location display - show city/state if available, otherwise show store name or fallback
        let location = '';
        if (wo.city && wo.state) {
            location = `${wo.city}, ${wo.state}`;
        } else if (wo.storeName) {
            location = wo.storeName;
        } else {
            location = 'Location not specified';
        }
        

        // Show appropriate badge based on work order state - matching metrics
        let badgeHtml;
        
        // Check if we're in default view (showing all 4 metrics)
        const isDefaultView = state.filters.status === 'all' && 
                              state.filters.priority === 'all' && 
                              state.filters.trade === 'all' && 
                              !state.filters.quickFilter &&
                              !state.activeMetric;
        
        // Check for Needs Attention: Past Due OR New — always show ACTION NEEDED (matches red card)
        if (wo.isOverdue || wo.status === 'New') {
            badgeHtml = `<span class="status-badge status-needs-attention">ACTION NEEDED</span>`;
        }
        // If "New" filter is active OR in default view, show purple NEW for New work orders
        else if ((state.activeMetric === 'new' || state.filters.quickFilter === 'new' || isDefaultView) && wo.status === 'New') {
            badgeHtml = `<span class="status-badge status-new-badge">NEW</span>`;
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
            <div class="work-order-card priority-${priorityClass}${isActionNeeded ? ' action-needed' : ''}" data-work-order-id="${wo.id}" data-wo-id="${wo.id}">
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
                        
                        ${wo.scheduledDate ? `
                            <span class="detail-label">Scheduled:</span>
                            <span class="detail-value">${formatDateTime(wo.scheduledDate)}</span>
                        ` : ''}
                        
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${formatDate(wo.createdDate)}</span>
                        
                        ${wo.completedDate ? `
                            <span class="detail-label">Completed:</span>
                            <span class="detail-value">${formatDate(wo.completedDate)}</span>
                        ` : ''}
                        
                        ${wo.nteAmount ? `
                            <span class="detail-label">NTE:</span>
                            <span class="detail-value">${formatCurrency(wo.nteAmount)}</span>
                        ` : ''}
                        
                        ${wo.invoiceAmount ? `
                            <span class="detail-label">Cost:</span>
                            <span class="detail-value">${formatCurrency(wo.invoiceAmount)}</span>
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

// Function to open edit modal with existing work order data
function openEditWorkOrderModal(workOrderId) {
    const workOrder = state.workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder) {
        showToast('Work order not found', 'error');
        return;
    }
    
    // Update modal title to show work order number
    document.querySelector('#newWorkOrderModal .modal-title').textContent = `Work Order ${workOrderId}`;
    
    // Populate form with work order data
    document.getElementById('account').value = workOrder.account || workOrder.storeName || '';
    document.getElementById('originalNTE').value = workOrder.originalNTE || workOrder.nteAmount || '';
    document.getElementById('priority').value = workOrder.priorityForm || mapDisplayToPriorityForm(workOrder.priority);
    document.getElementById('trade').value = workOrder.trade || '';
    // Set issue type if it matches a known type, otherwise leave empty
    const issueType = workOrder.issue;
    const issueSelect = document.getElementById('issue');
    if (issueSelect) {
        // Check if the issue matches any option
        const matchingOption = Array.from(issueSelect.options).find(opt => opt.value === issueType);
        if (matchingOption) {
            issueSelect.value = issueType;
        } else {
            issueSelect.value = '';
        }
    }
    document.getElementById('isRecall').value = workOrder.isRecall || 'No';
    
    document.getElementById('description').value = workOrder.description || '';
    
    // Show/hide clear button
    const accountValue = document.getElementById('account').value;
    document.getElementById('clearAccount').style.display = accountValue ? 'flex' : 'none';
    
    // Store the work order ID for updating
    document.getElementById('newWorkOrderForm').dataset.editId = workOrderId;
    
        // Open modal
        const modal = document.getElementById('newWorkOrderModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Prevent body scroll on mobile
        if (window.innerWidth <= 768) {
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
}

    // Helper function to map display priority back to form format
    function mapDisplayToPriorityForm(priorityDisplay) {
        const priorityMap = {
            'Critical': 'P1 - Priority 1 Hour',
            'High': 'P4 - Priority 4 Hours',
            'Medium': 'P5 - Priority 5 Hours',
            'NPW1': 'P5 - Priority 5 Hours',
            'Low': 'P7 - Priority 7 Hours'
        };
        return priorityMap[priorityDisplay] || 'P4 - Priority 4 Hours';
    }

function updateWorkOrderCount() {
    const countEl = document.getElementById('workOrderCount');
    
    // Calculate the sum of the four metrics (Needs Attention + In Progress + New + On Hold)
    // Needs Attention - Past Due OR New
    const needsAttention = state.workOrders.filter(wo => 
        wo.isOverdue || wo.status === 'New'
    ).length;
    
    // In Progress - On-site/In Progress OR Dispatched
    const inProgress = state.workOrders.filter(wo => 
        wo.status === 'On-site/In Progress' || 
        wo.status === 'Dispatched'
    ).length;
    
    // New - Status is New (all new work orders)
    const newCount = state.workOrders.filter(wo => wo.status === 'New').length;
    
    // On Hold - Proposal Submitted, Proposal Pending Approval, Pending Schedule, or Awaiting Parts
    const onHold = state.workOrders.filter(wo => 
        wo.status === 'Proposal Submitted' || 
        wo.status === 'Proposal Pending Approval' ||
        wo.status === 'Pending Schedule' ||
        wo.status === 'Awaiting Parts'
    ).length;
    
    // Pending Estimates - count estimates with Pending status
    let pendingEstimates = 0;
    if (typeof estimatesData !== 'undefined' && estimatesData && Array.isArray(estimatesData)) {
        pendingEstimates = estimatesData.filter(est => est.status === 'Pending').length;
    }
    
    const totalActive = needsAttention + inProgress + newCount + onHold + pendingEstimates;
    countEl.textContent = `(${totalActive})`;
}

function updateMetrics() {
    // Calculate metrics from all work orders (for initial display)
    // Needs Attention - Past Due OR New
    const needsAttention = state.workOrders.filter(wo => 
        wo.isOverdue || wo.status === 'New'
    ).length;
    
    // In Progress - On-site/In Progress OR Dispatched
    const inProgress = state.workOrders.filter(wo => 
        wo.status === 'On-site/In Progress' || 
        wo.status === 'Dispatched'
    ).length;
    
    // New - Status is New (all new work orders)
    const newCount = state.workOrders.filter(wo => wo.status === 'New').length;
    
    // On Hold - Proposal Submitted, Proposal Pending Approval, Pending Schedule, or Awaiting Parts
    const onHold = state.workOrders.filter(wo => 
        wo.status === 'Proposal Submitted' || 
        wo.status === 'Proposal Pending Approval' ||
        wo.status === 'Pending Schedule' ||
        wo.status === 'Awaiting Parts'
    ).length;

    document.getElementById('metricNeedsAttention').textContent = needsAttention;
    document.getElementById('metricInProgress').textContent = inProgress;
    document.getElementById('metricNew').textContent = 1;
    document.getElementById('metricOnHold').textContent = onHold;
    
    // Pending Estimates - count estimates with Pending status
    let pendingEstimates = 0;
    if (typeof estimatesData !== 'undefined' && estimatesData && Array.isArray(estimatesData)) {
        pendingEstimates = estimatesData.filter(est => est.status === 'Pending').length;
    }
    const pendingEstimatesEl = document.getElementById('metricPendingEstimates');
    if (pendingEstimatesEl) {
        pendingEstimatesEl.textContent = pendingEstimates;
    }
    
    // Update the active work orders count (sum of all five metrics including pending estimates)
    updateWorkOrderCount();
}

// Update metrics based on filtered work orders (so they match what's displayed)
function updateMetricsFromFiltered() {
    const filtered = state.filteredWorkOrders;
    
    // Urgent - Past Due OR New OR In Progress
    const urgent = filtered.filter(wo => 
        wo.isOverdue || 
        wo.status === 'New' || 
        wo.status === 'On-site/In Progress'
    ).length;
    
    // Pending Approval - Proposal Submitted, Proposal Pending Approval, or On Hold (Pending Schedule)
    const pendingApproval = filtered.filter(wo => 
        wo.status === 'Proposal Submitted' || 
        wo.status === 'Proposal Pending Approval' ||
        wo.status === 'Pending Schedule'
    ).length;
    
    // New - Status is New
    const newCount = filtered.filter(wo => wo.status === 'New').length;
    
    // Needs Follow Up - Work orders older than 7 days, not completed/invoiced
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() - 7);
    const needsFollowUp = filtered.filter(wo => 
        new Date(wo.createdDate) < followUpDate &&
        wo.status !== 'Work Complete' &&
        wo.status !== 'Invoice Submitted'
    ).length;

    document.getElementById('metricUrgent').textContent = urgent;
    document.getElementById('metricPendingApproval').textContent = pendingApproval;
    document.getElementById('metricNew').textContent = 1;
    document.getElementById('metricNeedsFollowUp').textContent = needsFollowUp;
}

// Event Listeners
// File upload functionality
let uploadedFiles = [];

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function renderUploadedFiles() {
    const container = document.getElementById('uploadedFilesList');
    if (!container) return;
    
    if (uploadedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = uploadedFiles.map((file, index) => `
        <div class="uploaded-file-item">
            <span class="uploaded-file-name">${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" class="uploaded-file-remove" data-index="${index}" aria-label="Remove file">Remove</button>
        </div>
    `).join('');
    
    // Add remove handlers
    container.querySelectorAll('.uploaded-file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            uploadedFiles.splice(index, 1);
            renderUploadedFiles();
        });
    });
}

function handleFiles(fileList) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    
    Array.from(fileList).forEach(file => {
        // Check file size
        if (file.size > maxSize) {
            showToast(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
            return;
        }
        
        // Check file type
        const isValidType = allowedTypes.some(type => file.type.startsWith(type)) || 
                           file.name.match(/\.(pdf|doc|docx|xls|xlsx)$/i);
        
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

function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!fileUploadArea || !fileInput) return;
    
    // Click handler
    fileUploadArea.addEventListener('click', (e) => {
        if (e.target !== fileInput && !e.target.closest('.uploaded-file-remove')) {
            fileInput.click();
        }
    });
    
    // Touch event support for mobile
    fileUploadArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!e.target.closest('.uploaded-file-remove')) {
            fileInput.click();
        }
    });
    
    // Drag and drop handlers (desktop only)
    const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;
    
    if (!isMobile()) {
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
            
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles.length > 0) {
                handleFiles(droppedFiles);
            }
        });
    }
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = ''; // Reset input for next selection
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Metric card clicks
    document.querySelectorAll('.metric-card').forEach(card => {
        card.addEventListener('click', () => {
            const metric = card.dataset.metric;
            
            // Toggle active state
            if (state.activeMetric === metric) {
                // Deselecting metric - restore default view
                state.activeMetric = null;
                card.classList.remove('active');
            } else {
                // Selecting metric
                document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));
                state.activeMetric = metric;
                card.classList.add('active');
            }
            
            // Clear all filters when metric is selected to show only metric-filtered results
            state.filters.status = 'all';
            state.filters.priority = 'all';
            state.filters.trade = 'all';
            state.filters.dateRange = 'all';
            state.filters.quickFilter = null;
            
            // Update filter buttons to reflect cleared filters
            updateFilterButtonsFromState();
            
            filterWorkOrders();
            showToast(`Filtered by: ${card.querySelector('.metric-label').textContent}`, 'info');
        });
    });

    // Filter button toggle
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    
    const isMobile = () => window.innerWidth <= 768;
    
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = filterDropdown.classList.contains('show');
        
        if (isOpen) {
            filterDropdown.classList.remove('show');
            if (isMobile()) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        } else {
            filterDropdown.classList.add('show');
            if (isMobile()) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                // Scroll to top of dropdown on mobile
                setTimeout(() => {
                    filterDropdown.scrollTop = 0;
                }, 100);
            }
        }
    });

    // Close dropdown on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && filterDropdown.classList.contains('show')) {
            filterDropdown.classList.remove('show');
            if (isMobile()) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('show');
            if (isMobile()) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        }
    });


    // Populate filter buttons
    populateFilterButtons();
    
    // Filter button click handlers - setup after populating buttons
    setupFilterButtons('status-buttons', 'status');
    setupFilterButtons('priority-buttons', 'priority');
    setupFilterButtons('trade-buttons', 'trade');
    setupFilterButtons('date-range-buttons', 'dateRange');

    // New Work Order button
    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        // TODO: Implement export functionality
        showToast('Export functionality coming soon', 'info');
    });

    document.getElementById('newWorkOrderBtn').addEventListener('click', () => {
        // Reset form and clear edit ID
        const form = document.getElementById('newWorkOrderForm');
        form.reset();
        form.removeAttribute('data-edit-id');
        document.getElementById('clearAccount').style.display = 'none';
        document.querySelector('#newWorkOrderModal .modal-title').textContent = 'Work Order Number';
        // Clear uploaded files
        uploadedFiles = [];
        renderUploadedFiles();
        
        const modal = document.getElementById('newWorkOrderModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Prevent body scroll on mobile
        if (window.innerWidth <= 768) {
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
    });

    // Close modal handlers
    function closeModal() {
        const modal = document.getElementById('newWorkOrderModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        // Remove any fixed positioning that might have been added
        document.body.style.position = '';
        document.body.style.width = '';
        const form = document.getElementById('newWorkOrderForm');
        form.reset();
        form.removeAttribute('data-edit-id');
        document.getElementById('clearAccount').style.display = 'none';
        document.querySelector('#newWorkOrderModal .modal-title').textContent = 'Work Order Number';
        // Clear uploaded files
        uploadedFiles = [];
        renderUploadedFiles();
    }

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    document.getElementById('cancelWorkOrder').addEventListener('click', closeModal);

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
    document.getElementById('account').addEventListener('input', (e) => {
        const clearBtn = document.getElementById('clearAccount');
        clearBtn.style.display = e.target.value ? 'flex' : 'none';
    });

    document.getElementById('clearAccount').addEventListener('click', () => {
        document.getElementById('account').value = '';
        document.getElementById('clearAccount').style.display = 'none';
    });

    // Helper function to map priority from form format to display format
    function mapPriorityToDisplay(priorityFormValue) {
        // Extract priority level from "P4 - Priority 4 Hours" format
        if (!priorityFormValue) return 'NPW1';
        
        const priorityMap = {
            'P1 - Priority 1 Hour': 'Critical',
            'P2 - Priority 2 Hours': 'Critical',
            'P3 - Priority 3 Hours': 'High',
            'P4 - Priority 4 Hours': 'High',
            'P5 - Priority 5 Hours': 'NPW1',
            'P6 - Priority 6 Hours': 'NPW1',
            'P7 - Priority 7 Hours': 'Low',
            'P8 - Priority 8 Hours': 'Low',
            'P9 - Priority 9 Hours': 'Low',
            'P10 - Priority 10 Hours': 'Low'
        };
        
        return priorityMap[priorityFormValue] || 'NPW1';
    }

    // Save Work Order
    function saveWorkOrder(closeAfterSave = true) {
        const form = document.getElementById('newWorkOrderForm');
        
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
            workOrder.priorityForm = priorityFormValue;
            workOrder.trade = formData.get('trade');
            // Use issue type as the main issue/title
            workOrder.issue = formData.get('issue') || 'Work Order';
            workOrder.storeName = formData.get('account') || null;
            workOrder.nteAmount = formData.get('originalNTE') ? parseFloat(formData.get('originalNTE')) : null;
            workOrder.status = 'New';
            workOrder.account = formData.get('account');
            workOrder.originalNTE = formData.get('originalNTE') ? parseFloat(formData.get('originalNTE')) : null;
            workOrder.isRecall = formData.get('isRecall');
            workOrder.description = formData.get('description');
            
            showToast(`Work order ${workOrderId} updated successfully!`, 'success');
        } else {
            // Create new work order
            workOrderId = 'WO-' + String(Math.floor(Math.random() * 1000000)).padStart(8, '0');
            
            workOrder = {
                id: workOrderId,
                status: 'New',
                priority: priorityDisplay,
                priorityForm: priorityFormValue,
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
                // Additional fields from form
                account: formData.get('account'),
                originalNTE: formData.get('originalNTE') ? parseFloat(formData.get('originalNTE')) : null,
                isRecall: formData.get('isRecall'),
                description: formData.get('description')
            };
            
            // Add to the beginning of work orders array (most recent first)
            state.workOrders.unshift(workOrder);
            
            showToast(`Work order ${workOrderId} created successfully!`, 'success');
        }
        
        // Update metrics to reflect changes
        updateMetrics();
        
        // Refresh the filtered work orders and re-render
        filterWorkOrders();
        
        if (closeAfterSave) {
            // Close modal and reset form
            closeModal();
        } else {
            // Reset form but keep modal open for "Save & New"
            form.reset();
            form.removeAttribute('data-edit-id');
            document.getElementById('clearAccount').style.display = 'none';
            document.querySelector('#newWorkOrderModal .modal-title').textContent = 'Work Order Number';
            document.querySelector('#newWorkOrderModal .header-value').textContent = 'New';
            // Clear uploaded files
            uploadedFiles = [];
            renderUploadedFiles();
            
            // Focus on first field for quick entry
            setTimeout(() => {
                document.getElementById('account').focus();
            }, 100);
        }
    }

    // Save button - closes modal after saving
    document.getElementById('saveWorkOrder').addEventListener('click', (e) => {
        e.preventDefault();
        saveWorkOrder(true);
    });

    // Save & New button - keeps modal open for another entry
    document.getElementById('saveAndNewWorkOrder').addEventListener('click', (e) => {
        e.preventDefault();
        saveWorkOrder(false);
    });

    // View All link
    document.getElementById('viewAllLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'view-all.html';
    });

    // Initialize state with work orders data
    initializeState();
    
    // Initial render
    updateMetrics();
    filterWorkOrders();
    renderSidebarNavigation();
    
    // Setup file upload
    setupFileUpload();
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

function populateFilterButtons() {
    // Get unique statuses
    const statuses = [...new Set(state.workOrders.map(wo => wo.status))].sort();
    const statusButtons = document.getElementById('status-buttons');
    statuses.forEach(status => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.dataset.value = status;
        button.textContent = status;
        statusButtons.appendChild(button);
    });

    // Get unique trades
    const trades = [...new Set(state.workOrders.map(wo => wo.trade))].sort();
    const tradeButtons = document.getElementById('trade-buttons');
    trades.forEach(trade => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.dataset.value = trade;
        button.textContent = trade;
        tradeButtons.appendChild(button);
    });
}

function setupFilterButtons(containerId, filterKey) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Use event delegation to handle clicks on all buttons, including dynamically added ones
    container.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-button');
        if (!button) return;
        
        // Remove active class from all buttons in THIS group only
        const buttons = container.querySelectorAll('.filter-button');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update filter state for THIS filter only
        state.filters[filterKey] = button.dataset.value;
        state.activeMetric = null; // Clear metric filter when using filters
        document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));
        
        filterWorkOrders();
        
            // Close dropdown on mobile after filter is applied (except for date range which might need multiple selections)
            if (window.innerWidth <= 768 && filterKey !== 'dateRange') {
                const filterDropdown = document.getElementById('filterDropdown');
                if (filterDropdown && filterDropdown.classList.contains('show')) {
                    setTimeout(() => {
                        filterDropdown.classList.remove('show');
                        document.body.style.overflow = '';
                        document.body.style.position = '';
                        document.body.style.width = '';
                    }, 300); // Small delay for better UX
                }
            }
    });
}

// Helper function to check if mobile
function isMobileView() {
    return window.innerWidth <= 768;
}

function updateFilterButtonsFromState() {
    // Update button states based on current filter state
    // Only update the specific filter group that changed, not all of them
    updateButtonGroup('status-buttons', state.filters.status);
    updateButtonGroup('priority-buttons', state.filters.priority);
    updateButtonGroup('trade-buttons', state.filters.trade);
    updateButtonGroup('date-range-buttons', state.filters.dateRange);
}

function updateButtonGroup(containerId, activeValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const buttons = container.querySelectorAll('.filter-button');
    buttons.forEach(button => {
        if (button.dataset.value === activeValue) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Mobile Menu Toggle for Top Navigation
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const topNavMenu = document.getElementById('topNavMenu');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    
    if (mobileMenuToggle && topNavMenu) {
        const openMobileMenu = () => {
            topNavMenu.classList.add('open');
            if (mobileNavOverlay) {
                mobileNavOverlay.classList.add('show');
            }
            document.body.style.overflow = 'hidden';
        };
        
        const closeMobileMenu = () => {
            topNavMenu.classList.remove('open');
            if (mobileNavOverlay) {
                mobileNavOverlay.classList.remove('show');
            }
            document.body.style.overflow = '';
        };
        
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (topNavMenu.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
        
        // Close menu when clicking overlay
        if (mobileNavOverlay) {
            mobileNavOverlay.addEventListener('click', closeMobileMenu);
        }
        
        // Close menu when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (topNavMenu.classList.contains('open') && 
                    !topNavMenu.contains(e.target) && 
                    !mobileMenuToggle.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });
        
        // Close menu when clicking nav links on mobile
        const closeMenuOnNavClick = () => {
            if (window.innerWidth <= 768) {
                document.querySelectorAll('.top-nav-menu .nav-item').forEach(link => {
                    link.addEventListener('click', () => {
                        closeMobileMenu();
                    });
                });
            }
        };
        
        // Initial setup
        closeMenuOnNavClick();
        
        // Re-setup on dynamic content changes
        const observer = new MutationObserver(() => {
            closeMenuOnNavClick();
        });
        
        if (topNavMenu) {
            observer.observe(topNavMenu, { childList: true, subtree: true });
        }
        
        // Close menu on window resize if it becomes desktop size
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        });

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
                if (accountingNavItem) {
                    accountingNavItem.addEventListener('click', (e) => {
                        if (window.innerWidth <= 768) {
                            e.preventDefault();
                            e.stopPropagation();
                            accountingDropdown.classList.toggle('open');
                        }
                    });
                }

                // Close dropdown when clicking outside on mobile
                document.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        if (!accountingDropdown.contains(e.target)) {
                            accountingDropdown.classList.remove('open');
                        }
                    }
                });

                // Close dropdown when clicking on dropdown items
                const dropdownItems = accountingDropdown.querySelectorAll('.nav-dropdown-item');
                dropdownItems.forEach(item => {
                    item.addEventListener('click', () => {
                        if (window.innerWidth <= 768) {
                            accountingDropdown.classList.remove('open');
                            closeMobileMenu();
                        }
                    });
                });
            }
        }
    }
});

