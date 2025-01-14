// Type definitions for @ag-grid-community/core v31.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { AgEvent, AgEventListener, AgGlobalEventListener } from "./events";
import { GridOptionsService } from "./gridOptionsService";
import { IEventEmitter } from "./interfaces/iEventEmitter";
import { IFrameworkOverrides } from "./interfaces/iFrameworkOverrides";
export declare class EventService implements IEventEmitter {
    private allSyncListeners;
    private allAsyncListeners;
    private globalSyncListeners;
    private globalAsyncListeners;
    private frameworkOverrides;
    private gridOptionsService?;
    private asyncFunctionsQueue;
    private scheduled;
    private firedEvents;
    setBeans(gridOptionsService: GridOptionsService, frameworkOverrides: IFrameworkOverrides, globalEventListener?: AgGlobalEventListener | null, globalSyncEventListener?: AgGlobalEventListener | null): void;
    setFrameworkOverrides(frameworkOverrides: IFrameworkOverrides): void;
    private getListeners;
    noRegisteredListenersExist(): boolean;
    addEventListener(eventType: string, listener: AgEventListener, async?: boolean): void;
    removeEventListener(eventType: string, listener: AgEventListener, async?: boolean): void;
    addGlobalListener(listener: AgGlobalEventListener, async?: boolean): void;
    removeGlobalListener(listener: AgGlobalEventListener, async?: boolean): void;
    dispatchEvent(event: AgEvent): void;
    dispatchEventOnce(event: AgEvent): void;
    private dispatchToListeners;
    private dispatchAsync;
    private flushAsyncQueue;
}
