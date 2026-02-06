import { LightningElement, api } from 'lwc';

export default class MetricCard extends LightningElement {
    @api label;
    @api value;
    @api sublabel;
    @api variant; // critical, warning, info, success, purple

    get cardClass() {
        return `metric-card ${this.variant || 'info'}`;
    }

    get accentColor() {
        const colors = {
            critical: '#c23934',
            warning: '#fe9339',
            info: '#0176d3',
            success: '#2e844a',
            purple: '#9065b0'
        };
        return colors[this.variant] || colors.info;
    }

    handleClick() {
        this.dispatchEvent(new CustomEvent('metricclick', {
            detail: {
                metric: this.label
            }
        }));
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleClick();
        }
    }
}

