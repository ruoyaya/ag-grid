// Type definitions for @ag-grid-community/core v31.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { IAggFunc } from "../entities/colDef";
import { Column } from "../entities/column";
export interface IAggFuncService {
    addAggFuncs(aggFuncs: {
        [key: string]: IAggFunc;
    }): void;
    clear(): void;
    getDefaultAggFunc(column: Column): string | null;
    getFuncNames(column: Column): string[];
    getDefaultFuncLabel(fctName: string): string;
}
