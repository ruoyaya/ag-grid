// Type definitions for @ag-grid-community/core v31.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { HeaderRowCtrl } from "../../row/headerRowCtrl";
import { AbstractHeaderCellCtrl, IAbstractHeaderCellComp } from "../abstractCell/abstractHeaderCellCtrl";
import { Column } from '../../../entities/column';
import { IFloatingFilter } from '../../../filter/floating/floatingFilter';
import { AgPromise } from '../../../utils';
import { UserCompDetails } from "../../../components/framework/userComponentFactory";
import { Beans } from "../../../rendering/beans";
export interface IHeaderFilterCellComp extends IAbstractHeaderCellComp {
    addOrRemoveBodyCssClass(cssClassName: string, on: boolean): void;
    setButtonWrapperDisplayed(displayed: boolean): void;
    setCompDetails(compDetails?: UserCompDetails | null): void;
    getFloatingFilterComp(): AgPromise<IFloatingFilter> | null;
    setWidth(width: string): void;
    setMenuIcon(icon: HTMLElement): void;
}
export declare class HeaderFilterCellCtrl extends AbstractHeaderCellCtrl<IHeaderFilterCellComp, Column> {
    private eButtonShowMainFilter;
    private eFloatingFilterBody;
    private suppressFilterButton;
    private highlightFilterButtonWhenActive;
    private active;
    private iconCreated;
    private userCompDetails?;
    private destroySyncListener;
    private destroyFilterChangedListener;
    constructor(column: Column, beans: Beans, parentRowCtrl: HeaderRowCtrl);
    setComp(comp: IHeaderFilterCellComp, eGui: HTMLElement, eButtonShowMainFilter: HTMLElement, eFloatingFilterBody: HTMLElement): void;
    protected resizeHeader(): void;
    protected moveHeader(): void;
    private setupActive;
    private setupUi;
    private setupFocus;
    private setupAria;
    private onTabKeyDown;
    private findNextColumnWithFloatingFilter;
    protected handleKeyDown(e: KeyboardEvent): void;
    private onFocusIn;
    private setupHover;
    private setupLeft;
    private setupFilterButton;
    private setupUserComp;
    private setCompDetails;
    private showParentFilter;
    private setupSyncWithFilter;
    private setupWidth;
    private setupFilterChangedListener;
    private updateFilterButton;
    private onColDefChanged;
    private updateCompDetails;
    private updateFloatingFilterParams;
    protected destroy(): void;
}
