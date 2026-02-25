import { LightningElement } from 'lwc';

export default class WorkOrderStoreDetails extends LightningElement {
    get store() {
        return {
            name: 'Warhammer - Silas Creek Crossing #0474',
            mall: 'Silas Creek Crossing',
            phone: '+1 743-643-4182',
            email: 'store0474@warhammer.com',
            address: '3246 Silas Creek Parkway, Winston-Salem North Carolina, United States - 27103-3011'
        };
    }
}
