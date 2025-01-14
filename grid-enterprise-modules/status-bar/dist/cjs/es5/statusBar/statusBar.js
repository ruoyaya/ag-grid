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
exports.StatusBar = void 0;
var core_1 = require("@ag-grid-community/core");
var StatusBar = /** @class */ (function (_super) {
    __extends(StatusBar, _super);
    function StatusBar() {
        var _this = _super.call(this, StatusBar.TEMPLATE) || this;
        _this.compDestroyFunctions = {};
        return _this;
    }
    StatusBar.prototype.postConstruct = function () {
        this.processStatusPanels(new Map());
        this.addManagedPropertyListeners(['statusBar'], this.handleStatusBarChanged.bind(this));
    };
    StatusBar.prototype.processStatusPanels = function (existingStatusPanelsToReuse) {
        var _a;
        var statusPanels = (_a = this.gridOptionsService.get('statusBar')) === null || _a === void 0 ? void 0 : _a.statusPanels;
        if (statusPanels) {
            var leftStatusPanelComponents = statusPanels
                .filter(function (componentConfig) { return componentConfig.align === 'left'; });
            this.createAndRenderComponents(leftStatusPanelComponents, this.eStatusBarLeft, existingStatusPanelsToReuse);
            var centerStatusPanelComponents = statusPanels
                .filter(function (componentConfig) { return componentConfig.align === 'center'; });
            this.createAndRenderComponents(centerStatusPanelComponents, this.eStatusBarCenter, existingStatusPanelsToReuse);
            var rightStatusPanelComponents = statusPanels
                .filter(function (componentConfig) { return (!componentConfig.align || componentConfig.align === 'right'); });
            this.createAndRenderComponents(rightStatusPanelComponents, this.eStatusBarRight, existingStatusPanelsToReuse);
        }
        else {
            this.setDisplayed(false);
        }
    };
    StatusBar.prototype.handleStatusBarChanged = function () {
        var _this = this;
        var _a;
        var statusPanels = (_a = this.gridOptionsService.get('statusBar')) === null || _a === void 0 ? void 0 : _a.statusPanels;
        var validStatusBarPanelsProvided = Array.isArray(statusPanels) && statusPanels.length > 0;
        this.setDisplayed(validStatusBarPanelsProvided);
        var existingStatusPanelsToReuse = new Map();
        if (validStatusBarPanelsProvided) {
            statusPanels.forEach(function (statusPanelConfig) {
                var _a, _b;
                var key = (_a = statusPanelConfig.key) !== null && _a !== void 0 ? _a : statusPanelConfig.statusPanel;
                var existingStatusPanel = _this.statusBarService.getStatusPanel(key);
                if (existingStatusPanel === null || existingStatusPanel === void 0 ? void 0 : existingStatusPanel.refresh) {
                    var newParams = _this.gridOptionsService.addGridCommonParams((_b = statusPanelConfig.statusPanelParams) !== null && _b !== void 0 ? _b : {});
                    var hasRefreshed = existingStatusPanel.refresh(newParams);
                    if (hasRefreshed) {
                        existingStatusPanelsToReuse.set(key, existingStatusPanel);
                        delete _this.compDestroyFunctions[key];
                        core_1._.removeFromParent(existingStatusPanel.getGui());
                    }
                }
            });
        }
        this.resetStatusBar();
        if (validStatusBarPanelsProvided) {
            this.processStatusPanels(existingStatusPanelsToReuse);
        }
    };
    StatusBar.prototype.resetStatusBar = function () {
        this.eStatusBarLeft.innerHTML = '';
        this.eStatusBarCenter.innerHTML = '';
        this.eStatusBarRight.innerHTML = '';
        this.destroyComponents();
        this.statusBarService.unregisterAllComponents();
    };
    StatusBar.prototype.destroyComponents = function () {
        Object.values(this.compDestroyFunctions).forEach(function (func) { return func(); });
        this.compDestroyFunctions = {};
    };
    StatusBar.prototype.createAndRenderComponents = function (statusBarComponents, ePanelComponent, existingStatusPanelsToReuse) {
        var _this = this;
        var componentDetails = [];
        statusBarComponents.forEach(function (componentConfig) {
            // default to the component name if no key supplied
            var key = componentConfig.key || componentConfig.statusPanel;
            var existingStatusPanel = existingStatusPanelsToReuse.get(key);
            var promise;
            if (existingStatusPanel) {
                promise = core_1.AgPromise.resolve(existingStatusPanel);
            }
            else {
                var params = {};
                var compDetails = _this.userComponentFactory.getStatusPanelCompDetails(componentConfig, params);
                promise = compDetails.newAgStackInstance();
                if (!promise) {
                    return;
                }
            }
            componentDetails.push({
                key: key,
                promise: promise
            });
        });
        core_1.AgPromise.all(componentDetails.map(function (details) { return details.promise; }))
            .then(function () {
            componentDetails.forEach(function (componentDetail) {
                componentDetail.promise.then(function (component) {
                    var destroyFunc = function () {
                        _this.getContext().destroyBean(component);
                    };
                    if (_this.isAlive()) {
                        _this.statusBarService.registerStatusPanel(componentDetail.key, component);
                        ePanelComponent.appendChild(component.getGui());
                        _this.compDestroyFunctions[componentDetail.key] = destroyFunc;
                    }
                    else {
                        destroyFunc();
                    }
                });
            });
        });
    };
    StatusBar.TEMPLATE = "<div class=\"ag-status-bar\">\n            <div ref=\"eStatusBarLeft\" class=\"ag-status-bar-left\" role=\"status\"></div>\n            <div ref=\"eStatusBarCenter\" class=\"ag-status-bar-center\" role=\"status\"></div>\n            <div ref=\"eStatusBarRight\" class=\"ag-status-bar-right\" role=\"status\"></div>\n        </div>";
    __decorate([
        (0, core_1.Autowired)('userComponentFactory')
    ], StatusBar.prototype, "userComponentFactory", void 0);
    __decorate([
        (0, core_1.Autowired)('statusBarService')
    ], StatusBar.prototype, "statusBarService", void 0);
    __decorate([
        (0, core_1.RefSelector)('eStatusBarLeft')
    ], StatusBar.prototype, "eStatusBarLeft", void 0);
    __decorate([
        (0, core_1.RefSelector)('eStatusBarCenter')
    ], StatusBar.prototype, "eStatusBarCenter", void 0);
    __decorate([
        (0, core_1.RefSelector)('eStatusBarRight')
    ], StatusBar.prototype, "eStatusBarRight", void 0);
    __decorate([
        core_1.PostConstruct
    ], StatusBar.prototype, "postConstruct", null);
    __decorate([
        core_1.PreDestroy
    ], StatusBar.prototype, "destroyComponents", null);
    return StatusBar;
}(core_1.Component));
exports.StatusBar = StatusBar;
