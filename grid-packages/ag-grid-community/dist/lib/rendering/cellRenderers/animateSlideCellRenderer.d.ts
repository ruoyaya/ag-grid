import { ICellRenderer } from "./iCellRenderer";
import { Component } from "../../widgets/component";
export declare class AnimateSlideCellRenderer extends Component implements ICellRenderer {
    private eCurrent;
    private ePrevious;
    private lastValue;
    private refreshCount;
    private filterManager;
    constructor();
    init(params: any): void;
    addSlideAnimation(): void;
    refresh(params: any, isInitialRender?: boolean): boolean;
}
