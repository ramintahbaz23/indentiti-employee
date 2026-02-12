// Application State
let state = {
    currentStore: null,
    workOrders: [],
    filteredWorkOrders: [],
    displayedWorkOrders: [],
    activeTab: 'active',
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'asc'
};

// Utility Functions
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
}

function formatAddress(store) {
    if (!store) return '';
    const parts = [];
    if (store.shippingStreet) parts.push(store.shippingStreet);
    if (store.shippingStreet && store.unit) parts.push(store.shippingStreet); // Repeat street if unit exists
    if (store.unit) parts.push(store.unit);
    if (store.city && store.state) {
        parts.push(`${store.city}, ${getStateFullName(store.state)}, United States`);
    }
    if (store.zipCode) parts.push(store.zipCode);
    if (store.region) parts.push(store.region);
    return parts.join('<br>');
}

function getStateFullName(abbr) {
    const states = {
        'CA': 'California',
        'NC': 'North Carolina',
        'OR': 'Oregon',
        'WA': 'Washington',
        'CO': 'Colorado',
        'FL': 'Florida'
    };
    return states[abbr] || abbr;
}

// Load Store Data
function loadStore() {
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('id');
    
    if (!storeId || !storesData) {
        console.error('Store ID not found or stores data not available');
        return;
    }

    state.currentStore = storesData.find(store => store.id === storeId);
    
    if (!state.currentStore) {
        console.error('Store not found:', storeId);
        return;
    }

    renderStoreInfo();
    loadWorkOrders();
}

// Render Store Info
function renderStoreInfo() {
    const store = state.currentStore;
    if (!store) return;

    // Render Address
    const addressDetails = document.getElementById('addressDetails');
    if (addressDetails) {
        addressDetails.innerHTML = formatAddress(store);
    }

    // Render Store Details
    const storeDetailsContent = document.getElementById('storeDetailsContent');
    if (storeDetailsContent) {
        const statusClass = store.status === 'Active' ? 'active' : '';
        storeDetailsContent.innerHTML = `
            <div class="status-badge ${statusClass}">${store.status || 'Active'}</div>
            <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${store.accountName || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Corp ID</span>
                <span class="detail-value">${store.corpId || store.storeNumber || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${store.phone || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Ext</span>
                <span class="detail-value ${store.phoneExt ? '' : 'empty'}">${store.phoneExt || 'Empty'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Store Manager</span>
                <span class="detail-value">${store.storeManager || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Manager Phone</span>
                <span class="detail-value ${store.managerPhone ? '' : 'empty'}">${store.managerPhone || 'Empty'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Store Manager E-Mail</span>
                <span class="detail-value ${store.managerEmail ? '' : 'empty'}">${store.managerEmail || 'Empty'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Mall</span>
                <span class="detail-value ${store.mall ? '' : 'empty'}">${store.mall || 'Empty'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Project Manager</span>
                <span class="detail-value ${store.projectManager ? '' : 'empty'}">${store.projectManager || 'Empty'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Deactivation Reason</span>
                <span class="detail-value ${store.deactivationReason ? '' : 'empty'}">${store.deactivationReason || 'Empty'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Active</span>
                <span class="detail-value active-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
            </div>
        `;
    }
}

// Load Work Orders
function loadWorkOrders() {
    if (!workOrdersData || !state.currentStore) return;

    // Filter work orders by store name (match accountName or account)
    const storeName = state.currentStore.accountName;
    const account = state.currentStore.account;
    const storeNumber = state.currentStore.storeNumber;
    
    state.workOrders = workOrdersData.filter(wo => {
        if (!wo.storeName) return false;
        
        // Try multiple matching strategies
        const woStoreName = wo.storeName.toLowerCase();
        const storeNameLower = storeName.toLowerCase();
        const accountLower = account.toLowerCase();
        
        // Match by full account name
        if (woStoreName.includes(storeNameLower)) return true;
        
        // Match by account field
        if (woStoreName.includes(accountLower)) return true;
        
        // Match by store number (extract from storeName like "Warhammer - Central Avenue #0215")
        if (storeNumber && woStoreName.includes(storeNumber.toLowerCase())) return true;
        
        // Match by extracting store name part before #
        const woStorePart = woStoreName.split('#')[0]?.trim();
        const storePart = storeNameLower.split('-')[0]?.trim();
        if (woStorePart && storePart && woStorePart.includes(storePart)) return true;
        
        return false;
    });

    filterWorkOrders();
}

// Filter Work Orders
function filterWorkOrders() {
    let filtered = [...state.workOrders];

    // Apply tab filter (Active vs Inactive)
    if (state.activeTab === 'active') {
        filtered = filtered.filter(wo => wo.status !== 'Completed');
    } else {
        filtered = filtered.filter(wo => wo.status === 'Completed' || wo.status === 'Awaiting AR');
    }

    // Apply search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(wo => {
            return (
                (wo.id && wo.id.toLowerCase().includes(query)) ||
                (wo.issue && wo.issue.toLowerCase().includes(query)) ||
                (wo.trade && wo.trade.toLowerCase().includes(query)) ||
                (wo.status && wo.status.toLowerCase().includes(query))
            );
        });
    }

    state.filteredWorkOrders = filtered;
    sortWorkOrders();
}

// Sort Work Orders
function sortWorkOrders() {
    if (!state.sortColumn) {
        state.displayedWorkOrders = [...state.filteredWorkOrders];
        renderWorkOrdersTable();
        return;
    }

    const sorted = [...state.filteredWorkOrders].sort((a, b) => {
        let aVal = a[state.sortColumn];
        let bVal = b[state.sortColumn];

        // Handle dates
        if (state.sortColumn === 'completedDate') {
            aVal = aVal ? new Date(aVal).getTime() : 0;
            bVal = bVal ? new Date(bVal).getTime() : 0;
        } else {
            // Convert to string for comparison
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
        }

        if (state.sortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });

    state.displayedWorkOrders = sorted;
    renderWorkOrdersTable();
    updateSortIcons();
}

// Update Sort Icons
function updateSortIcons() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const column = th.getAttribute('data-sort');
        const icon = th.querySelector('.sort-icon');
        
        if (icon) {
            if (state.sortColumn === column) {
                icon.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
            } else {
                icon.textContent = '⇅';
            }
        }
    });
}

// Render Work Orders Table
function renderWorkOrdersTable() {
    const tbody = document.getElementById('workOrdersTableBody');
    if (!tbody) return;

    if (state.displayedWorkOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div>No work orders found</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.displayedWorkOrders.map(wo => `
        <tr>
            <td>
                <a href="work-order-details.html?id=${wo.id}" class="ticket-link">${wo.id || '-'}</a>
            </td>
            <td>${wo.status || '-'}</td>
            <td>${formatDate(wo.completedDate)}</td>
            <td>${formatCurrency(wo.nteAmount)}</td>
            <td>${wo.trade || '-'}</td>
            <td>${wo.issue || '-'}</td>
            <td>${wo.storeName ? wo.storeName.split('#')[0].trim() : '-'}</td>
        </tr>
    `).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load store data
    loadStore();

    // Mobile menu toggle (match homepage nav behavior)
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const topNavMenu = document.getElementById('topNavMenu');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    if (mobileMenuToggle && topNavMenu) {
        const openMobileMenu = () => {
            topNavMenu.classList.add('open');
            if (mobileNavOverlay) mobileNavOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        };
        const closeMobileMenu = () => {
            topNavMenu.classList.remove('open');
            if (mobileNavOverlay) mobileNavOverlay.classList.remove('show');
            document.body.style.overflow = '';
        };
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            topNavMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
        });
        if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileMenu);
        document.querySelectorAll('.top-nav-menu .nav-item').forEach(link => {
            link.addEventListener('click', () => { if (window.innerWidth <= 768) closeMobileMenu(); });
        });
        window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMobileMenu(); });
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeTab = tab.dataset.tab;
            filterWorkOrders();
        });
    });

    // Search input
    const searchInput = document.getElementById('workOrderSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            filterWorkOrders();
        });
    }

    // Sortable column headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (column) {
                if (state.sortColumn === column) {
                    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sortColumn = column;
                    state.sortDirection = 'asc';
                }
                sortWorkOrders();
            }
        });
    });

    // Desktop dropdown hover for Accounting menu
    const accountingDropdown = document.querySelector('.nav-item-dropdown');
    if (accountingDropdown) {
        const dropdownMenu = accountingDropdown.querySelector('.nav-dropdown-menu');
        const accountingNavItem = accountingDropdown.querySelector('.nav-item');
        
        if (dropdownMenu && accountingNavItem) {
            let hideTimeout = null;
            
            const positionDropdown = () => {
                const rect = accountingNavItem.getBoundingClientRect();
                dropdownMenu.style.top = (rect.bottom + 4) + 'px';
                dropdownMenu.style.left = rect.left + 'px';
            };

            const showDropdown = () => {
                if (window.innerWidth > 768) {
                    clearTimeout(hideTimeout);
                    positionDropdown();
                    dropdownMenu.style.display = 'block';
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.visibility = 'visible';
                }
            };

            const hideDropdown = () => {
                if (window.innerWidth > 768) {
                    hideTimeout = setTimeout(() => {
                        dropdownMenu.style.display = 'none';
                        dropdownMenu.style.opacity = '0';
                        dropdownMenu.style.visibility = 'hidden';
                    }, 150);
                }
            };

            accountingDropdown.addEventListener('mouseenter', showDropdown);
            accountingDropdown.addEventListener('mouseleave', hideDropdown);

            dropdownMenu.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    clearTimeout(hideTimeout);
                    dropdownMenu.style.display = 'block';
                    dropdownMenu.style.opacity = '1';
                    dropdownMenu.style.visibility = 'visible';
                }
            });

            dropdownMenu.addEventListener('mouseleave', hideDropdown);

            accountingNavItem.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    accountingDropdown.classList.toggle('open');
                }
            });
        }
    }
});
