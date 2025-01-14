// Type definitions for @ag-grid-community/core v31.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { BeanStub } from "../context/beanStub";
export declare class SelectableService extends BeanStub {
    private rowModel;
    private selectionService;
    private init;
    /**
     * Used by CSRM only, to update selectable state after group state changes.
     */
    updateSelectableAfterGrouping(): void;
    private updateSelectable;
}
