import { LightningElement, track } from 'lwc';

export default class ClientCommunicationComponent extends LightningElement {
    @track mode = 'internal';
    @track selectedTemplate = 'standard';

    get templateOptions() {
        return [
            { label: 'Standard Client Update', value: 'standard' }
        ];
    }

    get isInternal() {
        return this.mode === 'internal';
    }

    get internalVariant() {
        return this.mode === 'internal' ? 'brand' : 'neutral';
    }

    get clientVariant() {
        return this.mode === 'client' ? 'brand' : 'neutral';
    }

    setInternal() { this.mode = 'internal'; }
    setClient() { this.mode = 'client'; }
}
