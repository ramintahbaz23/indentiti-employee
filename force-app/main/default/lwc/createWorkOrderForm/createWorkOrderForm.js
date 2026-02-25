import { LightningElement, track, api } from 'lwc';

export default class CreateWorkOrderForm extends LightningElement {
    @api recordId;

    @track formData = {
        account: '',
        accountName: '',
        nte: 0,
        priority: 'P4',
        trade: '',
        issueType: '',
        recall: 'No',
        description: '',
        vendorTypes: []
    };

    @track showAccountConfirm = false;
    @track issueTypeOptions = [{ label: 'Select Issue Type', value: '' }];

    accountMeta = {
        activeQuotes: 2,
        vendorsOnFile: 1
    };

    acceptedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];

    accountOptions = [
        { label: 'Warhammer Inc.', value: 'warhammer' },
        { label: 'Purple Corp', value: 'purple' },
        { label: '5066 - Minnetonka Country Village', value: 'minnetonka' }
    ];

    priorityOptions = [
        { label: 'P4 - Priority 4 Hours', value: 'P4' },
        { label: 'P8 - Priority 8 Hours', value: 'P8' },
        { label: 'NPW1 - Next Priority Window', value: 'NPW1' },
        { label: 'Critical', value: 'CRITICAL' }
    ];

    tradeOptions = [
        { label: 'Select Trade', value: '' },
        { label: 'Electrical', value: 'Electrical' },
        { label: 'Plumbing', value: 'Plumbing' },
        { label: 'Janitorial/Cleaning Services', value: 'Janitorial' },
        { label: 'Lighting', value: 'Lighting' },
        { label: 'General Maintenance', value: 'GeneralMaintenance' },
        { label: 'Fire Services', value: 'FireServices' },
        { label: 'Automotive', value: 'Automotive' }
    ];

    issueTypesByTrade = {
        Electrical: [
            { label: 'Power Outage', value: 'PowerOutage' },
            { label: 'Lighting Repair', value: 'LightingRepair' }
        ],
        Plumbing: [
            { label: 'Toilet Repair', value: 'ToiletRepair' },
            { label: 'Pipe Leak', value: 'PipeLeak' }
        ],
        Automotive: [
            { label: 'Car Lifts', value: 'CarLifts' },
            { label: 'Oil Change Equipment', value: 'OilChange' }
        ]
    };

    recallOptions = [
        { label: 'No', value: 'No' },
        { label: 'Yes', value: 'Yes' }
    ];

    vendorTypes = [
        { label: 'Installer', value: 'Installer' },
        { label: 'Electrician', value: 'Electrician' },
        { label: 'Painter', value: 'Painter' },
        { label: 'Roofing', value: 'Roofing' },
        { label: 'Manufacturer', value: 'Manufacturer' }
    ];

    handleAccountChange(event) {
        const selected = event.detail.value;
        const option = this.accountOptions.find(o => o.value === selected);
        this.formData = {
            ...this.formData,
            account: selected,
            accountName: option ? option.label : ''
        };
        this.showAccountConfirm = !!selected;
    }

    handleTradeChange(event) {
        const trade = event.detail.value;
        this.formData = { ...this.formData, trade, issueType: '' };
        const types = this.issueTypesByTrade[trade] || [];
        this.issueTypeOptions = [
            { label: 'Select Issue Type', value: '' },
            ...types
        ];
    }

    handleVendorChange(event) {
        const value = event.target.dataset.vendorValue || event.target.value;
        const checked = event.target.checked;
        let vendors = [...(this.formData.vendorTypes || [])];
        if (checked) {
            vendors.push(value);
        } else {
            vendors = vendors.filter(v => v !== value);
        }
        this.formData = { ...this.formData, vendorTypes: vendors };
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.detail !== undefined && event.detail.value !== undefined ? event.detail.value : event.target.value;
        this.formData = { ...this.formData, [field]: value };
    }

    handleTradeDependency() {}
    handleIssueDependency() {}
    handleUploadFinished() {}

    handleSave() {
        if (this.validateForm()) {
            this.dispatchEvent(new CustomEvent('save', { detail: this.formData }));
        }
    }

    handleSaveAndNew() {
        if (this.validateForm()) {
            this.dispatchEvent(new CustomEvent('savenew', { detail: this.formData }));
        }
    }

    handleSaveAndCreateEstimate() {
        if (this.validateForm()) {
            this.dispatchEvent(new CustomEvent('saveestimate', { detail: this.formData }));
        }
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    validateForm() {
        const inputs = this.template.querySelectorAll('lightning-input[required], lightning-combobox[required], lightning-textarea[required]');
        let isValid = true;
        inputs.forEach(input => {
            if (input.reportValidity && !input.reportValidity()) {
                isValid = false;
            }
        });
        return isValid;
    }
}
