"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFloatingFilter = void 0;
const dateFilter_1 = require("./dateFilter");
const context_1 = require("../../../context/context");
const dateCompWrapper_1 = require("./dateCompWrapper");
const componentAnnotations_1 = require("../../../widgets/componentAnnotations");
const simpleFloatingFilter_1 = require("../../floating/provided/simpleFloatingFilter");
const providedFilter_1 = require("../providedFilter");
const dom_1 = require("../../../utils/dom");
const date_1 = require("../../../utils/date");
const function_1 = require("../../../utils/function");
class DateFloatingFilter extends simpleFloatingFilter_1.SimpleFloatingFilter {
    constructor() {
        super(/* html */ `
            <div class="ag-floating-filter-input" role="presentation">
                <ag-input-text-field ref="eReadOnlyText"></ag-input-text-field>
                <div ref="eDateWrapper" style="display: flex;"></div>
            </div>`);
    }
    getDefaultFilterOptions() {
        return dateFilter_1.DateFilter.DEFAULT_FILTER_OPTIONS;
    }
    init(params) {
        super.init(params);
        this.params = params;
        this.filterParams = params.filterParams;
        this.createDateComponent();
        this.filterModelFormatter = new dateFilter_1.DateFilterModelFormatter(this.filterParams, this.localeService, this.optionsFactory);
        const translate = this.localeService.getLocaleTextFunc();
        this.eReadOnlyText
            .setDisabled(true)
            .setInputAriaLabel(translate('ariaDateFilterInput', 'Date Filter Input'));
    }
    onParamsUpdated(params) {
        this.refresh(params);
    }
    refresh(params) {
        super.refresh(params);
        this.params = params;
        this.filterParams = params.filterParams;
        this.updateDateComponent();
        this.filterModelFormatter.updateParams({ optionsFactory: this.optionsFactory, dateFilterParams: this.filterParams });
        this.updateCompOnModelChange(params.currentParentModel());
    }
    updateCompOnModelChange(model) {
        // Update the read-only text field
        const allowEditing = !this.isReadOnly() && this.canWeEditAfterModelFromParentFilter(model);
        this.setEditable(allowEditing);
        if (allowEditing) {
            if (model) {
                const dateModel = model;
                this.dateComp.setDate((0, date_1.parseDateTimeFromString)(dateModel.dateFrom));
            }
            else {
                this.dateComp.setDate(null);
            }
            this.eReadOnlyText.setValue('');
        }
        else {
            this.eReadOnlyText.setValue(this.filterModelFormatter.getModelAsString(model));
            this.dateComp.setDate(null);
        }
    }
    setEditable(editable) {
        (0, dom_1.setDisplayed)(this.eDateWrapper, editable);
        (0, dom_1.setDisplayed)(this.eReadOnlyText.getGui(), !editable);
    }
    onParentModelChanged(model, event) {
        // We don't want to update the floating filter if the floating filter caused the change,
        // because the UI is already in sync. if we didn't do this, the UI would behave strangely
        // as it would be updating as the user is typing.
        // This is similar for data changes, which don't affect provided date floating filters
        if (this.isEventFromFloatingFilter(event) || this.isEventFromDataChange(event)) {
            return;
        }
        super.setLastTypeFromModel(model);
        this.updateCompOnModelChange(model);
    }
    onDateChanged() {
        const filterValueDate = this.dateComp.getDate();
        const filterValueText = (0, date_1.serialiseDate)(filterValueDate);
        this.params.parentFilterInstance(filterInstance => {
            if (filterInstance) {
                const date = (0, date_1.parseDateTimeFromString)(filterValueText);
                filterInstance.onFloatingFilterChanged(this.getLastType() || null, date);
            }
        });
    }
    getDateComponentParams() {
        const debounceMs = providedFilter_1.ProvidedFilter.getDebounceMs(this.params.filterParams, this.getDefaultDebounceMs());
        return {
            onDateChanged: (0, function_1.debounce)(this.onDateChanged.bind(this), debounceMs),
            filterParams: this.params.column.getColDef().filterParams
        };
    }
    createDateComponent() {
        this.dateComp = new dateCompWrapper_1.DateCompWrapper(this.getContext(), this.userComponentFactory, this.getDateComponentParams(), this.eDateWrapper);
        this.addDestroyFunc(() => this.dateComp.destroy());
    }
    updateDateComponent() {
        const params = this.gridOptionsService.addGridCommonParams(this.getDateComponentParams());
        this.dateComp.updateParams(params);
    }
    getFilterModelFormatter() {
        return this.filterModelFormatter;
    }
}
__decorate([
    (0, context_1.Autowired)('userComponentFactory')
], DateFloatingFilter.prototype, "userComponentFactory", void 0);
__decorate([
    (0, componentAnnotations_1.RefSelector)('eReadOnlyText')
], DateFloatingFilter.prototype, "eReadOnlyText", void 0);
__decorate([
    (0, componentAnnotations_1.RefSelector)('eDateWrapper')
], DateFloatingFilter.prototype, "eDateWrapper", void 0);
exports.DateFloatingFilter = DateFloatingFilter;
