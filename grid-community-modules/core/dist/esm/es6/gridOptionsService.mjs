var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GridOptionsService_1;
import { ColumnApi } from "./columns/columnApi.mjs";
import { ComponentUtil } from "./components/componentUtil.mjs";
import { Autowired, Bean, PostConstruct, PreDestroy } from "./context/context.mjs";
import { Events } from "./events.mjs";
import { EventService } from "./eventService.mjs";
import { INITIAL_GRID_OPTION_KEYS, PropertyKeys } from "./propertyKeys.mjs";
import { warnOnce } from "./utils/function.mjs";
import { exists, missing } from "./utils/generic.mjs";
import { getScrollbarWidth } from './utils/browser.mjs';
import { GRID_OPTION_DEFAULTS } from "./validation/rules/gridOptionsValidations.mjs";
let GridOptionsService = GridOptionsService_1 = class GridOptionsService {
    constructor() {
        this.destroyed = false;
        this.domDataKey = '__AG_' + Math.random().toString();
        this.propertyEventService = new EventService();
        // responsible for calling the onXXX functions on gridOptions
        // It forces events defined in GridOptionsService.alwaysSyncGlobalEvents to be fired synchronously.
        // This is required for events such as GridPreDestroyed.
        // Other events can be fired asynchronously or synchronously depending on config.
        this.globalEventHandlerFactory = (restrictToSyncOnly) => {
            return (eventName, event) => {
                // prevent events from being fired _after_ the grid has been destroyed
                if (this.destroyed) {
                    return;
                }
                const alwaysSync = GridOptionsService_1.alwaysSyncGlobalEvents.has(eventName);
                if ((alwaysSync && !restrictToSyncOnly) || (!alwaysSync && restrictToSyncOnly)) {
                    return;
                }
                const eventHandlerName = ComponentUtil.getCallbackForEvent(eventName);
                const eventHandler = this.gridOptions[eventHandlerName];
                if (typeof eventHandler === 'function') {
                    this.frameworkOverrides.wrapOutgoing(() => {
                        eventHandler(event);
                    });
                }
            };
        };
    }
    // This is quicker then having code call gridOptionsService.get('context')
    get context() {
        return this.gridOptions['context'];
    }
    init() {
        this.columnApi = new ColumnApi(this.api);
        const async = !this.get('suppressAsyncEvents');
        this.eventService.addGlobalListener(this.globalEventHandlerFactory().bind(this), async);
        this.eventService.addGlobalListener(this.globalEventHandlerFactory(true).bind(this), false);
        // Ensure the propertyEventService has framework overrides set so that it can fire events outside of angular
        this.propertyEventService.setFrameworkOverrides(this.frameworkOverrides);
        // sets an initial calculation for the scrollbar width
        this.getScrollbarWidth();
    }
    destroy() {
        this.destroyed = true;
        this.columnApi = undefined;
    }
    /**
     * Get the raw value of the GridOptions property provided.
     * @param property
     */
    get(property) {
        var _a;
        return (_a = this.gridOptions[property]) !== null && _a !== void 0 ? _a : GRID_OPTION_DEFAULTS[property];
    }
    /**
     * Get the GridOption callback but wrapped so that the common params of api,columnApi and context are automatically applied to the params.
     * @param property GridOption callback properties based on the fact that this property has a callback with params extending AgGridCommon
     */
    getCallback(property) {
        return this.mergeGridCommonParams(this.gridOptions[property]);
    }
    /**
     * Returns `true` if a value has been specified for this GridOption.
     * @param property GridOption property
     */
    exists(property) {
        return exists(this.gridOptions[property]);
    }
    /**
    * Wrap the user callback and attach the api, columnApi and context to the params object on the way through.
    * @param callback User provided callback
    * @returns Wrapped callback where the params object not require api, columnApi and context
    */
    mergeGridCommonParams(callback) {
        if (callback) {
            const wrapped = (callbackParams) => {
                const mergedParams = callbackParams;
                mergedParams.api = this.api;
                mergedParams.columnApi = this.columnApi;
                mergedParams.context = this.context;
                return callback(mergedParams);
            };
            return wrapped;
        }
        return callback;
    }
    static toBoolean(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            // for boolean, compare to empty String to allow attributes appearing with
            // no value to be treated as 'true'
            return value.toUpperCase() === 'TRUE' || value == '';
        }
        return false;
    }
    static toNumber(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseInt(value);
            if (isNaN(parsed)) {
                return undefined;
            }
            return parsed;
        }
        return undefined;
    }
    static toConstrainedNum(min, max) {
        return (value) => {
            const num = GridOptionsService_1.toNumber(value);
            if (num == null || num < min || num > max) {
                return undefined; // return undefined if outside bounds, this will then be coerced to the default value.
            }
            return num;
        };
    }
    static getCoercedValue(key, value) {
        const coerceFunc = GridOptionsService_1.PROPERTY_COERCIONS.get(key);
        if (!coerceFunc) {
            return value;
        }
        return coerceFunc(value);
    }
    static getCoercedGridOptions(gridOptions) {
        const newGo = {};
        Object.entries(gridOptions).forEach(([key, value]) => {
            const coercedValue = GridOptionsService_1.getCoercedValue(key, value);
            newGo[key] = coercedValue;
        });
        return newGo;
    }
    updateGridOptions({ options, source = 'api' }) {
        const changeSet = { id: GridOptionsService_1.changeSetId++, properties: [] };
        // all events are fired after grid options has finished updating.
        const events = [];
        Object.entries(options).forEach(([key, value]) => {
            if (source === 'api' && INITIAL_GRID_OPTION_KEYS[key]) {
                warnOnce(`${key} is an initial property and cannot be updated.`);
            }
            const coercedValue = GridOptionsService_1.getCoercedValue(key, value);
            const shouldForce = (typeof coercedValue) === 'object' && source === 'api'; // force objects as they could have been mutated.
            const previousValue = this.gridOptions[key];
            if (shouldForce || previousValue !== coercedValue) {
                this.gridOptions[key] = coercedValue;
                const event = {
                    type: key,
                    currentValue: coercedValue,
                    previousValue,
                    changeSet,
                    source
                };
                events.push(event);
            }
        });
        this.validationService.processGridOptions(this.gridOptions);
        // changeSet should just include the properties that have changed.
        changeSet.properties = events.map(event => event.type);
        events.forEach(event => {
            if (this.gridOptions.debug) {
                console.log(`AG Grid: Updated property ${event.type} from `, event.previousValue, ' to  ', event.currentValue);
            }
            this.propertyEventService.dispatchEvent(event);
        });
    }
    addEventListener(key, listener) {
        this.propertyEventService.addEventListener(key, listener);
    }
    removeEventListener(key, listener) {
        this.propertyEventService.removeEventListener(key, listener);
    }
    // *************** Helper methods ************************** //
    // Methods to share common GridOptions related logic that goes above accessing a single property
    // the user might be using some non-standard scrollbar, eg a scrollbar that has zero
    // width and overlays (like the Safari scrollbar, but presented in Chrome). so we
    // allow the user to provide the scroll width before we work it out.
    getScrollbarWidth() {
        if (this.scrollbarWidth == null) {
            const useGridOptions = typeof this.gridOptions.scrollbarWidth === 'number' && this.gridOptions.scrollbarWidth >= 0;
            const scrollbarWidth = useGridOptions ? this.gridOptions.scrollbarWidth : getScrollbarWidth();
            if (scrollbarWidth != null) {
                this.scrollbarWidth = scrollbarWidth;
                this.eventService.dispatchEvent({
                    type: Events.EVENT_SCROLLBAR_WIDTH_CHANGED
                });
            }
        }
        return this.scrollbarWidth;
    }
    isRowModelType(rowModelType) {
        return this.gridOptions.rowModelType === rowModelType ||
            (rowModelType === 'clientSide' && missing(this.gridOptions.rowModelType));
    }
    isDomLayout(domLayout) {
        var _a;
        const gridLayout = (_a = this.gridOptions.domLayout) !== null && _a !== void 0 ? _a : 'normal';
        return gridLayout === domLayout;
    }
    isRowSelection() {
        return this.gridOptions.rowSelection === 'single' || this.gridOptions.rowSelection === 'multiple';
    }
    useAsyncEvents() {
        return !this.get('suppressAsyncEvents');
    }
    isGetRowHeightFunction() {
        return typeof this.gridOptions.getRowHeight === 'function';
    }
    getRowHeightForNode(rowNode, allowEstimate = false, defaultRowHeight) {
        if (defaultRowHeight == null) {
            defaultRowHeight = this.environment.getDefaultRowHeight();
        }
        // check the function first, in case use set both function and
        // number, when using virtual pagination then function can be
        // used for pinned rows and the number for the body rows.
        if (this.isGetRowHeightFunction()) {
            if (allowEstimate) {
                return { height: defaultRowHeight, estimated: true };
            }
            const params = {
                node: rowNode,
                data: rowNode.data
            };
            const height = this.getCallback('getRowHeight')(params);
            if (this.isNumeric(height)) {
                if (height === 0) {
                    warnOnce('The return of `getRowHeight` cannot be zero. If the intention is to hide rows, use a filter instead.');
                }
                return { height: Math.max(1, height), estimated: false };
            }
        }
        if (rowNode.detail && this.get('masterDetail')) {
            return this.getMasterDetailRowHeight();
        }
        const rowHeight = this.gridOptions.rowHeight && this.isNumeric(this.gridOptions.rowHeight) ? this.gridOptions.rowHeight : defaultRowHeight;
        return { height: rowHeight, estimated: false };
    }
    getMasterDetailRowHeight() {
        // if autoHeight, we want the height to grow to the new height starting at 1, as otherwise a flicker would happen,
        // as the detail goes to the default (eg 200px) and then immediately shrink up/down to the new measured height
        // (due to auto height) which looks bad, especially if doing row animation.
        if (this.get('detailRowAutoHeight')) {
            return { height: 1, estimated: false };
        }
        if (this.isNumeric(this.gridOptions.detailRowHeight)) {
            return { height: this.gridOptions.detailRowHeight, estimated: false };
        }
        return { height: 300, estimated: false };
    }
    // we don't allow dynamic row height for virtual paging
    getRowHeightAsNumber() {
        if (!this.gridOptions.rowHeight || missing(this.gridOptions.rowHeight)) {
            return this.environment.getDefaultRowHeight();
        }
        const rowHeight = this.environment.refreshRowHeightVariable();
        if (rowHeight !== -1) {
            return rowHeight;
        }
        console.warn('AG Grid row height must be a number if not using standard row model');
        return this.environment.getDefaultRowHeight();
    }
    isNumeric(value) {
        return !isNaN(value) && typeof value === 'number' && isFinite(value);
    }
    getDomDataKey() {
        return this.domDataKey;
    }
    // returns the dom data, or undefined if not found
    getDomData(element, key) {
        const domData = element[this.getDomDataKey()];
        return domData ? domData[key] : undefined;
    }
    setDomData(element, key, value) {
        const domDataKey = this.getDomDataKey();
        let domData = element[domDataKey];
        if (missing(domData)) {
            domData = {};
            element[domDataKey] = domData;
        }
        domData[key] = value;
    }
    getDocument() {
        // if user is providing document, we use the users one,
        // otherwise we use the document on the global namespace.
        let result = null;
        if (this.gridOptions.getDocument && exists(this.gridOptions.getDocument)) {
            result = this.gridOptions.getDocument();
        }
        else if (this.eGridDiv) {
            result = this.eGridDiv.ownerDocument;
        }
        if (result && exists(result)) {
            return result;
        }
        return document;
    }
    getWindow() {
        const eDocument = this.getDocument();
        return eDocument.defaultView || window;
    }
    getRootNode() {
        return this.eGridDiv.getRootNode();
    }
    getAsyncTransactionWaitMillis() {
        return exists(this.gridOptions.asyncTransactionWaitMillis) ? this.gridOptions.asyncTransactionWaitMillis : 50;
    }
    isAnimateRows() {
        // never allow animating if enforcing the row order
        if (this.get('ensureDomOrder')) {
            return false;
        }
        return this.get('animateRows');
    }
    isGroupRowsSticky() {
        if (this.get('suppressGroupRowsSticky') ||
            this.get('paginateChildRows') ||
            this.get('groupHideOpenParents') ||
            this.isDomLayout('print')) {
            return false;
        }
        return true;
    }
    isColumnsSortingCoupledToGroup() {
        const autoGroupColumnDef = this.gridOptions.autoGroupColumnDef;
        return !(autoGroupColumnDef === null || autoGroupColumnDef === void 0 ? void 0 : autoGroupColumnDef.comparator) && !this.get('treeData');
    }
    getGroupAggFiltering() {
        const userValue = this.gridOptions.groupAggFiltering;
        if (typeof userValue === 'function') {
            return this.getCallback('groupAggFiltering');
        }
        if (userValue === true) {
            return () => true;
        }
        return undefined;
    }
    isGroupIncludeFooterTrueOrCallback() {
        const userValue = this.gridOptions.groupIncludeFooter;
        return userValue === true || typeof userValue === 'function';
    }
    getGroupIncludeFooter() {
        const userValue = this.gridOptions.groupIncludeFooter;
        if (typeof userValue === 'function') {
            return this.getCallback('groupIncludeFooter');
        }
        if (userValue === true) {
            return () => true;
        }
        return () => false;
    }
    isGroupMultiAutoColumn() {
        if (this.gridOptions.groupDisplayType) {
            return this.gridOptions.groupDisplayType === 'multipleColumns';
        }
        // if we are doing hideOpenParents we also show multiple columns, otherwise hideOpenParents would not work
        return this.get('groupHideOpenParents');
    }
    isGroupUseEntireRow(pivotMode) {
        // we never allow groupDisplayType = 'groupRows' if in pivot mode, otherwise we won't see the pivot values.
        if (pivotMode) {
            return false;
        }
        return this.gridOptions.groupDisplayType === 'groupRows';
    }
    getGridCommonParams() {
        return {
            api: this.api,
            columnApi: this.columnApi,
            context: this.context
        };
    }
    addGridCommonParams(params) {
        const updatedParams = params;
        updatedParams.api = this.api;
        updatedParams.columnApi = this.columnApi;
        updatedParams.context = this.context;
        return updatedParams;
    }
};
GridOptionsService.alwaysSyncGlobalEvents = new Set([Events.EVENT_GRID_PRE_DESTROYED]);
/**
 * Handles value coercion including validation of ranges etc. If value is invalid, undefined is set, allowing default to be used.
 */
GridOptionsService.PROPERTY_COERCIONS = new Map([
    ...PropertyKeys.BOOLEAN_PROPERTIES.map(key => [key, GridOptionsService_1.toBoolean]),
    ...PropertyKeys.NUMBER_PROPERTIES.map(key => [key, GridOptionsService_1.toNumber]),
    ['groupAggFiltering', (val) => typeof val === 'function' ? val : GridOptionsService_1.toBoolean(val)],
    ['pageSize', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['autoSizePadding', GridOptionsService_1.toConstrainedNum(0, Number.MAX_VALUE)],
    ['keepDetailRowsCount', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['rowBuffer', GridOptionsService_1.toConstrainedNum(0, Number.MAX_VALUE)],
    ['infiniteInitialRowCount', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['cacheOverflowSize', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['cacheBlockSize', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['serverSideInitialRowCount', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['viewportRowModelPageSize', GridOptionsService_1.toConstrainedNum(1, Number.MAX_VALUE)],
    ['viewportRowModelBufferSize', GridOptionsService_1.toConstrainedNum(0, Number.MAX_VALUE)],
]);
GridOptionsService.changeSetId = 0;
__decorate([
    Autowired('gridOptions')
], GridOptionsService.prototype, "gridOptions", void 0);
__decorate([
    Autowired('eventService')
], GridOptionsService.prototype, "eventService", void 0);
__decorate([
    Autowired('environment')
], GridOptionsService.prototype, "environment", void 0);
__decorate([
    Autowired('frameworkOverrides')
], GridOptionsService.prototype, "frameworkOverrides", void 0);
__decorate([
    Autowired('eGridDiv')
], GridOptionsService.prototype, "eGridDiv", void 0);
__decorate([
    Autowired('validationService')
], GridOptionsService.prototype, "validationService", void 0);
__decorate([
    Autowired('gridApi')
], GridOptionsService.prototype, "api", void 0);
__decorate([
    PostConstruct
], GridOptionsService.prototype, "init", null);
__decorate([
    PreDestroy
], GridOptionsService.prototype, "destroy", null);
GridOptionsService = GridOptionsService_1 = __decorate([
    Bean('gridOptionsService')
], GridOptionsService);
export { GridOptionsService };
