// Type definitions for @ag-grid-community/core v31.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { Column, ColumnPinnedType } from "../../entities/column";
import { DraggingEvent } from "../../dragAndDrop/dragAndDropService";
import { DropListener } from "./bodyDropTarget";
import { ColumnEventType } from "../../events";
import { CtrlsService } from "../../ctrlsService";
export declare class MoveColumnFeature implements DropListener {
    private columnModel;
    private dragAndDropService;
    private gridOptionsService;
    ctrlsService: CtrlsService;
    private gridBodyCon;
    private needToMoveLeft;
    private needToMoveRight;
    private movingIntervalId;
    private intervalCount;
    private pinned;
    private centerContainer;
    private lastDraggingEvent;
    private lastMovedInfo;
    private failedMoveAttempts;
    private eContainer;
    constructor(pinned: ColumnPinnedType, eContainer: HTMLElement);
    init(): void;
    getIconName(): string;
    onDragEnter(draggingEvent: DraggingEvent): void;
    onDragLeave(): void;
    setColumnsVisible(columns: Column[] | null | undefined, visible: boolean, source: ColumnEventType): void;
    setColumnsPinned(columns: Column[] | null | undefined, pinned: ColumnPinnedType, source: ColumnEventType): void;
    onDragStop(): void;
    private checkCenterForScrolling;
    onDragging(draggingEvent?: DraggingEvent, fromEnter?: boolean, fakeEvent?: boolean, finished?: boolean): void;
    private normaliseDirection;
    private ensureIntervalStarted;
    private ensureIntervalCleared;
    private moveInterval;
}
