// Sample Data Script for Work Order Dashboard
// Run this in Anonymous Apex (Developer Console > Debug > Open Execute Anonymous Window)
// This will create sample work orders with various statuses, priorities, and trades

List<Work_Order__c> workOrders = new List<Work_Order__c>();

// Past Due - Critical Priority
workOrders.add(new Work_Order__c(
    Status__c = 'New',
    Priority__c = 'Critical',
    Trade__c = 'Plumbing',
    Issue__c = 'Toilet Repair - Emergency',
    Store_Name__c = 'Warhammer - Rancho Vista #0407',
    City__c = 'Cerritos',
    State__c = 'CA',
    NTE_Amount__c = 550.00,
    Due_Date__c = Date.today().addDays(-3),
    CreatedDate = DateTime.now().addDays(-5)
));

// Past Due - High Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Assigned',
    Priority__c = 'High',
    Trade__c = 'HVAC-R',
    Issue__c = 'AC Unit Not Cooling',
    Store_Name__c = 'Purple Store #2847',
    City__c = 'Austin',
    State__c = 'TX',
    NTE_Amount__c = 1200.00,
    Due_Date__c = Date.today().addDays(-2),
    CreatedDate = DateTime.now().addDays(-4)
));

// Need Assignment - Medium Priority
workOrders.add(new Work_Order__c(
    Status__c = 'New',
    Priority__c = 'Medium',
    Trade__c = 'Pest Control',
    Issue__c = 'Pest Control Prevention',
    Store_Name__c = 'Purple Store #3118',
    City__c = 'San Marcos',
    State__c = 'TX',
    NTE_Amount__c = 275.00,
    Due_Date__c = Date.today().addDays(7),
    CreatedDate = DateTime.now().addDays(-2)
));

// Need Assignment - High Priority
workOrders.add(new Work_Order__c(
    Status__c = 'New',
    Priority__c = 'High',
    Trade__c = 'Electrical',
    Issue__c = 'Electrical Panel Inspection',
    Store_Name__c = 'Purple Store #1432',
    City__c = 'Columbus',
    State__c = 'OH',
    NTE_Amount__c = 850.00,
    Due_Date__c = Date.today().addDays(3),
    CreatedDate = DateTime.now().addDays(-1)
));

// In Progress - Medium Priority
workOrders.add(new Work_Order__c(
    Status__c = 'On-site/In Progress',
    Priority__c = 'Medium',
    Trade__c = 'Janitorial/Cleaning Services',
    Issue__c = 'Window Cleaning - Quarterly',
    Store_Name__c = 'Purple Store #0982',
    City__c = 'Irvine',
    State__c = 'CA',
    NTE_Amount__c = 450.00,
    Due_Date__c = Date.today().addDays(2),
    CreatedDate = DateTime.now().addDays(-3)
));

// In Progress - High Priority
workOrders.add(new Work_Order__c(
    Status__c = 'On-site/In Progress',
    Priority__c = 'High',
    Trade__c = 'Fire Services',
    Issue__c = 'Fire Alarm System Repair',
    Store_Name__c = 'Purple Store #2001',
    City__c = 'Phoenix',
    State__c = 'AZ',
    NTE_Amount__c = 950.00,
    Due_Date__c = Date.today().addDays(1),
    CreatedDate = DateTime.now().addDays(-2)
));

// Scheduled - High Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Scheduled',
    Priority__c = 'High',
    Trade__c = 'Fire Services',
    Issue__c = 'Fire Extinguisher Inspection',
    Store_Name__c = 'Purple Store #1432',
    City__c = 'Columbus',
    State__c = 'OH',
    NTE_Amount__c = 320.00,
    Scheduled_Date__c = DateTime.now().addDays(5).addHours(9),
    Due_Date__c = Date.today().addDays(5),
    CreatedDate = DateTime.now().addDays(-10)
));

// Scheduled - Medium Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Scheduled',
    Priority__c = 'Medium',
    Trade__c = 'HVAC-R',
    Issue__c = 'HVAC Preventative Maintenance',
    Store_Name__c = 'Purple Store #2847',
    City__c = 'Austin',
    State__c = 'TX',
    NTE_Amount__c = 650.00,
    Scheduled_Date__c = DateTime.now().addDays(3).addHours(14),
    Due_Date__c = Date.today().addDays(3),
    CreatedDate = DateTime.now().addDays(-7)
));

// Completed This Week - Low Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Work Complete',
    Priority__c = 'Low',
    Trade__c = 'Locks/Safes/Security',
    Issue__c = 'Door Lock Replacement',
    Store_Name__c = 'Purple Store #1209',
    City__c = 'Farmington',
    State__c = 'UT',
    NTE_Amount__c = 420.00,
    Invoice_Amount__c = 420.00,
    Completed_Date__c = Date.today().addDays(-2),
    Due_Date__c = Date.today().addDays(-3),
    CreatedDate = DateTime.now().addDays(-10)
));

// Completed This Week - Medium Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Work Complete',
    Priority__c = 'Medium',
    Trade__c = 'Plumbing',
    Issue__c = 'Sink Faucet Replacement',
    Store_Name__c = 'Purple Store #0521',
    City__c = 'Denver',
    State__c = 'CO',
    NTE_Amount__c = 380.00,
    Invoice_Amount__c = 375.00,
    Completed_Date__c = Date.today().addDays(-1),
    Due_Date__c = Date.today().addDays(-2),
    CreatedDate = DateTime.now().addDays(-8)
));

// Completed This Week - High Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Work Complete',
    Priority__c = 'High',
    Trade__c = 'Electrical',
    Issue__c = 'Lighting Fixture Installation',
    Store_Name__c = 'Purple Store #1892',
    City__c = 'Seattle',
    State__c = 'WA',
    NTE_Amount__c = 1250.00,
    Invoice_Amount__c = 1245.00,
    Completed_Date__c = Date.today(),
    Due_Date__c = Date.today().addDays(-1),
    CreatedDate = DateTime.now().addDays(-5)
));

// Proposal Submitted - Medium Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Proposal Submitted',
    Priority__c = 'Medium',
    Trade__c = 'Lighting',
    Issue__c = 'Interior Lighting Upgrade',
    Store_Name__c = 'Purple Store #0484',
    City__c = 'Bakersfield',
    State__c = 'CA',
    NTE_Amount__c = 2450.00,
    Due_Date__c = Date.today().addDays(14),
    CreatedDate = DateTime.now().addDays(-5)
));

// Proposal Pending Approval - High Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Proposal Pending Approval',
    Priority__c = 'High',
    Trade__c = 'HVAC-R',
    Issue__c = 'Complete HVAC System Replacement',
    Store_Name__c = 'Purple Store #3201',
    City__c = 'Miami',
    State__c = 'FL',
    NTE_Amount__c = 15000.00,
    Due_Date__c = Date.today().addDays(30),
    CreatedDate = DateTime.now().addDays(-7)
));

// Invoice Submitted - Low Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Invoice Submitted',
    Priority__c = 'Low',
    Trade__c = 'General Maintenance',
    Issue__c = 'Monthly Maintenance Check',
    Store_Name__c = 'Purple Store #2105',
    City__c = 'Portland',
    State__c = 'OR',
    NTE_Amount__c = 500.00,
    Invoice_Amount__c = 495.00,
    Completed_Date__c = Date.today().addDays(-3),
    Due_Date__c = Date.today().addDays(-4),
    CreatedDate = DateTime.now().addDays(-12)
));

// Assigned - Critical Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Assigned',
    Priority__c = 'Critical',
    Trade__c = 'Plumbing',
    Issue__c = 'Water Leak - Urgent',
    Store_Name__c = 'Purple Store #1503',
    City__c = 'Las Vegas',
    State__c = 'NV',
    NTE_Amount__c = 800.00,
    Due_Date__c = Date.today(),
    CreatedDate = DateTime.now().addHours(-2)
));

// Assigned - Medium Priority
workOrders.add(new Work_Order__c(
    Status__c = 'Assigned',
    Priority__c = 'Medium',
    Trade__c = 'Locks/Safes/Security',
    Issue__c = 'Security System Update',
    Store_Name__c = 'Purple Store #2756',
    City__c = 'Atlanta',
    State__c = 'GA',
    NTE_Amount__c = 1100.00,
    Due_Date__c = Date.today().addDays(5),
    CreatedDate = DateTime.now().addDays(-1)
));

try {
    insert workOrders;
    System.debug('Successfully inserted ' + workOrders.size() + ' work orders');
} catch (Exception e) {
    System.debug('Error inserting work orders: ' + e.getMessage());
}



