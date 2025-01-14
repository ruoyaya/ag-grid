"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimateShowChangeCellRenderer = void 0;
const context_1 = require("../../context/context");
const component_1 = require("../../widgets/component");
const generic_1 = require("../../utils/generic");
const dom_1 = require("../../utils/dom");
const ARROW_UP = '\u2191';
const ARROW_DOWN = '\u2193';
class AnimateShowChangeCellRenderer extends component_1.Component {
    constructor() {
        super();
        this.refreshCount = 0;
        const template = document.createElement('span');
        const delta = document.createElement('span');
        delta.setAttribute('class', 'ag-value-change-delta');
        const value = document.createElement('span');
        value.setAttribute('class', 'ag-value-change-value');
        template.appendChild(delta);
        template.appendChild(value);
        this.setTemplateFromElement(template);
    }
    init(params) {
        this.eValue = this.queryForHtmlElement('.ag-value-change-value');
        this.eDelta = this.queryForHtmlElement('.ag-value-change-delta');
        this.refresh(params, true);
    }
    showDelta(params, delta) {
        const absDelta = Math.abs(delta);
        const valueFormatted = params.formatValue(absDelta);
        const valueToUse = (0, generic_1.exists)(valueFormatted) ? valueFormatted : absDelta;
        const deltaUp = (delta >= 0);
        if (deltaUp) {
            this.eDelta.textContent = ARROW_UP + valueToUse;
        }
        else {
            // because negative, use ABS to remove sign
            this.eDelta.textContent = ARROW_DOWN + valueToUse;
        }
        this.eDelta.classList.toggle('ag-value-change-delta-up', deltaUp);
        this.eDelta.classList.toggle('ag-value-change-delta-down', !deltaUp);
    }
    setTimerToRemoveDelta() {
        // the refreshCount makes sure that if the value updates again while
        // the below timer is waiting, then the below timer will realise it
        // is not the most recent and will not try to remove the delta value.
        this.refreshCount++;
        const refreshCountCopy = this.refreshCount;
        this.getFrameworkOverrides().wrapIncoming(() => {
            window.setTimeout(() => {
                if (refreshCountCopy === this.refreshCount) {
                    this.hideDeltaValue();
                }
            }, 2000);
        });
    }
    hideDeltaValue() {
        this.eValue.classList.remove('ag-value-change-value-highlight');
        (0, dom_1.clearElement)(this.eDelta);
    }
    refresh(params, isInitialRender = false) {
        const value = params.value;
        if (value === this.lastValue) {
            return false;
        }
        if ((0, generic_1.exists)(params.valueFormatted)) {
            this.eValue.textContent = params.valueFormatted;
        }
        else if ((0, generic_1.exists)(params.value)) {
            this.eValue.textContent = value;
        }
        else {
            (0, dom_1.clearElement)(this.eValue);
        }
        // we don't show the delta if we are in the middle of a filter. see comment on FilterManager
        // with regards processingFilterChange
        if (this.filterManager.isSuppressFlashingCellsBecauseFiltering()) {
            return false;
        }
        if (typeof value === 'number' && typeof this.lastValue === 'number') {
            const delta = value - this.lastValue;
            this.showDelta(params, delta);
        }
        // highlight the current value, but only if it's not new, otherwise it
        // would get highlighted first time the value is shown
        if (this.lastValue) {
            this.eValue.classList.add('ag-value-change-value-highlight');
        }
        if (!isInitialRender) {
            this.setTimerToRemoveDelta();
        }
        this.lastValue = value;
        return true;
    }
}
__decorate([
    (0, context_1.Autowired)('filterManager')
], AnimateShowChangeCellRenderer.prototype, "filterManager", void 0);
exports.AnimateShowChangeCellRenderer = AnimateShowChangeCellRenderer;
