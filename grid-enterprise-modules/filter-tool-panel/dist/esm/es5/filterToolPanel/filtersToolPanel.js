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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, RefSelector } from "@ag-grid-community/core";
var FiltersToolPanel = /** @class */ (function (_super) {
    __extends(FiltersToolPanel, _super);
    function FiltersToolPanel() {
        var _this = _super.call(this, FiltersToolPanel.TEMPLATE) || this;
        _this.initialised = false;
        _this.listenerDestroyFuncs = [];
        return _this;
    }
    FiltersToolPanel.prototype.init = function (params) {
        // if initialised is true, means this is a refresh
        if (this.initialised) {
            this.listenerDestroyFuncs.forEach(function (func) { return func(); });
            this.listenerDestroyFuncs = [];
        }
        this.initialised = true;
        var defaultParams = this.gridOptionsService.addGridCommonParams({
            suppressExpandAll: false,
            suppressFilterSearch: false,
            suppressSyncLayoutWithGrid: false
        });
        this.params = __assign(__assign({}, defaultParams), params);
        this.filtersToolPanelHeaderPanel.init(this.params);
        this.filtersToolPanelListPanel.init(this.params);
        var hideExpand = this.params.suppressExpandAll;
        var hideSearch = this.params.suppressFilterSearch;
        if (hideExpand && hideSearch) {
            this.filtersToolPanelHeaderPanel.setDisplayed(false);
        }
        // this is necessary to prevent a memory leak while refreshing the tool panel
        this.listenerDestroyFuncs.push(this.addManagedListener(this.filtersToolPanelHeaderPanel, 'expandAll', this.onExpandAll.bind(this)), this.addManagedListener(this.filtersToolPanelHeaderPanel, 'collapseAll', this.onCollapseAll.bind(this)), this.addManagedListener(this.filtersToolPanelHeaderPanel, 'searchChanged', this.onSearchChanged.bind(this)), this.addManagedListener(this.filtersToolPanelListPanel, 'filterExpanded', this.onFilterExpanded.bind(this)), this.addManagedListener(this.filtersToolPanelListPanel, 'groupExpanded', this.onGroupExpanded.bind(this)));
    };
    // lazy initialise the panel
    FiltersToolPanel.prototype.setVisible = function (visible) {
        _super.prototype.setDisplayed.call(this, visible);
        if (visible && !this.initialised) {
            this.init(this.params);
        }
    };
    FiltersToolPanel.prototype.onExpandAll = function () {
        this.filtersToolPanelListPanel.expandFilterGroups(true);
    };
    FiltersToolPanel.prototype.onCollapseAll = function () {
        this.filtersToolPanelListPanel.expandFilterGroups(false);
    };
    FiltersToolPanel.prototype.onSearchChanged = function (event) {
        this.filtersToolPanelListPanel.performFilterSearch(event.searchText);
    };
    FiltersToolPanel.prototype.setFilterLayout = function (colDefs) {
        this.filtersToolPanelListPanel.setFiltersLayout(colDefs);
    };
    FiltersToolPanel.prototype.onFilterExpanded = function () {
        this.params.onStateUpdated();
    };
    FiltersToolPanel.prototype.onGroupExpanded = function (event) {
        this.filtersToolPanelHeaderPanel.setExpandState(event.state);
        this.params.onStateUpdated();
    };
    FiltersToolPanel.prototype.expandFilterGroups = function (groupIds) {
        this.filtersToolPanelListPanel.expandFilterGroups(true, groupIds);
    };
    FiltersToolPanel.prototype.collapseFilterGroups = function (groupIds) {
        this.filtersToolPanelListPanel.expandFilterGroups(false, groupIds);
    };
    FiltersToolPanel.prototype.expandFilters = function (colIds) {
        this.filtersToolPanelListPanel.expandFilters(true, colIds);
    };
    FiltersToolPanel.prototype.collapseFilters = function (colIds) {
        this.filtersToolPanelListPanel.expandFilters(false, colIds);
    };
    FiltersToolPanel.prototype.syncLayoutWithGrid = function () {
        this.filtersToolPanelListPanel.syncFilterLayout();
    };
    FiltersToolPanel.prototype.refresh = function (params) {
        this.init(params);
        return true;
    };
    FiltersToolPanel.prototype.getState = function () {
        return this.filtersToolPanelListPanel.getExpandedFiltersAndGroups();
    };
    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    FiltersToolPanel.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
    };
    FiltersToolPanel.TEMPLATE = "<div class=\"ag-filter-toolpanel\">\n            <ag-filters-tool-panel-header ref=\"filtersToolPanelHeaderPanel\"></ag-filters-tool-panel-header>\n            <ag-filters-tool-panel-list ref=\"filtersToolPanelListPanel\"></ag-filters-tool-panel-list>\n         </div>";
    __decorate([
        RefSelector('filtersToolPanelHeaderPanel')
    ], FiltersToolPanel.prototype, "filtersToolPanelHeaderPanel", void 0);
    __decorate([
        RefSelector('filtersToolPanelListPanel')
    ], FiltersToolPanel.prototype, "filtersToolPanelListPanel", void 0);
    return FiltersToolPanel;
}(Component));
export { FiltersToolPanel };
