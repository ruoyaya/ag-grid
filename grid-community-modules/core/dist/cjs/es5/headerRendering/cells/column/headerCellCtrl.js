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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderCellCtrl = void 0;
var keyCode_1 = require("../../../constants/keyCode");
var dragAndDropService_1 = require("../../../dragAndDrop/dragAndDropService");
var column_1 = require("../../../entities/column");
var eventKeys_1 = require("../../../eventKeys");
var setLeftFeature_1 = require("../../../rendering/features/setLeftFeature");
var aria_1 = require("../../../utils/aria");
var managedFocusFeature_1 = require("../../../widgets/managedFocusFeature");
var tooltipFeature_1 = require("../../../widgets/tooltipFeature");
var abstractHeaderCellCtrl_1 = require("../abstractCell/abstractHeaderCellCtrl");
var cssClassApplier_1 = require("../cssClassApplier");
var hoverFeature_1 = require("../hoverFeature");
var headerComp_1 = require("./headerComp");
var resizeFeature_1 = require("./resizeFeature");
var selectAllFeature_1 = require("./selectAllFeature");
var dom_1 = require("../../../utils/dom");
var columnMoveHelper_1 = require("../../columnMoveHelper");
var direction_1 = require("../../../constants/direction");
var HeaderCellCtrl = /** @class */ (function (_super) {
    __extends(HeaderCellCtrl, _super);
    function HeaderCellCtrl(column, beans, parentRowCtrl) {
        var _this = _super.call(this, column, beans, parentRowCtrl) || this;
        _this.refreshFunctions = [];
        _this.userHeaderClasses = new Set();
        _this.ariaDescriptionProperties = new Map();
        _this.column = column;
        return _this;
    }
    HeaderCellCtrl.prototype.setComp = function (comp, eGui, eResize, eHeaderCompWrapper) {
        var _this = this;
        this.comp = comp;
        this.setGui(eGui);
        this.updateState();
        this.setupWidth();
        this.setupMovingCss();
        this.setupMenuClass();
        this.setupSortableClass();
        this.setupWrapTextClass();
        this.refreshSpanHeaderHeight();
        this.setupAutoHeight(eHeaderCompWrapper);
        this.addColumnHoverListener();
        this.setupFilterClass();
        this.setupClassesFromColDef();
        this.setupTooltip();
        this.addActiveHeaderMouseListeners();
        this.setupSelectAll();
        this.setupUserComp();
        this.refreshAria();
        this.resizeFeature = this.createManagedBean(new resizeFeature_1.ResizeFeature(this.getPinned(), this.column, eResize, comp, this));
        this.createManagedBean(new hoverFeature_1.HoverFeature([this.column], eGui));
        this.createManagedBean(new setLeftFeature_1.SetLeftFeature(this.column, eGui, this.beans));
        this.createManagedBean(new managedFocusFeature_1.ManagedFocusFeature(eGui, {
            shouldStopEventPropagation: function (e) { return _this.shouldStopEventPropagation(e); },
            onTabKeyDown: function () { return null; },
            handleKeyDown: this.handleKeyDown.bind(this),
            onFocusIn: this.onFocusIn.bind(this),
            onFocusOut: this.onFocusOut.bind(this)
        }));
        this.addResizeAndMoveKeyboardListeners();
        this.addManagedPropertyListeners(['suppressMovableColumns', 'suppressMenuHide', 'suppressAggFuncInHeader'], this.refresh.bind(this));
        this.addManagedListener(this.column, column_1.Column.EVENT_COL_DEF_CHANGED, this.refresh.bind(this));
        this.addManagedListener(this.eventService, eventKeys_1.Events.EVENT_COLUMN_VALUE_CHANGED, this.onColumnValueChanged.bind(this));
        this.addManagedListener(this.eventService, eventKeys_1.Events.EVENT_COLUMN_ROW_GROUP_CHANGED, this.onColumnRowGroupChanged.bind(this));
        this.addManagedListener(this.eventService, eventKeys_1.Events.EVENT_COLUMN_PIVOT_CHANGED, this.onColumnPivotChanged.bind(this));
        this.addManagedListener(this.eventService, eventKeys_1.Events.EVENT_HEADER_HEIGHT_CHANGED, this.onHeaderHeightChanged.bind(this));
    };
    HeaderCellCtrl.prototype.resizeHeader = function (delta, shiftKey) {
        var _a, _b;
        if (!this.column.isResizable()) {
            return;
        }
        var actualWidth = this.column.getActualWidth();
        var minWidth = (_a = this.column.getMinWidth()) !== null && _a !== void 0 ? _a : 0;
        var maxWidth = (_b = this.column.getMaxWidth()) !== null && _b !== void 0 ? _b : Number.MAX_SAFE_INTEGER;
        var newWidth = Math.min(Math.max(actualWidth + delta, minWidth), maxWidth);
        this.beans.columnModel.setColumnWidths([{ key: this.column, newWidth: newWidth }], shiftKey, true, 'uiColumnResized');
    };
    HeaderCellCtrl.prototype.moveHeader = function (hDirection) {
        var _a = this, eGui = _a.eGui, column = _a.column, gridOptionsService = _a.gridOptionsService, ctrlsService = _a.ctrlsService;
        var pinned = this.getPinned();
        var left = eGui.getBoundingClientRect().left;
        var width = column.getActualWidth();
        var isRtl = gridOptionsService.get('enableRtl');
        var isLeft = hDirection === direction_1.HorizontalDirection.Left !== isRtl;
        var xPosition = columnMoveHelper_1.ColumnMoveHelper.normaliseX(isLeft ? (left - 20) : (left + width + 20), pinned, true, gridOptionsService, ctrlsService);
        columnMoveHelper_1.ColumnMoveHelper.attemptMoveColumns({
            allMovingColumns: [column],
            isFromHeader: true,
            hDirection: hDirection,
            xPosition: xPosition,
            pinned: pinned,
            fromEnter: false,
            fakeEvent: false,
            gridOptionsService: gridOptionsService,
            columnModel: this.beans.columnModel
        });
        ctrlsService.getGridBodyCtrl().getScrollFeature().ensureColumnVisible(column, 'auto');
    };
    HeaderCellCtrl.prototype.setupUserComp = function () {
        var compDetails = this.lookupUserCompDetails();
        this.setCompDetails(compDetails);
    };
    HeaderCellCtrl.prototype.setCompDetails = function (compDetails) {
        this.userCompDetails = compDetails;
        this.comp.setUserCompDetails(compDetails);
    };
    HeaderCellCtrl.prototype.lookupUserCompDetails = function () {
        var params = this.createParams();
        var colDef = this.column.getColDef();
        return this.userComponentFactory.getHeaderCompDetails(colDef, params);
    };
    HeaderCellCtrl.prototype.createParams = function () {
        var _this = this;
        var params = this.gridOptionsService.addGridCommonParams({
            column: this.column,
            displayName: this.displayName,
            enableSorting: this.column.isSortable(),
            enableMenu: this.menuEnabled,
            enableFilterButton: this.openFilterEnabled && this.menuService.isHeaderFilterButtonEnabled(this.column),
            enableFilterIcon: !this.openFilterEnabled || this.menuService.isLegacyMenuEnabled(),
            showColumnMenu: function (buttonElement) {
                _this.menuService.showColumnMenu({
                    column: _this.column,
                    buttonElement: buttonElement,
                    positionBy: 'button'
                });
            },
            showColumnMenuAfterMouseClick: function (mouseEvent) {
                _this.menuService.showColumnMenu({
                    column: _this.column,
                    mouseEvent: mouseEvent,
                    positionBy: 'mouse'
                });
            },
            showFilter: function (buttonElement) {
                _this.menuService.showFilterMenu({
                    column: _this.column,
                    buttonElement: buttonElement,
                    containerType: 'columnFilter',
                    positionBy: 'button'
                });
            },
            progressSort: function (multiSort) {
                _this.beans.sortController.progressSort(_this.column, !!multiSort, "uiColumnSorted");
            },
            setSort: function (sort, multiSort) {
                _this.beans.sortController.setSortForColumn(_this.column, sort, !!multiSort, "uiColumnSorted");
            },
            eGridHeader: this.getGui()
        });
        return params;
    };
    HeaderCellCtrl.prototype.setupSelectAll = function () {
        this.selectAllFeature = this.createManagedBean(new selectAllFeature_1.SelectAllFeature(this.column));
        this.selectAllFeature.setComp(this);
    };
    HeaderCellCtrl.prototype.getSelectAllGui = function () {
        return this.selectAllFeature.getCheckboxGui();
    };
    HeaderCellCtrl.prototype.handleKeyDown = function (e) {
        _super.prototype.handleKeyDown.call(this, e);
        if (e.key === keyCode_1.KeyCode.SPACE) {
            this.selectAllFeature.onSpaceKeyDown(e);
        }
        if (e.key === keyCode_1.KeyCode.ENTER) {
            this.onEnterKeyDown(e);
        }
        if (e.key === keyCode_1.KeyCode.DOWN && e.altKey) {
            this.showMenuOnKeyPress(e, false);
        }
    };
    HeaderCellCtrl.prototype.onEnterKeyDown = function (e) {
        if (e.ctrlKey || e.metaKey) {
            this.showMenuOnKeyPress(e, true);
        }
        else if (this.sortable) {
            var multiSort = e.shiftKey;
            this.beans.sortController.progressSort(this.column, multiSort, "uiColumnSorted");
        }
    };
    HeaderCellCtrl.prototype.showMenuOnKeyPress = function (e, isFilterShortcut) {
        var headerComp = this.comp.getUserCompInstance();
        if (!headerComp || !(headerComp instanceof headerComp_1.HeaderComp)) {
            return;
        }
        // the header comp knows what features are enabled, so let it handle the shortcut
        if (headerComp.onMenuKeyboardShortcut(isFilterShortcut)) {
            e.preventDefault();
        }
    };
    HeaderCellCtrl.prototype.onFocusIn = function (e) {
        if (!this.getGui().contains(e.relatedTarget)) {
            var rowIndex = this.getRowIndex();
            this.focusService.setFocusedHeader(rowIndex, this.column);
            this.announceAriaDescription();
        }
        if (this.focusService.isKeyboardMode()) {
            this.setActiveHeader(true);
        }
    };
    HeaderCellCtrl.prototype.onFocusOut = function (e) {
        if (this.getGui().contains(e.relatedTarget)) {
            return;
        }
        this.setActiveHeader(false);
    };
    HeaderCellCtrl.prototype.setupTooltip = function () {
        var _this = this;
        var tooltipCtrl = {
            getColumn: function () { return _this.column; },
            getColDef: function () { return _this.column.getColDef(); },
            getGui: function () { return _this.eGui; },
            getLocation: function () { return 'header'; },
            getTooltipValue: function () {
                var res = _this.column.getColDef().headerTooltip;
                return res;
            },
        };
        var tooltipFeature = this.createManagedBean(new tooltipFeature_1.TooltipFeature(tooltipCtrl, this.beans));
        tooltipFeature.setComp(this.eGui);
        this.refreshFunctions.push(function () { return tooltipFeature.refreshToolTip(); });
    };
    HeaderCellCtrl.prototype.setupClassesFromColDef = function () {
        var _this = this;
        var refreshHeaderClasses = function () {
            var colDef = _this.column.getColDef();
            var classes = cssClassApplier_1.CssClassApplier.getHeaderClassesFromColDef(colDef, _this.gridOptionsService, _this.column, null);
            var oldClasses = _this.userHeaderClasses;
            _this.userHeaderClasses = new Set(classes);
            classes.forEach(function (c) {
                if (oldClasses.has(c)) {
                    // class already added, no need to apply it, but remove from old set
                    oldClasses.delete(c);
                }
                else {
                    // class new since last time, so apply it
                    _this.comp.addOrRemoveCssClass(c, true);
                }
            });
            // now old set only has classes that were applied last time, but not this time, so remove them
            oldClasses.forEach(function (c) { return _this.comp.addOrRemoveCssClass(c, false); });
        };
        this.refreshFunctions.push(refreshHeaderClasses);
        refreshHeaderClasses();
    };
    HeaderCellCtrl.prototype.setDragSource = function (eSource) {
        var _this = this;
        this.dragSourceElement = eSource;
        this.removeDragSource();
        if (!eSource || !this.draggable) {
            return;
        }
        var _a = this, column = _a.column, beans = _a.beans, displayName = _a.displayName, dragAndDropService = _a.dragAndDropService, gridOptionsService = _a.gridOptionsService;
        var columnModel = beans.columnModel;
        var hideColumnOnExit = !this.gridOptionsService.get('suppressDragLeaveHidesColumns');
        var dragSource = this.dragSource = {
            type: dragAndDropService_1.DragSourceType.HeaderCell,
            eElement: eSource,
            getDefaultIconName: function () { return hideColumnOnExit ? dragAndDropService_1.DragAndDropService.ICON_HIDE : dragAndDropService_1.DragAndDropService.ICON_NOT_ALLOWED; },
            getDragItem: function () { return _this.createDragItem(column); },
            dragItemName: displayName,
            onDragStarted: function () {
                hideColumnOnExit = !gridOptionsService.get('suppressDragLeaveHidesColumns');
                column.setMoving(true, "uiColumnMoved");
            },
            onDragStopped: function () { return column.setMoving(false, "uiColumnMoved"); },
            onGridEnter: function (dragItem) {
                var _a;
                if (hideColumnOnExit) {
                    var unlockedColumns = ((_a = dragItem === null || dragItem === void 0 ? void 0 : dragItem.columns) === null || _a === void 0 ? void 0 : _a.filter(function (col) { return !col.getColDef().lockVisible; })) || [];
                    columnModel.setColumnsVisible(unlockedColumns, true, "uiColumnMoved");
                }
            },
            onGridExit: function (dragItem) {
                var _a;
                if (hideColumnOnExit) {
                    var unlockedColumns = ((_a = dragItem === null || dragItem === void 0 ? void 0 : dragItem.columns) === null || _a === void 0 ? void 0 : _a.filter(function (col) { return !col.getColDef().lockVisible; })) || [];
                    columnModel.setColumnsVisible(unlockedColumns, false, "uiColumnMoved");
                }
            },
        };
        dragAndDropService.addDragSource(dragSource, true);
    };
    HeaderCellCtrl.prototype.createDragItem = function (column) {
        var visibleState = {};
        visibleState[column.getId()] = column.isVisible();
        return {
            columns: [column],
            visibleState: visibleState
        };
    };
    HeaderCellCtrl.prototype.updateState = function () {
        this.menuEnabled = this.menuService.isColumnMenuInHeaderEnabled(this.column);
        this.openFilterEnabled = this.menuService.isFilterMenuInHeaderEnabled(this.column);
        this.sortable = this.column.isSortable();
        this.displayName = this.calculateDisplayName();
        this.draggable = this.workOutDraggable();
    };
    HeaderCellCtrl.prototype.addRefreshFunction = function (func) {
        this.refreshFunctions.push(func);
    };
    HeaderCellCtrl.prototype.refresh = function () {
        this.updateState();
        this.refreshHeaderComp();
        this.refreshAria();
        this.refreshFunctions.forEach(function (f) { return f(); });
    };
    HeaderCellCtrl.prototype.refreshHeaderComp = function () {
        var newCompDetails = this.lookupUserCompDetails();
        var compInstance = this.comp.getUserCompInstance();
        // only try refresh if old comp exists adn it is the correct type
        var attemptRefresh = compInstance != null && this.userCompDetails.componentClass == newCompDetails.componentClass;
        var headerCompRefreshed = attemptRefresh ? this.attemptHeaderCompRefresh(newCompDetails.params) : false;
        if (headerCompRefreshed) {
            // we do this as a refresh happens after colDefs change, and it's possible the column has had it's
            // draggable property toggled. no need to call this if not refreshing, as setDragSource is done
            // as part of appendHeaderComp
            this.setDragSource(this.dragSourceElement);
        }
        else {
            this.setCompDetails(newCompDetails);
        }
    };
    HeaderCellCtrl.prototype.attemptHeaderCompRefresh = function (params) {
        var headerComp = this.comp.getUserCompInstance();
        if (!headerComp) {
            return false;
        }
        // if no refresh method, then we want to replace the headerComp
        if (!headerComp.refresh) {
            return false;
        }
        var res = headerComp.refresh(params);
        return res;
    };
    HeaderCellCtrl.prototype.calculateDisplayName = function () {
        return this.beans.columnModel.getDisplayNameForColumn(this.column, 'header', true);
    };
    HeaderCellCtrl.prototype.checkDisplayName = function () {
        // display name can change if aggFunc different, eg sum(Gold) is now max(Gold)
        if (this.displayName !== this.calculateDisplayName()) {
            this.refresh();
        }
    };
    HeaderCellCtrl.prototype.workOutDraggable = function () {
        var colDef = this.column.getColDef();
        var isSuppressMovableColumns = this.gridOptionsService.get('suppressMovableColumns');
        var colCanMove = !isSuppressMovableColumns && !colDef.suppressMovable && !colDef.lockPosition;
        // we should still be allowed drag the column, even if it can't be moved, if the column
        // can be dragged to a rowGroup or pivot drop zone
        return !!colCanMove || !!colDef.enableRowGroup || !!colDef.enablePivot;
    };
    HeaderCellCtrl.prototype.onColumnRowGroupChanged = function () {
        this.checkDisplayName();
    };
    HeaderCellCtrl.prototype.onColumnPivotChanged = function () {
        this.checkDisplayName();
    };
    HeaderCellCtrl.prototype.onColumnValueChanged = function () {
        this.checkDisplayName();
    };
    HeaderCellCtrl.prototype.setupWidth = function () {
        var _this = this;
        var listener = function () {
            var columnWidth = _this.column.getActualWidth();
            _this.comp.setWidth("".concat(columnWidth, "px"));
        };
        this.addManagedListener(this.column, column_1.Column.EVENT_WIDTH_CHANGED, listener);
        listener();
    };
    HeaderCellCtrl.prototype.setupMovingCss = function () {
        var _this = this;
        var listener = function () {
            // this is what makes the header go dark when it is been moved (gives impression to
            // user that the column was picked up).
            _this.comp.addOrRemoveCssClass('ag-header-cell-moving', _this.column.isMoving());
        };
        this.addManagedListener(this.column, column_1.Column.EVENT_MOVING_CHANGED, listener);
        listener();
    };
    HeaderCellCtrl.prototype.setupMenuClass = function () {
        var _this = this;
        var listener = function () {
            _this.comp.addOrRemoveCssClass('ag-column-menu-visible', _this.column.isMenuVisible());
        };
        this.addManagedListener(this.column, column_1.Column.EVENT_MENU_VISIBLE_CHANGED, listener);
        listener();
    };
    HeaderCellCtrl.prototype.setupSortableClass = function () {
        var _this = this;
        var updateSortableCssClass = function () {
            _this.comp.addOrRemoveCssClass('ag-header-cell-sortable', !!_this.sortable);
        };
        updateSortableCssClass();
        this.addRefreshFunction(updateSortableCssClass);
        this.addManagedListener(this.eventService, column_1.Column.EVENT_SORT_CHANGED, this.refreshAriaSort.bind(this));
    };
    HeaderCellCtrl.prototype.setupFilterClass = function () {
        var _this = this;
        var listener = function () {
            var isFilterActive = _this.column.isFilterActive();
            _this.comp.addOrRemoveCssClass('ag-header-cell-filtered', isFilterActive);
            _this.refreshAria();
        };
        this.addManagedListener(this.column, column_1.Column.EVENT_FILTER_ACTIVE_CHANGED, listener);
        listener();
    };
    HeaderCellCtrl.prototype.setupWrapTextClass = function () {
        var _this = this;
        var listener = function () {
            var wrapText = !!_this.column.getColDef().wrapHeaderText;
            _this.comp.addOrRemoveCssClass('ag-header-cell-wrap-text', wrapText);
        };
        listener();
        this.addRefreshFunction(listener);
    };
    HeaderCellCtrl.prototype.onDisplayedColumnsChanged = function () {
        _super.prototype.onDisplayedColumnsChanged.call(this);
        if (!this.isAlive()) {
            return;
        }
        this.onHeaderHeightChanged();
    };
    HeaderCellCtrl.prototype.onHeaderHeightChanged = function () {
        this.refreshSpanHeaderHeight();
    };
    HeaderCellCtrl.prototype.refreshSpanHeaderHeight = function () {
        var _a = this, eGui = _a.eGui, column = _a.column, comp = _a.comp, beans = _a.beans;
        if (!column.isSpanHeaderHeight()) {
            eGui.style.removeProperty('top');
            eGui.style.removeProperty('height');
            comp.addOrRemoveCssClass('ag-header-span-height', false);
            comp.addOrRemoveCssClass('ag-header-span-total', false);
            return;
        }
        var _b = this.column.getColumnGroupPaddingInfo(), numberOfParents = _b.numberOfParents, isSpanningTotal = _b.isSpanningTotal;
        comp.addOrRemoveCssClass('ag-header-span-height', numberOfParents > 0);
        var columnModel = beans.columnModel;
        var headerHeight = columnModel.getColumnHeaderRowHeight();
        if (numberOfParents === 0) {
            // if spanning has stopped then need to reset these values.
            comp.addOrRemoveCssClass('ag-header-span-total', false);
            eGui.style.setProperty('top', "0px");
            eGui.style.setProperty('height', "".concat(headerHeight, "px"));
            return;
        }
        comp.addOrRemoveCssClass('ag-header-span-total', isSpanningTotal);
        var pivotMode = columnModel.isPivotMode();
        var groupHeaderHeight = pivotMode
            ? columnModel.getPivotGroupHeaderHeight()
            : columnModel.getGroupHeaderHeight();
        var extraHeight = numberOfParents * groupHeaderHeight;
        eGui.style.setProperty('top', "".concat(-extraHeight, "px"));
        eGui.style.setProperty('height', "".concat(headerHeight + extraHeight, "px"));
    };
    HeaderCellCtrl.prototype.setupAutoHeight = function (wrapperElement) {
        var _this = this;
        var _a = this.beans, columnModel = _a.columnModel, resizeObserverService = _a.resizeObserverService;
        var measureHeight = function (timesCalled) {
            if (!_this.isAlive()) {
                return;
            }
            var _a = (0, dom_1.getElementSize)(_this.getGui()), paddingTop = _a.paddingTop, paddingBottom = _a.paddingBottom, borderBottomWidth = _a.borderBottomWidth, borderTopWidth = _a.borderTopWidth;
            var extraHeight = paddingTop + paddingBottom + borderBottomWidth + borderTopWidth;
            var wrapperHeight = wrapperElement.offsetHeight;
            var autoHeight = wrapperHeight + extraHeight;
            if (timesCalled < 5) {
                // if not in doc yet, means framework not yet inserted, so wait for next VM turn,
                // maybe it will be ready next VM turn
                var doc = _this.beans.gridOptionsService.getDocument();
                var notYetInDom = !doc || !doc.contains(wrapperElement);
                // this happens in React, where React hasn't put any content in. we say 'possibly'
                // as a) may not be React and b) the cell could be empty anyway
                var possiblyNoContentYet = autoHeight == 0;
                if (notYetInDom || possiblyNoContentYet) {
                    window.setTimeout(function () { return measureHeight(timesCalled + 1); }, 0);
                    return;
                }
            }
            columnModel.setColumnHeaderHeight(_this.column, autoHeight);
        };
        var isMeasuring = false;
        var stopResizeObserver;
        var checkMeasuring = function () {
            var newValue = _this.column.isAutoHeaderHeight();
            if (newValue && !isMeasuring) {
                startMeasuring();
            }
            if (!newValue && isMeasuring) {
                stopMeasuring();
            }
        };
        var startMeasuring = function () {
            isMeasuring = true;
            measureHeight(0);
            _this.comp.addOrRemoveCssClass('ag-header-cell-auto-height', true);
            stopResizeObserver = resizeObserverService.observeResize(wrapperElement, function () { return measureHeight(0); });
        };
        var stopMeasuring = function () {
            isMeasuring = false;
            if (stopResizeObserver) {
                stopResizeObserver();
            }
            _this.comp.addOrRemoveCssClass('ag-header-cell-auto-height', false);
            stopResizeObserver = undefined;
        };
        checkMeasuring();
        this.addDestroyFunc(function () { return stopMeasuring(); });
        // In theory we could rely on the resize observer for everything - but since it's debounced
        // it can be a little janky for smooth movement. in this case its better to react to our own events
        // And unfortunately we cant _just_ rely on our own events, since custom components can change whenever
        this.addManagedListener(this.column, column_1.Column.EVENT_WIDTH_CHANGED, function () { return isMeasuring && measureHeight(0); });
        // Displaying the sort icon changes the available area for text, so sort changes can affect height
        this.addManagedListener(this.eventService, column_1.Column.EVENT_SORT_CHANGED, function () {
            // Rendering changes for sort, happen after the event... not ideal
            if (isMeasuring) {
                window.setTimeout(function () { return measureHeight(0); });
            }
        });
        this.addRefreshFunction(checkMeasuring);
    };
    HeaderCellCtrl.prototype.refreshAriaSort = function () {
        if (this.sortable) {
            var translate = this.localeService.getLocaleTextFunc();
            var sort = this.beans.sortController.getDisplaySortForColumn(this.column) || null;
            this.comp.setAriaSort((0, aria_1.getAriaSortState)(sort));
            this.setAriaDescriptionProperty('sort', translate('ariaSortableColumn', 'Press ENTER to sort'));
        }
        else {
            this.comp.setAriaSort();
            this.setAriaDescriptionProperty('sort', null);
        }
    };
    HeaderCellCtrl.prototype.refreshAriaMenu = function () {
        if (this.menuEnabled) {
            var translate = this.localeService.getLocaleTextFunc();
            this.setAriaDescriptionProperty('menu', translate('ariaMenuColumn', 'Press ALT DOWN to open column menu'));
        }
        else {
            this.setAriaDescriptionProperty('menu', null);
        }
    };
    HeaderCellCtrl.prototype.refreshAriaFilterButton = function () {
        if (this.openFilterEnabled && !this.menuService.isLegacyMenuEnabled()) {
            var translate = this.localeService.getLocaleTextFunc();
            this.setAriaDescriptionProperty('filterButton', translate('ariaFilterColumn', 'Press CTRL ENTER to open filter'));
        }
        else {
            this.setAriaDescriptionProperty('filterButton', null);
        }
    };
    HeaderCellCtrl.prototype.refreshAriaFiltered = function () {
        var translate = this.localeService.getLocaleTextFunc();
        var isFilterActive = this.column.isFilterActive();
        if (isFilterActive) {
            this.setAriaDescriptionProperty('filter', translate('ariaColumnFiltered', 'Column Filtered'));
        }
        else {
            this.setAriaDescriptionProperty('filter', null);
        }
    };
    HeaderCellCtrl.prototype.setAriaDescriptionProperty = function (property, value) {
        if (value != null) {
            this.ariaDescriptionProperties.set(property, value);
        }
        else {
            this.ariaDescriptionProperties.delete(property);
        }
    };
    HeaderCellCtrl.prototype.announceAriaDescription = function () {
        var _this = this;
        var eDocument = this.beans.gridOptionsService.getDocument();
        if (!this.eGui.contains(eDocument.activeElement)) {
            return;
        }
        var ariaDescription = Array.from(this.ariaDescriptionProperties.keys())
            // always announce the filter description first
            .sort(function (a, b) { return a === 'filter' ? -1 : (b.charCodeAt(0) - a.charCodeAt(0)); })
            .map(function (key) { return _this.ariaDescriptionProperties.get(key); })
            .join('. ');
        this.beans.ariaAnnouncementService.announceValue(ariaDescription);
    };
    HeaderCellCtrl.prototype.refreshAria = function () {
        this.refreshAriaSort();
        this.refreshAriaMenu();
        this.refreshAriaFilterButton();
        this.refreshAriaFiltered();
    };
    HeaderCellCtrl.prototype.addColumnHoverListener = function () {
        var _this = this;
        var listener = function () {
            if (!_this.gridOptionsService.get('columnHoverHighlight')) {
                return;
            }
            var isHovered = _this.beans.columnHoverService.isHovered(_this.column);
            _this.comp.addOrRemoveCssClass('ag-column-hover', isHovered);
        };
        this.addManagedListener(this.eventService, eventKeys_1.Events.EVENT_COLUMN_HOVER_CHANGED, listener);
        listener();
    };
    HeaderCellCtrl.prototype.getColId = function () {
        return this.column.getColId();
    };
    HeaderCellCtrl.prototype.addActiveHeaderMouseListeners = function () {
        var _this = this;
        var listener = function (e) { return _this.handleMouseOverChange(e.type === 'mouseenter'); };
        var clickListener = function () { return _this.dispatchColumnMouseEvent(eventKeys_1.Events.EVENT_COLUMN_HEADER_CLICKED, _this.column); };
        var contextMenuListener = function (event) { return _this.handleContextMenuMouseEvent(event, undefined, _this.column); };
        this.addManagedListener(this.getGui(), 'mouseenter', listener);
        this.addManagedListener(this.getGui(), 'mouseleave', listener);
        this.addManagedListener(this.getGui(), 'click', clickListener);
        this.addManagedListener(this.getGui(), 'contextmenu', contextMenuListener);
    };
    HeaderCellCtrl.prototype.handleMouseOverChange = function (isMouseOver) {
        this.setActiveHeader(isMouseOver);
        var eventType = isMouseOver ?
            eventKeys_1.Events.EVENT_COLUMN_HEADER_MOUSE_OVER :
            eventKeys_1.Events.EVENT_COLUMN_HEADER_MOUSE_LEAVE;
        var event = {
            type: eventType,
            column: this.column,
        };
        this.eventService.dispatchEvent(event);
    };
    HeaderCellCtrl.prototype.setActiveHeader = function (active) {
        this.comp.addOrRemoveCssClass('ag-header-active', active);
    };
    HeaderCellCtrl.prototype.getAnchorElementForMenu = function (isFilter) {
        var headerComp = this.comp.getUserCompInstance();
        if (headerComp instanceof headerComp_1.HeaderComp) {
            return headerComp.getAnchorElementForMenu(isFilter);
        }
        return this.getGui();
    };
    HeaderCellCtrl.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.refreshFunctions = null;
        this.selectAllFeature = null;
        this.dragSourceElement = null;
        this.userCompDetails = null;
        this.userHeaderClasses = null;
        this.ariaDescriptionProperties = null;
    };
    return HeaderCellCtrl;
}(abstractHeaderCellCtrl_1.AbstractHeaderCellCtrl));
exports.HeaderCellCtrl = HeaderCellCtrl;
