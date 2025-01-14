import { Column, DraggingEvent, ITooltipParams, WithoutGridCommon } from "@ag-grid-community/core";
import { BaseDropZonePanel } from "./baseDropZonePanel";
export declare class ValuesDropZonePanel extends BaseDropZonePanel {
    private columnModel;
    private loggerFactory;
    private dragAndDropService;
    constructor(horizontal: boolean);
    private passBeansUp;
    protected getAriaLabel(): string;
    getTooltipParams(): WithoutGridCommon<ITooltipParams>;
    protected getIconName(): string;
    protected isColumnDroppable(column: Column, draggingEvent: DraggingEvent): boolean;
    protected updateColumns(columns: Column[]): void;
    protected getExistingColumns(): Column[];
}
