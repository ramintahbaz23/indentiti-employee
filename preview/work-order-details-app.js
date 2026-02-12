// Get work order ID from URL
const urlParams = new URLSearchParams(window.location.search);
const workOrderId = urlParams.get('id');

let currentWorkOrder = null;
let comments = [];
let files = [];

// Helper functions for estimates and invoices
function getWorkOrderEstimates(workOrderId) {
    if (!workOrderId || typeof estimatesData === 'undefined') return [];
    return estimatesData.filter(est => est.workOrderNumber === workOrderId)
        .sort((a, b) => new Date(b.created) - new Date(a.created));
}

function getWorkOrderInvoices(workOrderId) {
    if (!workOrderId || typeof invoicesData === 'undefined') return [];
    return invoicesData.filter(inv => inv.ticketNumber === workOrderId)
        .sort((a, b) => new Date(b.created) - new Date(a.created));
}

function findEstimateByStatus(estimates, statuses) {
    if (!Array.isArray(statuses)) statuses = [statuses];
    for (const est of estimates) {
        const normalizedStatus = (est.status || '').toLowerCase();
        if (statuses.includes(normalizedStatus)) {
            return est;
        }
    }
    return null;
}

/**
 * Render Estimates table in Estimates tab
 */
function renderEstimatesTable(workOrderId) {
    const tableContainer = document.getElementById('estimatesTable');
    if (!tableContainer) {
        console.error('estimatesTable element not found');
        return;
    }

    let estimates = getWorkOrderEstimates(workOrderId);
    console.log('Rendering estimates table for work order:', workOrderId, 'Found estimates:', estimates);

    // If no estimates, create 2 sample estimates for display
    if (!estimates || estimates.length === 0) {
        estimates = [
            {
                id: `EST-${workOrderId}-001`,
                workOrderNumber: workOrderId,
                created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                estimationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                total: 850.00,
                taxAmount: 68.00,
                grandTotal: 918.00,
                status: 'Pending',
                comment: 'Awaiting approval'
            },
            {
                id: `EST-${workOrderId}-002`,
                workOrderNumber: workOrderId,
                created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                estimationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
                total: 1200.00,
                taxAmount: 96.00,
                grandTotal: 1296.00,
                status: 'Draft',
                comment: 'Initial estimate'
            }
        ];
    } else if (estimates.length < 2) {
        // If only 1 estimate, add another sample one
        estimates.push({
            id: `EST-${workOrderId}-${String(estimates.length + 1).padStart(3, '0')}`,
            workOrderNumber: workOrderId,
            created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            estimationDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
            total: 750.00,
            taxAmount: 60.00,
            grandTotal: 810.00,
            status: 'Draft',
            comment: 'Revised estimate'
        });
    }

    // Limit to 2 estimates for display
    estimates = estimates.slice(0, 2);

    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid #dddbda;">
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Name</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Status</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Total</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Updated</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${estimates.map(est => {
                    const status = (est.status || '').toLowerCase();
                    const statusClass = status || 'draft';
                    return `
                        <tr style="border-bottom: 1px solid #f3f2f2;">
                            <td style="padding: 1rem;"><a href="estimates.html?id=${est.id}" style="color: var(--sf-brand); text-decoration: none;">${est.id}</a></td>
                            <td style="padding: 1rem;"><span class="status-badge-small ${statusClass}">${est.status || 'Draft'}</span></td>
                            <td style="padding: 1rem;">${formatCurrency(est.grandTotal || est.total)}</td>
                            <td style="padding: 1rem;">${formatDate(est.created)}</td>
                            <td style="padding: 1rem;">
                                <a href="estimates.html?id=${est.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">View</a>
                                ${status === 'draft' ? `<a href="#" class="edit-estimate" data-id="${est.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Edit</a>` : ''}
                                ${status === 'draft' ? `<a href="#" class="send-estimate" data-id="${est.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Send</a>` : ''}
                                ${status === 'rejected' ? `<a href="#" class="revise-estimate" data-id="${est.id}" style="color: var(--sf-brand);">Revise</a>` : ''}
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
 * Render Invoices table in Invoices tab
 */
function renderInvoicesTable(workOrderId) {
    const tableContainer = document.getElementById('invoicesTable');
    if (!tableContainer) return;

    let invoices = getWorkOrderInvoices(workOrderId);
    const estimates = getWorkOrderEstimates(workOrderId);
    const approvedEstimate = findEstimateByStatus(estimates, 'approved');

    // If no invoices, create 2 sample invoices for display
    if (!invoices || invoices.length === 0) {
        invoices = [
            {
                id: `INV-${workOrderId}-001`,
                ticketNumber: workOrderId,
                invoiceNumber: `INV-${workOrderId}-001`,
                created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                invoiceDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                total: 918.00,
                taxAmount: 73.44,
                grandTotal: 991.44,
                status: 'Paid',
                paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                id: `INV-${workOrderId}-002`,
                ticketNumber: workOrderId,
                invoiceNumber: `INV-${workOrderId}-002`,
                created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                invoiceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                total: 1296.00,
                taxAmount: 103.68,
                grandTotal: 1399.68,
                status: 'Sent',
                paidDate: null
            }
        ];
    } else if (invoices.length < 2) {
        // If only 1 invoice, add another sample one
        invoices.push({
            id: `INV-${workOrderId}-${String(invoices.length + 1).padStart(3, '0')}`,
            ticketNumber: workOrderId,
            invoiceNumber: `INV-${workOrderId}-${String(invoices.length + 1).padStart(3, '0')}`,
            created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            total: 810.00,
            taxAmount: 64.80,
            grandTotal: 874.80,
            status: 'Draft',
            paidDate: null
        });
    }

    // Limit to 2 invoices for display
    invoices = invoices.slice(0, 2);

    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid #dddbda;">
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Number</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Status</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Total</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Updated</th>
                    <th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #3e3e3c; text-transform: uppercase;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${invoices.map(inv => {
                    const status = (inv.status || '').toLowerCase();
                    const statusClass = status || 'draft';
                    return `
                        <tr style="border-bottom: 1px solid #f3f2f2;">
                            <td style="padding: 1rem;"><a href="invoices.html?id=${inv.id}" style="color: var(--sf-brand); text-decoration: none;">${inv.invoiceNumber || inv.id}</a></td>
                            <td style="padding: 1rem;"><span class="status-badge-small ${statusClass}">${inv.status || 'Draft'}</span></td>
                            <td style="padding: 1rem;">${formatCurrency(inv.grandTotal || inv.total)}</td>
                            <td style="padding: 1rem;">${formatDate(inv.created || inv.invoiceDate)}</td>
                            <td style="padding: 1rem;">
                                <a href="invoices.html?id=${inv.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">View</a>
                                ${status === 'draft' ? `<a href="#" class="edit-invoice" data-id="${inv.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Edit</a>` : ''}
                                ${status === 'draft' ? `<a href="#" class="send-invoice" data-id="${inv.id}" style="color: var(--sf-brand); margin-right: 0.5rem;">Send</a>` : ''}
                                ${status === 'sent' ? `<a href="#" class="record-payment" data-id="${inv.id}" style="color: var(--sf-brand);">Record Payment</a>` : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
}

// Recent Work Orders Management
function addToRecentWorkOrders(woId, woTitle) {
    const recent = getRecentWorkOrders();
    // Remove if already exists
    const filtered = recent.filter(wo => wo.id !== woId);
    // Add to beginning
    filtered.unshift({ id: woId, title: woTitle, viewedAt: new Date().toISOString() });
    // Keep only last 5
    const limited = filtered.slice(0, 5);
    localStorage.setItem('recentWorkOrders', JSON.stringify(limited));
}

function getRecentWorkOrders() {
    try {
        const stored = localStorage.getItem('recentWorkOrders');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Utility Functions
function formatCurrency(amount) {
    if (amount == null || amount === '' || amount === 0) return '-';
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

// Get timezone for a state (simplified - in production, use proper timezone mapping)
function getTimezoneForState(state) {
    const timezoneMap = {
        'CA': 'America/Los_Angeles',
        'NY': 'America/New_York',
        'TX': 'America/Chicago',
        'FL': 'America/New_York',
        'IL': 'America/Chicago',
        'PA': 'America/New_York',
        'OH': 'America/New_York',
        'NC': 'America/New_York',
        'GA': 'America/New_York',
        'MI': 'America/Detroit',
        'NJ': 'America/New_York',
        'VA': 'America/New_York',
        'WA': 'America/Los_Angeles',
        'AZ': 'America/Phoenix',
        'MA': 'America/New_York',
        'TN': 'America/Chicago',
        'IN': 'America/Indiana/Indianapolis',
        'MO': 'America/Chicago',
        'MD': 'America/New_York',
        'WI': 'America/Chicago',
        'CO': 'America/Denver',
        'MN': 'America/Chicago',
        'SC': 'America/New_York',
        'AL': 'America/Chicago',
        'LA': 'America/Chicago',
        'KY': 'America/New_York',
        'OR': 'America/Los_Angeles',
        'OK': 'America/Chicago',
        'CT': 'America/New_York',
        'UT': 'America/Denver',
        'IA': 'America/Chicago',
        'NV': 'America/Los_Angeles',
        'AR': 'America/Chicago',
        'MS': 'America/Chicago',
        'KS': 'America/Chicago',
        'NM': 'America/Denver',
        'NE': 'America/Chicago',
        'WV': 'America/New_York',
        'ID': 'America/Boise',
        'HI': 'Pacific/Honolulu',
        'NH': 'America/New_York',
        'ME': 'America/New_York',
        'RI': 'America/New_York',
        'MT': 'America/Denver',
        'DE': 'America/New_York',
        'SD': 'America/Chicago',
        'ND': 'America/Chicago',
        'AK': 'America/Anchorage',
        'DC': 'America/New_York',
        'VT': 'America/New_York',
        'WY': 'America/Denver'
    };
    return timezoneMap[state] || 'America/New_York';
}

// Update store local time and weather
function updateStoreTimeAndWeather(wo) {
    const state = wo?.state || 'NC';
    const city = wo?.city || 'Winston-Salem';
    const timezone = getTimezoneForState(state);
    
    // Get current time in store's timezone with dummy data fallback
    const timeEl = document.getElementById('storeLocalTime');
    const weatherEl = document.getElementById('storeWeather');
    const weatherIconEl = document.getElementById('weatherIcon');
    
    if (!timeEl || !weatherEl || !weatherIconEl) {
        console.warn('Time/weather elements not found');
        return;
    }
    
    try {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true,
            timeZone: timezone
        });
        
        // Get timezone abbreviation
        const tzAbbr = getTimezoneAbbreviation(state);
        timeEl.textContent = `${timeString} ${tzAbbr}`;
    } catch (e) {
        // Fallback dummy data
        timeEl.textContent = '1:33 AM EST';
    }
    
    // Mock weather data (in production, call weather API)
    const weatherData = getMockWeather(city, state);
    weatherEl.textContent = weatherData.condition;
    weatherIconEl.textContent = weatherData.icon;
}

// Get timezone for state (IANA timezone identifier)
function getTimezoneForState(state) {
    const tzMap = {
        'CA': 'America/Los_Angeles', 'NV': 'America/Los_Angeles', 'WA': 'America/Los_Angeles', 'OR': 'America/Los_Angeles',
        'TX': 'America/Chicago', 'IL': 'America/Chicago', 'MO': 'America/Chicago', 'AR': 'America/Chicago', 'LA': 'America/Chicago', 'OK': 'America/Chicago', 'KS': 'America/Chicago', 'NE': 'America/Chicago', 'SD': 'America/Chicago', 'ND': 'America/Chicago', 'MN': 'America/Chicago', 'WI': 'America/Chicago', 'IA': 'America/Chicago', 'TN': 'America/Chicago', 'AL': 'America/Chicago', 'MS': 'America/Chicago',
        'NY': 'America/New_York', 'FL': 'America/New_York', 'NC': 'America/New_York', 'GA': 'America/New_York', 'PA': 'America/New_York', 'OH': 'America/New_York', 'MI': 'America/New_York', 'NJ': 'America/New_York', 'VA': 'America/New_York', 'MA': 'America/New_York', 'MD': 'America/New_York', 'SC': 'America/New_York', 'KY': 'America/New_York', 'WV': 'America/New_York', 'VT': 'America/New_York', 'NH': 'America/New_York', 'ME': 'America/New_York', 'RI': 'America/New_York', 'CT': 'America/New_York', 'DE': 'America/New_York', 'DC': 'America/New_York',
        'CO': 'America/Denver', 'UT': 'America/Denver', 'AZ': 'America/Phoenix', 'NM': 'America/Denver', 'WY': 'America/Denver', 'MT': 'America/Denver', 'ID': 'America/Denver'
    };
    return tzMap[state] || 'America/New_York';
}

// Get timezone abbreviation
function getTimezoneAbbreviation(state) {
    const tzMap = {
        'CA': 'PST', 'NV': 'PST', 'WA': 'PST', 'OR': 'PST',
        'TX': 'CST', 'IL': 'CST', 'MO': 'CST', 'AR': 'CST', 'LA': 'CST', 'OK': 'CST', 'KS': 'CST', 'NE': 'CST', 'SD': 'CST', 'ND': 'CST', 'MN': 'CST', 'WI': 'CST', 'IA': 'CST', 'TN': 'CST', 'AL': 'CST', 'MS': 'CST',
        'NY': 'EST', 'FL': 'EST', 'NC': 'EST', 'GA': 'EST', 'PA': 'EST', 'OH': 'EST', 'MI': 'EST', 'NJ': 'EST', 'VA': 'EST', 'MA': 'EST', 'MD': 'EST', 'SC': 'EST', 'KY': 'EST', 'WV': 'EST', 'VT': 'EST', 'NH': 'EST', 'ME': 'EST', 'RI': 'EST', 'CT': 'EST', 'DE': 'EST', 'DC': 'EST',
        'CO': 'MST', 'UT': 'MST', 'AZ': 'MST', 'NM': 'MST', 'WY': 'MST', 'MT': 'MST', 'ID': 'MST'
    };
    return tzMap[state] || 'EST';
}

// Get mock weather data
function getMockWeather(city, state) {
    // Simple mock weather based on time of day and season
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    
    // Determine season and base temperature
    const isWinter = month >= 11 || month <= 2;
    const isSummer = month >= 5 && month <= 8;
    
    // Base temperature by season and state region
    let baseTemp = 70;
    if (isWinter) {
        // Colder states in winter
        if (['MN', 'WI', 'ND', 'SD', 'MT', 'ME', 'VT', 'NH'].includes(state)) {
            baseTemp = 25;
        } else if (['NY', 'MA', 'CT', 'RI', 'PA', 'MI', 'OH'].includes(state)) {
            baseTemp = 35;
        } else if (['CA', 'FL', 'TX', 'AZ', 'NV'].includes(state)) {
            baseTemp = 65;
        } else {
            baseTemp = 45;
        }
    } else if (isSummer) {
        // Hotter states in summer
        if (['AZ', 'NV', 'TX', 'FL'].includes(state)) {
            baseTemp = 95;
        } else if (['CA', 'NC', 'GA', 'SC'].includes(state)) {
            baseTemp = 85;
        } else {
            baseTemp = 75;
        }
    }
    
    // Adjust for time of day (cooler at night)
    if (hour >= 20 || hour < 6) {
        baseTemp -= 10;
    }
    
    // Mock weather conditions with temperature
    const conditions = [
        { icon: '☀️', condition: `Sunny, ${baseTemp}°F` },
        { icon: '⛅', condition: `Partly Cloudy, ${baseTemp - 2}°F` },
        { icon: '☁️', condition: `Cloudy, ${baseTemp - 4}°F` },
        { icon: '🌤️', condition: `Mostly Sunny, ${baseTemp - 1}°F` },
        { icon: '🌧️', condition: `Light Rain, ${baseTemp - 5}°F` }
    ];
    
    // Simple logic: sunny during day, varied at night
    if (hour >= 6 && hour < 20) {
        // Daytime - mostly sunny
        return Math.random() > 0.3 ? conditions[0] : conditions[1];
    } else {
        // Nighttime - varied
        const rand = Math.random();
        if (rand > 0.7) return conditions[2]; // Cloudy
        if (rand > 0.4) return conditions[1]; // Partly Cloudy
        return conditions[0]; // Sunny
    }
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

function showToast(message, type = 'info') {
    // Simple alert for now - could be enhanced with a toast component
    alert(message);
}

/**
 * Show a modal dialog to collect decline reason
 * Uses best practices: proper modal, validation, accessibility
 */
window.showDeclineReasonModal = function() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'decline-modal-title');
    
    // Create modal container
    const container = document.createElement('div');
    container.className = 'modal-container';
    
    // Create modal header
    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'decline-modal-title';
    title.textContent = 'Decline Work Order';
    header.appendChild(title);
    
    // Create modal body
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    const label = document.createElement('label');
    label.className = 'modal-label';
    label.setAttribute('for', 'decline-reason-textarea');
    label.textContent = 'Reason for Declining *';
    
    const textarea = document.createElement('textarea');
    textarea.id = 'decline-reason-textarea';
    textarea.className = 'modal-textarea';
    textarea.setAttribute('placeholder', 'Please provide a reason for declining this work order...');
    textarea.setAttribute('maxlength', '500');
    textarea.setAttribute('required', 'true');
    textarea.setAttribute('aria-required', 'true');
    textarea.setAttribute('aria-describedby', 'char-count');
    
    const charCount = document.createElement('div');
    charCount.id = 'char-count';
    charCount.className = 'modal-char-count';
    charCount.textContent = '0 / 500 characters';
    
    // Update character count as user types
    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        charCount.textContent = `${length} / 500 characters`;
        
        // Enable/disable decline button based on input
        const declineBtn = container.querySelector('.modal-btn-decline');
        if (declineBtn) {
            declineBtn.disabled = length === 0 || !textarea.value.trim();
        }
    });
    
    body.appendChild(label);
    body.appendChild(textarea);
    body.appendChild(charCount);
    
    // Create modal footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn modal-btn-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel decline');
    
    const declineBtn = document.createElement('button');
    declineBtn.className = 'modal-btn modal-btn-decline';
    declineBtn.type = 'button';
    declineBtn.textContent = 'Decline Work Order';
    declineBtn.disabled = true;
    declineBtn.setAttribute('aria-label', 'Confirm decline');
    
    footer.appendChild(cancelBtn);
    footer.appendChild(declineBtn);
    
    // Assemble modal
    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    overlay.appendChild(container);
    
    // Add to DOM
    document.body.appendChild(overlay);
    
    // Focus textarea for accessibility
    textarea.focus();
    
    // Close modal function
    const closeModal = () => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
        // Restore body scroll if needed
        document.body.style.overflow = '';
    };
    
    // Handle cancel button
    cancelBtn.addEventListener('click', closeModal);
    
    // Handle decline button
    declineBtn.addEventListener('click', () => {
        const reason = textarea.value.trim();
        
        // Validate reason is provided
        if (!reason) {
            textarea.focus();
            textarea.style.borderColor = '#ea001e';
            setTimeout(() => {
                textarea.style.borderColor = '';
            }, 2000);
            return;
        }
        
        // Update work order
        if (currentWorkOrder) {
            currentWorkOrder.rejectionReason = reason;
            currentWorkOrder.status = 'Declined';
            renderWorkOrder();
            showToast('Work order declined.', 'success');
        }
        
        closeModal();
    });
    
    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
};

// Load work order data
function loadWorkOrder() {
    // Find work order in data
    if (workOrderId) {
        currentWorkOrder = workOrdersData.find(wo => wo.id === workOrderId);
        console.log('Work order found:', currentWorkOrder);
        console.log('Trade value:', currentWorkOrder?.trade);
        console.log('NTE Amount value:', currentWorkOrder?.nteAmount);
    }
    
    // If not found, use mock data for demo purposes
    if (!currentWorkOrder) {
        console.log('Work order not found, using mock data');
        currentWorkOrder = {
            id: workOrderId || 'WO-00149331',
            status: 'New',
            priority: 'Medium',
            trade: 'HVAC-R',
            issue: 'Heating System Repair',
            storeName: 'Warhammer - Silas Creek Crossing #0474',
            storePhone: '+1 743-643-4182',
            storeAddress: '3246 Silas Creek Parkway, Winston-Salem North Carolina, United States - 27103-3011',
            storeMall: 'Silas Creek Crossing',
            storeEmail: 'store0474@warhammer.com',
            city: 'Winston-Salem',
            state: 'NC',
            nteAmount: 750.00,
            contractorName: 'ABC Maintenance Services',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isOverdue: false,
            isRecall: 'No',
            subject: 'Ceiling Tile Replacement - Back Storage Area',
            description: 'Manager reports needing several ceiling tiles cut and replaced in back of store. The tiles have water damage from a previous leak and need to be removed and replaced with new tiles. Please coordinate with store manager for access to the back storage area.',
            rejectionReason: ''
        };
    }

    renderWorkOrder();
}

function renderWorkOrder() {
    const wo = currentWorkOrder;
    
    if (!wo) {
        console.error('currentWorkOrder is null or undefined');
        return;
    }
    
    console.log('Rendering work order:', wo.id);
    console.log('Work order data:', wo);
    
    // Show/hide buttons based on work order status
    const dispatchBtn = document.getElementById('dispatchBtn');
    const declineBtn = document.getElementById('declineBtn');
    const editBtn = document.getElementById('editBtn');
    const primaryCtaBtn = document.getElementById('primaryCtaBtn');
    const moreActionsBtn = document.getElementById('moreActionsBtn');
    
    // Hide all buttons initially
    if (dispatchBtn) dispatchBtn.style.display = 'none';
    if (declineBtn) declineBtn.style.display = 'none';
    if (primaryCtaBtn) primaryCtaBtn.style.display = 'none';
    if (moreActionsBtn) moreActionsBtn.style.display = 'none';
    
    // Determine status conditions
    const status = wo.status || '';
    const statusLower = status.toLowerCase();
    const isUnassigned = !wo.contractorName || wo.contractorName.trim() === '' || wo.contractorName === null;
    const isNew = status === 'New' || statusLower === 'new';
    const isInProgress = status === 'On-site/In Progress' || status === 'In Progress' || status === 'Dispatched' || 
                         statusLower.includes('in progress') || statusLower.includes('dispatched');
    const isComplete = status === 'Work Complete' || status === 'Complete' || statusLower.includes('complete');
    const isAccepted = status === 'Accepted' || statusLower === 'accepted';
    
    // Show Dispatch/Decline if unassigned and status is New
    if (isUnassigned && isNew) {
        if (dispatchBtn) dispatchBtn.style.display = 'inline-flex';
        if (declineBtn) {
            declineBtn.style.display = 'inline-flex';
            // Re-attach listener when button becomes visible
            if (!declineBtn.dataset.listenerAttached) {
                declineBtn.dataset.listenerAttached = 'true';
                declineBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Decline button clicked after renderWorkOrder');
                    if (window.showDeclineReasonModal) {
                        window.showDeclineReasonModal();
                    }
                    return false;
                });
            }
        }
    }
    
    // Hide Dispatch button if status is In Progress or Complete
    if (dispatchBtn && (isInProgress || isComplete)) {
        dispatchBtn.style.display = 'none';
    }
    
    // Hide Decline button if status is Complete
    if (declineBtn && isComplete) {
        declineBtn.style.display = 'none';
    }
    
    // Hide Edit button if status is Complete or Accepted
    if (editBtn) {
        if (isComplete || isAccepted) {
            editBtn.style.display = 'none';
        } else {
            editBtn.style.display = 'inline-flex';
        }
    }
    
    // Add to recent work orders
    addToRecentWorkOrders(wo.id, wo.issue || wo.id);
    
    // Update page title
    document.getElementById('pageTitle').textContent = `Work Order ${wo.id}`;
    document.getElementById('pageSubtitle').textContent = wo.issue || 'Work Order Details';
    document.getElementById('workOrderId').textContent = wo.id;

    // Store Details - populate with mock data
    document.getElementById('storeName').textContent = wo.storeName || 'Warhammer - Silas Creek Crossing #0474';
    document.getElementById('storePhone').textContent = wo.storePhone || '+1 743-643-4182';
    document.getElementById('storeAddress').textContent = wo.storeAddress || '3246 Silas Creek Parkway, Winston-Salem North Carolina, United States - 27103-3011';
    
    // Handle empty fields
    const storeMallEl = document.getElementById('storeMall');
    const storeEmailEl = document.getElementById('storeEmail');
    if (wo.storeMall) {
        storeMallEl.textContent = wo.storeMall;
        storeMallEl.classList.remove('empty');
    } else {
        // Show dummy mall data
        storeMallEl.textContent = 'Silas Creek Crossing';
        storeMallEl.classList.remove('empty');
    }
    if (wo.storeEmail) {
        storeEmailEl.textContent = wo.storeEmail;
        storeEmailEl.classList.remove('empty');
    } else {
        // Show dummy email data
        storeEmailEl.textContent = 'store0474@warhammer.com';
        storeEmailEl.classList.remove('empty');
    }

    // Details card - populate with comprehensive mock data
    document.getElementById('createdOn').textContent = formatDateTime(wo.createdDate || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    
    // Status badge in card header
    const statusClass = getStatusClass(wo.status || 'New');
    // Transform "On Hold" status to "Awaiting Approval" for display
    let displayStatus = wo.status || 'New';
    if (displayStatus === 'On Hold' || displayStatus === 'Proposal Submitted' || displayStatus === 'Proposal Pending Approval' || displayStatus === 'Pending Schedule' || displayStatus === 'Awaiting Parts') {
        displayStatus = 'Awaiting Approval';
    }
    document.getElementById('statusBadge').innerHTML = `<span class="status-badge status-${statusClass}">${displayStatus}</span>`;
    
    // Key information displays
    document.getElementById('statusValueDisplay').textContent = displayStatus;
    const priorityDisplay = formatPriorityDisplay(wo.priority) || 'High';
    document.getElementById('priorityValueDisplay').textContent = priorityDisplay;
    document.getElementById('issueValueDisplay').textContent = wo.issue || 'Ceiling Tiles';
    
    document.getElementById('clientTracking').textContent = wo.id || 'WR1084488';
    document.getElementById('division').textContent = 'Facility Maintenance';
    
    // Ensure Classification always has a value
    const classificationEl = document.getElementById('classificationValue');
    if (classificationEl) {
        // Check if trade exists and has a valid value
        if (wo && wo.trade && String(wo.trade).trim() && String(wo.trade).trim() !== 'null' && String(wo.trade).trim() !== 'undefined') {
            classificationEl.textContent = String(wo.trade).trim();
        } else {
            classificationEl.textContent = 'General Maintenance';
        }
    }
    
    const priorityValueEl = document.getElementById('priorityValue');
    if (priorityValueEl) {
        priorityValueEl.textContent = priorityDisplay;
    }
    
    // Ensure NTE Amount always has a value
    let displayAmount = 550.00;
    if (wo && wo.nteAmount != null && wo.nteAmount !== 0 && wo.nteAmount !== '' && wo.nteAmount !== undefined) {
        displayAmount = wo.nteAmount;
    }
    const nteValueEl = document.getElementById('nteValue');
    if (nteValueEl) {
        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayAmount);
        nteValueEl.textContent = formattedAmount;
        nteValueEl.innerHTML = formattedAmount;
        console.log('NTE Amount set to:', formattedAmount, 'from value:', wo?.nteAmount, 'displayAmount:', displayAmount);
    } else {
        console.error('nteValue element not found!');
    }
    document.getElementById('recall').textContent = wo.isRecall === 'Yes' ? 'YES' : 'NO';
    
    // Show/hide rejection reason based on whether it has a value
    const rejectionReasonGroup = document.getElementById('rejectionReasonGroup');
    const rejectionReasonValue = document.getElementById('rejectionReason');
    if (wo.rejectionReason && wo.rejectionReason.trim()) {
        rejectionReasonValue.textContent = wo.rejectionReason;
        rejectionReasonGroup.style.display = 'flex';
    } else {
        rejectionReasonGroup.style.display = 'none';
    }

    // Summary card - populate with mock data (always show dummy data)
    const requestedByEl = document.getElementById('requestedByValue');
    if (requestedByEl) {
        // Use contractor name if available, otherwise use realistic dummy data
        let requestedBy = 'Mark Thomas';
        if (wo && wo.contractorName && wo.contractorName.trim() !== '') {
            requestedBy = wo.contractorName;
        } else if (wo && wo.storeName) {
            // Extract store manager name from store name or use default
            requestedBy = 'Mark Thomas';
        }
        requestedByEl.textContent = requestedBy;
        // Remove empty class if it exists
        requestedByEl.classList.remove('empty');
    }
    
    const descriptionEl = document.getElementById('description');
    if (descriptionEl) {
        // Generate realistic description based on work order type, or use provided description
        let description = '';
        
        if (wo && wo.description && wo.description.trim() !== '') {
            description = wo.description;
        } else {
            // Generate context-aware dummy descriptions based on issue/trade
            const issue = (wo && wo.issue) ? wo.issue.toLowerCase() : '';
            const trade = (wo && wo.trade) ? wo.trade.toLowerCase() : '';
            
            if (issue.includes('toilet') || issue.includes('plumbing') || trade.includes('plumbing')) {
                description = 'Store manager reports toilet in restroom is not flushing properly. Water continues to run after flushing, and there appears to be a leak around the base. This is affecting customer experience and needs immediate attention. Please coordinate with store staff for access to the restroom area.';
            } else if (issue.includes('fire') || trade.includes('fire')) {
                description = 'Quarterly fire extinguisher inspection required per local fire code. All extinguishers need to be checked for proper pressure, expiration dates, and accessibility. Inspection tags need to be updated and documentation provided to store management.';
            } else if (issue.includes('hvac') || trade.includes('hvac')) {
                description = 'Routine preventative maintenance for HVAC system. Includes filter replacement, coil cleaning, checking refrigerant levels, and testing all components. System has been running continuously and needs professional servicing to maintain efficiency and prevent breakdowns.';
            } else if (issue.includes('cleaning') || issue.includes('window') || trade.includes('janitorial')) {
                description = 'Quarterly deep cleaning service required. Includes window washing, floor scrubbing, and general maintenance cleaning. Store is preparing for upcoming promotion and needs to maintain professional appearance. Please coordinate timing with store manager.';
            } else if (issue.includes('lock') || issue.includes('door') || trade.includes('lock')) {
                description = 'Front entrance door lock mechanism is failing. Key sometimes gets stuck and lock does not engage properly. This is a security concern that needs immediate attention. Replacement lock hardware has been approved and is available on-site.';
            } else if (issue.includes('pest') || trade.includes('pest')) {
                description = 'Routine pest control service required. Store has noticed increased activity and needs professional treatment. Service includes inspection, treatment, and follow-up recommendations. Please ensure all products used are safe for food service environments.';
            } else if (issue.includes('ceiling') || issue.includes('tile')) {
                description = 'Manager reports needing several ceiling tiles cut and replaced in back of store. The tiles have water damage from a previous leak and need to be removed and replaced with new tiles. Please coordinate with store manager for access to the back storage area.';
            } else {
                // Default generic description
                description = 'Work order requested by store management. Service required to address maintenance needs and ensure proper facility operations. Please coordinate with store manager for scheduling and access. All work must be completed according to company standards and local regulations.';
            }
        }
        
        descriptionEl.value = description;
        // Ensure textarea is visible and has content
        if (description.trim() === '') {
            descriptionEl.value = 'Work order details and service requirements. Please contact store manager for additional information or clarification.';
        }
    }
    
    const subjectEl = document.getElementById('subject');
    if (subjectEl) {
        const subject = (wo && wo.subject && wo.subject.trim() !== '') 
            ? wo.subject 
            : (wo && wo.issue && wo.issue.trim() !== '') 
                ? wo.issue 
                : 'Ceiling Tile Replacement - Back Storage Area';
        subjectEl.value = subject;
    }

    // Always load comments and files (they will use work order ID if available)
    // This ensures dummy data is always shown
    loadComments();
    loadFiles();
    
    // Ensure comments and files are visible after a short delay (in case tab switching interferes)
    setTimeout(() => {
        // Re-render comments to ensure they're visible
        if (comments.length > 0) {
            console.log('Re-rendering comments:', comments.length);
            renderComments();
        } else {
            console.warn('No comments loaded, calling loadComments again');
            loadComments();
        }
        
        // Re-render files to ensure they're visible
        if (files.length > 0) {
            console.log('Re-rendering files:', files.length);
            renderFiles();
        } else {
            console.warn('No files loaded, calling loadFiles again');
            loadFiles();
        }
    }, 500);
}

function loadComments() {
    // In a real app, this would fetch from an API
    // For demo, we'll ALWAYS use comprehensive mock data with realistic conversation thread
    console.log('loadComments called, currentWorkOrder:', currentWorkOrder);
    
    // Always ensure we have a work order ID to use, even if currentWorkOrder is null
    const woId = currentWorkOrder?.id || workOrderId || 'WO-00149331';
    const baseDate = currentWorkOrder?.createdDate ? new Date(currentWorkOrder.createdDate) : new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const issue = currentWorkOrder?.issue || 'Ceiling Tiles';
    const contractorName = currentWorkOrder?.contractorName || 'ABC Maintenance Services';
    
    console.log('Loading comments with woId:', woId, 'issue:', issue, 'Always loading dummy data');
    
    comments = [
        {
            id: 1,
            author: 'Mark Thomas',
            role: 'Purple Corporate Manager',
            date: new Date(baseDate),
            type: 'Internal',
            subject: 'Work order created',
            body: `Work order ${woId} has been created for ${issue}. Store manager reported water damage in the back storage area. The issue was first noticed on Monday morning when staff arrived.`,
            likes: 2,
            commentCount: 3,
            isLiked: false
        },
        {
            id: 2,
            author: 'Sarah Johnson',
            role: 'Operations Coordinator',
            date: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Contractor assignment',
            body: `I've assigned this to ${contractorName}. Can you reach out to them and coordinate a site visit? We need to get this addressed quickly as the area is currently taped off.`,
            likes: 1,
            commentCount: 2,
            isLiked: true
        }
    ];
    
    // Sort comments by date to ensure chronological order
    comments.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`Loaded ${comments.length} comments/messages:`, comments);
    
    // Always render comments after loading
    setTimeout(() => {
        renderComments();
    }, 100);
}

// Helper function to get user initials for avatar
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Helper function to format relative time (like "2 hours ago")
function formatRelativeTime(date) {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    // For older posts, show formatted date
    return formatDateTime(date);
}

function renderComments() {
    const container = document.getElementById('commentsList');
    
    if (!container) {
        console.error('commentsList container not found!');
        // Try again after a short delay
        setTimeout(() => {
            const retryContainer = document.getElementById('commentsList');
            if (retryContainer && comments.length > 0) {
                renderComments();
            }
        }, 500);
        return;
    }
    
    console.log('Rendering comments, count:', comments.length, 'container:', container);
    
    if (comments.length === 0) {
        console.warn('No comments to render, showing empty state');
        container.innerHTML = '<div class="empty-state">No posts yet. Share an update!</div>';
        return;
    }

    // Sort comments by date (newest first)
    const sortedComments = [...comments].sort((a, b) => new Date(b.date) - new Date(a.date));

    const html = sortedComments.map(comment => {
        const initials = getInitials(comment.author);
        const typeClass = (comment.type || 'Internal').toLowerCase();
        const likeCount = comment.likes || 0;
        const commentCount = comment.commentCount || 0;
        const isLiked = comment.isLiked || false;
        
        return `
            <div class="chatter-post" data-post-id="${comment.id}" data-comment-type="${comment.type || 'Internal'}">
                <div class="chatter-post-header">
                    <div class="chatter-avatar">${initials}</div>
                    <div class="chatter-post-info">
                        <div class="chatter-post-author">${comment.author}</div>
                        <div class="chatter-post-meta">
                            ${comment.role ? `<span class="chatter-post-role">${comment.role}</span>` : ''}
                            <span class="chatter-post-time">${formatRelativeTime(comment.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="chatter-post-body">
                    ${comment.subject ? `<div class="chatter-post-subject">${comment.subject}</div>` : ''}
                    <div>${escapeHtml(comment.body)}</div>
                </div>
                <div class="chatter-post-actions">
                    <button class="chatter-action ${isLiked ? 'liked' : ''}" data-action="like" data-post-id="${comment.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span class="chatter-action-count">${likeCount}</span>
                    </button>
                    <button class="chatter-action" data-action="comment" data-post-id="${comment.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="chatter-action-count">${commentCount}</span>
                    </button>
                    <button class="chatter-action" data-action="share" data-post-id="${comment.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // Attach event listeners for post actions
    attachPostActionListeners();
    
    console.log(`Successfully rendered ${comments.length} posts`);
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Attach event listeners for post actions (like, comment, share)
function attachPostActionListeners() {
    document.querySelectorAll('.chatter-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const postId = btn.getAttribute('data-post-id');
            
            if (action === 'like') {
                handleLike(postId, btn);
            } else if (action === 'comment') {
                handleComment(postId);
            } else if (action === 'share') {
                handleShare(postId);
            }
        });
    });
}

function handleLike(postId, btn) {
    const comment = comments.find(c => c.id == postId);
    if (comment) {
        comment.isLiked = !comment.isLiked;
        comment.likes = (comment.likes || 0) + (comment.isLiked ? 1 : -1);
        renderComments();
    }
}

function handleComment(postId) {
    // For now, just show a toast - could expand to show comment input
    showToast('Comment functionality coming soon', 'info');
}

function handleShare(postId) {
    showToast('Share functionality coming soon', 'info');
}

function loadFiles() {
    // In a real app, this would fetch from an API
    // For demo, we'll ALWAYS use comprehensive mock data with realistic file names
    console.log('loadFiles called, currentWorkOrder:', currentWorkOrder);
    
    // Always ensure we have a work order ID to use, even if currentWorkOrder is null
    const woId = currentWorkOrder?.id || workOrderId || 'WO-00149331';
    const issue = currentWorkOrder?.issue || 'Ceiling Tiles';
    
    console.log('Loading files with woId:', woId, 'Always loading dummy data');
    
    files = [
        {
            id: 1,
            name: `${woId}_ceiling_damage_overview.jpg`,
            size: 2456789,
            type: 'image/jpeg',
            file: null
        },
        {
            id: 2,
            name: `${woId}_water_damage_detail.jpg`,
            size: 1987654,
            type: 'image/jpeg',
            file: null
        },
        {
            id: 3,
            name: `${woId}_affected_area_closeup.jpg`,
            size: 3123456,
            type: 'image/jpeg',
            file: null
        },
        {
            id: 4,
            name: `ABC_Maintenance_Quote_${woId}.pdf`,
            size: 456789,
            type: 'application/pdf',
            file: null
        },
        {
            id: 5,
            name: `Work_Order_Estimate_${woId}.xlsx`,
            size: 123456,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            file: null
        },
        {
            id: 6,
            name: `Store_Back_Storage_Layout.pdf`,
            size: 987654,
            type: 'application/pdf',
            file: null
        },
        {
            id: 7,
            name: `${woId}_site_visit_video.mp4`,
            size: 12345678,
            type: 'video/mp4',
            file: null
        },
        {
            id: 8,
            name: `Tile_Specifications_2x2_Drop_Ceiling.pdf`,
            size: 654321,
            type: 'application/pdf',
            file: null
        },
        {
            id: 9,
            name: `Safety_Inspection_Report_${woId}.pdf`,
            size: 789012,
            type: 'application/pdf',
            file: null
        },
        {
            id: 10,
            name: `Before_Repair_Photo_1.jpg`,
            size: 2234567,
            type: 'image/jpeg',
            file: null
        },
        {
            id: 11,
            name: `Contractor_Assessment_Notes.docx`,
            size: 345678,
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            file: null
        },
        {
            id: 12,
            name: `Material_Order_Confirmation.pdf`,
            size: 234567,
            type: 'application/pdf',
            file: null
        },
        {
            id: 13,
            name: `Store_Manager_Report_${woId}.pdf`,
            size: 567890,
            type: 'application/pdf',
            file: null
        },
        {
            id: 14,
            name: `Installation_Schedule_${woId}.pdf`,
            size: 123456,
            type: 'application/pdf',
            file: null
        },
        {
            id: 15,
            name: `After_Repair_Photo.jpg`,
            size: 2876543,
            type: 'image/jpeg',
            file: null
        }
    ];
    
    console.log(`Loaded ${files.length} dummy files:`, files);
    
    // Always render files after loading
    setTimeout(() => {
        renderFiles();
    }, 100);
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(fileType, fileName) {
    if (fileType && fileType.startsWith('image/')) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>`;
    } else if (fileType && fileType.startsWith('video/')) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>`;
    } else if (fileName && fileName.endsWith('.pdf')) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>`;
    } else if (fileName && (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || (fileType && fileType.includes('spreadsheetml')))) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
            <line x1="10" y1="13" x2="8" y2="13"></line>
            <line x1="10" y1="17" x2="8" y2="17"></line>
        </svg>`;
    } else if (fileName && (fileName.endsWith('.docx') || fileName.endsWith('.doc') || (fileType && fileType.includes('wordprocessingml')))) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>`;
    } else if (fileName && fileName.endsWith('.pdf') || (fileType && fileType === 'application/pdf')) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>`;
    } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
        </svg>`;
    }
}

function renderFiles() {
    const container = document.getElementById('filesList');
    
    if (!container) {
        console.error('filesList container not found!');
        // Try again after a short delay
        setTimeout(() => {
            const retryContainer = document.getElementById('filesList');
            if (retryContainer && files.length > 0) {
                renderFiles();
            }
        }, 500);
        return;
    }
    
    console.log('Rendering files, count:', files.length, 'container:', container);
    
    if (files.length === 0) {
        console.warn('No files to render, showing empty state');
        container.innerHTML = '<div class="empty-state">No files attached yet.</div>';
        return;
    }

    const html = files.map(file => `
        <div class="file-item" data-file-id="${file.id}">
            <div class="file-icon">
                ${getFileIcon(file.type, file.name)}
            </div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div style="font-size: 0.625rem; color: #706e6b; margin-top: 0.25rem; white-space: nowrap;">${formatFileSize(file.size)}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    console.log(`Successfully rendered ${files.length} files`);
    
    // Use event delegation on the container instead of individual items
    setupFileClickDelegation();
}

function setupFileClickDelegation() {
    const container = document.getElementById('filesList');
    if (!container) {
        console.error('filesList container not found for event delegation');
        return;
    }
    
    // Remove any existing click listeners by removing and re-adding the event listener
    // First, store a reference to avoid memory leaks
    if (container._fileClickHandler) {
        container.removeEventListener('click', container._fileClickHandler, true);
    }
    
    // Create the handler function
    const clickHandler = (e) => {
        // Find the closest file-item ancestor
        const fileItem = e.target.closest('.file-item[data-file-id]');
        if (!fileItem) {
            return; // Click wasn't on a file item
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const fileId = parseInt(fileItem.dataset.fileId);
        const file = files.find(f => f.id === fileId);
        
        console.log('File clicked via delegation:', fileId, file, e.target);
        
        if (file) {
            handleFileClick(file);
        } else {
            console.error('File not found for ID:', fileId);
            showToast('File not found', 'error');
        }
    };
    
    // Store handler reference for cleanup
    container._fileClickHandler = clickHandler;
    
    // Add event listener with capture phase to catch it early
    container.addEventListener('click', clickHandler, true);
    
    // Also try mousedown as backup
    container.addEventListener('mousedown', (e) => {
        const fileItem = e.target.closest('.file-item[data-file-id]');
        if (fileItem) {
            e.preventDefault();
            const fileId = parseInt(fileItem.dataset.fileId);
            const file = files.find(f => f.id === fileId);
            if (file) {
                console.log('File clicked via mousedown:', fileId);
                handleFileClick(file);
            }
        }
    }, true);
    
    console.log('File click delegation set up on container', container);
}

function handleFileClick(file) {
    console.log('handleFileClick called with:', file);
    
    // Show immediate feedback
    showToast(`Opening ${file.name}...`, 'info');
    
    // In a real app, this would open/download the file
    // For demo, we'll show a preview or download simulation
    
    // Check if it's an image
    if (file.type && file.type.startsWith('image/')) {
        // For images, show a modal preview
        showFilePreview(file);
    } else if (file.file) {
        // If it's an actual File object (uploaded), create download link
        const url = URL.createObjectURL(file.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Downloading ${file.name}...`, 'success');
    } else {
        // For demo files, show a message and simulate opening
        console.log('Opening demo file:', file);
        
        // Simulate file opening - in production this would fetch from server
        if (file.type === 'application/pdf') {
            showToast(`PDF viewer would open ${file.name}`, 'info');
        } else if (file.type && file.type.includes('spreadsheet')) {
            showToast(`Spreadsheet viewer would open ${file.name}`, 'info');
        } else if (file.type && file.type.includes('video')) {
            showToast(`Video player would open ${file.name}`, 'info');
        } else {
            showToast(`File viewer would open ${file.name}`, 'info');
        }
    }
}

function showFilePreview(file) {
    // Create a modal to preview images
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90%;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: -40px;
        right: 0;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 2rem;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const img = document.createElement('img');
    if (file.file) {
        img.src = URL.createObjectURL(file.file);
    } else {
        // For demo files, use a placeholder or show message
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjJmMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM3MDZlNmIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==';
    }
    img.style.cssText = `
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 0.25rem;
    `;
    
    const fileName = document.createElement('div');
    fileName.textContent = file.name;
    fileName.style.cssText = `
        color: white;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.875rem;
    `;
    
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
            if (file.file && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        }
    };
    
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on ESC key
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    content.appendChild(closeBtn);
    content.appendChild(img);
    content.appendChild(fileName);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
        const fileObj = {
            id: files.length + 1,
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        };
        files.push(fileObj);
    });
    renderFiles();
    showToast(`${fileList.length} file(s) added successfully`, 'success');
}

// renderSidebarNavigation removed - using top nav instead

// Tab Switching - make it globally accessible
window.switchTab = function(tabName) {
    console.log('Switching to tab:', tabName);
    
    try {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Add active class to selected tab and content
        const selectedTab = document.getElementById(`${tabName}Tab`);
        const selectedContent = document.getElementById(`${tabName}Content`);
        
        console.log('Selected tab element:', selectedTab);
        console.log('Selected content element:', selectedContent);
        
        if (selectedTab && selectedContent) {
            selectedTab.classList.add('active');
            selectedContent.classList.add('active');
            selectedContent.style.display = 'block';
            
            // Force visibility
            selectedContent.style.visibility = 'visible';
            selectedContent.style.opacity = '1';
            
        // If switching to files tab, ensure files are loaded and rendered
        if (tabName === 'files') {
            setTimeout(() => {
                if (files.length === 0) {
                    console.log('No files found, loading files...');
                    loadFiles();
                } else {
                    console.log('Rendering existing files:', files.length);
                    renderFiles();
                }
            }, 50);
        }
        
        // If switching to estimates tab, render estimates table
        if (tabName === 'estimates') {
            setTimeout(() => {
                renderEstimatesTable(workOrderId);
            }, 50);
        }
        
        // If switching to invoices tab, render invoices table
        if (tabName === 'invoices') {
            setTimeout(() => {
                renderInvoicesTable(workOrderId);
            }, 50);
        }
            
            console.log('Tab switched successfully to:', tabName);
        } else {
            console.error(`Tab elements not found for: ${tabName}`, {
                tab: selectedTab,
                content: selectedContent
            });
        }
    } catch (error) {
        console.error('Error switching tab:', error);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, loading work order...');
    
    // ALWAYS load dummy comments and files first, regardless of work order
    console.log('Initial load - always loading dummy data');
    loadComments();
    loadFiles();
    
    // Load work order
    loadWorkOrder();
    
    // Load comments on page load (messages section is always visible)
    setTimeout(() => {
        if (comments.length === 0) {
            console.log('No comments found, loading...');
            loadComments();
        } else {
            console.log('Rendering existing comments');
            renderComments();
        }
    }, 200);
    
    // Initialize store time and weather (use current work order or defaults)
    if (currentWorkOrder) {
        updateStoreTimeAndWeather(currentWorkOrder);
    } else {
        // Use default store location if no work order loaded yet
        updateStoreTimeAndWeather({ state: 'NC', city: 'Winston-Salem' });
    }
    
    // Update time every minute
    setInterval(() => {
        if (currentWorkOrder) {
            updateStoreTimeAndWeather(currentWorkOrder);
        } else {
            updateStoreTimeAndWeather({ state: 'NC', city: 'Winston-Salem' });
        }
    }, 60000); // Update every minute
    
    // Ensure files tab is active by default and render content
    setTimeout(() => {
        switchTab('files');
        // Force render files after a delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Checking files after tab switch');
            console.log('Files count:', files.length);
            
            if (files.length === 0) {
                console.log('No files found, loading...');
                loadFiles();
            } else {
                console.log('Rendering existing files');
                renderFiles();
            }
            
        }, 300);
    }, 200);
    
    // Double-check values are set after a short delay (in case of timing issues)
    setTimeout(() => {
        const classificationEl = document.getElementById('classificationValue');
        const nteValueEl = document.getElementById('nteValue');
        const requestedByEl = document.getElementById('requestedByValue');
        const descriptionEl = document.getElementById('description');
        
        // Force set classification if it's empty or "-"
        if (classificationEl) {
            const currentValue = classificationEl.textContent || classificationEl.innerText || '';
            if (!currentValue || currentValue.trim() === '' || currentValue === '-' || currentValue.trim() === '-') {
                console.log('Classification still empty or showing "-", forcing to General Maintenance. Current:', currentValue);
                classificationEl.textContent = 'General Maintenance';
            }
        }
        
        if (nteValueEl) {
            const currentValue = nteValueEl.textContent || nteValueEl.innerText || '';
            if (!currentValue || currentValue.trim() === '' || currentValue === '-' || currentValue.trim() === '-') {
                console.log('NTE Amount still showing "-" or empty, setting default. Current:', currentValue);
                const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(550.00);
                nteValueEl.textContent = formattedAmount;
                nteValueEl.innerHTML = formattedAmount;
            }
        } else {
            console.error('nteValue element not found in setTimeout!');
        }
        
        if (requestedByEl && (requestedByEl.textContent === '-' || !requestedByEl.textContent || requestedByEl.textContent.trim() === '')) {
            console.log('Requested By still showing "-" or empty, setting default...');
            requestedByEl.textContent = 'Mark Thomas';
        }
        
        if (descriptionEl && (!descriptionEl.value || descriptionEl.value.trim() === '')) {
            console.log('Description still empty, setting default...');
            descriptionEl.value = 'Manager reports needing several ceiling tiles cut and replaced in back of store. The tiles have water damage from a previous leak and need to be removed and replaced with new tiles. Please coordinate with store manager for access to the back storage area.';
        }
    }, 100);

    // Tab switching - multiple approaches for reliability
    // Approach 1: Inline onclick handlers (already added to HTML)
    
    // Approach 2: Event delegation on tabs header
    const tabsHeader = document.querySelector('.tabs-header');
    if (tabsHeader) {
        tabsHeader.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.tab-button');
            if (tabButton) {
                e.preventDefault();
                e.stopPropagation();
                const tabName = tabButton.dataset.tab || tabButton.id.replace('Tab', '');
                console.log('Tab button clicked via delegation:', tabName, tabButton);
                if (tabName && window.switchTab) {
                    window.switchTab(tabName);
                }
            }
        }, true); // Use capture phase
    }
    
    // Approach 3: Direct listeners as backup
    setTimeout(() => {
        const filesTab = document.getElementById('filesTab');
        
        if (filesTab) {
            filesTab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Files tab clicked directly');
                if (window.switchTab) {
                    window.switchTab('files');
                }
            }, true);
        }
    }, 100);

    // Old comment form removed - now using Chatter-style composer (handled below)

    // Chatter post composer handlers
    const chatterPostInput = document.getElementById('chatterPostInput');
    const chatterPostBtn = document.getElementById('chatterPostBtn');
    const chatterCancelBtn = document.getElementById('chatterCancelBtn');
    const chatterFileInput = document.getElementById('chatterFileInput');
    const attachBtn = document.querySelector('.chatter-action-btn[title="Attach file"]');

    if (chatterPostBtn) {
        chatterPostBtn.addEventListener('click', () => {
            const postText = chatterPostInput.value.trim();

            if (!postText) {
                showToast('Please enter a post', 'error');
                return;
            }

            const newPost = {
                id: comments.length + 1,
                author: 'Current User', // In real app, get from auth
                role: 'Purple Corporate Manager', // In real app, get from auth
                date: new Date(),
                type: 'Internal', // Default type for new posts
                body: postText,
                likes: 0,
                commentCount: 0,
                isLiked: false
            };

            comments.push(newPost);
            renderComments();

            // Clear form
            chatterPostInput.value = '';
            if (chatterCancelBtn) chatterCancelBtn.style.display = 'none';
            showToast('Post shared successfully', 'success');
        });
    }

    if (chatterCancelBtn) {
        chatterCancelBtn.addEventListener('click', () => {
            if (chatterPostInput) chatterPostInput.value = '';
            chatterCancelBtn.style.display = 'none';
        });
    }

    if (chatterPostInput) {
        chatterPostInput.addEventListener('input', () => {
            if (chatterPostInput.value.trim() && chatterCancelBtn) {
                chatterCancelBtn.style.display = 'inline-block';
            } else if (chatterCancelBtn) {
                chatterCancelBtn.style.display = 'none';
            }
        });
    }

    if (attachBtn && chatterFileInput) {
        attachBtn.addEventListener('click', () => {
            chatterFileInput.click();
        });

        chatterFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                showToast(`${e.target.files.length} file(s) selected. File attachment coming soon.`, 'info');
            }
        });
    }

    // File upload
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');

    if (fileUploadArea && fileInput) {
        // Click/tap handler for file upload area
        fileUploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking directly on the input
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        // Touch event support for mobile
        fileUploadArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        // Drag and drop handlers (desktop only)
        const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;
        
        if (!isMobile()) {
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '#003366';
                fileUploadArea.style.background = '#fafaf9';
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.style.borderColor = '#dddbda';
                fileUploadArea.style.background = '';
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = '#dddbda';
                fileUploadArea.style.background = '';
                
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

        // Ensure file input is accessible on mobile
        // Make sure it covers the entire upload area on mobile
        if (isMobile()) {
            fileInput.style.position = 'absolute';
            fileInput.style.width = '100%';
            fileInput.style.height = '100%';
            fileInput.style.top = '0';
            fileInput.style.left = '0';
            fileInput.style.opacity = '0';
            fileInput.style.cursor = 'pointer';
        }
    }

    // Event delegation for primary CTA and more actions
    const pageHeaderRight = document.querySelector('.page-header-right');
    if (pageHeaderRight) {
        pageHeaderRight.addEventListener('click', (e) => {
            // Check if clicked element is inside decline button
            const declineBtn = e.target.closest('#declineBtn');
            if (declineBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Decline button clicked via delegation');
                if (window.showDeclineReasonModal) {
                    window.showDeclineReasonModal();
                } else {
                    console.error('showDeclineReasonModal function not found');
                }
                return;
            }
            
            // Check if clicked element is inside dispatch button
            const dispatchBtn = e.target.closest('#dispatchBtn');
            if (dispatchBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('Dispatch this work order?')) {
                    if (currentWorkOrder) {
                        currentWorkOrder.status = 'Dispatched';
                        currentWorkOrder.contractorName = 'KFM247'; // Assign contractor
                        renderWorkOrder();
                        showToast('Work order dispatched successfully!', 'success');
                    }
                }
                return;
            }
            
            // Check for other buttons
            const target = e.target.closest('button');
            if (!target) return;
            
            // Primary CTA button
            if (target.id === 'primaryCtaBtn' || target.closest('#primaryCtaBtn')) {
                const btn = document.getElementById('primaryCtaBtn');
                if (btn) {
                    const action = btn.dataset.action;
                    const data = {
                        estimateId: btn.dataset.estimateId,
                        invoiceId: btn.dataset.invoiceId
                    };
                    handlePrimaryCtaAction(action, data);
                }
            }
            
            // More actions button
            if (target.id === 'moreActionsBtn' || target.closest('#moreActionsBtn')) {
                e.stopPropagation();
                toggleMoreActionsDropdown();
            }
            
            // Edit button
            if (target.id === 'editBtn' || target.closest('#editBtn')) {
                if (currentWorkOrder && currentWorkOrder.normalizedStatus !== 'new') {
                    showToast('Cannot edit work order that has been accepted', 'error');
                    return;
                }
                window.location.href = `index.html?id=${workOrderId}&edit=true`;
            }
        });
    }
    
    // Use event delegation on document level to catch all decline button clicks
    // This works even if buttons are dynamically created or recreated
    document.addEventListener('click', (e) => {
        // Check if clicked element is inside decline button
        const declineBtn = e.target.closest('#declineBtn');
        if (declineBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Decline button clicked via document delegation');
            if (window.showDeclineReasonModal) {
                window.showDeclineReasonModal();
            } else {
                console.error('showDeclineReasonModal function not found');
            }
            return false;
        }
    }, true); // Use capture phase to catch early
    
    // Also attach direct listener when button becomes visible
    const attachDeclineListener = () => {
        const declineBtn = document.getElementById('declineBtn');
        if (declineBtn && !declineBtn.dataset.listenerAttached) {
            declineBtn.dataset.listenerAttached = 'true';
            declineBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Decline button clicked via direct listener');
                if (window.showDeclineReasonModal) {
                    window.showDeclineReasonModal();
                } else {
                    console.error('showDeclineReasonModal function not found');
                }
                return false;
            });
        }
    };
    
    // Try attaching immediately and after delays
    attachDeclineListener();
    setTimeout(attachDeclineListener, 500);
    setTimeout(attachDeclineListener, 1000);
    setTimeout(attachDeclineListener, 2000);
    
    // Also attach when button visibility changes
    const observer = new MutationObserver(() => {
        attachDeclineListener();
    });
    
    setTimeout(() => {
        const declineBtn = document.getElementById('declineBtn');
        if (declineBtn) {
            observer.observe(declineBtn, { attributes: true, attributeFilter: ['style'] });
        }
    }, 500);
    
    // Event delegation for more actions menu items
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.dropdown-menu-item');
        if (menuItem) {
            const action = menuItem.dataset.action;
            const data = {
                estimateId: menuItem.dataset.estimateId,
                invoiceId: menuItem.dataset.invoiceId
            };
            
            if (menuItem.dataset.requiresConfirm === 'true') {
                showInvoiceOverrideModal();
            } else {
                handlePrimaryCtaAction(action, data);
            }
            
            closeMoreActionsDropdown();
        }
    });
    
    // Close more actions dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('moreActionsDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            closeMoreActionsDropdown();
        }
    });
    

    // Save subject on blur
    document.getElementById('subject').addEventListener('blur', (e) => {
        if (currentWorkOrder && e.target.value) {
            currentWorkOrder.subject = e.target.value;
        }
    });
});

