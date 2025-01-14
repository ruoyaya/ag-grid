// @ag-grid-community/react v31.1.0
import { Component } from 'react';
import { AgGridReactProps, AgReactUiProps } from './shared/interfaces';
import { ColumnApi, GridApi } from '@ag-grid-community/core';
export declare class AgGridReact<TData = any> extends Component<AgGridReactProps<TData> | AgReactUiProps<TData>, {}> {
    /** Grid Api available after onGridReady event has fired. */
    api: GridApi<TData>;
    /**
     * @deprecated v31 - The `columnApi` has been deprecated and all the methods are now present of the `api`.
     * Please use the `api` instead.
     */
    columnApi: ColumnApi;
    private apiListeners;
    registerApiListener(listener: (api: GridApi) => void): void;
    private setGridApi;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
