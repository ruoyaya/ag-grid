// Type definitions for @ag-grid-community/core v31.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { BeanStub } from "../context/beanStub";
export declare class ColumnAnimationService extends BeanStub {
    private ctrlsService;
    private gridBodyCtrl;
    private executeNextFuncs;
    private executeLaterFuncs;
    private active;
    private suppressAnimation;
    private animationThreadCount;
    private postConstruct;
    isActive(): boolean;
    setSuppressAnimation(suppress: boolean): void;
    start(): void;
    finish(): void;
    executeNextVMTurn(func: Function): void;
    executeLaterVMTurn(func: Function): void;
    private ensureAnimationCssClassPresent;
    private flush;
}
