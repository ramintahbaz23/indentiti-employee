import { LightningElement } from 'lwc';

export default class KpiSummaryCards extends LightningElement {
    get kpis() {
        return [
            { id: '1', label: 'Open Emergencies', value: '2', sublabel: 'Requires immediate action', valueClass: 'kpi-red' },
            { id: '2', label: 'SLA Breaches Today', value: '3', sublabel: 'At 0 days remaining', valueClass: 'kpi-red' },
            { id: '3', label: 'Media Pending', value: '4', sublabel: 'Missing or not consolidated', valueClass: 'kpi-red' },
            { id: '4', label: 'Quotes Awaiting Action', value: '3', sublabel: 'Conflicts and pending sends', valueClass: 'kpi-amber' }
        ];
    }
}
