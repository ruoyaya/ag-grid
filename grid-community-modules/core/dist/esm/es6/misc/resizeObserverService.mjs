var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bean } from "../context/context.mjs";
import { BeanStub } from "../context/beanStub.mjs";
const DEBOUNCE_DELAY = 50;
let ResizeObserverService = class ResizeObserverService extends BeanStub {
    constructor() {
        super(...arguments);
        this.polyfillFunctions = [];
    }
    observeResize(element, callback) {
        const win = this.gridOptionsService.getWindow();
        const useBrowserResizeObserver = () => {
            const resizeObserver = new win.ResizeObserver(callback);
            resizeObserver.observe(element);
            return () => resizeObserver.disconnect();
        };
        const usePolyfill = () => {
            var _a, _b;
            // initialise to the current width and height, so first call will have no changes
            let widthLastTime = (_a = element === null || element === void 0 ? void 0 : element.clientWidth) !== null && _a !== void 0 ? _a : 0;
            let heightLastTime = (_b = element === null || element === void 0 ? void 0 : element.clientHeight) !== null && _b !== void 0 ? _b : 0;
            // when finished, this gets turned to false.
            let running = true;
            const periodicallyCheckWidthAndHeight = () => {
                var _a, _b;
                if (running) {
                    const newWidth = (_a = element === null || element === void 0 ? void 0 : element.clientWidth) !== null && _a !== void 0 ? _a : 0;
                    const newHeight = (_b = element === null || element === void 0 ? void 0 : element.clientHeight) !== null && _b !== void 0 ? _b : 0;
                    const changed = newWidth !== widthLastTime || newHeight !== heightLastTime;
                    if (changed) {
                        widthLastTime = newWidth;
                        heightLastTime = newHeight;
                        callback();
                    }
                    this.doNextPolyfillTurn(periodicallyCheckWidthAndHeight);
                }
            };
            periodicallyCheckWidthAndHeight();
            // the callback function we return sets running to false
            return () => running = false;
        };
        const suppressResize = this.gridOptionsService.get('suppressBrowserResizeObserver');
        const resizeObserverExists = !!win.ResizeObserver;
        if (resizeObserverExists && !suppressResize) {
            return useBrowserResizeObserver();
        }
        return this.getFrameworkOverrides().wrapIncoming(() => usePolyfill(), 'resize-observer');
    }
    doNextPolyfillTurn(func) {
        this.polyfillFunctions.push(func);
        this.schedulePolyfill();
    }
    schedulePolyfill() {
        if (this.polyfillScheduled) {
            return;
        }
        const executeAllFuncs = () => {
            const funcs = this.polyfillFunctions;
            // make sure set scheduled to false and clear clear array
            // before executing the funcs, as the funcs could add more funcs
            this.polyfillScheduled = false;
            this.polyfillFunctions = [];
            funcs.forEach(f => f());
        };
        this.polyfillScheduled = true;
        window.setTimeout(executeAllFuncs, DEBOUNCE_DELAY);
    }
};
ResizeObserverService = __decorate([
    Bean('resizeObserverService')
], ResizeObserverService);
export { ResizeObserverService };
