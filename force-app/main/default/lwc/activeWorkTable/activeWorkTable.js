import { LightningElement, track } from 'lwc';

export default class ActiveWorkTable extends LightningElement {
    @track workOrders = [
        { id: '1', workOrderNumber: 'WO-00000001', status: 'Open', priority: 'Critical', mall: 'Westfield Mall', media: 'Missing', mediaStatus: 'bad', quoteStatus: 'Draft', quoteClass: 'amber', escalation: true, slaAge: '0d', slaClass: 'red', lastUpdated: 'Feb 24, 05:00 AM' },
        { id: '2', workOrderNumber: 'WO-00000002', status: 'In Progress', priority: 'High', mall: 'Galleria', media: 'Complete (8)', mediaStatus: 'ok', quoteStatus: 'Submitted', quoteClass: 'amber', escalation: true, slaAge: '2d', slaClass: 'amber', lastUpdated: 'Feb 23, 09:30 AM' },
        { id: '3', workOrderNumber: 'WO-00000003', status: 'Scheduled', priority: 'Medium', mall: 'Westfield Mall', media: 'Missing', mediaStatus: 'bad', quoteStatus: 'Approved', quoteClass: 'green', escalation: false, slaAge: '5d', slaClass: 'neutral', lastUpdated: 'Feb 22, 04:00 AM' },
        { id: '4', workOrderNumber: 'WO-00000004', status: 'Pending', priority: 'High', mall: 'Plaza Center', media: 'Complete (3)', mediaStatus: 'ok', quoteStatus: 'Draft', quoteClass: 'amber', escalation: false, slaAge: '1d', slaClass: 'amber', lastUpdated: 'Feb 24, 03:00 AM' },
        { id: '5', workOrderNumber: 'WO-00000005', status: 'On Hold', priority: 'Low', mall: 'Galleria', media: 'Complete (6)', mediaStatus: 'ok', quoteStatus: 'Sent', quoteClass: 'green', escalation: false, slaAge: '3d', slaClass: 'neutral', lastUpdated: 'Feb 21, 11:00 AM' },
        { id: '6', workOrderNumber: 'WO-00000006', status: 'Open', priority: 'Critical', mall: 'Westfield Mall', media: 'Missing', mediaStatus: 'bad', quoteStatus: 'Pending Review', quoteClass: 'amber', escalation: false, slaAge: '0d', slaClass: 'red', lastUpdated: 'Feb 24, 06:00 AM' }
    ];

    get workOrdersWithClasses() {
        return (this.workOrders || []).map(row => ({
            ...row,
            mediaClass: row.mediaStatus === 'bad' ? 'media-bad' : 'media-ok',
            quoteCssClass: row.quoteClass === 'amber' ? 'category-amber' : (row.quoteClass === 'green' ? 'quote-green' : ''),
            slaCssClass: row.slaClass === 'red' ? 'sla-red' : (row.slaClass === 'amber' ? 'sla-amber' : 'sla-neutral')
        }));
    }
}
