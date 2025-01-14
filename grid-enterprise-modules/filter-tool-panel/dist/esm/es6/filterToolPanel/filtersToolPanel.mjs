var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, RefSelector } from "@ag-grid-community/core";
export class FiltersToolPanel extends Component {
    constructor() {
        super(FiltersToolPanel.TEMPLATE);
        this.initialised = false;
        this.listenerDestroyFuncs = [];
    }
    init(params) {
        // if initialised is true, means this is a refresh
        if (this.initialised) {
            this.listenerDestroyFuncs.forEach(func => func());
            this.listenerDestroyFuncs = [];
        }
        this.initialised = true;
        const defaultParams = this.gridOptionsService.addGridCommonParams({
            suppressExpandAll: false,
            suppressFilterSearch: false,
            suppressSyncLayoutWithGrid: false
        });
        this.params = Object.assign(Object.assign({}, defaultParams), params);
        this.filtersToolPanelHeaderPanel.init(this.params);
        this.filtersToolPanelListPanel.init(this.params);
        const hideExpand = this.params.suppressExpandAll;
        const hideSearch = this.params.suppressFilterSearch;
        if (hideExpand && hideSearch) {
            this.filtersToolPanelHeaderPanel.setDisplayed(false);
        }
        // this is necessary to prevent a memory leak while refreshing the tool panel
        this.listenerDestroyFuncs.push(this.addManagedListener(this.filtersToolPanelHeaderPanel, 'expandAll', this.onExpandAll.bind(this)), this.addManagedListener(this.filtersToolPanelHeaderPanel, 'collapseAll', this.onCollapseAll.bind(this)), this.addManagedListener(this.filtersToolPanelHeaderPanel, 'searchChanged', this.onSearchChanged.bind(this)), this.addManagedListener(this.filtersToolPanelListPanel, 'filterExpanded', this.onFilterExpanded.bind(this)), this.addManagedListener(this.filtersToolPanelListPanel, 'groupExpanded', this.onGroupExpanded.bind(this)));
    }
    // lazy initialise the panel
    setVisible(visible) {
        super.setDisplayed(visible);
        if (visible && !this.initialised) {
            this.init(this.params);
        }
    }
    onExpandAll() {
        this.filtersToolPanelListPanel.expandFilterGroups(true);
    }
    onCollapseAll() {
        this.filtersToolPanelListPanel.expandFilterGroups(false);
    }
    onSearchChanged(event) {
        this.filtersToolPanelListPanel.performFilterSearch(event.searchText);
    }
    setFilterLayout(colDefs) {
        this.filtersToolPanelListPanel.setFiltersLayout(colDefs);
    }
    onFilterExpanded() {
        this.params.onStateUpdated();
    }
    onGroupExpanded(event) {
        this.filtersToolPanelHeaderPanel.setExpandState(event.state);
        this.params.onStateUpdated();
    }
    expandFilterGroups(groupIds) {
        this.filtersToolPanelListPanel.expandFilterGroups(true, groupIds);
    }
    collapseFilterGroups(groupIds) {
        this.filtersToolPanelListPanel.expandFilterGroups(false, groupIds);
    }
    expandFilters(colIds) {
        this.filtersToolPanelListPanel.expandFilters(true, colIds);
    }
    collapseFilters(colIds) {
        this.filtersToolPanelListPanel.expandFilters(false, colIds);
    }
    syncLayoutWithGrid() {
        this.filtersToolPanelListPanel.syncFilterLayout();
    }
    refresh(params) {
        this.init(params);
        return true;
    }
    getState() {
        return this.filtersToolPanelListPanel.getExpandedFiltersAndGroups();
    }
    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    destroy() {
        super.destroy();
    }
}
FiltersToolPanel.TEMPLATE = `<div class="ag-filter-toolpanel">
            <ag-filters-tool-panel-header ref="filtersToolPanelHeaderPanel"></ag-filters-tool-panel-header>
            <ag-filters-tool-panel-list ref="filtersToolPanelListPanel"></ag-filters-tool-panel-list>
         </div>`;
__decorate([
    RefSelector('filtersToolPanelHeaderPanel')
], FiltersToolPanel.prototype, "filtersToolPanelHeaderPanel", void 0);
__decorate([
    RefSelector('filtersToolPanelListPanel')
], FiltersToolPanel.prototype, "filtersToolPanelListPanel", void 0);
