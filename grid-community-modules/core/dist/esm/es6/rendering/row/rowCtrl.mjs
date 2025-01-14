import { BeanStub } from "../../context/beanStub.mjs";
import { RowNode } from "../../entities/rowNode.mjs";
import { RowHighlightPosition } from "../../interfaces/iRowNode.mjs";
import { Events } from "../../events.mjs";
import { RowContainerType } from "../../gridBodyComp/rowContainer/rowContainerCtrl.mjs";
import { ModuleNames } from "../../modules/moduleNames.mjs";
import { ModuleRegistry } from "../../modules/moduleRegistry.mjs";
import { setAriaExpanded, setAriaRowIndex, setAriaSelected } from "../../utils/aria.mjs";
import { isElementChildOfClass } from "../../utils/dom.mjs";
import { isStopPropagationForAgGrid } from "../../utils/event.mjs";
import { warnOnce, executeNextVMTurn } from "../../utils/function.mjs";
import { exists, makeNull } from "../../utils/generic.mjs";
import { escapeString } from "../../utils/string.mjs";
import { CellCtrl } from "../cell/cellCtrl.mjs";
import { RowDragComp } from "./rowDragComp.mjs";
var RowType;
(function (RowType) {
    RowType["Normal"] = "Normal";
    RowType["FullWidth"] = "FullWidth";
    RowType["FullWidthLoading"] = "FullWidthLoading";
    RowType["FullWidthGroup"] = "FullWidthGroup";
    RowType["FullWidthDetail"] = "FullWidthDetail";
})(RowType || (RowType = {}));
let instanceIdSequence = 0;
export class RowCtrl extends BeanStub {
    constructor(rowNode, beans, animateIn, useAnimationFrameForCreate, printLayout) {
        super();
        this.allRowGuis = [];
        this.active = true;
        this.centerCellCtrls = { list: [], map: {} };
        this.leftCellCtrls = { list: [], map: {} };
        this.rightCellCtrls = { list: [], map: {} };
        this.slideInAnimation = {
            left: false,
            center: false,
            right: false,
            fullWidth: false
        };
        this.fadeInAnimation = {
            left: false,
            center: false,
            right: false,
            fullWidth: false
        };
        this.rowDragComps = [];
        this.lastMouseDownOnDragger = false;
        this.emptyStyle = {};
        this.updateColumnListsPending = false;
        this.rowId = null;
        this.businessKeySanitised = null;
        this.beans = beans;
        this.gridOptionsService = beans.gridOptionsService;
        this.rowNode = rowNode;
        this.paginationPage = beans.paginationProxy.getCurrentPage();
        this.useAnimationFrameForCreate = useAnimationFrameForCreate;
        this.printLayout = printLayout;
        this.suppressRowTransform = this.gridOptionsService.get('suppressRowTransform');
        this.instanceId = rowNode.id + '-' + instanceIdSequence++;
        this.rowId = escapeString(rowNode.id);
        this.initRowBusinessKey();
        this.rowFocused = beans.focusService.isRowFocused(this.rowNode.rowIndex, this.rowNode.rowPinned);
        this.rowLevel = beans.rowCssClassCalculator.calculateRowLevel(this.rowNode);
        this.setRowType();
        this.setAnimateFlags(animateIn);
        this.rowStyles = this.processStylesFromGridOptions();
        // calls to `isFullWidth()` only work after `setRowType` has been called.
        if (this.isFullWidth() && !this.gridOptionsService.get('suppressCellFocus')) {
            this.tabIndex = -1;
        }
        this.addListeners();
    }
    initRowBusinessKey() {
        this.businessKeyForNodeFunc = this.gridOptionsService.get('getBusinessKeyForNode');
        this.updateRowBusinessKey();
    }
    updateRowBusinessKey() {
        if (typeof this.businessKeyForNodeFunc !== 'function') {
            return;
        }
        const businessKey = this.businessKeyForNodeFunc(this.rowNode);
        this.businessKeySanitised = escapeString(businessKey);
    }
    getRowId() {
        return this.rowId;
    }
    getRowStyles() {
        return this.rowStyles;
    }
    getTabIndex() {
        return this.tabIndex;
    }
    isSticky() {
        return this.rowNode.sticky;
    }
    getBeans() {
        return this.beans;
    }
    getInstanceId() {
        return this.instanceId;
    }
    setComp(rowComp, element, containerType) {
        const gui = { rowComp, element, containerType };
        this.allRowGuis.push(gui);
        if (containerType === RowContainerType.LEFT) {
            this.leftGui = gui;
        }
        else if (containerType === RowContainerType.RIGHT) {
            this.rightGui = gui;
        }
        else if (containerType === RowContainerType.FULL_WIDTH) {
            this.fullWidthGui = gui;
        }
        else {
            this.centerGui = gui;
        }
        this.initialiseRowComp(gui);
        // pinned rows render before the main grid body in the SSRM, only fire the event after the main body has rendered.
        if (this.rowType !== 'FullWidthLoading' && !this.rowNode.rowPinned) {
            // this is fired within setComp as we know that the component renderer is now trying to render.
            // linked with the fact the function implementation queues behind requestAnimationFrame should allow
            // us to be certain that all rendering is done by the time the event fires.
            this.beans.rowRenderer.dispatchFirstDataRenderedEvent();
        }
    }
    unsetComp(containerType) {
        this.allRowGuis = this.allRowGuis
            .filter(rowGui => rowGui.containerType !== containerType);
        switch (containerType) {
            case RowContainerType.LEFT:
                this.leftGui = undefined;
                break;
            case RowContainerType.RIGHT:
                this.rightGui = undefined;
                break;
            case RowContainerType.FULL_WIDTH:
                this.fullWidthGui = undefined;
                break;
            case RowContainerType.CENTER:
                this.centerGui = undefined;
                break;
            default:
        }
    }
    isCacheable() {
        return this.rowType === RowType.FullWidthDetail
            && this.gridOptionsService.get('keepDetailRows');
    }
    setCached(cached) {
        const displayValue = cached ? 'none' : '';
        this.allRowGuis.forEach(rg => rg.element.style.display = displayValue);
    }
    initialiseRowComp(gui) {
        const gos = this.gridOptionsService;
        this.listenOnDomOrder(gui);
        if (this.beans.columnModel.wasAutoRowHeightEverActive()) {
            this.rowNode.checkAutoHeights();
        }
        this.onRowHeightChanged(gui);
        this.updateRowIndexes(gui);
        this.setFocusedClasses(gui);
        this.setStylesFromGridOptions(false, gui); // no need to calculate styles already set in constructor
        if (gos.isRowSelection() && this.rowNode.selectable) {
            this.onRowSelected(gui);
        }
        this.updateColumnLists(!this.useAnimationFrameForCreate);
        const comp = gui.rowComp;
        const initialRowClasses = this.getInitialRowClasses(gui.containerType);
        initialRowClasses.forEach(name => comp.addOrRemoveCssClass(name, true));
        this.executeSlideAndFadeAnimations(gui);
        if (this.rowNode.group) {
            setAriaExpanded(gui.element, this.rowNode.expanded == true);
        }
        this.setRowCompRowId(comp);
        this.setRowCompRowBusinessKey(comp);
        // DOM DATA
        gos.setDomData(gui.element, RowCtrl.DOM_DATA_KEY_ROW_CTRL, this);
        this.addDestroyFunc(() => gos.setDomData(gui.element, RowCtrl.DOM_DATA_KEY_ROW_CTRL, null));
        // adding hover functionality adds listener to this row, so we
        // do it lazily in an animation frame
        if (this.useAnimationFrameForCreate) {
            this.beans.animationFrameService.createTask(this.addHoverFunctionality.bind(this, gui.element), this.rowNode.rowIndex, 'createTasksP2');
        }
        else {
            this.addHoverFunctionality(gui.element);
        }
        if (this.isFullWidth()) {
            this.setupFullWidth(gui);
        }
        if (gos.get('rowDragEntireRow')) {
            this.addRowDraggerToRow(gui);
        }
        if (this.useAnimationFrameForCreate) {
            // the height animation we only want active after the row is alive for 1 second.
            // this stops the row animation working when rows are initially created. otherwise
            // auto-height rows get inserted into the dom and resized immediately, which gives
            // very bad UX (eg 10 rows get inserted, then all 10 expand, look particularly bad
            // when scrolling). so this makes sure when rows are shown for the first time, they
            // are resized immediately without animation.
            this.beans.animationFrameService.addDestroyTask(() => {
                if (!this.isAlive()) {
                    return;
                }
                gui.rowComp.addOrRemoveCssClass('ag-after-created', true);
            });
        }
        this.executeProcessRowPostCreateFunc();
    }
    setRowCompRowBusinessKey(comp) {
        if (this.businessKeySanitised == null) {
            return;
        }
        comp.setRowBusinessKey(this.businessKeySanitised);
    }
    getBusinessKey() {
        return this.businessKeySanitised;
    }
    setRowCompRowId(comp) {
        this.rowId = escapeString(this.rowNode.id);
        if (this.rowId == null) {
            return;
        }
        comp.setRowId(this.rowId);
    }
    executeSlideAndFadeAnimations(gui) {
        const { containerType } = gui;
        const shouldSlide = this.slideInAnimation[containerType];
        if (shouldSlide) {
            executeNextVMTurn(() => {
                this.onTopChanged();
            });
            this.slideInAnimation[containerType] = false;
        }
        const shouldFade = this.fadeInAnimation[containerType];
        if (shouldFade) {
            executeNextVMTurn(() => {
                gui.rowComp.addOrRemoveCssClass('ag-opacity-zero', false);
            });
            this.fadeInAnimation[containerType] = false;
        }
    }
    addRowDraggerToRow(gui) {
        if (this.gridOptionsService.get('enableRangeSelection')) {
            warnOnce('Setting `rowDragEntireRow: true` in the gridOptions doesn\'t work with `enableRangeSelection: true`');
            return;
        }
        const translate = this.beans.localeService.getLocaleTextFunc();
        const rowDragComp = new RowDragComp(() => `1 ${translate('rowDragRow', 'row')}`, this.rowNode, undefined, gui.element, undefined, true);
        const rowDragBean = this.createBean(rowDragComp, this.beans.context);
        this.rowDragComps.push(rowDragBean);
    }
    setupFullWidth(gui) {
        const pinned = this.getPinnedForContainer(gui.containerType);
        const params = this.createFullWidthParams(gui.element, pinned);
        if (this.rowType == RowType.FullWidthDetail) {
            if (!ModuleRegistry.__assertRegistered(ModuleNames.MasterDetailModule, "cell renderer 'agDetailCellRenderer' (for master detail)", this.beans.context.getGridId())) {
                return;
            }
        }
        let compDetails;
        switch (this.rowType) {
            case RowType.FullWidthDetail:
                compDetails = this.beans.userComponentFactory.getFullWidthDetailCellRendererDetails(params);
                break;
            case RowType.FullWidthGroup:
                compDetails = this.beans.userComponentFactory.getFullWidthGroupCellRendererDetails(params);
                break;
            case RowType.FullWidthLoading:
                compDetails = this.beans.userComponentFactory.getFullWidthLoadingCellRendererDetails(params);
                break;
            default:
                compDetails = this.beans.userComponentFactory.getFullWidthCellRendererDetails(params);
                break;
        }
        gui.rowComp.showFullWidth(compDetails);
    }
    isPrintLayout() {
        return this.printLayout;
    }
    getFullWidthCellRenderers() {
        var _a, _b;
        if (this.gridOptionsService.get('embedFullWidthRows')) {
            return this.allRowGuis.map(gui => { var _a; return (_a = gui === null || gui === void 0 ? void 0 : gui.rowComp) === null || _a === void 0 ? void 0 : _a.getFullWidthCellRenderer(); });
        }
        return [(_b = (_a = this.fullWidthGui) === null || _a === void 0 ? void 0 : _a.rowComp) === null || _b === void 0 ? void 0 : _b.getFullWidthCellRenderer()];
    }
    // use by autoWidthCalculator, as it clones the elements
    getCellElement(column) {
        const cellCtrl = this.getCellCtrl(column);
        return cellCtrl ? cellCtrl.getGui() : null;
    }
    executeProcessRowPostCreateFunc() {
        const func = this.gridOptionsService.getCallback('processRowPostCreate');
        if (!func || !this.areAllContainersReady()) {
            return;
        }
        const params = {
            // areAllContainersReady asserts that centerGui is not null
            eRow: this.centerGui.element,
            ePinnedLeftRow: this.leftGui ? this.leftGui.element : undefined,
            ePinnedRightRow: this.rightGui ? this.rightGui.element : undefined,
            node: this.rowNode,
            rowIndex: this.rowNode.rowIndex,
            addRenderedRowListener: this.addEventListener.bind(this),
        };
        func(params);
    }
    areAllContainersReady() {
        const isLeftReady = !!this.leftGui || !this.beans.columnModel.isPinningLeft();
        const isCenterReady = !!this.centerGui;
        const isRightReady = !!this.rightGui || !this.beans.columnModel.isPinningRight();
        return isLeftReady && isCenterReady && isRightReady;
    }
    setRowType() {
        const isStub = this.rowNode.stub;
        const isFullWidthCell = this.rowNode.isFullWidthCell();
        const isDetailCell = this.gridOptionsService.get('masterDetail') && this.rowNode.detail;
        const pivotMode = this.beans.columnModel.isPivotMode();
        // we only use full width for groups, not footers. it wouldn't make sense to include footers if not looking
        // for totals. if users complain about this, then we should introduce a new property 'footerUseEntireRow'
        // so each can be set independently (as a customer complained about footers getting full width, hence
        // introducing this logic)
        const isGroupRow = !!this.rowNode.group && !this.rowNode.footer;
        const isFullWidthGroup = isGroupRow && this.gridOptionsService.isGroupUseEntireRow(pivotMode);
        if (isStub) {
            this.rowType = RowType.FullWidthLoading;
        }
        else if (isDetailCell) {
            this.rowType = RowType.FullWidthDetail;
        }
        else if (isFullWidthCell) {
            this.rowType = RowType.FullWidth;
        }
        else if (isFullWidthGroup) {
            this.rowType = RowType.FullWidthGroup;
        }
        else {
            this.rowType = RowType.Normal;
        }
    }
    updateColumnLists(suppressAnimationFrame = false, useFlushSync = false) {
        if (this.isFullWidth()) {
            return;
        }
        const noAnimation = suppressAnimationFrame
            || this.gridOptionsService.get('suppressAnimationFrame')
            || this.printLayout;
        if (noAnimation) {
            this.updateColumnListsImpl(useFlushSync);
            return;
        }
        if (this.updateColumnListsPending) {
            return;
        }
        this.beans.animationFrameService.createTask(() => {
            if (!this.active) {
                return;
            }
            this.updateColumnListsImpl(true);
        }, this.rowNode.rowIndex, 'createTasksP1');
        this.updateColumnListsPending = true;
    }
    createCellCtrls(prev, cols, pinned = null) {
        const res = {
            list: [],
            map: {}
        };
        const addCell = (colInstanceId, cellCtrl) => {
            res.list.push(cellCtrl);
            res.map[colInstanceId] = cellCtrl;
        };
        cols.forEach(col => {
            // we use instanceId's rather than colId as it's possible there is a Column with same Id,
            // but it's referring to a different column instance. Happens a lot with pivot, as pivot col id's are
            // reused eg pivot_0, pivot_1 etc
            const colInstanceId = col.getInstanceId();
            let cellCtrl = prev.map[colInstanceId];
            if (!cellCtrl) {
                cellCtrl = new CellCtrl(col, this.rowNode, this.beans, this);
            }
            addCell(colInstanceId, cellCtrl);
        });
        prev.list.forEach(prevCellCtrl => {
            const cellInResult = res.map[prevCellCtrl.getColumn().getInstanceId()] != null;
            if (cellInResult) {
                return;
            }
            const keepCell = !this.isCellEligibleToBeRemoved(prevCellCtrl, pinned);
            if (keepCell) {
                addCell(prevCellCtrl.getColumn().getInstanceId(), prevCellCtrl);
                return;
            }
            prevCellCtrl.destroy();
        });
        return res;
    }
    updateColumnListsImpl(useFlushSync) {
        this.updateColumnListsPending = false;
        this.createAllCellCtrls();
        this.setCellCtrls(useFlushSync);
    }
    setCellCtrls(useFlushSync) {
        this.allRowGuis.forEach(item => {
            const cellControls = this.getCellCtrlsForContainer(item.containerType);
            item.rowComp.setCellCtrls(cellControls, useFlushSync);
        });
    }
    getCellCtrlsForContainer(containerType) {
        switch (containerType) {
            case RowContainerType.LEFT:
                return this.leftCellCtrls.list;
            case RowContainerType.RIGHT:
                return this.rightCellCtrls.list;
            case RowContainerType.FULL_WIDTH:
                return [];
            case RowContainerType.CENTER:
                return this.centerCellCtrls.list;
            default:
                const exhaustiveCheck = containerType;
                throw new Error(`Unhandled case: ${exhaustiveCheck}`);
        }
    }
    createAllCellCtrls() {
        const columnModel = this.beans.columnModel;
        if (this.printLayout) {
            this.centerCellCtrls = this.createCellCtrls(this.centerCellCtrls, columnModel.getAllDisplayedColumns());
            this.leftCellCtrls = { list: [], map: {} };
            this.rightCellCtrls = { list: [], map: {} };
        }
        else {
            const centerCols = columnModel.getViewportCenterColumnsForRow(this.rowNode);
            this.centerCellCtrls = this.createCellCtrls(this.centerCellCtrls, centerCols);
            const leftCols = columnModel.getDisplayedLeftColumnsForRow(this.rowNode);
            this.leftCellCtrls = this.createCellCtrls(this.leftCellCtrls, leftCols, 'left');
            const rightCols = columnModel.getDisplayedRightColumnsForRow(this.rowNode);
            this.rightCellCtrls = this.createCellCtrls(this.rightCellCtrls, rightCols, 'right');
        }
    }
    isCellEligibleToBeRemoved(cellCtrl, nextContainerPinned) {
        const REMOVE_CELL = true;
        const KEEP_CELL = false;
        // always remove the cell if it's not rendered or if it's in the wrong pinned location
        const column = cellCtrl.getColumn();
        if (column.getPinned() != nextContainerPinned) {
            return REMOVE_CELL;
        }
        // we want to try and keep editing and focused cells
        const editing = cellCtrl.isEditing();
        const focused = this.beans.focusService.isCellFocused(cellCtrl.getCellPosition());
        const mightWantToKeepCell = editing || focused;
        if (mightWantToKeepCell) {
            const column = cellCtrl.getColumn();
            const displayedColumns = this.beans.columnModel.getAllDisplayedColumns();
            const cellStillDisplayed = displayedColumns.indexOf(column) >= 0;
            return cellStillDisplayed ? KEEP_CELL : REMOVE_CELL;
        }
        return REMOVE_CELL;
    }
    getDomOrder() {
        const isEnsureDomOrder = this.gridOptionsService.get('ensureDomOrder');
        return isEnsureDomOrder || this.gridOptionsService.isDomLayout('print');
    }
    listenOnDomOrder(gui) {
        const listener = () => {
            gui.rowComp.setDomOrder(this.getDomOrder());
        };
        this.addManagedPropertyListener('domLayout', listener);
        this.addManagedPropertyListener('ensureDomOrder', listener);
    }
    setAnimateFlags(animateIn) {
        if (this.isSticky() || !animateIn) {
            return;
        }
        const oldRowTopExists = exists(this.rowNode.oldRowTop);
        const pinningLeft = this.beans.columnModel.isPinningLeft();
        const pinningRight = this.beans.columnModel.isPinningRight();
        if (oldRowTopExists) {
            if (this.isFullWidth() && !this.gridOptionsService.get('embedFullWidthRows')) {
                this.slideInAnimation.fullWidth = true;
                return;
            }
            // if the row had a previous position, we slide it in
            this.slideInAnimation.center = true;
            this.slideInAnimation.left = pinningLeft;
            this.slideInAnimation.right = pinningRight;
        }
        else {
            if (this.isFullWidth() && !this.gridOptionsService.get('embedFullWidthRows')) {
                this.fadeInAnimation.fullWidth = true;
                return;
            }
            // if the row had no previous position, we fade it in
            this.fadeInAnimation.center = true;
            this.fadeInAnimation.left = pinningLeft;
            this.fadeInAnimation.right = pinningRight;
        }
    }
    isEditing() {
        return this.editingRow;
    }
    isFullWidth() {
        return this.rowType !== RowType.Normal;
    }
    getRowType() {
        return this.rowType;
    }
    refreshFullWidth() {
        // returns 'true' if refresh succeeded
        const tryRefresh = (gui, pinned) => {
            if (!gui) {
                return true;
            } // no refresh needed
            return gui.rowComp.refreshFullWidth(() => this.createFullWidthParams(gui.element, pinned));
        };
        const fullWidthSuccess = tryRefresh(this.fullWidthGui, null);
        const centerSuccess = tryRefresh(this.centerGui, null);
        const leftSuccess = tryRefresh(this.leftGui, 'left');
        const rightSuccess = tryRefresh(this.rightGui, 'right');
        const allFullWidthRowsRefreshed = fullWidthSuccess && centerSuccess && leftSuccess && rightSuccess;
        return allFullWidthRowsRefreshed;
    }
    addListeners() {
        this.addManagedListener(this.rowNode, RowNode.EVENT_HEIGHT_CHANGED, () => this.onRowHeightChanged());
        this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_SELECTED, () => this.onRowSelected());
        this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_INDEX_CHANGED, this.onRowIndexChanged.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_TOP_CHANGED, this.onTopChanged.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_EXPANDED_CHANGED, this.updateExpandedCss.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_HAS_CHILDREN_CHANGED, this.updateExpandedCss.bind(this));
        if (this.rowNode.detail) {
            // if the master row node has updated data, we also want to try to refresh the detail row
            this.addManagedListener(this.rowNode.parent, RowNode.EVENT_DATA_CHANGED, this.onRowNodeDataChanged.bind(this));
        }
        this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, this.onRowNodeDataChanged.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, this.postProcessCss.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_HIGHLIGHT_CHANGED, this.onRowNodeHighlightChanged.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_DRAGGING_CHANGED, this.postProcessRowDragging.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_UI_LEVEL_CHANGED, this.onUiLevelChanged.bind(this));
        const eventService = this.beans.eventService;
        this.addManagedListener(eventService, Events.EVENT_PAGINATION_PIXEL_OFFSET_CHANGED, this.onPaginationPixelOffsetChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_HEIGHT_SCALE_CHANGED, this.onTopChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_VIRTUAL_COLUMNS_CHANGED, this.onVirtualColumnsChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_CELL_FOCUSED, this.onCellFocusChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_CELL_FOCUS_CLEARED, this.onCellFocusChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_PAGINATION_CHANGED, this.onPaginationChanged.bind(this));
        this.addManagedListener(eventService, Events.EVENT_MODEL_UPDATED, this.refreshFirstAndLastRowStyles.bind(this));
        this.addManagedListener(eventService, Events.EVENT_COLUMN_MOVED, this.updateColumnLists.bind(this));
        this.addDestroyFunc(() => {
            this.destroyBeans(this.rowDragComps, this.beans.context);
        });
        this.addManagedPropertyListeners(['rowDragEntireRow'], () => {
            const useRowDragEntireRow = this.gridOptionsService.get('rowDragEntireRow');
            if (useRowDragEntireRow) {
                this.allRowGuis.forEach(gui => {
                    this.addRowDraggerToRow(gui);
                });
                return;
            }
            this.destroyBeans(this.rowDragComps, this.beans.context);
            this.rowDragComps = [];
        });
        this.addListenersForCellComps();
    }
    addListenersForCellComps() {
        this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_INDEX_CHANGED, () => {
            this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onRowIndexChanged());
        });
        this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, event => {
            this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onCellChanged(event));
        });
    }
    onRowNodeDataChanged(event) {
        // if the row is rendered incorrectly, as the requirements for whether this is a FW row have changed, we force re-render this row.
        const fullWidthChanged = this.isFullWidth() !== !!this.rowNode.isFullWidthCell();
        if (fullWidthChanged) {
            this.beans.rowRenderer.redrawRow(this.rowNode);
            return;
        }
        // this bit of logic handles trying to refresh the FW row ctrl, or delegating to removing/recreating it if unsupported.
        if (this.isFullWidth()) {
            const refresh = this.refreshFullWidth();
            if (!refresh) {
                this.beans.rowRenderer.redrawRow(this.rowNode);
            }
            return;
        }
        // if this is an update, we want to refresh, as this will allow the user to put in a transition
        // into the cellRenderer refresh method. otherwise this might be completely new data, in which case
        // we will want to completely replace the cells
        this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.refreshCell({
            suppressFlash: !event.update,
            newData: !event.update
        }));
        // as data has changed update the dom row id attributes
        this.allRowGuis.forEach(gui => {
            this.setRowCompRowId(gui.rowComp);
            this.updateRowBusinessKey();
            this.setRowCompRowBusinessKey(gui.rowComp);
        });
        // check for selected also, as this could be after lazy loading of the row data, in which case
        // the id might of just gotten set inside the row and the row selected state may of changed
        // as a result. this is what happens when selected rows are loaded in virtual pagination.
        // - niall note - since moving to the stub component, this may no longer be true, as replacing
        // the stub component now replaces the entire row
        this.onRowSelected();
        // as data has changed, then the style and class needs to be recomputed
        this.postProcessCss();
    }
    postProcessCss() {
        this.setStylesFromGridOptions(true);
        this.postProcessClassesFromGridOptions();
        this.postProcessRowClassRules();
        this.postProcessRowDragging();
    }
    onRowNodeHighlightChanged() {
        const highlighted = this.rowNode.highlighted;
        this.allRowGuis.forEach(gui => {
            const aboveOn = highlighted === RowHighlightPosition.Above;
            const belowOn = highlighted === RowHighlightPosition.Below;
            gui.rowComp.addOrRemoveCssClass('ag-row-highlight-above', aboveOn);
            gui.rowComp.addOrRemoveCssClass('ag-row-highlight-below', belowOn);
        });
    }
    postProcessRowDragging() {
        const dragging = this.rowNode.dragging;
        this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('ag-row-dragging', dragging));
    }
    updateExpandedCss() {
        const expandable = this.rowNode.isExpandable();
        const expanded = this.rowNode.expanded == true;
        this.allRowGuis.forEach(gui => {
            gui.rowComp.addOrRemoveCssClass('ag-row-group', expandable);
            gui.rowComp.addOrRemoveCssClass('ag-row-group-expanded', expandable && expanded);
            gui.rowComp.addOrRemoveCssClass('ag-row-group-contracted', expandable && !expanded);
            setAriaExpanded(gui.element, expandable && expanded);
        });
    }
    onDisplayedColumnsChanged() {
        // we skip animations for onDisplayedColumnChanged, as otherwise the client could remove columns and
        // then set data, and any old valueGetter's (ie from cols that were removed) would still get called.
        this.updateColumnLists(true);
        if (this.beans.columnModel.wasAutoRowHeightEverActive()) {
            this.rowNode.checkAutoHeights();
        }
    }
    onVirtualColumnsChanged() {
        this.updateColumnLists(false, true);
    }
    getRowPosition() {
        return {
            rowPinned: makeNull(this.rowNode.rowPinned),
            rowIndex: this.rowNode.rowIndex
        };
    }
    onKeyboardNavigate(keyboardEvent) {
        const currentFullWidthComp = this.allRowGuis.find(c => c.element.contains(keyboardEvent.target));
        const currentFullWidthContainer = currentFullWidthComp ? currentFullWidthComp.element : null;
        const isFullWidthContainerFocused = currentFullWidthContainer === keyboardEvent.target;
        if (!isFullWidthContainerFocused) {
            return;
        }
        const node = this.rowNode;
        const lastFocusedCell = this.beans.focusService.getFocusedCell();
        const cellPosition = {
            rowIndex: node.rowIndex,
            rowPinned: node.rowPinned,
            column: (lastFocusedCell && lastFocusedCell.column)
        };
        this.beans.navigationService.navigateToNextCell(keyboardEvent, keyboardEvent.key, cellPosition, true);
        keyboardEvent.preventDefault();
    }
    onTabKeyDown(keyboardEvent) {
        if (keyboardEvent.defaultPrevented || isStopPropagationForAgGrid(keyboardEvent)) {
            return;
        }
        const currentFullWidthComp = this.allRowGuis.find(c => c.element.contains(keyboardEvent.target));
        const currentFullWidthContainer = currentFullWidthComp ? currentFullWidthComp.element : null;
        const isFullWidthContainerFocused = currentFullWidthContainer === keyboardEvent.target;
        let nextEl = null;
        if (!isFullWidthContainerFocused) {
            nextEl = this.beans.focusService.findNextFocusableElement(currentFullWidthContainer, false, keyboardEvent.shiftKey);
        }
        if ((this.isFullWidth() && isFullWidthContainerFocused) || !nextEl) {
            this.beans.navigationService.onTabKeyDown(this, keyboardEvent);
        }
    }
    onFullWidthRowFocused(event) {
        var _a;
        const node = this.rowNode;
        const isFocused = !event ? false : this.isFullWidth() && event.rowIndex === node.rowIndex && event.rowPinned == node.rowPinned;
        const element = this.fullWidthGui ? this.fullWidthGui.element : (_a = this.centerGui) === null || _a === void 0 ? void 0 : _a.element;
        if (!element) {
            return;
        } // can happen with react ui, comp not yet ready
        element.classList.toggle('ag-full-width-focus', isFocused);
        if (isFocused) {
            // we don't scroll normal rows into view when we focus them, so we don't want
            // to scroll Full Width rows either.
            element.focus({ preventScroll: true });
        }
    }
    refreshCell(cellCtrl) {
        this.centerCellCtrls = this.removeCellCtrl(this.centerCellCtrls, cellCtrl);
        this.leftCellCtrls = this.removeCellCtrl(this.leftCellCtrls, cellCtrl);
        this.rightCellCtrls = this.removeCellCtrl(this.rightCellCtrls, cellCtrl);
        this.updateColumnLists();
    }
    removeCellCtrl(prev, cellCtrlToRemove) {
        const res = {
            list: [],
            map: {}
        };
        prev.list.forEach(cellCtrl => {
            if (cellCtrl === cellCtrlToRemove) {
                return;
            }
            res.list.push(cellCtrl);
            res.map[cellCtrl.getInstanceId()] = cellCtrl;
        });
        return res;
    }
    onMouseEvent(eventName, mouseEvent) {
        switch (eventName) {
            case 'dblclick':
                this.onRowDblClick(mouseEvent);
                break;
            case 'click':
                this.onRowClick(mouseEvent);
                break;
            case 'touchstart':
            case 'mousedown':
                this.onRowMouseDown(mouseEvent);
                break;
        }
    }
    createRowEvent(type, domEvent) {
        return this.gridOptionsService.addGridCommonParams({
            type: type,
            node: this.rowNode,
            data: this.rowNode.data,
            rowIndex: this.rowNode.rowIndex,
            rowPinned: this.rowNode.rowPinned,
            event: domEvent
        });
    }
    createRowEventWithSource(type, domEvent) {
        const event = this.createRowEvent(type, domEvent);
        // when first developing this, we included the rowComp in the event.
        // this seems very weird. so when introducing the event types, i left the 'source'
        // out of the type, and just include the source in the two places where this event
        // was fired (rowClicked and rowDoubleClicked). it doesn't make sense for any
        // users to be using this, as the rowComp isn't an object we expose, so would be
        // very surprising if a user was using it.
        event.source = this;
        return event;
    }
    onRowDblClick(mouseEvent) {
        if (isStopPropagationForAgGrid(mouseEvent)) {
            return;
        }
        const agEvent = this.createRowEventWithSource(Events.EVENT_ROW_DOUBLE_CLICKED, mouseEvent);
        this.beans.eventService.dispatchEvent(agEvent);
    }
    onRowMouseDown(mouseEvent) {
        this.lastMouseDownOnDragger = isElementChildOfClass(mouseEvent.target, 'ag-row-drag', 3);
        if (!this.isFullWidth()) {
            return;
        }
        const node = this.rowNode;
        const columnModel = this.beans.columnModel;
        if (this.beans.rangeService) {
            this.beans.rangeService.removeAllCellRanges();
        }
        this.beans.focusService.setFocusedCell({
            rowIndex: node.rowIndex,
            column: columnModel.getAllDisplayedColumns()[0],
            rowPinned: node.rowPinned,
            forceBrowserFocus: true
        });
    }
    onRowClick(mouseEvent) {
        const stop = isStopPropagationForAgGrid(mouseEvent) || this.lastMouseDownOnDragger;
        if (stop) {
            return;
        }
        const agEvent = this.createRowEventWithSource(Events.EVENT_ROW_CLICKED, mouseEvent);
        this.beans.eventService.dispatchEvent(agEvent);
        // ctrlKey for windows, metaKey for Apple
        const isMultiKey = mouseEvent.ctrlKey || mouseEvent.metaKey;
        const isShiftKey = mouseEvent.shiftKey;
        // we do not allow selecting the group by clicking, when groupSelectChildren, as the logic to
        // handle this is broken. to observe, change the logic below and allow groups to be selected.
        // you will see the group gets selected, then all children get selected, then the grid unselects
        // the children (as the default behaviour when clicking is to unselect other rows) which results
        // in the group getting unselected (as all children are unselected). the correct thing would be
        // to change this, so that children of the selected group are not then subsequently un-selected.
        const groupSelectsChildren = this.gridOptionsService.get('groupSelectsChildren');
        if (
        // we do not allow selecting groups by clicking (as the click here expands the group), or if it's a detail row,
        // so return if it's a group row
        (groupSelectsChildren && this.rowNode.group) ||
            this.isRowSelectionBlocked() ||
            // if click selection suppressed, do nothing
            this.gridOptionsService.get('suppressRowClickSelection')) {
            return;
        }
        const multiSelectOnClick = this.gridOptionsService.get('rowMultiSelectWithClick');
        const rowDeselectionWithCtrl = !this.gridOptionsService.get('suppressRowDeselection');
        const source = 'rowClicked';
        if (this.rowNode.isSelected()) {
            if (multiSelectOnClick) {
                this.rowNode.setSelectedParams({ newValue: false, event: mouseEvent, source });
            }
            else if (isMultiKey) {
                if (rowDeselectionWithCtrl) {
                    this.rowNode.setSelectedParams({ newValue: false, event: mouseEvent, source });
                }
            }
            else {
                // selected with no multi key, must make sure anything else is unselected
                this.rowNode.setSelectedParams({ newValue: true, clearSelection: !isShiftKey, rangeSelect: isShiftKey, event: mouseEvent, source });
            }
        }
        else {
            const clearSelection = multiSelectOnClick ? false : !isMultiKey;
            this.rowNode.setSelectedParams({ newValue: true, clearSelection: clearSelection, rangeSelect: isShiftKey, event: mouseEvent, source });
        }
    }
    isRowSelectionBlocked() {
        return !this.rowNode.selectable || !!this.rowNode.rowPinned || !this.gridOptionsService.isRowSelection();
    }
    setupDetailRowAutoHeight(eDetailGui) {
        if (this.rowType !== RowType.FullWidthDetail) {
            return;
        }
        if (!this.gridOptionsService.get('detailRowAutoHeight')) {
            return;
        }
        const checkRowSizeFunc = () => {
            const clientHeight = eDetailGui.clientHeight;
            // if the UI is not ready, the height can be 0, which we ignore, as otherwise a flicker will occur
            // as UI goes from the default height, to 0, then to the real height as UI becomes ready. this means
            // it's not possible for have 0 as auto-height, however this is an improbable use case, as even an
            // empty detail grid would still have some styling around it giving at least a few pixels.
            if (clientHeight != null && clientHeight > 0) {
                // we do the update in a timeout, to make sure we are not calling from inside the grid
                // doing another update
                const updateRowHeightFunc = () => {
                    this.rowNode.setRowHeight(clientHeight);
                    if (this.beans.clientSideRowModel) {
                        this.beans.clientSideRowModel.onRowHeightChanged();
                    }
                    else if (this.beans.serverSideRowModel) {
                        this.beans.serverSideRowModel.onRowHeightChanged();
                    }
                };
                window.setTimeout(updateRowHeightFunc, 0);
            }
        };
        const resizeObserverDestroyFunc = this.beans.resizeObserverService.observeResize(eDetailGui, checkRowSizeFunc);
        this.addDestroyFunc(resizeObserverDestroyFunc);
        checkRowSizeFunc();
    }
    createFullWidthParams(eRow, pinned) {
        const params = this.gridOptionsService.addGridCommonParams({
            fullWidth: true,
            data: this.rowNode.data,
            node: this.rowNode,
            value: this.rowNode.key,
            valueFormatted: this.rowNode.key,
            rowIndex: this.rowNode.rowIndex,
            // these need to be taken out, as part of 'afterAttached' now
            eGridCell: eRow,
            eParentOfValue: eRow,
            pinned: pinned,
            addRenderedRowListener: this.addEventListener.bind(this),
            registerRowDragger: (rowDraggerElement, dragStartPixels, value, suppressVisibilityChange) => this.addFullWidthRowDragging(rowDraggerElement, dragStartPixels, value, suppressVisibilityChange)
        });
        return params;
    }
    addFullWidthRowDragging(rowDraggerElement, dragStartPixels, value = '', suppressVisibilityChange) {
        if (!this.isFullWidth()) {
            return;
        }
        const rowDragComp = new RowDragComp(() => value, this.rowNode, undefined, rowDraggerElement, dragStartPixels, suppressVisibilityChange);
        this.createManagedBean(rowDragComp, this.beans.context);
    }
    onUiLevelChanged() {
        const newLevel = this.beans.rowCssClassCalculator.calculateRowLevel(this.rowNode);
        if (this.rowLevel != newLevel) {
            const classToAdd = 'ag-row-level-' + newLevel;
            const classToRemove = 'ag-row-level-' + this.rowLevel;
            this.allRowGuis.forEach(gui => {
                gui.rowComp.addOrRemoveCssClass(classToAdd, true);
                gui.rowComp.addOrRemoveCssClass(classToRemove, false);
            });
        }
        this.rowLevel = newLevel;
    }
    isFirstRowOnPage() {
        return this.rowNode.rowIndex === this.beans.paginationProxy.getPageFirstRow();
    }
    isLastRowOnPage() {
        return this.rowNode.rowIndex === this.beans.paginationProxy.getPageLastRow();
    }
    refreshFirstAndLastRowStyles() {
        const newFirst = this.isFirstRowOnPage();
        const newLast = this.isLastRowOnPage();
        if (this.firstRowOnPage !== newFirst) {
            this.firstRowOnPage = newFirst;
            this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('ag-row-first', newFirst));
        }
        if (this.lastRowOnPage !== newLast) {
            this.lastRowOnPage = newLast;
            this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('ag-row-last', newLast));
        }
    }
    stopEditing(cancel = false) {
        // if we are already stopping row edit, there is
        // no need to start this process again.
        if (this.stoppingRowEdit) {
            return;
        }
        const cellControls = this.getAllCellCtrls();
        const isRowEdit = this.editingRow;
        this.stoppingRowEdit = true;
        let fireRowEditEvent = false;
        for (const ctrl of cellControls) {
            const valueChanged = ctrl.stopEditing(cancel);
            if (isRowEdit && !cancel && !fireRowEditEvent && valueChanged) {
                fireRowEditEvent = true;
            }
        }
        if (fireRowEditEvent) {
            const event = this.createRowEvent(Events.EVENT_ROW_VALUE_CHANGED);
            this.beans.eventService.dispatchEvent(event);
        }
        if (isRowEdit) {
            this.setEditingRow(false);
        }
        this.stoppingRowEdit = false;
    }
    setInlineEditingCss(editing) {
        this.allRowGuis.forEach(gui => {
            gui.rowComp.addOrRemoveCssClass("ag-row-inline-editing", editing);
            gui.rowComp.addOrRemoveCssClass("ag-row-not-inline-editing", !editing);
        });
    }
    setEditingRow(value) {
        this.editingRow = value;
        this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('ag-row-editing', value));
        const event = value ?
            this.createRowEvent(Events.EVENT_ROW_EDITING_STARTED)
            : this.createRowEvent(Events.EVENT_ROW_EDITING_STOPPED);
        this.beans.eventService.dispatchEvent(event);
    }
    startRowEditing(key = null, sourceRenderedCell = null, event = null) {
        // don't do it if already editing
        if (this.editingRow) {
            return;
        }
        const atLeastOneEditing = this.getAllCellCtrls().reduce((prev, cellCtrl) => {
            const cellStartedEdit = cellCtrl === sourceRenderedCell;
            if (cellStartedEdit) {
                cellCtrl.startEditing(key, cellStartedEdit, event);
            }
            else {
                cellCtrl.startEditing(null, cellStartedEdit, event);
            }
            if (prev) {
                return true;
            }
            return cellCtrl.isEditing();
        }, false);
        if (atLeastOneEditing) {
            this.setEditingRow(true);
        }
    }
    getAllCellCtrls() {
        if (this.leftCellCtrls.list.length === 0 && this.rightCellCtrls.list.length === 0) {
            return this.centerCellCtrls.list;
        }
        const res = [...this.centerCellCtrls.list, ...this.leftCellCtrls.list, ...this.rightCellCtrls.list];
        return res;
    }
    postProcessClassesFromGridOptions() {
        const cssClasses = this.beans.rowCssClassCalculator.processClassesFromGridOptions(this.rowNode);
        if (!cssClasses || !cssClasses.length) {
            return;
        }
        cssClasses.forEach(classStr => {
            this.allRowGuis.forEach(c => c.rowComp.addOrRemoveCssClass(classStr, true));
        });
    }
    postProcessRowClassRules() {
        this.beans.rowCssClassCalculator.processRowClassRules(this.rowNode, (className) => {
            this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass(className, true));
        }, (className) => {
            this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass(className, false));
        });
    }
    setStylesFromGridOptions(updateStyles, gui) {
        if (updateStyles) {
            this.rowStyles = this.processStylesFromGridOptions();
        }
        this.forEachGui(gui, gui => gui.rowComp.setUserStyles(this.rowStyles));
    }
    getPinnedForContainer(rowContainerType) {
        const pinned = rowContainerType === RowContainerType.LEFT
            ? 'left'
            : rowContainerType === RowContainerType.RIGHT
                ? 'right'
                : null;
        return pinned;
    }
    getInitialRowClasses(rowContainerType) {
        const pinned = this.getPinnedForContainer(rowContainerType);
        const params = {
            rowNode: this.rowNode,
            rowFocused: this.rowFocused,
            fadeRowIn: this.fadeInAnimation[rowContainerType],
            rowIsEven: this.rowNode.rowIndex % 2 === 0,
            rowLevel: this.rowLevel,
            fullWidthRow: this.isFullWidth(),
            firstRowOnPage: this.isFirstRowOnPage(),
            lastRowOnPage: this.isLastRowOnPage(),
            printLayout: this.printLayout,
            expandable: this.rowNode.isExpandable(),
            pinned: pinned
        };
        return this.beans.rowCssClassCalculator.getInitialRowClasses(params);
    }
    processStylesFromGridOptions() {
        // part 1 - rowStyle
        const rowStyle = this.gridOptionsService.get('rowStyle');
        if (rowStyle && typeof rowStyle === 'function') {
            console.warn('AG Grid: rowStyle should be an object of key/value styles, not be a function, use getRowStyle() instead');
            return;
        }
        // part 1 - rowStyleFunc
        const rowStyleFunc = this.gridOptionsService.getCallback('getRowStyle');
        let rowStyleFuncResult;
        if (rowStyleFunc) {
            const params = {
                data: this.rowNode.data,
                node: this.rowNode,
                rowIndex: this.rowNode.rowIndex
            };
            rowStyleFuncResult = rowStyleFunc(params);
        }
        if (rowStyleFuncResult || rowStyle) {
            return Object.assign({}, rowStyle, rowStyleFuncResult);
        }
        // Return constant reference for React
        return this.emptyStyle;
    }
    onRowSelected(gui) {
        const eDocument = this.beans.gridOptionsService.getDocument();
        // Treat undefined as false, if we pass undefined down it gets treated as toggle class, rather than explicitly
        // setting the required value
        const selected = !!this.rowNode.isSelected();
        this.forEachGui(gui, gui => {
            gui.rowComp.addOrRemoveCssClass('ag-row-selected', selected);
            setAriaSelected(gui.element, selected);
            const hasFocus = gui.element.contains(eDocument.activeElement);
            if (hasFocus && (gui === this.centerGui || gui === this.fullWidthGui)) {
                this.announceDescription();
            }
        });
    }
    announceDescription() {
        if (this.isRowSelectionBlocked()) {
            return;
        }
        const selected = this.rowNode.isSelected();
        if (selected && this.beans.gridOptionsService.get('suppressRowDeselection')) {
            return;
        }
        const translate = this.beans.localeService.getLocaleTextFunc();
        const label = translate(selected ? 'ariaRowDeselect' : 'ariaRowSelect', `Press SPACE to ${selected ? 'deselect' : 'select'} this row.`);
        this.beans.ariaAnnouncementService.announceValue(label);
    }
    isUseAnimationFrameForCreate() {
        return this.useAnimationFrameForCreate;
    }
    addHoverFunctionality(eRow) {
        // because we use animation frames to do this, it's possible the row no longer exists
        // by the time we get to add it
        if (!this.active) {
            return;
        }
        // because mouseenter and mouseleave do not propagate, we cannot listen on the gridPanel
        // like we do for all the other mouse events.
        // because of the pinning, we cannot simply add / remove the class based on the eRow. we
        // have to check all eRow's (body & pinned). so the trick is if any of the rows gets a
        // mouse hover, it sets such in the rowNode, and then all three reflect the change as
        // all are listening for event on the row node.
        // step 1 - add listener, to set flag on row node
        this.addManagedListener(eRow, 'mouseenter', () => this.rowNode.onMouseEnter());
        this.addManagedListener(eRow, 'mouseleave', () => this.rowNode.onMouseLeave());
        // step 2 - listen for changes on row node (which any eRow can trigger)
        this.addManagedListener(this.rowNode, RowNode.EVENT_MOUSE_ENTER, () => {
            // if hover turned off, we don't add the class. we do this here so that if the application
            // toggles this property mid way, we remove the hover form the last row, but we stop
            // adding hovers from that point onwards. Also, do not highlight while dragging elements around.
            if (!this.beans.dragService.isDragging() &&
                !this.gridOptionsService.get('suppressRowHoverHighlight')) {
                eRow.classList.add('ag-row-hover');
                this.rowNode.setHovered(true);
            }
        });
        this.addManagedListener(this.rowNode, RowNode.EVENT_MOUSE_LEAVE, () => {
            eRow.classList.remove('ag-row-hover');
            this.rowNode.setHovered(false);
        });
    }
    // for animation, we don't want to animate entry or exit to a very far away pixel,
    // otherwise the row would move so fast, it would appear to disappear. so this method
    // moves the row closer to the viewport if it is far away, so the row slide in / out
    // at a speed the user can see.
    roundRowTopToBounds(rowTop) {
        const range = this.beans.ctrlsService.getGridBodyCtrl().getScrollFeature().getApproximateVScollPosition();
        const minPixel = this.applyPaginationOffset(range.top, true) - 100;
        const maxPixel = this.applyPaginationOffset(range.bottom, true) + 100;
        return Math.min(Math.max(minPixel, rowTop), maxPixel);
    }
    getFrameworkOverrides() {
        return this.beans.frameworkOverrides;
    }
    forEachGui(gui, callback) {
        if (gui) {
            callback(gui);
        }
        else {
            this.allRowGuis.forEach(callback);
        }
    }
    onRowHeightChanged(gui) {
        // check for exists first - if the user is resetting the row height, then
        // it will be null (or undefined) momentarily until the next time the flatten
        // stage is called where the row will then update again with a new height
        if (this.rowNode.rowHeight == null) {
            return;
        }
        const rowHeight = this.rowNode.rowHeight;
        const defaultRowHeight = this.beans.environment.getDefaultRowHeight();
        const isHeightFromFunc = this.gridOptionsService.isGetRowHeightFunction();
        const heightFromFunc = isHeightFromFunc ? this.gridOptionsService.getRowHeightForNode(this.rowNode).height : undefined;
        const lineHeight = heightFromFunc ? `${Math.min(defaultRowHeight, heightFromFunc) - 2}px` : undefined;
        this.forEachGui(gui, gui => {
            gui.element.style.height = `${rowHeight}px`;
            // If the row height is coming from a function, this means some rows can
            // be smaller than the theme had intended. so we set --ag-line-height on
            // the row, which is picked up by the theme CSS and is used in a calc
            // for the CSS line-height property, which makes sure the line-height is
            // not bigger than the row height, otherwise the row text would not fit.
            // We do not use rowNode.rowHeight here, as this could be the result of autoHeight,
            // and we found using the autoHeight result causes a loop, where changing the
            // line-height them impacts the cell height, resulting in a new autoHeight,
            // resulting in a new line-height and so on loop.
            // const heightFromFunc = this.gridOptionsService.getRowHeightForNode(this.rowNode).height;
            if (lineHeight) {
                gui.element.style.setProperty('--ag-line-height', lineHeight);
            }
        });
    }
    addEventListener(eventType, listener) {
        super.addEventListener(eventType, listener);
    }
    removeEventListener(eventType, listener) {
        super.removeEventListener(eventType, listener);
    }
    // note - this is NOT called by context, as we don't wire / unwire the CellComp for performance reasons.
    destroyFirstPass(suppressAnimation = false) {
        this.active = false;
        // why do we have this method? shouldn't everything below be added as a destroy func beside
        // the corresponding create logic?
        if (!suppressAnimation && this.gridOptionsService.isAnimateRows() && !this.isSticky()) {
            const rowStillVisibleJustNotInViewport = this.rowNode.rowTop != null;
            if (rowStillVisibleJustNotInViewport) {
                // if the row is not rendered, but in viewport, it means it has moved,
                // so we animate the row out. if the new location is very far away,
                // the animation will be so fast the row will look like it's just disappeared,
                // so instead we animate to a position just outside the viewport.
                const rowTop = this.roundRowTopToBounds(this.rowNode.rowTop);
                this.setRowTop(rowTop);
            }
            else {
                this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('ag-opacity-zero', true));
            }
        }
        this.rowNode.setHovered(false);
        const event = this.createRowEvent(Events.EVENT_VIRTUAL_ROW_REMOVED);
        this.dispatchEvent(event);
        this.beans.eventService.dispatchEvent(event);
        super.destroy();
    }
    destroySecondPass() {
        this.allRowGuis.length = 0;
        // if we are editing, destroying the row will stop editing
        this.stopEditing();
        const destroyCellCtrls = (ctrls) => {
            ctrls.list.forEach(c => c.destroy());
            return { list: [], map: {} };
        };
        this.centerCellCtrls = destroyCellCtrls(this.centerCellCtrls);
        this.leftCellCtrls = destroyCellCtrls(this.leftCellCtrls);
        this.rightCellCtrls = destroyCellCtrls(this.rightCellCtrls);
    }
    setFocusedClasses(gui) {
        this.forEachGui(gui, gui => {
            gui.rowComp.addOrRemoveCssClass('ag-row-focus', this.rowFocused);
            gui.rowComp.addOrRemoveCssClass('ag-row-no-focus', !this.rowFocused);
        });
    }
    onCellFocusChanged() {
        const rowFocused = this.beans.focusService.isRowFocused(this.rowNode.rowIndex, this.rowNode.rowPinned);
        if (rowFocused !== this.rowFocused) {
            this.rowFocused = rowFocused;
            this.setFocusedClasses();
        }
        // if we are editing, then moving the focus out of a row will stop editing
        if (!rowFocused && this.editingRow) {
            this.stopEditing(false);
        }
    }
    onPaginationChanged() {
        const currentPage = this.beans.paginationProxy.getCurrentPage();
        // it is possible this row is in the new page, but the page number has changed, which means
        // it needs to reposition itself relative to the new page
        if (this.paginationPage !== currentPage) {
            this.paginationPage = currentPage;
            this.onTopChanged();
        }
        this.refreshFirstAndLastRowStyles();
    }
    onTopChanged() {
        this.setRowTop(this.rowNode.rowTop);
    }
    onPaginationPixelOffsetChanged() {
        // the pixel offset is used when calculating rowTop to set on the row DIV
        this.onTopChanged();
    }
    // applies pagination offset, eg if on second page, and page height is 500px, then removes
    // 500px from the top position, so a row with rowTop 600px is displayed at location 100px.
    // reverse will take the offset away rather than add.
    applyPaginationOffset(topPx, reverse = false) {
        if (this.rowNode.isRowPinned() || this.rowNode.sticky) {
            return topPx;
        }
        const pixelOffset = this.beans.paginationProxy.getPixelOffset();
        const multiplier = reverse ? 1 : -1;
        return topPx + (pixelOffset * multiplier);
    }
    setRowTop(pixels) {
        // print layout uses normal flow layout for row positioning
        if (this.printLayout) {
            return;
        }
        // need to make sure rowTop is not null, as this can happen if the node was once
        // visible (ie parent group was expanded) but is now not visible
        if (exists(pixels)) {
            const afterPaginationPixels = this.applyPaginationOffset(pixels);
            const skipScaling = this.rowNode.isRowPinned() || this.rowNode.sticky;
            const afterScalingPixels = skipScaling ? afterPaginationPixels : this.beans.rowContainerHeightService.getRealPixelPosition(afterPaginationPixels);
            const topPx = `${afterScalingPixels}px`;
            this.setRowTopStyle(topPx);
        }
    }
    // the top needs to be set into the DOM element when the element is created, not updated afterwards.
    // otherwise the transition would not work, as it would be transitioning from zero (the unset value).
    // for example, suppose a row that is outside the viewport, then user does a filter to remove other rows
    // and this row now appears in the viewport, and the row moves up (ie it was under the viewport and not rendered,
    // but now is in the viewport) then a new RowComp is created, however it should have it's position initialised
    // to below the viewport, so the row will appear to animate up. if we didn't set the initial position at creation
    // time, the row would animate down (ie from position zero).
    getInitialRowTop(rowContainerType) {
        return this.suppressRowTransform ? this.getInitialRowTopShared(rowContainerType) : undefined;
    }
    getInitialTransform(rowContainerType) {
        return this.suppressRowTransform ? undefined : `translateY(${this.getInitialRowTopShared(rowContainerType)})`;
    }
    getInitialRowTopShared(rowContainerType) {
        // print layout uses normal flow layout for row positioning
        if (this.printLayout) {
            return '';
        }
        let rowTop;
        if (this.isSticky()) {
            rowTop = this.rowNode.stickyRowTop;
        }
        else {
            // if sliding in, we take the old row top. otherwise we just set the current row top.
            const pixels = this.slideInAnimation[rowContainerType] ? this.roundRowTopToBounds(this.rowNode.oldRowTop) : this.rowNode.rowTop;
            const afterPaginationPixels = this.applyPaginationOffset(pixels);
            // we don't apply scaling if row is pinned
            rowTop = this.rowNode.isRowPinned() ? afterPaginationPixels : this.beans.rowContainerHeightService.getRealPixelPosition(afterPaginationPixels);
        }
        return rowTop + 'px';
    }
    setRowTopStyle(topPx) {
        this.allRowGuis.forEach(gui => this.suppressRowTransform ?
            gui.rowComp.setTop(topPx) :
            gui.rowComp.setTransform(`translateY(${topPx})`));
    }
    getRowNode() {
        return this.rowNode;
    }
    getCellCtrl(column) {
        // first up, check for cell directly linked to this column
        let res = null;
        this.getAllCellCtrls().forEach(cellCtrl => {
            if (cellCtrl.getColumn() == column) {
                res = cellCtrl;
            }
        });
        if (res != null) {
            return res;
        }
        // second up, if not found, then check for spanned cols.
        // we do this second (and not at the same time) as this is
        // more expensive, as spanning cols is a
        // infrequently used feature so we don't need to do this most
        // of the time
        this.getAllCellCtrls().forEach(cellCtrl => {
            if (cellCtrl.getColSpanningList().indexOf(column) >= 0) {
                res = cellCtrl;
            }
        });
        return res;
    }
    onRowIndexChanged() {
        // we only bother updating if the rowIndex is present. if it is not present, it means this row
        // is child of a group node, and the group node was closed, it's the only way to have no row index.
        // when this happens, row is about to be de-rendered, so we don't care, rowComp is about to die!
        if (this.rowNode.rowIndex != null) {
            this.onCellFocusChanged();
            this.updateRowIndexes();
            this.postProcessCss();
        }
    }
    getRowIndex() {
        return this.rowNode.getRowIndexString();
    }
    updateRowIndexes(gui) {
        const rowIndexStr = this.rowNode.getRowIndexString();
        const headerRowCount = this.beans.headerNavigationService.getHeaderRowCount() + this.beans.filterManager.getHeaderRowCount();
        const rowIsEven = this.rowNode.rowIndex % 2 === 0;
        const ariaRowIndex = headerRowCount + this.rowNode.rowIndex + 1;
        this.forEachGui(gui, c => {
            c.rowComp.setRowIndex(rowIndexStr);
            c.rowComp.addOrRemoveCssClass('ag-row-even', rowIsEven);
            c.rowComp.addOrRemoveCssClass('ag-row-odd', !rowIsEven);
            setAriaRowIndex(c.element, ariaRowIndex);
        });
    }
}
RowCtrl.DOM_DATA_KEY_ROW_CTRL = 'renderedRow';
