"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartesianAxisPanel = void 0;
var core_1 = require("@ag-grid-community/core");
var chartController_1 = require("../../../chartController");
var axisTicksPanel_1 = require("./axisTicksPanel");
var fontPanel_1 = require("../fontPanel");
var formatPanel_1 = require("../formatPanel");
var agAngleSelect_1 = require("../../../../../widgets/agAngleSelect");
var CartesianAxisPanel = /** @class */ (function (_super) {
    __extends(CartesianAxisPanel, _super);
    function CartesianAxisPanel(_a) {
        var chartController = _a.chartController, chartOptionsService = _a.chartOptionsService, _b = _a.isExpandedOnInit, isExpandedOnInit = _b === void 0 ? false : _b;
        var _this = _super.call(this) || this;
        _this.activePanels = [];
        _this.axisLabelUpdateFuncs = [];
        _this.prevXRotation = 0;
        _this.prevYRotation = 0;
        _this.chartController = chartController;
        _this.chartOptionsService = chartOptionsService;
        _this.isExpandedOnInit = isExpandedOnInit;
        return _this;
    }
    CartesianAxisPanel.prototype.init = function () {
        var _this = this;
        var groupParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical'
        };
        this.setTemplate(CartesianAxisPanel.TEMPLATE, { axisGroup: groupParams });
        this.initAxis();
        this.initAxisTicks();
        this.initAxisLabels();
        var updateAxisLabelRotations = function () { return _this.axisLabelUpdateFuncs.forEach(function (func) { return func(); }); };
        this.addManagedListener(this.chartController, chartController_1.ChartController.EVENT_CHART_UPDATED, updateAxisLabelRotations);
    };
    CartesianAxisPanel.prototype.initAxis = function () {
        var _this = this;
        this.axisGroup
            .setTitle(this.translate("axis"))
            .toggleGroupExpand(this.isExpandedOnInit)
            .hideEnabledCheckbox(true);
        // Note that there is no separate checkbox for enabling/disabling the axis line. Whenever the line settings are
        // changed, the value for `line.enabled` is inferred based on the current `line.width` value.
        this.axisColorInput
            .setLabel(this.translate("color"))
            .setLabelWidth("flex")
            .setInputWidth("flex")
            .setValue(this.chartOptionsService.getAxisProperty("line.color"))
            .onValueChange(function (newColor) {
            var isLineEnabled = _this.chartOptionsService.getAxisProperty("line.width") > 0;
            _this.chartOptionsService.setAxisProperties([
                { expression: "line.enabled", value: isLineEnabled },
                { expression: "line.color", value: newColor },
            ]);
        });
        var currentValue = this.chartOptionsService.getAxisProperty("line.width");
        this.axisLineWidthSlider
            .setMaxValue((0, formatPanel_1.getMaxValue)(currentValue, 10))
            .setLabel(this.translate("thickness"))
            .setTextFieldWidth(45)
            .setValue("".concat(currentValue))
            .onValueChange(function (newValue) { return _this.chartOptionsService.setAxisProperties([
            { expression: "line.enabled", value: (newValue !== 0) },
            { expression: "line.width", value: newValue },
        ]); });
    };
    CartesianAxisPanel.prototype.initAxisTicks = function () {
        if (!this.hasConfigurableAxisTicks())
            return;
        var axisTicksComp = this.createBean(new axisTicksPanel_1.AxisTicksPanel(this.chartOptionsService));
        this.axisGroup.addItem(axisTicksComp);
        this.activePanels.push(axisTicksComp);
    };
    CartesianAxisPanel.prototype.hasConfigurableAxisTicks = function () {
        // Axis ticks are disabled for some chart types
        var chartType = this.chartController.getChartType();
        switch (chartType) {
            case 'radarLine':
            case 'radarArea':
            case 'rangeBar':
            case 'boxPlot':
            case 'waterfall':
                return false;
            default:
                return true;
        }
    };
    CartesianAxisPanel.prototype.initAxisLabels = function () {
        var _this = this;
        var initialFont = {
            family: this.chartOptionsService.getAxisProperty("label.fontFamily"),
            style: this.chartOptionsService.getAxisProperty("label.fontStyle"),
            weight: this.chartOptionsService.getAxisProperty("label.fontWeight"),
            size: this.chartOptionsService.getAxisProperty("label.fontSize"),
            color: this.chartOptionsService.getAxisProperty("label.color")
        };
        var setFont = function (font) {
            if (font.family) {
                _this.chartOptionsService.setAxisProperty("label.fontFamily", font.family);
            }
            if (font.weight) {
                _this.chartOptionsService.setAxisProperty("label.fontWeight", font.weight);
            }
            if (font.style) {
                _this.chartOptionsService.setAxisProperty("label.fontStyle", font.style);
            }
            if (font.size) {
                _this.chartOptionsService.setAxisProperty("label.fontSize", font.size);
            }
            if (font.color) {
                _this.chartOptionsService.setAxisProperty("label.color", font.color);
            }
        };
        var params = {
            name: this.translate("labels"),
            enabled: true,
            suppressEnabledCheckbox: true,
            initialFont: initialFont,
            setFont: setFont
        };
        var labelPanelComp = this.createBean(new fontPanel_1.FontPanel(params));
        this.axisGroup.addItem(labelPanelComp);
        this.activePanels.push(labelPanelComp);
        this.addAdditionalLabelComps(labelPanelComp);
    };
    CartesianAxisPanel.prototype.addAdditionalLabelComps = function (labelPanelComp) {
        this.addLabelPadding(labelPanelComp);
        var _a = this.createRotationWidgets(), xRotationComp = _a.xRotationComp, yRotationComp = _a.yRotationComp;
        var autoRotateCb = this.initLabelRotations(xRotationComp, yRotationComp);
        labelPanelComp.addCompToPanel(autoRotateCb);
        labelPanelComp.addCompToPanel(xRotationComp);
        labelPanelComp.addCompToPanel(yRotationComp);
    };
    CartesianAxisPanel.prototype.initLabelRotations = function (xRotationComp, yRotationComp) {
        var _this = this;
        var getLabelRotation = function (axisType) {
            return _this.chartOptionsService.getLabelRotation(axisType);
        };
        var setLabelRotation = function (axisType, value) {
            _this.chartOptionsService.setLabelRotation(axisType, value);
        };
        var updateAutoRotate = function (autoRotate) {
            _this.chartOptionsService.setAxisProperty("label.autoRotate", autoRotate);
            if (autoRotate) {
                // store prev rotations before we remove them from the options
                _this.prevXRotation = getLabelRotation("xAxis");
                _this.prevYRotation = getLabelRotation("yAxis");
                // `autoRotate` is only
                setLabelRotation("xAxis", undefined);
                setLabelRotation("yAxis", undefined);
            }
            else {
                // reinstate prev rotations
                setLabelRotation("xAxis", _this.prevXRotation);
                setLabelRotation("yAxis", _this.prevYRotation);
            }
            xRotationComp.setDisabled(autoRotate);
            yRotationComp.setDisabled(autoRotate);
        };
        var getAutoRotateValue = function () {
            var xRotation = getLabelRotation("xAxis");
            var yRotation = getLabelRotation("yAxis");
            if (xRotation == undefined && yRotation == undefined) {
                return _this.chartOptionsService.getAxisProperty("label.autoRotate");
            }
            return false;
        };
        var autoRotate = getAutoRotateValue();
        var autoRotateCheckbox = this.createBean(new core_1.AgCheckbox())
            .setLabel(this.translate('autoRotate'))
            .setValue(autoRotate)
            .onValueChange(updateAutoRotate);
        // init rotation comp state
        xRotationComp.setDisabled(autoRotate);
        yRotationComp.setDisabled(autoRotate);
        return autoRotateCheckbox;
    };
    CartesianAxisPanel.prototype.createRotationWidgets = function () {
        var _this = this;
        var degreesSymbol = String.fromCharCode(176);
        var createRotationComp = function (labelKey, axisType) {
            var label = "".concat(_this.chartTranslationService.translate(labelKey), " ").concat(degreesSymbol);
            var value = _this.chartOptionsService.getLabelRotation(axisType);
            var angleSelect = new agAngleSelect_1.AgAngleSelect()
                .setLabel(label)
                .setLabelWidth("flex")
                .setValue(value || 0)
                .onValueChange(function (newValue) { return _this.chartOptionsService.setLabelRotation(axisType, newValue); });
            // the axis label rotation needs to be updated when the default category changes in the data panel
            _this.axisLabelUpdateFuncs.push(function () {
                var value = _this.chartOptionsService.getLabelRotation(axisType);
                angleSelect.setValue(value || 0);
            });
            return _this.createBean(angleSelect);
        };
        return {
            xRotationComp: createRotationComp("xRotation", "xAxis"),
            yRotationComp: createRotationComp("yRotation", "yAxis")
        };
    };
    CartesianAxisPanel.prototype.addLabelPadding = function (labelPanelComp) {
        var _this = this;
        var labelPaddingSlider = this.createBean(new core_1.AgSlider());
        var currentValue = this.chartOptionsService.getAxisProperty("label.padding");
        labelPaddingSlider.setLabel(this.chartTranslationService.translate("padding"))
            .setMaxValue((0, formatPanel_1.getMaxValue)(currentValue, 30))
            .setValue("".concat(currentValue))
            .setTextFieldWidth(45)
            .onValueChange(function (newValue) { return _this.chartOptionsService.setAxisProperty("label.padding", newValue); });
        labelPanelComp.addCompToPanel(labelPaddingSlider);
    };
    CartesianAxisPanel.prototype.translate = function (key, defaultText) {
        return this.chartTranslationService.translate(key, defaultText);
    };
    CartesianAxisPanel.prototype.destroyActivePanels = function () {
        var _this = this;
        this.activePanels.forEach(function (panel) {
            core_1._.removeFromParent(panel.getGui());
            _this.destroyBean(panel);
        });
    };
    CartesianAxisPanel.prototype.destroy = function () {
        this.destroyActivePanels();
        _super.prototype.destroy.call(this);
    };
    CartesianAxisPanel.TEMPLATE = "<div>\n            <ag-group-component ref=\"axisGroup\">\n                <ag-color-picker ref=\"axisColorInput\"></ag-color-picker>\n                <ag-slider ref=\"axisLineWidthSlider\"></ag-slider>\n            </ag-group-component>\n        </div>";
    __decorate([
        (0, core_1.RefSelector)('axisGroup')
    ], CartesianAxisPanel.prototype, "axisGroup", void 0);
    __decorate([
        (0, core_1.RefSelector)('axisColorInput')
    ], CartesianAxisPanel.prototype, "axisColorInput", void 0);
    __decorate([
        (0, core_1.RefSelector)('axisLineWidthSlider')
    ], CartesianAxisPanel.prototype, "axisLineWidthSlider", void 0);
    __decorate([
        (0, core_1.Autowired)('chartTranslationService')
    ], CartesianAxisPanel.prototype, "chartTranslationService", void 0);
    __decorate([
        core_1.PostConstruct
    ], CartesianAxisPanel.prototype, "init", null);
    return CartesianAxisPanel;
}(core_1.Component));
exports.CartesianAxisPanel = CartesianAxisPanel;
