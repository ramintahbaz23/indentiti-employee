// Application State
let state = {
    stores: storesData || [],
    filteredStores: storesData || [],
    displayedStores: [],
    sortColumn: null,
    sortDirection: 'asc',
    searchQuery: '',
    filters: {
        state: 'all',
        parentCompany: 'all',
        city: 'all',
        region: 'all',
        status: 'all',
        storeNumber: 'all',
        zipCode: 'all',
        accountName: ''
    }
};

// Utility Functions
function formatPhone(phone) {
    if (!phone) return '-';
    return phone;
}

// Filter Functions
function filterStores() {
    let filtered = [...state.stores];

    // Apply dropdown filters
    if (state.filters) {
        if (state.filters.state && state.filters.state !== 'all') {
            filtered = filtered.filter(store => store.state === state.filters.state);
        }
        if (state.filters.parentCompany && state.filters.parentCompany !== 'all') {
            filtered = filtered.filter(store => store.parentCompany === state.filters.parentCompany);
        }
        if (state.filters.city && state.filters.city !== 'all') {
            filtered = filtered.filter(store => store.city === state.filters.city);
        }
        if (state.filters.region && state.filters.region !== 'all') {
            filtered = filtered.filter(store => store.region === state.filters.region);
        }
        if (state.filters.status && state.filters.status !== 'all') {
            filtered = filtered.filter(store => store.status === state.filters.status);
        }
        if (state.filters.storeNumber && state.filters.storeNumber !== 'all') {
            filtered = filtered.filter(store => store.storeNumber === state.filters.storeNumber);
        }
        if (state.filters.zipCode && state.filters.zipCode !== 'all') {
            filtered = filtered.filter(store => store.zipCode === state.filters.zipCode);
        }
        if (state.filters.accountName && state.filters.accountName.trim()) {
            const q = state.filters.accountName.trim().toLowerCase();
            filtered = filtered.filter(store =>
                (store.accountName && store.accountName.toLowerCase().includes(q)) ||
                (store.account && store.account && store.account.toLowerCase().includes(q))
            );
        }
    }

    // Apply search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(store => {
            return (
                (store.accountName && store.accountName.toLowerCase().includes(query)) ||
                (store.storeNumber && store.storeNumber.toLowerCase().includes(query)) ||
                (store.phone && store.phone.toLowerCase().includes(query)) ||
                (store.shippingStreet && store.shippingStreet.toLowerCase().includes(query)) ||
                (store.city && store.city.toLowerCase().includes(query)) ||
                (store.state && store.state.toLowerCase().includes(query)) ||
                (store.parentCompany && store.parentCompany.toLowerCase().includes(query)) ||
                (store.account && store.account.toLowerCase().includes(query))
            );
        });
    }

    state.filteredStores = filtered;
    updateDisplayedStores();
    renderTable();
    updateTotalCount();
}

function updateDisplayedStores() {
    state.displayedStores = [...state.filteredStores];
}

function updateTotalCount() {
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) {
        const count = state.filteredStores.length;
        totalCountEl.textContent = `${count} ${count === 1 ? 'store' : 'stores'}`;
    }
}

// Sort Functions
function sortStores(column) {
    if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = column;
        state.sortDirection = 'asc';
    }

    state.filteredStores.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';

        // Convert to string for comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (state.sortDirection === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });

    updateDisplayedStores();
    renderTable();
    updateSortIcons();
}

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

// Render Functions
function renderTable() {
    const tbody = document.getElementById('storesTableBody');
    if (!tbody) return;

    if (state.displayedStores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-state-title">No stores found</div>
                    <div class="empty-state-description">Try adjusting your search criteria</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.displayedStores.map(store => `
        <tr class="store-row" data-store-id="${store.id || store.storeNumber}" style="cursor: pointer;">
            <td>${store.accountName || '-'}</td>
            <td>${store.storeNumber || '-'}</td>
            <td>${formatPhone(store.phone)}</td>
            <td>${store.shippingStreet || '-'}</td>
            <td>${store.city || '-'}</td>
            <td>${store.state || '-'}</td>
            <td>${store.parentCompany || '-'}</td>
            <td>${store.account || '-'}</td>
        </tr>
    `).join('');

    // Add click handlers to store rows
    document.querySelectorAll('.store-row').forEach(row => {
        row.addEventListener('click', (e) => {
            const storeId = row.dataset.storeId;
            if (storeId) {
                window.location.href = `store-details.html?id=${storeId}`;
            }
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    if (typeof storesData !== 'undefined' && storesData) {
        state.stores = storesData;
        state.filteredStores = storesData;
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            filterStores();
        });
    }

    // Filter toggle button
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterIconBtn = document.getElementById('filterIconBtn');
    const filtersSection = document.getElementById('filtersSection');
    
    const toggleFilters = (e) => {
        if (e) e.stopPropagation();
        const isExpanded = filtersSection && filtersSection.classList.contains('expanded');
        if (filtersSection) {
            if (isExpanded) {
                filtersSection.classList.remove('expanded');
                if (filterToggleBtn) filterToggleBtn.classList.remove('expanded');
                if (filterIconBtn) filterIconBtn.classList.remove('active');
            } else {
                filtersSection.classList.add('expanded');
                if (filterToggleBtn) filterToggleBtn.classList.add('expanded');
                if (filterIconBtn) filterIconBtn.classList.add('active');
            }
        }
    };
    
    if (filterToggleBtn && filtersSection) {
        filterToggleBtn.addEventListener('click', toggleFilters);
    }
    
    if (filterIconBtn && filtersSection) {
        filterIconBtn.addEventListener('click', toggleFilters);
    }

    // Filter inputs
    const filterState = document.getElementById('filterState');
    if (filterState) {
        filterState.addEventListener('change', (e) => {
            state.filters.state = e.target.value;
            filterStores();
        });
    }

    const filterParentCompany = document.getElementById('filterParentCompany');
    if (filterParentCompany) {
        filterParentCompany.addEventListener('change', (e) => {
            state.filters.parentCompany = e.target.value;
            filterStores();
        });
    }

    const filterCity = document.getElementById('filterCity');
    if (filterCity) {
        const cities = [...new Set(state.stores.map(s => s.city).filter(Boolean))].sort();
        cities.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            filterCity.appendChild(opt);
        });
        filterCity.addEventListener('change', (e) => {
            state.filters.city = e.target.value;
            filterStores();
        });
    }

    const filterRegion = document.getElementById('filterRegion');
    if (filterRegion) {
        filterRegion.addEventListener('change', (e) => {
            state.filters.region = e.target.value;
            filterStores();
        });
    }

    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            state.filters.status = e.target.value;
            filterStores();
        });
    }

    const filterStoreNumber = document.getElementById('filterStoreNumber');
    if (filterStoreNumber) {
        const storeNumbers = [...new Set(state.stores.map(s => s.storeNumber).filter(Boolean))].sort((a, b) => {
            const numA = (a || '').replace(/\D/g, '');
            const numB = (b || '').replace(/\D/g, '');
            return parseInt(numA, 10) - parseInt(numB, 10);
        });
        storeNumbers.forEach(sn => {
            const opt = document.createElement('option');
            opt.value = sn;
            opt.textContent = sn;
            filterStoreNumber.appendChild(opt);
        });
        filterStoreNumber.addEventListener('change', (e) => {
            state.filters.storeNumber = e.target.value;
            filterStores();
        });
    }

    const filterZipCode = document.getElementById('filterZipCode');
    if (filterZipCode) {
        const zips = [...new Set(state.stores.map(s => s.zipCode).filter(Boolean))].sort();
        zips.forEach(zip => {
            const opt = document.createElement('option');
            opt.value = zip;
            opt.textContent = zip;
            filterZipCode.appendChild(opt);
        });
        filterZipCode.addEventListener('change', (e) => {
            state.filters.zipCode = e.target.value;
            filterStores();
        });
    }

    const filterAccountName = document.getElementById('filterAccountName');
    if (filterAccountName) {
        filterAccountName.addEventListener('input', (e) => {
            state.filters.accountName = e.target.value;
            filterStores();
        });
    }

    // Clear all filters
    const clearAll = document.getElementById('clearAll');
    if (clearAll) {
        clearAll.addEventListener('click', (e) => {
            e.preventDefault();
            state.filters = {
                state: 'all',
                parentCompany: 'all',
                city: 'all',
                region: 'all',
                status: 'all',
                storeNumber: 'all',
                zipCode: 'all',
                accountName: ''
            };
            if (filterState) filterState.value = 'all';
            if (filterParentCompany) filterParentCompany.value = 'all';
            if (filterCity) filterCity.value = 'all';
            const filterRegion = document.getElementById('filterRegion');
            const filterStatus = document.getElementById('filterStatus');
            const filterStoreNumber = document.getElementById('filterStoreNumber');
            const filterZipCode = document.getElementById('filterZipCode');
            const filterAccountName = document.getElementById('filterAccountName');
            if (filterRegion) filterRegion.value = 'all';
            if (filterStatus) filterStatus.value = 'all';
            if (filterStoreNumber) filterStoreNumber.value = 'all';
            if (filterZipCode) filterZipCode.value = 'all';
            if (filterAccountName) filterAccountName.value = '';
            filterStores();
        });
    }

    // Action buttons (UI only for now)
    const printableViewBtn = document.getElementById('printableViewBtn');
    if (printableViewBtn) {
        printableViewBtn.addEventListener('click', () => {
            // TODO: Implement printable view
            console.log('Printable View clicked');
        });
    }

    const exportListsBtn = document.getElementById('exportListsBtn');
    if (exportListsBtn) {
        exportListsBtn.addEventListener('click', () => {
            // TODO: Implement export lists
            console.log('Export Lists clicked');
        });
    }

    // Sortable column headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (column) {
                sortStores(column);
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
    
    // Initial render
    filterStores();
    updateTotalCount();
    updateSortIcons();
    updateFilterBadge();
});
