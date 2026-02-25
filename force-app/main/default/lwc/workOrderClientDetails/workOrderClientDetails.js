import { LightningElement } from 'lwc';

export default class WorkOrderClientDetails extends LightningElement {
    get client() {
        return {
            clientName: 'Warhammer Inc.',
            contactName: 'Sarah Johnson',
            phone: '+1 743-643-4182',
            email: 'client@warhammer.com',
            accountType: 'Retail Chain',
            portalAccess: 'Active'
        };
    }
}
