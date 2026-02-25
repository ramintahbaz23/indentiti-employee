// Sample Work Order Data - Simplified to 1 work order per status bucket
const workOrdersData = [
    // 1. New
    {
        id: 'WO-00149331',
        status: 'New',
        priority: 'Critical',
        trade: 'Plumbing',
        issue: 'Toilet Repair - Emergency',
        storeName: 'Warhammer - Rancho Vista #0407',
        city: 'Cerritos',
        state: 'CA',
        storeMall: 'Rancho Vista Shopping Center',
        storeEmail: 'store0407@warhammer.com',
        nteAmount: 550.00,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    // 2. In Progress
    {
        id: 'WO-00150125',
        status: 'On-site/In Progress',
        priority: 'Medium',
        trade: 'Janitorial/Cleaning Services',
        issue: 'Window Cleaning - Quarterly',
        storeName: 'Purple Store #0982',
        city: 'Irvine',
        state: 'CA',
        storeMall: 'Irvine Spectrum Center',
        storeEmail: 'store0982@purple.com',
        nteAmount: 450.00,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    // 3. Action Needed
    {
        id: 'WO-00150298',
        status: 'New',
        priority: 'Critical',
        trade: 'Electrical',
        issue: 'Power Outage Investigation',
        storeName: 'Purple Store #2105',
        city: 'Portland',
        state: 'OR',
        nteAmount: 1200.00,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isOverdue: true,
        daysOverdue: 1
    },
    // 4. Awaiting Approval
    {
        id: 'WO-00149887',
        status: 'Proposal Pending Approval',
        priority: 'Medium',
        trade: 'Lighting',
        issue: 'Interior Lighting Upgrade',
        storeName: 'Purple Store #0484',
        city: 'Bakersfield',
        state: 'CA',
        nteAmount: 2450.00,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    // 5. Awaiting Estimate
    {
        id: 'WO-00150438',
        status: 'Awaiting Estimate',
        priority: 'Medium',
        trade: 'Fire Services',
        issue: 'Sprinkler System Installation',
        storeName: 'Purple Store #3201',
        city: 'Miami',
        state: 'FL',
        nteAmount: 5000.00,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    // Additional work orders for store history (Warhammer - Central Avenue #0215)
    {
        id: 'WO-00150466',
        status: 'Completed',
        priority: 'Medium',
        trade: 'Locks / Safes / Security',
        issue: 'Door Locks',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 980.00,
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00150321',
        status: 'Completed',
        priority: 'Low',
        trade: 'Janitorial/Cleaning Services',
        issue: 'Cleaning - PM',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 963.13,
        dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00150245',
        status: 'Completed',
        priority: 'Medium',
        trade: 'General Maintenance',
        issue: 'Ceiling Tiles',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 550.00,
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00150189',
        status: 'Completed',
        priority: 'High',
        trade: 'Lighting',
        issue: 'Interior Lighting',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 1200.00,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00150134',
        status: 'Completed',
        priority: 'Medium',
        trade: 'Doors',
        issue: 'Door Repair',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 750.00,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00150087',
        status: 'Awaiting AR',
        priority: 'Medium',
        trade: 'Remediation',
        issue: 'Water/sewer Extraction',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 2500.00,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00150012',
        status: 'On-site/In Progress',
        priority: 'High',
        trade: 'Windows',
        issue: 'Window Replacement',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 1800.00,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isOverdue: false
    },
    {
        id: 'WO-00149956',
        status: 'New',
        priority: 'Critical',
        trade: 'Electrical',
        issue: 'Electrical Panel Inspection',
        storeName: 'Warhammer - Central Avenue #0215',
        city: 'Glendale',
        state: 'CA',
        nteAmount: 950.00,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isOverdue: false
    }
];



// Sample Invoice Data - Simplified to only reference the 5 work orders
const invoicesData = [
    {
        id: 'INV-001',
        ticketNumber: 'WO-00150125',
        created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        trackingNumber: 'TRK-12347',
        invoiceDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        invoiceNumber: 'INV-2024-003',
        brand: 'Purple',
        total: 450.00,
        taxAmount: 36.00,
        grandTotal: 486.00,
        paidAmount: 486.00,
        checkAch: 'ACH-4567',
        paidDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: 'Paid',
        statusYesNo: 'Yes',
        comment: 'ACH payment processed',
        hasPdf: true
    }
];
