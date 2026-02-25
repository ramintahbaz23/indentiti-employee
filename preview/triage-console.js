/**
 * Operational Triage Console - Static preview
 * Mock data and UI logic; replace with LWC/Apex in Salesforce.
 */
(function () {
    const PRIORITY_ORDER = { emergency: 1, escalation: 2, unreadClientNote: 3, slaBreach: 4, mediaMissing: 5, mediaNotConsolidated: 6, quotePending: 7, mallAlert: 8, quoteConflict: 9 };

    const needsAttentionData = [
        { id: 'na1', workOrderNumber: 'WO-00000001', workOrderId: 'wo1', account: 'Acme Corp', category: 'emergency', categoryLabel: 'Emergency Tickets', status: 'Open', reason: 'Safety issue', ageDays: 0, slaAtRisk: true },
        { id: 'na2', workOrderNumber: 'WO-00000002', workOrderId: 'wo2', account: 'Retail Co', category: 'escalation', categoryLabel: 'Escalations', status: 'In Progress', reason: 'Client escalation', ageDays: 2, slaAtRisk: false },
        { id: 'na2b', workOrderNumber: 'WO-00000007', workOrderId: 'wo7', account: 'Metro Signs', category: 'unreadClientNote', categoryLabel: 'Unread Client Note', status: 'In Progress', reason: 'Client note via portal, unread', ageDays: 1, slaAtRisk: false },
        { id: 'na3', workOrderNumber: 'WO-00000003', workOrderId: 'wo3', account: 'Mall Tenant A', category: 'mediaMissing', categoryLabel: 'Missing Required Media', status: 'Scheduled', reason: 'Pre-work photos missing', ageDays: 5, slaAtRisk: true },
        { id: 'na3b', workOrderNumber: 'WO-00000007', workOrderId: 'wo7', account: 'Child WO Parent', category: 'mediaNotConsolidated', categoryLabel: 'Media Not Consolidated', status: 'Scheduled', reason: 'Child photos not rolled up', ageDays: 2, slaAtRisk: false },
        { id: 'na4', workOrderNumber: 'WO-00000004', workOrderId: 'wo4', account: 'Store B', category: 'quotePending', categoryLabel: 'Quotes Pending Send', status: 'Pending', reason: 'Quote approved, not sent', ageDays: 1, slaAtRisk: false },
        { id: 'na5', workOrderNumber: 'WO-00000005', workOrderId: 'wo5', account: 'Chain X', category: 'quoteConflict', categoryLabel: 'Quote Status Conflict', status: 'On Hold', reason: 'Status mismatch', ageDays: 3, slaAtRisk: false },
        { id: 'na6', workOrderNumber: 'WO-00000006', workOrderId: 'wo6', account: 'Mall West', category: 'mallAlert', categoryLabel: 'Mall Alert / Compliance', status: 'Open', reason: 'Compliance requirements not acknowledged', ageDays: 0, slaAtRisk: false },
    ];

    const activeWorkData = [
        { id: 'wo1', workOrderNumber: 'WO-00000001', status: 'Open', priority: 'Critical', mall: 'Westfield Mall', mediaCount: 12, quoteStatus: 'Draft', hasEscalation: true, slaAgeDays: 0, lastUpdated: '2025-02-24T10:00:00Z', mediaMissing: true, quoteNeedsAction: true, mallId: 'mall1', hasQuoteConflict: false },
        { id: 'wo2', workOrderNumber: 'WO-00000002', status: 'In Progress', priority: 'High', mall: 'Galleria', mediaCount: 8, quoteStatus: 'Submitted', hasEscalation: true, slaAgeDays: 2, lastUpdated: '2025-02-23T14:30:00Z', mediaMissing: false, quoteNeedsAction: false, mallId: 'mall2', hasQuoteConflict: false },
        { id: 'wo3', workOrderNumber: 'WO-00000003', status: 'Scheduled', priority: 'Medium', mall: 'Westfield Mall', mediaCount: 5, quoteStatus: 'Approved', hasEscalation: false, slaAgeDays: 5, lastUpdated: '2025-02-22T09:00:00Z', mediaMissing: true, quoteNeedsAction: true, mallId: 'mall1', hasQuoteConflict: false },
        { id: 'wo4', workOrderNumber: 'WO-00000004', status: 'Pending', priority: 'High', mall: 'Plaza Center', mediaCount: 3, quoteStatus: 'Draft', hasEscalation: false, slaAgeDays: 1, lastUpdated: '2025-02-24T08:00:00Z', mediaMissing: false, quoteNeedsAction: true, mallId: 'mall3', hasQuoteConflict: false },
        { id: 'wo5', workOrderNumber: 'WO-00000005', status: 'On Hold', priority: 'Low', mall: 'Galleria', mediaCount: 6, quoteStatus: 'Sent', hasEscalation: false, slaAgeDays: 3, lastUpdated: '2025-02-21T16:00:00Z', mediaMissing: false, quoteNeedsAction: false, mallId: 'mall2', hasQuoteConflict: true },
        { id: 'wo6', workOrderNumber: 'WO-00000006', status: 'Open', priority: 'Critical', mall: 'Westfield Mall', mediaCount: 10, quoteStatus: 'Pending Review', hasEscalation: false, slaAgeDays: 0, lastUpdated: '2025-02-24T11:00:00Z', mediaMissing: true, quoteNeedsAction: true, mallId: 'mall1', hasQuoteConflict: false },
    ];

    let filters = {
        status: '', priority: '', mall: '', mediaMissing: false, quoteNeedsAction: false
    };
    let triageFilterCategory = ''; // 'quote' | 'media' | 'mall' | ''
    let needsAttentionSortCategory = null; // null = priority order, 'asc' = A-Z by category, 'desc' = Z-A

    function showToast(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'toast ' + (type || 'info') + ' show';
        setTimeout(function () { toast.classList.remove('show'); }, 3000);
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return iso; }
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getCategoryBadgeClass(cat) {
        const map = { emergency: 'slds-badge slds-badge_error', escalation: 'slds-badge slds-badge_warning', mediaMissing: 'slds-badge slds-badge_warning', quotePending: 'slds-badge slds-badge_inverse', quoteConflict: 'slds-badge slds-badge_warning', mallAlert: 'slds-badge slds-badge_lightest' };
        return map[cat] || 'slds-badge slds-badge_lightest';
    }

    function getCategoryInlineStyle(categoryLabel) {
        const map = {
            'Emergency Tickets': 'color:#ba0517;font-weight:600',
            'Mall Alert / Compliance': 'color:#ba0517;font-weight:600',
            'Escalations': 'color:#a86403;font-weight:600',
            'Unread Client Note': 'color:#a86403;font-weight:600',
            'Quote Status Conflict': 'color:#a86403;font-weight:600',
            'Media Not Consolidated': 'color:#a86403;font-weight:600',
            'Missing Required Media': 'color:#0176d3;font-weight:600',
            'Quotes Pending Send': 'color:#0176d3;font-weight:600'
        };
        return map[categoryLabel] ? 'style="' + map[categoryLabel] + '"' : '';
    }

    function applyFilters() {
        let work = activeWorkData.filter(function (row) {
            if (filters.status && row.status !== filters.status) return false;
            if (filters.priority && row.priority !== filters.priority) return false;
            if (filters.mall && row.mall !== filters.mall) return false;
            if (filters.mediaMissing && !row.mediaMissing) return false;
            if (filters.quoteNeedsAction && !row.quoteNeedsAction) return false;
            return true;
        });
        return work;
    }

    function getPriorityTier(row) {
        /* Red: drop-everything (emergency, mallAlert only) */
        if (row.category === 'emergency' || row.category === 'mallAlert') return 'p1';
        /* Amber: time-sensitive (escalation, unreadClientNote, quoteConflict, mediaNotConsolidated) */
        if (row.category === 'escalation' || row.category === 'unreadClientNote' || row.category === 'quoteConflict' || row.category === 'mediaNotConsolidated') return 'p2';
        /* Blue: workflow gaps (mediaMissing, quotePending, slaBreach, any other) */
        return 'p3';
    }
    function getActionLabel(row) {
        switch (row.category) {
            case 'emergency': return 'Open WO';
            case 'escalation': return 'Respond';
            case 'unreadClientNote': return 'Read & Respond →';
            case 'mediaMissing': return 'Upload Media';
            case 'mediaNotConsolidated': return 'Consolidate →';
            case 'quotePending': return 'Send Quote';
            case 'mallAlert': return 'Acknowledge →';
            case 'quoteConflict': return 'Resolve';
            default: return 'Open WO';
        }
    }

    function renderNeedsAttention() {
        const tbody = document.getElementById('needsAttentionBody');
        if (!tbody) return;
        let sorted = needsAttentionData.slice();
        if (triageFilterCategory === 'quote') {
            sorted = sorted.filter(function (r) { return r.category === 'quotePending' || r.category === 'quoteConflict'; });
        } else if (triageFilterCategory === 'media') {
            sorted = sorted.filter(function (r) { return r.category === 'mediaMissing' || r.category === 'mediaNotConsolidated'; });
        } else if (triageFilterCategory === 'mall') {
            sorted = sorted.filter(function (r) { return r.category === 'mallAlert'; });
        }
        if (needsAttentionSortCategory === 'asc') {
            sorted.sort(function (a, b) {
                var A = (a.categoryLabel || '').toLowerCase();
                var B = (b.categoryLabel || '').toLowerCase();
                return A < B ? -1 : A > B ? 1 : 0;
            });
        } else if (needsAttentionSortCategory === 'desc') {
            sorted.sort(function (a, b) {
                var A = (a.categoryLabel || '').toLowerCase();
                var B = (b.categoryLabel || '').toLowerCase();
                return A > B ? -1 : A < B ? 1 : 0;
            });
        } else {
            sorted.sort(function (a, b) {
                return (PRIORITY_ORDER[a.category] || 99) - (PRIORITY_ORDER[b.category] || 99);
            });
        }
        var countEl = document.getElementById('needsAttentionCount');
        if (countEl) countEl.textContent = sorted.length;
        var categoryTh = document.getElementById('needsAttentionCategoryHeader');
        if (categoryTh) {
            var dir = needsAttentionSortCategory === 'asc' ? ' \u2191' : needsAttentionSortCategory === 'desc' ? ' \u2193' : '';
            categoryTh.textContent = 'Category' + dir;
            categoryTh.setAttribute('aria-sort', needsAttentionSortCategory === 'asc' ? 'ascending' : needsAttentionSortCategory === 'desc' ? 'descending' : 'none');
        }
        if (!sorted.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="slds-cell-buffer_left slds-cell-buffer_right slds-text-align_center slds-p-around_medium slds-text-color_weak">No items need attention.</td></tr>';
            return;
        }
        tbody.innerHTML = sorted.map(function (row) {
            var categoryStyle = getCategoryInlineStyle(row.categoryLabel);
            var sla = row.slaAtRisk ? '<span class="slds-badge slds-badge_error">' + row.ageDays + 'd</span>' : row.ageDays + 'd';
            var actionLabel = getActionLabel(row);
            var detailUrl = 'work-order-details.html?id=' + encodeURIComponent(row.workOrderNumber);
            var cellClass = 'slds-cell-buffer_left slds-cell-buffer_right';
            var categoryCell = '<td class="' + cellClass + '" data-label="Category"><span ' + categoryStyle + '>' + escapeHtml(row.categoryLabel) + '</span></td>';
            var dropdownId = 'na-dropdown-' + escapeHtml(row.workOrderId);
            var dropdownBtn = '<button type="button" class="actions-dropdown-btn" data-dropdown-for="' + dropdownId + '" aria-expanded="false" aria-haspopup="true" aria-label="Actions" title="Actions">' +
                '<svg class="slds-icon slds-icon_x-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button>';
            var dropdownMenu = '<div class="row-action-dropdown" id="' + dropdownId + '" role="menu" hidden><a href="' + detailUrl + '" class="row-action-dropdown-item">' + escapeHtml(actionLabel) + '</a></div>';
            return '<tr class="needs-attention-row" data-id="' + escapeHtml(row.workOrderId) + '">' +
                categoryCell +
                '<td class="' + cellClass + '" data-label="Work Order #"><a href="' + detailUrl + '" class="wo-link">' + escapeHtml(row.workOrderNumber) + '</a></td>' +
                '<td class="' + cellClass + '" data-label="Client / Account">' + escapeHtml(row.account) + '</td>' +
                '<td class="' + cellClass + '" data-label="Status"><span class="slds-badge slds-badge_lightest">' + escapeHtml(row.status) + '</span></td>' +
                '<td class="' + cellClass + '" data-label="Reason">' + escapeHtml(row.reason) + '</td>' +
                '<td class="' + cellClass + '" data-label="Age / SLA">' + sla + '</td>' +
                '<td class="td-expand" data-label=""><div class="row-dropdown-wrapper">' + dropdownBtn + dropdownMenu + '</div></td></tr>';
        }).join('');

        tbody.querySelectorAll('.row-dropdown-wrapper .actions-dropdown-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var dropdownId = this.getAttribute('data-dropdown-for');
                var dropdown = document.getElementById(dropdownId);
                var wasOpen = dropdown && !dropdown.hasAttribute('hidden');
                tbody.querySelectorAll('.row-action-dropdown').forEach(function (d) { d.setAttribute('hidden', ''); });
                tbody.querySelectorAll('.row-dropdown-wrapper .actions-dropdown-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
                if (!wasOpen && dropdown) {
                    dropdown.removeAttribute('hidden');
                    this.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    function renderActiveWork(rows) {
        const tbody = document.getElementById('activeWorkBody');
        if (!tbody) return;
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="slds-cell-buffer_left slds-cell-buffer_right slds-text-align_center slds-p-around_medium slds-text-color_weak">No work orders match the current filters.</td></tr>';
            return;
        }
        function statusBadge(s) {
            if (s === 'In Progress') return 'slds-badge slds-badge_inverse';
            if (s === 'Pending') return 'slds-badge slds-badge_warning';
            return 'slds-badge slds-badge_lightest';
        }
        function mediaCell(row) {
            var label = row.mediaMissing ? 'Missing' : 'Complete (' + (row.mediaCount || 0) + ')';
            var color = row.mediaMissing ? ' style="color:#ba0517"' : '';
            return '<span' + color + '>' + escapeHtml(label) + '</span>';
        }
        function quoteStatusColor(s) {
            if (s === 'Draft' || s === 'Pending Review' || s === 'Submitted') return '#a86403';
            if (s === 'Approved' || s === 'Sent') return '#2e844a';
            return '';
        }
        function quoteStatusCell(row) {
            var color = quoteStatusColor(row.quoteStatus);
            var style = color ? ' style="color:' + color + '"' : '';
            return '<span' + style + '>' + escapeHtml(row.quoteStatus) + '</span>';
        }
        var cellClass = 'slds-cell-buffer_left slds-cell-buffer_right';
        tbody.innerHTML = rows.map(function (row) {
            var esc = row.hasEscalation ? '<span class="escalation-icon" title="Escalation">&#9888;</span>' : '—';
            return '<tr class="active-work-row" data-id="' + escapeHtml(row.id) + '">' +
                '<td class="' + cellClass + '" data-label="Work Order #"><a href="javascript:void(0)" class="wo-link" data-id="' + escapeHtml(row.id) + '">' + escapeHtml(row.workOrderNumber) + '</a></td>' +
                '<td class="' + cellClass + '" data-label="Status"><span class="' + statusBadge(row.status) + '">' + escapeHtml(row.status) + '</span></td>' +
                '<td class="' + cellClass + '" data-label="Priority">' + escapeHtml(row.priority) + '</td>' +
                '<td class="' + cellClass + '" data-label="Mall">' + escapeHtml(row.mall) + '</td>' +
                '<td class="' + cellClass + '" data-label="Media">' + mediaCell(row) + '</td>' +
                '<td class="' + cellClass + '" data-label="Quote Status">' + quoteStatusCell(row) + '</td>' +
                '<td class="' + cellClass + '" data-label="Escalation">' + esc + '</td>' +
                '<td class="' + cellClass + '" data-label="SLA Age">' + row.slaAgeDays + 'd</td>' +
                '<td class="' + cellClass + '" data-label="Last Updated">' + escapeHtml(formatDate(row.lastUpdated)) + '</td>' +
                '</tr>';
        }).join('');
        tbody.querySelectorAll('.wo-link, .active-work-row').forEach(function (el) {
            el.addEventListener('click', function (e) {
                if (e.target.classList.contains('wo-link')) e.preventDefault();
                var id = (e.currentTarget.getAttribute('data-id') || e.target.getAttribute('data-id'));
                if (id) showToast('Would open Work Order: ' + id, 'info');
            });
        });
    }

    function bindFilters() {
        var statusSelect = document.getElementById('filterStatus');
        var prioritySelect = document.getElementById('filterPriority');
        var mallSelect = document.getElementById('filterMall');
        var mediaMissingCb = document.getElementById('filterMediaMissing');
        var quoteNeedsCb = document.getElementById('filterQuoteNeedsAction');

        if (statusSelect) statusSelect.addEventListener('change', function () { filters.status = this.value || ''; renderActiveWork(applyFilters()); });
        if (prioritySelect) prioritySelect.addEventListener('change', function () { filters.priority = this.value || ''; renderActiveWork(applyFilters()); });
        if (mallSelect) mallSelect.addEventListener('change', function () { filters.mall = this.value || ''; renderActiveWork(applyFilters()); });
        if (mediaMissingCb) mediaMissingCb.addEventListener('change', function () { filters.mediaMissing = this.checked; renderActiveWork(applyFilters()); });
        if (quoteNeedsCb) quoteNeedsCb.addEventListener('change', function () { filters.quoteNeedsAction = this.checked; renderActiveWork(applyFilters()); });
    }

    function init() {
        renderNeedsAttention();
        renderActiveWork(applyFilters());
        bindFilters();

        var categoryHeader = document.getElementById('needsAttentionCategoryHeader');
        if (categoryHeader) {
            categoryHeader.addEventListener('click', function () {
                needsAttentionSortCategory = needsAttentionSortCategory === null ? 'asc' : needsAttentionSortCategory === 'asc' ? 'desc' : null;
                renderNeedsAttention();
            });
            categoryHeader.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    needsAttentionSortCategory = needsAttentionSortCategory === null ? 'asc' : needsAttentionSortCategory === 'asc' ? 'desc' : null;
                    renderNeedsAttention();
                }
            });
        }

        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('.triage-zone .row-dropdown-wrapper')) return;
            var tbody = document.getElementById('needsAttentionBody');
            if (tbody) {
                tbody.querySelectorAll('.row-action-dropdown').forEach(function (d) { d.setAttribute('hidden', ''); });
                tbody.querySelectorAll('.row-dropdown-wrapper .actions-dropdown-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
            }
        });

        // New Work Order modal
        var newWoBtn = document.getElementById('newWorkOrderBtn');
        var newWorkOrderModal = document.getElementById('newWorkOrderModal');
        var modalOverlay = document.getElementById('modalOverlay');
        var modalClose = document.getElementById('modalClose');
        var cancelWorkOrderBtn = document.getElementById('cancelWorkOrder');
        var saveAndNewBtn = document.getElementById('saveAndNewWorkOrder');
        var newWorkOrderForm = document.getElementById('newWorkOrderForm');

        function openNewWorkOrderModal() {
            if (newWorkOrderModal) {
                newWorkOrderModal.style.display = 'flex';
                newWorkOrderModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                document.addEventListener('keydown', handleModalEscape);
            }
        }
        function closeNewWorkOrderModal() {
            if (newWorkOrderModal) {
                newWorkOrderModal.style.display = 'none';
                newWorkOrderModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleModalEscape);
            }
        }
        function handleModalEscape(e) {
            if (e.key === 'Escape' && newWorkOrderModal && newWorkOrderModal.style.display === 'flex') {
                closeNewWorkOrderModal();
            }
        }
        if (newWoBtn) newWoBtn.addEventListener('click', openNewWorkOrderModal);
        if (modalOverlay) modalOverlay.addEventListener('click', closeNewWorkOrderModal);
        if (modalClose) modalClose.addEventListener('click', closeNewWorkOrderModal);
        if (cancelWorkOrderBtn) cancelWorkOrderBtn.addEventListener('click', closeNewWorkOrderModal);

        var vendorTypesOptions = ['Installer', 'Electrician', 'Painter', 'Roofing', 'Manufacturer'];
        var vendorTypesAvailable = document.getElementById('vendorTypesAvailable');
        var vendorTypesChosen = document.getElementById('vendorTypesChosen');
        var vendorTypesValue = document.getElementById('vendorTypesValue');
        var vendorTypesAddBtn = document.getElementById('vendorTypesAdd');
        var vendorTypesRemoveBtn = document.getElementById('vendorTypesRemove');

        function updateVendorTypesHidden() {
            if (!vendorTypesValue) return;
            var chosen = vendorTypesChosen ? [].slice.call(vendorTypesChosen.querySelectorAll('li')).map(function (li) { return li.getAttribute('data-value') || li.textContent; }) : [];
            vendorTypesValue.value = chosen.length ? chosen.join(',') : '';
        }
        function initVendorTypesDualList() {
            if (!vendorTypesAvailable || !vendorTypesChosen) return;
            vendorTypesAvailable.innerHTML = '';
            vendorTypesChosen.innerHTML = '';
            vendorTypesOptions.forEach(function (v) {
                var li = document.createElement('li');
                li.setAttribute('data-value', v);
                li.textContent = v;
                li.tabIndex = 0;
                li.addEventListener('click', function () {
                    vendorTypesAvailable.querySelectorAll('li').forEach(function (el) { el.classList.remove('selected'); });
                    vendorTypesChosen.querySelectorAll('li').forEach(function (el) { el.classList.remove('selected'); });
                    this.classList.add('selected');
                });
                vendorTypesAvailable.appendChild(li);
            });
            updateVendorTypesHidden();
        }
        if (vendorTypesAddBtn && vendorTypesAvailable && vendorTypesChosen) {
            vendorTypesAddBtn.addEventListener('click', function () {
                var sel = vendorTypesAvailable.querySelector('li.selected');
                if (!sel) return;
                sel.classList.remove('selected');
                vendorTypesAvailable.removeChild(sel);
                vendorTypesChosen.appendChild(sel);
                updateVendorTypesHidden();
            });
        }
        if (vendorTypesRemoveBtn && vendorTypesAvailable && vendorTypesChosen) {
            vendorTypesRemoveBtn.addEventListener('click', function () {
                var sel = vendorTypesChosen.querySelector('li.selected');
                if (!sel) return;
                sel.classList.remove('selected');
                vendorTypesChosen.removeChild(sel);
                vendorTypesAvailable.appendChild(sel);
                updateVendorTypesHidden();
            });
        }
        initVendorTypesDualList();

        if (newWorkOrderForm) {
            newWorkOrderForm.addEventListener('submit', function (e) {
                e.preventDefault();
                updateVendorTypesHidden();
                if (!vendorTypesValue || !vendorTypesValue.value.trim()) {
                    showToast('Please select at least one Vendor Type', 'warning');
                    return;
                }
                if (this.checkValidity()) {
                    showToast('Work order saved successfully', 'success');
                    closeNewWorkOrderModal();
                } else this.reportValidity();
            });
        }
        if (saveAndNewBtn) {
            saveAndNewBtn.addEventListener('click', function () {
                var form = document.getElementById('newWorkOrderForm');
                updateVendorTypesHidden();
                if (!vendorTypesValue || !vendorTypesValue.value.trim()) {
                    showToast('Please select at least one Vendor Type', 'warning');
                    return;
                }
                if (form && form.checkValidity()) {
                    showToast('Work order saved. Creating new…', 'success');
                    closeNewWorkOrderModal();
                    setTimeout(function () {
                        if (form) form.reset();
                        initVendorTypesDualList();
                        openNewWorkOrderModal();
                    }, 400);
                } else if (form) form.reportValidity();
            });
        }

        var filtersToggle = document.getElementById('activeWorkFiltersToggle');
        var filterBar = document.getElementById('activeWorkFilterBar');
        if (filtersToggle && filterBar) {
            filtersToggle.addEventListener('click', function () {
                var isOpen = filterBar.classList.toggle('filter-bar-hidden');
                filtersToggle.setAttribute('aria-expanded', !isOpen);
                filtersToggle.setAttribute('aria-label', isOpen ? 'Show filters' : 'Hide filters');
                var label = filtersToggle.querySelector('.filters-toggle-label');
                if (label) label.textContent = isOpen ? 'Filters' : 'Hide filters';
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
