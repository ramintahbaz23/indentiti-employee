# Work Order Dashboard - Salesforce LWC Project

A comprehensive Lightning Web Component dashboard for managing work orders in Salesforce.

## Project Structure

```
force-app/
└── main/
    └── default/
        ├── classes/
        │   ├── WorkOrderDashboardController.cls
        │   └── WorkOrderDashboardController.cls-meta.xml
        ├── lwc/
        │   ├── dashboardContainer/     (Main parent component)
        │   ├── metricCard/             (Metric display cards)
        │   ├── filterBar/              (Filter controls)
        │   ├── workOrderCard/         (Individual work order card)
        │   └── workOrderGrid/         (Grid layout for work orders)
        └── objects/
            └── Work_Order__c/
                ├── Work_Order__c.object-meta.xml
                └── fields/             (All field metadata files)
```

## Features

### Components

1. **dashboardContainer** - Main parent component that:
   - Manages state for all filters, metrics, and work orders
   - Handles data fetching from Salesforce (Apex controller)
   - Passes data down to child components
   - Contains page header with "New Work Order" button

2. **metricCard** - Reusable metric display component:
   - Displays label, value, and sublabel
   - Supports variants: critical, warning, info, success
   - Emits click events to filter work orders
   - Color-coded left border accent

3. **filterBar** - Filter controls component:
   - Status dropdown filter
   - Priority dropdown filter
   - Trade dropdown filter
   - Date range dropdown filter
   - Quick filter pills (toggle active state)
   - Emits filter change events

4. **workOrderCard** - Individual work order display:
   - Shows work order number, status, title, priority, classification
   - Displays location, store, dates, amounts, contractor
   - Priority color coding and overdue warnings
   - Context-aware action buttons based on status
   - Emits action button clicks

5. **workOrderGrid** - Grid layout component:
   - Renders grid of workOrderCard components
   - Handles empty state
   - Shows loading spinner while fetching data

### Apex Controller

**WorkOrderDashboardController** provides:
- `getMetricCounts()` - Returns counts for:
  - Past Due work orders
  - Need Assignment (New without contractor)
  - In Progress work orders
  - Completed This Week
- `getWorkOrders(filters)` - Returns filtered list of work orders
- `getFilterOptions()` - Returns available statuses, priorities, trades for dropdowns

### Custom Object: Work_Order__c

**Fields:**
- `Work_Order_Number__c` (Auto-Number: WO-{00000000})
- `Status__c` (Picklist)
- `Priority__c` (Picklist: Critical, High, Medium, Low)
- `Trade__c` (Picklist)
- `Issue__c` (Text 255)
- `Store_Name__c` (Text 255)
- `City__c` (Text 100)
- `State__c` (Text 2)
- `NTE_Amount__c` (Currency)
- `Scheduled_Date__c` (DateTime)
- `Contractor_Name__c` (Text 255)
- `Completed_Date__c` (Date)
- `Invoice_Amount__c` (Currency)
- `Due_Date__c` (Date)
- `Is_Overdue__c` (Formula Checkbox)
- `Days_Overdue__c` (Formula Number)

## Deployment Instructions

1. **Deploy to Salesforce:**
   ```bash
   sfdx force:source:deploy -p force-app
   ```

2. **Create Sample Data:**
   - Open Developer Console
   - Go to Debug > Open Execute Anonymous Window
   - Copy and paste the contents of `scripts/insertSampleWorkOrders.apex`
   - Execute the script

3. **Add Component to Page:**
   - Navigate to Setup > Lightning App Builder
   - Create a new App Page or edit an existing Home Page
   - Add the `dashboardContainer` component
   - Save and activate

## Usage

### Filtering Work Orders

- **Metric Cards**: Click any metric card to filter work orders by that metric
- **Dropdown Filters**: Use Status, Priority, Trade, or Date Range dropdowns
- **Quick Filters**: Click quick filter pills to toggle active filters

### Work Order Actions

Action buttons on work order cards vary by status:
- **New**: Assign, View Details
- **Scheduled**: Reschedule, View Details
- **On-site/In Progress**: Check Status, View Details
- **Dispatched**: Track, View Details
- **Work Complete**: View Invoice, View Details
- **Proposal Submitted/Pending**: Approve, Review Quote, View Details

## Styling

The components use Salesforce Lightning Design System (SLDS) and match the visual design from the original HTML:
- Color-coded priorities (Critical: Red, High: Orange, Medium: Yellow, Low: Gray)
- Status badges with appropriate colors
- Hover effects and animations
- Mobile responsive design
- Accessibility features (ARIA labels, keyboard navigation)

## Future Enhancements

- [ ] Wire up "New Work Order" button to create modal/page
- [ ] Implement action button handlers (Assign, Reschedule, etc.)
- [ ] Add navigation to work order detail pages
- [ ] Add search functionality
- [ ] Add pagination for large result sets
- [ ] Add export functionality
- [ ] Add real-time updates using Platform Events

## Support

For issues or questions, please contact your Salesforce administrator.



