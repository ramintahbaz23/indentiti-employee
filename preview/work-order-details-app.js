// Get work order ID from URL
const urlParams = new URLSearchParams(window.location.search);
const workOrderId = urlParams.get('id');

let currentWorkOrder = null;
let comments = [];
let files = [];

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
    const state = wo.state || 'NC';
    const city = wo.city || 'Winston-Salem';
    const timezone = getTimezoneForState(state);
    
    // Get current time in store's timezone with dummy data fallback
    try {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true,
            timeZone: timezone
        });
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            timeZone: timezone
        });
        
        // Get timezone abbreviation
        const tzAbbr = getTimezoneAbbreviation(state);
        document.getElementById('storeLocalTime').textContent = `${dateString} ${timeString} ${tzAbbr}`;
    } catch (e) {
        // Fallback dummy data
        document.getElementById('storeLocalTime').textContent = 'Mon, Feb 5, 1:33 AM EST';
    }
    
    // Mock weather data (in production, call weather API)
    const weatherData = getMockWeather(city, state);
    document.getElementById('storeWeather').textContent = weatherData.condition;
    document.getElementById('weatherIcon').textContent = weatherData.icon;
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
    
    // Add to recent work orders
    addToRecentWorkOrders(wo.id, wo.issue || wo.id);
    
    // Render sidebar navigation
    renderSidebarNavigation();
    
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
    document.getElementById('statusBadge').innerHTML = `<span class="status-badge status-${statusClass}">${wo.status || 'New'}</span>`;
    
    // Key information displays
    document.getElementById('statusValueDisplay').textContent = wo.status || 'New';
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
    
    // Store local time and weather
    updateStoreTimeAndWeather(wo);
    
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
            date: new Date(baseDate),
            type: 'Internal',
            subject: 'Work order created',
            body: `Work order ${woId} has been created for ${issue}. Store manager reported water damage in the back storage area. The issue was first noticed on Monday morning when staff arrived.`
        },
        {
            id: 2,
            author: 'Sarah Johnson',
            date: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Contractor assignment',
            body: `I've assigned this to ${contractorName}. Can you reach out to them and coordinate a site visit? We need to get this addressed quickly as the area is currently taped off.`
        },
        {
            id: 3,
            author: 'Mark Thomas',
            date: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Re: Contractor assignment',
            body: `Will do. I'll contact them first thing tomorrow morning. Do we have a preferred time window for the site visit?`
        },
        {
            id: 4,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Site visit scheduled',
            body: `Hi Mark, we've scheduled a site visit for ${formatDate(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000))} at 10:00 AM. Our technician Mike will be on-site to assess the damage. Can someone from the store be available to provide access to the back storage area?`
        },
        {
            id: 5,
            author: 'John Smith',
            date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            type: 'Customer',
            subject: 'Re: Site visit scheduled',
            body: `Yes, I'll be here on ${formatDate(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000))} at 10 AM. The back storage area is accessible through the employee entrance. I'll make sure the area is clear for your technician.`
        },
        {
            id: 6,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Site visit completed',
            body: `Site visit completed. We've assessed the damage - approximately 12 ceiling tiles need replacement due to water damage. The tiles are standard 2x2 drop ceiling tiles. We'll need to order matching tiles which may take 3-5 business days. I've taken photos of the damaged area.`
        },
        {
            id: 7,
            author: 'Mark Thomas',
            date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Re: Site visit completed',
            body: `Thanks for the update. Can you provide a quote for the replacement? We have an NTE of $550.00 for this work order.`
        },
        {
            id: 8,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Quote provided',
            body: `Here's the breakdown:\n- 12 replacement tiles: $180.00\n- Labor (2-3 hours): $300.00\n- Materials and supplies: $70.00\n\nTotal: $550.00\n\nThis is within your NTE amount. Once approved, we'll order the tiles and schedule installation.`
        },
        {
            id: 9,
            author: 'Sarah Johnson',
            date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Re: Quote provided',
            body: `The quote looks good and is within budget. Mark, can you approve this so we can move forward?`
        },
        {
            id: 10,
            author: 'Mark Thomas',
            date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Approved',
            body: `Approved. Please proceed with ordering materials and scheduling installation.`
        },
        {
            id: 11,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Materials ordered',
            body: `Materials have been ordered and should arrive by ${formatDate(new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000))}. Once we receive confirmation of delivery, we'll schedule the installation. Estimated installation time is 2-3 hours. We'll coordinate with John at the store for the best time.`
        },
        {
            id: 12,
            author: 'John Smith',
            date: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
            type: 'Customer',
            subject: 'Question about timeline',
            body: `Just checking in - any update on when the materials will arrive? The taped-off area is starting to impact our storage operations.`
        },
        {
            id: 13,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Re: Question about timeline',
            body: `Hi John, we're tracking the shipment and it's scheduled to arrive on ${formatDate(new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000))}. We can schedule installation for the following day if that works for you. What time would be best?`
        },
        {
            id: 14,
            author: 'John Smith',
            date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            type: 'Customer',
            subject: 'Re: Question about timeline',
            body: `Morning would be best, around 9 AM if possible. That way we can have everything ready and the area cleared before we get busy.`
        },
        {
            id: 15,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Installation scheduled',
            body: `Perfect! We've scheduled installation for ${formatDate(new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000))} at 9:00 AM. Our technician Mike will be on-site. Please ensure the area is accessible. We'll send a reminder the day before.`
        },
        {
            id: 16,
            author: 'Mark Thomas',
            date: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Status update',
            body: `Just wanted to confirm everything is on track. Materials should arrive today and installation is scheduled for tomorrow. John, please confirm once the work is completed so we can close out this work order.`
        },
        {
            id: 17,
            author: 'John Smith',
            date: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
            type: 'Customer',
            subject: 'Re: Status update',
            body: `Will do, Mark. I'll be here tomorrow morning to let Mike in and will send confirmation photos once the work is complete.`
        },
        {
            id: 18,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Materials received',
            body: `Great news - materials arrived today as expected. Everything looks good and matches the specifications. We're all set for tomorrow's installation at 9 AM. Mike will arrive with all necessary tools and materials.`
        },
        {
            id: 19,
            author: 'Mark Thomas',
            date: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Re: Materials received',
            body: `Excellent! Thanks for the update. Looking forward to getting this resolved.`
        },
        {
            id: 20,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Installation in progress',
            body: `Mike has arrived on-site and has begun the installation. He's removed the damaged tiles and is preparing the area for new tiles. Estimated completion time is around 11:30 AM.`
        },
        {
            id: 21,
            author: 'John Smith',
            date: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            type: 'Customer',
            subject: 'Re: Installation in progress',
            body: `Thanks for the update. Mike is doing great work. The area looks much better already.`
        },
        {
            id: 22,
            author: 'ABC Maintenance Services',
            date: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            type: 'Vendor',
            subject: 'Installation completed',
            body: `Installation has been completed successfully! All 12 tiles have been replaced and the area has been cleaned up. Mike has taken photos of the completed work. The area is now safe to use. Please let us know if you need anything else.`
        },
        {
            id: 23,
            author: 'John Smith',
            date: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 30 * 60 * 1000),
            type: 'Customer',
            subject: 'Re: Installation completed',
            body: `Perfect! The work looks excellent. I've removed the tape and we're back to normal operations. Thanks to Mike for the great work and quick turnaround.`
        },
        {
            id: 24,
            author: 'Mark Thomas',
            date: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
            type: 'Internal',
            subject: 'Work order completion',
            body: `Great to hear everything went smoothly! I'll process the invoice and close out this work order. Thanks everyone for the coordination.`
        },
        {
            id: 25,
            author: 'Sarah Johnson',
            date: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000),
            type: 'Internal',
            subject: 'Re: Work order completion',
            body: `Excellent work everyone! This was handled very efficiently. The store manager is happy with the results.`
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
        container.innerHTML = '<div class="empty-state">No comments yet. Be the first to comment!</div>';
        return;
    }

    const html = comments.map(comment => `
        <div class="comment-item" data-comment-type="${comment.type}">
            <div class="comment-header">
                <div>
                    <span class="comment-type">${comment.type}</span>
                    <div class="comment-author">${comment.author}</div>
                </div>
                <div class="comment-date">${formatDateTime(comment.date)}</div>
            </div>
            ${comment.subject ? `<div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; color: #181818;">${comment.subject}</div>` : ''}
            <div class="comment-body">${comment.body}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    console.log(`Successfully rendered ${comments.length} comments`);
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
            <div style="font-size: 0.75rem; color: #706e6b; margin-top: 0.25rem;">${formatFileSize(file.size)}</div>
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

function renderSidebarNavigation() {
    const container = document.getElementById('workOrderChildren');
    if (!container) return;
    
    // Ensure Work Orders parent is active and expanded
    const workOrdersParent = document.querySelector('.nav-item-parent.has-children');
    if (workOrdersParent) {
        workOrdersParent.classList.add('active');
    }
    
    const recent = getRecentWorkOrders();
    // Filter out current work order from recent
    const recentFiltered = recent.filter(wo => wo.id !== workOrderId);
    
    let html = '';
    
    // Current work order (always shown first and marked as active)
    if (currentWorkOrder && workOrderId) {
        html += `
            <a href="work-order-details.html?id=${currentWorkOrder.id}" class="nav-item-child active">
                ${currentWorkOrder.id}
            </a>
        `;
    }
    
    // Recent work orders
    if (recentFiltered.length > 0) {
        html += `<div class="recent-work-orders-label">Recently Viewed</div>`;
        recentFiltered.slice(0, 5).forEach(wo => {
            html += `
                <a href="work-order-details.html?id=${wo.id}" class="nav-item-child">
                    ${wo.id}
                </a>
            `;
        });
    }
    
    container.innerHTML = html;
    
    // Ensure children are visible when parent is active
    if (workOrdersParent && workOrdersParent.classList.contains('active')) {
        container.style.display = 'flex';
    }
}

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
        
        // If switching to messages tab, ensure comments are loaded and rendered
        if (tabName === 'messages') {
            setTimeout(() => {
                if (comments.length === 0) {
                    console.log('No comments found, loading comments...');
                    loadComments();
                } else {
                    console.log('Rendering existing comments:', comments.length);
                    renderComments();
                }
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
    
    // Ensure messages tab is active by default and render content
    setTimeout(() => {
        switchTab('messages');
        // Force render comments and files after a delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Checking comments and files after tab switch');
            console.log('Comments count:', comments.length);
            console.log('Files count:', files.length);
            
            if (comments.length === 0) {
                console.log('No comments found, loading...');
                loadComments();
            } else {
                console.log('Rendering existing comments');
                renderComments();
            }
            
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
        const messagesTab = document.getElementById('messagesTab');
        const filesTab = document.getElementById('filesTab');
        
        if (messagesTab) {
            messagesTab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Messages tab clicked directly');
                if (window.switchTab) {
                    window.switchTab('messages');
                }
            }, true);
        }
        
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

    // Add comment
    document.getElementById('addCommentBtn').addEventListener('click', () => {
        const type = document.getElementById('commentType').value;
        const subject = document.getElementById('commentSubject').value;
        const body = document.getElementById('commentBody').value;

        if (!body.trim()) {
            showToast('Please enter a comment', 'error');
            return;
        }

        const newComment = {
            id: comments.length + 1,
            author: 'Current User', // In real app, get from auth
            date: new Date(),
            type: type,
            subject: subject,
            body: body
        };

        comments.push(newComment);
        renderComments();

        // Clear form
        document.getElementById('commentSubject').value = '';
        document.getElementById('commentBody').value = '';
        
        showToast('Comment added successfully', 'success');
    });

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

    // Edit button - navigate back to main page with edit mode
    document.getElementById('editBtn').addEventListener('click', () => {
        window.location.href = `index.html?id=${workOrderId}&edit=true`;
    });

    // Dispatch button
    document.getElementById('dispatchBtn').addEventListener('click', () => {
        if (confirm('Dispatch this work order to KFM247?')) {
            // In real app, make API call
            showToast('Work order dispatched successfully!', 'success');
            // Update status
            if (currentWorkOrder) {
                currentWorkOrder.status = 'Dispatched';
                renderWorkOrder();
            }
        }
    });

    // Decline button
    document.getElementById('declineBtn').addEventListener('click', () => {
        const reason = prompt('Please provide a reason for declining:');
        if (reason) {
            // In real app, make API call
            if (currentWorkOrder) {
                currentWorkOrder.rejectionReason = reason;
                currentWorkOrder.status = 'Declined';
                renderWorkOrder();
            }
            showToast('Work order declined.', 'success');
        }
    });

    // Save subject on blur
    document.getElementById('subject').addEventListener('blur', (e) => {
        if (currentWorkOrder && e.target.value) {
            currentWorkOrder.subject = e.target.value;
        }
    });
});

