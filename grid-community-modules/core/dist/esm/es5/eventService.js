var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Bean, Qualifier } from "./context/context";
var EventService = /** @class */ (function () {
    function EventService() {
        this.allSyncListeners = new Map();
        this.allAsyncListeners = new Map();
        this.globalSyncListeners = new Set();
        this.globalAsyncListeners = new Set();
        this.asyncFunctionsQueue = [];
        this.scheduled = false;
        // using an object performs better than a Set for the number of different events we have
        this.firedEvents = {};
    }
    // because this class is used both inside the context and outside the context, we do not
    // use autowired attributes, as that would be confusing, as sometimes the attributes
    // would be wired, and sometimes not.
    //
    // the global event servers used by AG Grid is autowired by the context once, and this
    // setBeans method gets called once.
    //
    // the times when this class is used outside of the context (eg RowNode has an instance of this
    // class) then it is not a bean, and this setBeans method is not called.
    EventService.prototype.setBeans = function (gridOptionsService, frameworkOverrides, globalEventListener, globalSyncEventListener) {
        if (globalEventListener === void 0) { globalEventListener = null; }
        if (globalSyncEventListener === void 0) { globalSyncEventListener = null; }
        this.frameworkOverrides = frameworkOverrides;
        this.gridOptionsService = gridOptionsService;
        if (globalEventListener) {
            var async = gridOptionsService.useAsyncEvents();
            this.addGlobalListener(globalEventListener, async);
        }
        if (globalSyncEventListener) {
            this.addGlobalListener(globalSyncEventListener, false);
        }
    };
    EventService.prototype.setFrameworkOverrides = function (frameworkOverrides) {
        this.frameworkOverrides = frameworkOverrides;
    };
    EventService.prototype.getListeners = function (eventType, async, autoCreateListenerCollection) {
        var listenerMap = async ? this.allAsyncListeners : this.allSyncListeners;
        var listeners = listenerMap.get(eventType);
        // Note: 'autoCreateListenerCollection' should only be 'true' if a listener is about to be added. For instance
        // getListeners() is also called during event dispatch even though no listeners are added. This measure protects
        // against 'memory bloat' as empty collections will prevent the RowNode's event service from being removed after
        // the RowComp is destroyed, see noRegisteredListenersExist() below.
        if (!listeners && autoCreateListenerCollection) {
            listeners = new Set();
            listenerMap.set(eventType, listeners);
        }
        return listeners;
    };
    EventService.prototype.noRegisteredListenersExist = function () {
        return this.allSyncListeners.size === 0 && this.allAsyncListeners.size === 0 &&
            this.globalSyncListeners.size === 0 && this.globalAsyncListeners.size === 0;
    };
    EventService.prototype.addEventListener = function (eventType, listener, async) {
        if (async === void 0) { async = false; }
        this.getListeners(eventType, async, true).add(listener);
    };
    EventService.prototype.removeEventListener = function (eventType, listener, async) {
        if (async === void 0) { async = false; }
        var listeners = this.getListeners(eventType, async, false);
        if (!listeners) {
            return;
        }
        listeners.delete(listener);
        if (listeners.size === 0) {
            var listenerMap = async ? this.allAsyncListeners : this.allSyncListeners;
            listenerMap.delete(eventType);
        }
    };
    EventService.prototype.addGlobalListener = function (listener, async) {
        if (async === void 0) { async = false; }
        (async ? this.globalAsyncListeners : this.globalSyncListeners).add(listener);
    };
    EventService.prototype.removeGlobalListener = function (listener, async) {
        if (async === void 0) { async = false; }
        (async ? this.globalAsyncListeners : this.globalSyncListeners).delete(listener);
    };
    EventService.prototype.dispatchEvent = function (event) {
        var agEvent = event;
        if (this.gridOptionsService) {
            // Apply common properties to all dispatched events if this event service has had its beans set with gridOptionsService.
            // Note there are multiple instances of EventService that are used local to components which do not set gridOptionsService.
            this.gridOptionsService.addGridCommonParams(agEvent);
        }
        this.dispatchToListeners(agEvent, true);
        this.dispatchToListeners(agEvent, false);
        this.firedEvents[agEvent.type] = true;
    };
    EventService.prototype.dispatchEventOnce = function (event) {
        if (!this.firedEvents[event.type]) {
            this.dispatchEvent(event);
        }
    };
    EventService.prototype.dispatchToListeners = function (event, async) {
        var _this = this;
        var _a;
        var eventType = event.type;
        if (async && 'event' in event) {
            var browserEvent = event.event;
            if (browserEvent instanceof Event) {
                // AG-7893 - Persist composedPath() so that its result can still be accessed by the user asynchronously.
                // Within an async event handler if they call composedPath() on the event it will always return an empty [].
                event.eventPath = browserEvent.composedPath();
            }
        }
        var processEventListeners = function (listeners, originalListeners) { return listeners.forEach(function (listener) {
            if (!originalListeners.has(listener)) {
                // A listener could have been removed by a previously processed listener. In this case we don't want to call 
                return;
            }
            var callback = _this.frameworkOverrides
                ? function () { return _this.frameworkOverrides.wrapIncoming(function () { return listener(event); }); }
                : function () { return listener(event); };
            if (async) {
                _this.dispatchAsync(callback);
            }
            else {
                callback();
            }
        }); };
        var originalListeners = (_a = this.getListeners(eventType, async, false)) !== null && _a !== void 0 ? _a : new Set();
        // create a shallow copy to prevent listeners cyclically adding more listeners to capture this event
        var listeners = new Set(originalListeners);
        if (listeners.size > 0) {
            processEventListeners(listeners, originalListeners);
        }
        var globalListeners = new Set(async ? this.globalAsyncListeners : this.globalSyncListeners);
        globalListeners.forEach(function (listener) {
            var callback = _this.frameworkOverrides
                ? function () { return _this.frameworkOverrides.wrapIncoming(function () { return listener(eventType, event); }); }
                : function () { return listener(eventType, event); };
            if (async) {
                _this.dispatchAsync(callback);
            }
            else {
                callback();
            }
        });
    };
    // this gets called inside the grid's thread, for each event that it
    // wants to set async. the grid then batches the events into one setTimeout()
    // because setTimeout() is an expensive operation. ideally we would have
    // each event in it's own setTimeout(), but we batch for performance.
    EventService.prototype.dispatchAsync = function (func) {
        var _this = this;
        // add to the queue for executing later in the next VM turn
        this.asyncFunctionsQueue.push(func);
        // check if timeout is already scheduled. the first time the grid calls
        // this within it's thread turn, this should be false, so it will schedule
        // the 'flush queue' method the first time it comes here. then the flag is
        // set to 'true' so it will know it's already scheduled for subsequent calls.
        if (!this.scheduled) {
            // if not scheduled, schedule one
            this.frameworkOverrides.wrapIncoming(function () {
                window.setTimeout(_this.flushAsyncQueue.bind(_this), 0);
            });
            // mark that it is scheduled
            this.scheduled = true;
        }
    };
    // this happens in the next VM turn only, and empties the queue of events
    EventService.prototype.flushAsyncQueue = function () {
        this.scheduled = false;
        // we take a copy, because the event listener could be using
        // the grid, which would cause more events, which would be potentially
        // added to the queue, so safe to take a copy, the new events will
        // get executed in a later VM turn rather than risk updating the
        // queue as we are flushing it.
        var queueCopy = this.asyncFunctionsQueue.slice();
        this.asyncFunctionsQueue = [];
        // execute the queue
        queueCopy.forEach(function (func) { return func(); });
    };
    __decorate([
        __param(0, Qualifier('gridOptionsService')),
        __param(1, Qualifier('frameworkOverrides')),
        __param(2, Qualifier('globalEventListener')),
        __param(3, Qualifier('globalSyncEventListener'))
    ], EventService.prototype, "setBeans", null);
    EventService = __decorate([
        Bean('eventService')
    ], EventService);
    return EventService;
}());
export { EventService };
