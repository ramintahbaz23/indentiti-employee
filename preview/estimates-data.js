// Sample Estimates Data (mapped from CPQ Quote + Work Order) - Simplified to only reference the 5 work orders
const estimatesData = [
    {
        id: 'EST-001',
        workOrderNumber: 'WO-00149331',
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        estimationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        brand: 'Purple',
        total: 500.00,
        taxAmount: 40.00,
        grandTotal: 540.00,
        status: 'Pending',
        comment: 'Awaiting approval',
        hasPdf: true
    },
    {
        id: 'EST-002',
        workOrderNumber: 'WO-00150125',
        created: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        estimationDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        brand: 'Purple',
        total: 410.00,
        taxAmount: 32.80,
        grandTotal: 442.80,
        status: 'Approved',
        approvedBy: 'Mark Johnson',
        comment: 'Approved',
        hasPdf: true
    },
    {
        id: 'EST-003',
        workOrderNumber: 'WO-00150298',
        created: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        estimationDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        brand: 'Purple',
        total: 1090.00,
        taxAmount: 87.20,
        grandTotal: 1177.20,
        status: 'Approved',
        approvedBy: 'John Smith',
        comment: 'Approved',
        hasPdf: true
    },
    {
        id: 'EST-004',
        workOrderNumber: 'WO-00149887',
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estimationDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
        brand: 'Purple',
        total: 2450.00,
        taxAmount: 196.00,
        grandTotal: 2646.00,
        status: 'Pending',
        comment: 'Awaiting approval',
        hasPdf: true
    },
    {
        id: 'EST-005',
        workOrderNumber: 'WO-00150438',
        created: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        estimationDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        brand: 'Purple',
        total: 4550.00,
        taxAmount: 364.00,
        grandTotal: 4914.00,
        status: 'Pending',
        comment: 'Awaiting approval',
        hasPdf: true
    }
];
