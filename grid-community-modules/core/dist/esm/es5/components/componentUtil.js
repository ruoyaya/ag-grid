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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { Events } from '../events';
import { PropertyKeys } from '../propertyKeys';
import { iterateObject } from '../utils/object';
import { includes } from '../utils/array';
import { values } from '../utils/generic';
var ComponentUtil = /** @class */ (function () {
    function ComponentUtil() {
    }
    ComponentUtil.getCallbackForEvent = function (eventName) {
        if (!eventName || eventName.length < 2) {
            return eventName;
        }
        return 'on' + eventName[0].toUpperCase() + eventName.substring(1);
    };
    ComponentUtil.getGridOptionKeys = function () {
        // Vue does not have keys in prod so instead need to run through all the 
        // gridOptions checking for presence of a gridOption key.
        return this.ALL_PROPERTIES_AND_CALLBACKS;
    };
    /** Combines component props / attributes with the provided gridOptions returning a new combined gridOptions object */
    ComponentUtil.combineAttributesAndGridOptions = function (gridOptions, component) {
        // create empty grid options if none were passed
        if (typeof gridOptions !== 'object') {
            gridOptions = {};
        }
        // shallow copy (so we don't change the provided object)
        var mergedOptions = __assign({}, gridOptions);
        var keys = ComponentUtil.getGridOptionKeys();
        // Loop through component props, if they are not undefined and a valid gridOption copy to gridOptions
        keys.forEach(function (key) {
            var value = component[key];
            if (typeof value !== 'undefined' && value !== ComponentUtil.VUE_OMITTED_PROPERTY) {
                mergedOptions[key] = value;
            }
        });
        return mergedOptions;
    };
    ComponentUtil.processOnChange = function (changes, api) {
        if (!changes) {
            return;
        }
        // Only process changes to properties that are part of the gridOptions
        var gridChanges = {};
        var hasChanges = false;
        Object.keys(changes)
            .filter(function (key) { return ComponentUtil.ALL_PROPERTIES_AND_CALLBACKS_SET.has(key); })
            .forEach(function (key) {
            gridChanges[key] = changes[key];
            hasChanges = true;
        });
        if (!hasChanges) {
            return;
        }
        api.__internalUpdateGridOptions(gridChanges);
        // copy gridChanges into an event for dispatch
        var event = {
            type: Events.EVENT_COMPONENT_STATE_CHANGED
        };
        iterateObject(gridChanges, function (key, value) {
            event[key] = value;
        });
        api.dispatchEvent(event);
    };
    var _a;
    _a = ComponentUtil;
    // all events
    ComponentUtil.EVENTS = values(Events);
    ComponentUtil.VUE_OMITTED_PROPERTY = 'AG-VUE-OMITTED-PROPERTY';
    // events that are internal to AG Grid and should not be exposed to users via documentation or generated framework components
    /** Exclude the following internal events from code generation to prevent exposing these events via framework components */
    ComponentUtil.EXCLUDED_INTERNAL_EVENTS = [
        Events.EVENT_SCROLLBAR_WIDTH_CHANGED,
        Events.EVENT_CHECKBOX_CHANGED,
        Events.EVENT_HEIGHT_SCALE_CHANGED,
        Events.EVENT_BODY_HEIGHT_CHANGED,
        Events.EVENT_COLUMN_CONTAINER_WIDTH_CHANGED,
        Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED,
        Events.EVENT_SCROLL_VISIBILITY_CHANGED,
        Events.EVENT_COLUMN_HOVER_CHANGED,
        Events.EVENT_FLASH_CELLS,
        Events.EVENT_PAGINATION_PIXEL_OFFSET_CHANGED,
        Events.EVENT_DISPLAYED_ROWS_CHANGED,
        Events.EVENT_LEFT_PINNED_WIDTH_CHANGED,
        Events.EVENT_RIGHT_PINNED_WIDTH_CHANGED,
        Events.EVENT_ROW_CONTAINER_HEIGHT_CHANGED,
        Events.EVENT_POPUP_TO_FRONT,
        Events.EVENT_STORE_UPDATED,
        Events.EVENT_COLUMN_PANEL_ITEM_DRAG_START,
        Events.EVENT_COLUMN_PANEL_ITEM_DRAG_END,
        Events.EVENT_FILL_START,
        Events.EVENT_FILL_END,
        Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_START,
        Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_END,
        Events.EVENT_FULL_WIDTH_ROW_FOCUSED,
        Events.EVENT_HEADER_HEIGHT_CHANGED,
        Events.EVENT_COLUMN_HEADER_HEIGHT_CHANGED,
        Events.EVENT_CELL_FOCUS_CLEARED,
        Events.EVENT_GRID_STYLES_CHANGED,
        Events.EVENT_FILTER_DESTROYED,
        Events.EVENT_ROW_DATA_UPDATE_STARTED,
        Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED,
        Events.EVENT_DATA_TYPES_INFERRED,
        Events.EVENT_FIELD_VALUE_CHANGED,
        Events.EVENT_FIELD_PICKER_VALUE_SELECTED,
        Events.EVENT_SUPPRESS_COLUMN_MOVE_CHANGED,
        Events.EVENT_SUPPRESS_MENU_HIDE_CHANGED,
        Events.EVENT_SUPPRESS_FIELD_DOT_NOTATION,
        Events.EVENT_ROW_COUNT_READY,
        Events.EVENT_SIDE_BAR_UPDATED,
    ];
    // events that are available for use by users of AG Grid and so should be documented
    /** EVENTS that should be exposed via code generation for the framework components.  */
    ComponentUtil.PUBLIC_EVENTS = ComponentUtil.EVENTS.filter(function (e) { return !includes(ComponentUtil.EXCLUDED_INTERNAL_EVENTS, e); });
    // onXXX methods, based on the above events
    ComponentUtil.EVENT_CALLBACKS = ComponentUtil.EVENTS.map(function (event) { return ComponentUtil.getCallbackForEvent(event); });
    ComponentUtil.STRING_PROPERTIES = PropertyKeys.STRING_PROPERTIES;
    ComponentUtil.OBJECT_PROPERTIES = PropertyKeys.OBJECT_PROPERTIES;
    ComponentUtil.ARRAY_PROPERTIES = PropertyKeys.ARRAY_PROPERTIES;
    ComponentUtil.NUMBER_PROPERTIES = PropertyKeys.NUMBER_PROPERTIES;
    ComponentUtil.BOOLEAN_PROPERTIES = PropertyKeys.BOOLEAN_PROPERTIES;
    ComponentUtil.FUNCTION_PROPERTIES = PropertyKeys.FUNCTION_PROPERTIES;
    ComponentUtil.ALL_PROPERTIES = PropertyKeys.ALL_PROPERTIES;
    ComponentUtil.ALL_PROPERTIES_AND_CALLBACKS = __spreadArray(__spreadArray([], __read(_a.ALL_PROPERTIES), false), __read(_a.EVENT_CALLBACKS), false);
    ComponentUtil.ALL_PROPERTIES_AND_CALLBACKS_SET = new Set(ComponentUtil.ALL_PROPERTIES_AND_CALLBACKS);
    return ComponentUtil;
}());
export { ComponentUtil };
