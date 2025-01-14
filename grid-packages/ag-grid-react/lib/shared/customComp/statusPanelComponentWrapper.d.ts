// ag-grid-react v31.1.0
import { IStatusPanel, IStatusPanelParams } from "ag-grid-community";
import { CustomComponentWrapper } from "./customComponentWrapper";
import { CustomStatusPanelProps } from "./interfaces";
export declare class StatusPanelComponentWrapper extends CustomComponentWrapper<IStatusPanelParams, CustomStatusPanelProps, {}> implements IStatusPanel {
    refresh(params: IStatusPanelParams): boolean;
}
