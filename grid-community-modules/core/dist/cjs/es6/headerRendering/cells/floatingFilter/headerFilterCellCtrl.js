"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderFilterCellCtrl = void 0;
const abstractHeaderCellCtrl_1 = require("../abstractCell/abstractHeaderCellCtrl");
const keyCode_1 = require("../../../constants/keyCode");
const column_1 = require("../../../entities/column");
const events_1 = require("../../../events");
const setLeftFeature_1 = require("../../../rendering/features/setLeftFeature");
const dom_1 = require("../../../utils/dom");
const icon_1 = require("../../../utils/icon");
const managedFocusFeature_1 = require("../../../widgets/managedFocusFeature");
const hoverFeature_1 = require("../hoverFeature");
const aria_1 = require("../../../utils/aria");
const function_1 = require("../../../utils/function");
class HeaderFilterCellCtrl extends abstractHeaderCellCtrl_1.AbstractHeaderCellCtrl {
    constructor(column, beans, parentRowCtrl) {
        super(column, beans, parentRowCtrl);
        this.iconCreated = false;
        this.column = column;
    }
    setComp(comp, eGui, eButtonShowMainFilter, eFloatingFilterBody) {
        this.comp = comp;
        this.eButtonShowMainFilter = eButtonShowMainFilter;
        this.eFloatingFilterBody = eFloatingFilterBody;
        this.setGui(eGui);
        this.setupActive();
        this.setupWidth();
        this.setupLeft();
        this.setupHover();
        this.setupFocus();
        this.setupAria();
        this.setupFilterButton();
        this.setupUserComp();
        this.setupSyncWithFilter();
        this.setupUi();
        this.addManagedListener(this.eButtonShowMainFilter, 'click', this.showParentFilter.bind(this));
        this.setupFilterChangedListener();
        this.addManagedListener(this.column, column_1.Column.EVENT_COL_DEF_CHANGED, this.onColDefChanged.bind(this));
    }
    // empty abstract method
    resizeHeader() { }
    // empty abstract method
    moveHeader() { }
    setupActive() {
        const colDef = this.column.getColDef();
        const filterExists = !!colDef.filter;
        const floatingFilterExists = !!colDef.floatingFilter;
        this.active = filterExists && floatingFilterExists;
    }
    setupUi() {
        this.comp.setButtonWrapperDisplayed(!this.suppressFilterButton && this.active);
        this.comp.addOrRemoveBodyCssClass('ag-floating-filter-full-body', this.suppressFilterButton);
        this.comp.addOrRemoveBodyCssClass('ag-floating-filter-body', !this.suppressFilterButton);
        if (!this.active || this.iconCreated) {
            return;
        }
        const eMenuIcon = (0, icon_1.createIconNoSpan)('filter', this.gridOptionsService, this.column);
        if (eMenuIcon) {
            this.iconCreated = true;
            this.eButtonShowMainFilter.appendChild(eMenuIcon);
        }
    }
    setupFocus() {
        this.createManagedBean(new managedFocusFeature_1.ManagedFocusFeature(this.eGui, {
            shouldStopEventPropagation: this.shouldStopEventPropagation.bind(this),
            onTabKeyDown: this.onTabKeyDown.bind(this),
            handleKeyDown: this.handleKeyDown.bind(this),
            onFocusIn: this.onFocusIn.bind(this)
        }));
    }
    setupAria() {
        const localeTextFunc = this.localeService.getLocaleTextFunc();
        (0, aria_1.setAriaLabel)(this.eButtonShowMainFilter, localeTextFunc('ariaFilterMenuOpen', 'Open Filter Menu'));
    }
    onTabKeyDown(e) {
        const eDocument = this.gridOptionsService.getDocument();
        const activeEl = eDocument.activeElement;
        const wrapperHasFocus = activeEl === this.eGui;
        if (wrapperHasFocus) {
            return;
        }
        const nextFocusableEl = this.focusService.findNextFocusableElement(this.eGui, null, e.shiftKey);
        if (nextFocusableEl) {
            this.beans.headerNavigationService.scrollToColumn(this.column);
            e.preventDefault();
            nextFocusableEl.focus();
            return;
        }
        const nextFocusableColumn = this.findNextColumnWithFloatingFilter(e.shiftKey);
        if (!nextFocusableColumn) {
            return;
        }
        if (this.focusService.focusHeaderPosition({
            headerPosition: {
                headerRowIndex: this.getParentRowCtrl().getRowIndex(),
                column: nextFocusableColumn
            },
            event: e
        })) {
            e.preventDefault();
        }
    }
    findNextColumnWithFloatingFilter(backwards) {
        const columnModel = this.beans.columnModel;
        let nextCol = this.column;
        do {
            nextCol = backwards
                ? columnModel.getDisplayedColBefore(nextCol)
                : columnModel.getDisplayedColAfter(nextCol);
            if (!nextCol) {
                break;
            }
        } while (!nextCol.getColDef().filter || !nextCol.getColDef().floatingFilter);
        return nextCol;
    }
    handleKeyDown(e) {
        super.handleKeyDown(e);
        const wrapperHasFocus = this.getWrapperHasFocus();
        switch (e.key) {
            case keyCode_1.KeyCode.UP:
            case keyCode_1.KeyCode.DOWN:
                if (!wrapperHasFocus) {
                    e.preventDefault();
                }
            case keyCode_1.KeyCode.LEFT:
            case keyCode_1.KeyCode.RIGHT:
                if (wrapperHasFocus) {
                    return;
                }
                e.stopPropagation();
            case keyCode_1.KeyCode.ENTER:
                if (wrapperHasFocus) {
                    if (this.focusService.focusInto(this.eGui)) {
                        e.preventDefault();
                    }
                }
                break;
            case keyCode_1.KeyCode.ESCAPE:
                if (!wrapperHasFocus) {
                    this.eGui.focus();
                }
        }
    }
    onFocusIn(e) {
        const isRelatedWithin = this.eGui.contains(e.relatedTarget);
        // when the focus is already within the component,
        // we default to the browser's behavior
        if (isRelatedWithin) {
            return;
        }
        const notFromHeaderWrapper = !!e.relatedTarget && !e.relatedTarget.classList.contains('ag-floating-filter');
        const fromWithinHeader = !!e.relatedTarget && (0, dom_1.isElementChildOfClass)(e.relatedTarget, 'ag-floating-filter');
        if (notFromHeaderWrapper && fromWithinHeader && e.target === this.eGui) {
            const lastFocusEvent = this.lastFocusEvent;
            const fromTab = !!(lastFocusEvent && lastFocusEvent.key === keyCode_1.KeyCode.TAB);
            if (lastFocusEvent && fromTab) {
                const shouldFocusLast = lastFocusEvent.shiftKey;
                this.focusService.focusInto(this.eGui, shouldFocusLast);
            }
        }
        const rowIndex = this.getRowIndex();
        this.beans.focusService.setFocusedHeader(rowIndex, this.column);
    }
    setupHover() {
        this.createManagedBean(new hoverFeature_1.HoverFeature([this.column], this.eGui));
        const listener = () => {
            if (!this.gridOptionsService.get('columnHoverHighlight')) {
                return;
            }
            const hovered = this.beans.columnHoverService.isHovered(this.column);
            this.comp.addOrRemoveCssClass('ag-column-hover', hovered);
        };
        this.addManagedListener(this.eventService, events_1.Events.EVENT_COLUMN_HOVER_CHANGED, listener);
        listener();
    }
    setupLeft() {
        const setLeftFeature = new setLeftFeature_1.SetLeftFeature(this.column, this.eGui, this.beans);
        this.createManagedBean(setLeftFeature);
    }
    setupFilterButton() {
        this.suppressFilterButton = !this.menuService.isFloatingFilterButtonEnabled(this.column);
        this.highlightFilterButtonWhenActive = !this.menuService.isLegacyMenuEnabled();
    }
    setupUserComp() {
        if (!this.active) {
            return;
        }
        const compDetails = this.beans.filterManager.getFloatingFilterCompDetails(this.column, () => this.showParentFilter());
        if (compDetails) {
            this.setCompDetails(compDetails);
        }
    }
    setCompDetails(compDetails) {
        this.userCompDetails = compDetails;
        this.comp.setCompDetails(compDetails);
    }
    showParentFilter() {
        const eventSource = this.suppressFilterButton ? this.eFloatingFilterBody : this.eButtonShowMainFilter;
        this.menuService.showFilterMenu({
            column: this.column,
            buttonElement: eventSource,
            containerType: 'floatingFilter',
            positionBy: 'button'
        });
    }
    setupSyncWithFilter() {
        if (!this.active) {
            return;
        }
        const { filterManager } = this.beans;
        const syncWithFilter = (filterChangedEvent) => {
            const compPromise = this.comp.getFloatingFilterComp();
            if (!compPromise) {
                return;
            }
            compPromise.then(comp => {
                if (comp) {
                    const parentModel = filterManager.getCurrentFloatingFilterParentModel(this.column);
                    comp.onParentModelChanged(parentModel, filterChangedEvent);
                }
            });
        };
        this.destroySyncListener = this.addManagedListener(this.column, column_1.Column.EVENT_FILTER_CHANGED, syncWithFilter);
        if (filterManager.isFilterActive(this.column)) {
            syncWithFilter(null);
        }
    }
    setupWidth() {
        const listener = () => {
            const width = `${this.column.getActualWidth()}px`;
            this.comp.setWidth(width);
        };
        this.addManagedListener(this.column, column_1.Column.EVENT_WIDTH_CHANGED, listener);
        listener();
    }
    setupFilterChangedListener() {
        if (this.active) {
            this.destroyFilterChangedListener = this.addManagedListener(this.column, column_1.Column.EVENT_FILTER_CHANGED, this.updateFilterButton.bind(this));
            this.updateFilterButton();
        }
    }
    updateFilterButton() {
        if (!this.suppressFilterButton && this.comp) {
            const isFilterAllowed = this.beans.filterManager.isFilterAllowed(this.column);
            this.comp.setButtonWrapperDisplayed(isFilterAllowed);
            if (this.highlightFilterButtonWhenActive && isFilterAllowed) {
                this.eButtonShowMainFilter.classList.toggle('ag-filter-active', this.column.isFilterActive());
            }
        }
    }
    onColDefChanged() {
        var _a, _b;
        const wasActive = this.active;
        this.setupActive();
        const becomeActive = !wasActive && this.active;
        if (wasActive && !this.active) {
            (_a = this.destroySyncListener) === null || _a === void 0 ? void 0 : _a.call(this);
            (_b = this.destroyFilterChangedListener) === null || _b === void 0 ? void 0 : _b.call(this);
        }
        const newCompDetails = this.active
            ? this.beans.filterManager.getFloatingFilterCompDetails(this.column, () => this.showParentFilter())
            : null;
        const compPromise = this.comp.getFloatingFilterComp();
        if (!compPromise || !newCompDetails) {
            this.updateCompDetails(newCompDetails, becomeActive);
        }
        else {
            compPromise.then(compInstance => {
                var _a;
                if (!compInstance || this.beans.filterManager.areFilterCompsDifferent((_a = this.userCompDetails) !== null && _a !== void 0 ? _a : null, newCompDetails)) {
                    this.updateCompDetails(newCompDetails, becomeActive);
                }
                else {
                    this.updateFloatingFilterParams(newCompDetails);
                }
            });
        }
    }
    updateCompDetails(compDetails, becomeActive) {
        if (!this.isAlive()) {
            return;
        }
        this.setCompDetails(compDetails);
        // filter button and UI can change based on params, so always want to update
        this.setupFilterButton();
        this.setupUi();
        if (becomeActive) {
            this.setupSyncWithFilter();
            this.setupFilterChangedListener();
        }
    }
    updateFloatingFilterParams(userCompDetails) {
        var _a;
        if (!userCompDetails) {
            return;
        }
        const params = userCompDetails.params;
        (_a = this.comp.getFloatingFilterComp()) === null || _a === void 0 ? void 0 : _a.then(floatingFilter => {
            let hasRefreshed = false;
            if ((floatingFilter === null || floatingFilter === void 0 ? void 0 : floatingFilter.refresh) && typeof floatingFilter.refresh === 'function') {
                const result = floatingFilter.refresh(params);
                // framework wrapper always implements optional methods, but returns null if no underlying method
                if (result !== null) {
                    hasRefreshed = true;
                }
            }
            if (!hasRefreshed && (floatingFilter === null || floatingFilter === void 0 ? void 0 : floatingFilter.onParamsUpdated) && typeof floatingFilter.onParamsUpdated === 'function') {
                const result = floatingFilter.onParamsUpdated(params);
                if (result !== null) {
                    (0, function_1.warnOnce)(`Custom floating filter method 'onParamsUpdated' is deprecated. Use 'refresh' instead.`);
                }
            }
        });
    }
    destroy() {
        super.destroy();
        this.eButtonShowMainFilter = null;
        this.eFloatingFilterBody = null;
        this.userCompDetails = null;
        this.destroySyncListener = null;
        this.destroyFilterChangedListener = null;
    }
}
exports.HeaderFilterCellCtrl = HeaderFilterCellCtrl;
