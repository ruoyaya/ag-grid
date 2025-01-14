// @ag-grid-community/react v31.1.0
import { IFloatingFilter, IFloatingFilterParams } from "@ag-grid-community/core";
import { CustomComponentWrapper } from "./customComponentWrapper";
import { CustomFloatingFilterProps, CustomFloatingFilterCallbacks } from "./interfaces";
export declare class FloatingFilterComponentWrapper extends CustomComponentWrapper<IFloatingFilterParams, CustomFloatingFilterProps, CustomFloatingFilterCallbacks> implements IFloatingFilter {
    private model;
    private readonly onModelChange;
    onParentModelChanged(parentModel: any): void;
    refresh(newParams: IFloatingFilterParams): void;
    protected getOptionalMethods(): string[];
    private updateModel;
    protected getProps(): CustomFloatingFilterProps;
}
