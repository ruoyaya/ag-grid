"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowComp = void 0;
const component_1 = require("../../widgets/component");
const dom_1 = require("../../utils/dom");
const cellComp_1 = require("../cell/cellComp");
const object_1 = require("../../utils/object");
const aria_1 = require("../../utils/aria");
class RowComp extends component_1.Component {
    constructor(ctrl, beans, containerType) {
        super();
        this.cellComps = {};
        this.beans = beans;
        this.rowCtrl = ctrl;
        const rowDiv = document.createElement('div');
        rowDiv.setAttribute('comp-id', `${this.getCompId()}`);
        rowDiv.setAttribute('style', this.getInitialStyle(containerType));
        this.setTemplateFromElement(rowDiv);
        const eGui = this.getGui();
        const style = eGui.style;
        this.domOrder = this.rowCtrl.getDomOrder();
        (0, aria_1.setAriaRole)(eGui, 'row');
        const tabIndex = this.rowCtrl.getTabIndex();
        if (tabIndex != null) {
            eGui.setAttribute('tabindex', tabIndex.toString());
        }
        const compProxy = {
            setDomOrder: domOrder => this.domOrder = domOrder,
            setCellCtrls: cellCtrls => this.setCellCtrls(cellCtrls),
            showFullWidth: compDetails => this.showFullWidth(compDetails),
            getFullWidthCellRenderer: () => this.getFullWidthCellRenderer(),
            addOrRemoveCssClass: (name, on) => this.addOrRemoveCssClass(name, on),
            setUserStyles: (styles) => (0, dom_1.addStylesToElement)(eGui, styles),
            setTop: top => style.top = top,
            setTransform: transform => style.transform = transform,
            setRowIndex: rowIndex => eGui.setAttribute('row-index', rowIndex),
            setRowId: (rowId) => eGui.setAttribute('row-id', rowId),
            setRowBusinessKey: businessKey => eGui.setAttribute('row-business-key', businessKey),
            refreshFullWidth: getUpdatedParams => this.refreshFullWidth(getUpdatedParams)
        };
        ctrl.setComp(compProxy, this.getGui(), containerType);
        this.addDestroyFunc(() => {
            ctrl.unsetComp(containerType);
        });
    }
    getInitialStyle(containerType) {
        const transform = this.rowCtrl.getInitialTransform(containerType);
        return transform ? `transform: ${transform}` : `top: ${this.rowCtrl.getInitialRowTop(containerType)}`;
    }
    showFullWidth(compDetails) {
        const callback = (cellRenderer) => {
            if (this.isAlive()) {
                const eGui = cellRenderer.getGui();
                this.getGui().appendChild(eGui);
                this.rowCtrl.setupDetailRowAutoHeight(eGui);
                this.setFullWidthRowComp(cellRenderer);
            }
            else {
                this.beans.context.destroyBean(cellRenderer);
            }
        };
        // if not in cache, create new one
        const res = compDetails.newAgStackInstance();
        if (!res) {
            return;
        }
        res.then(callback);
    }
    setCellCtrls(cellCtrls) {
        const cellsToRemove = Object.assign({}, this.cellComps);
        cellCtrls.forEach(cellCtrl => {
            const key = cellCtrl.getInstanceId();
            const existingCellComp = this.cellComps[key];
            if (existingCellComp == null) {
                this.newCellComp(cellCtrl);
            }
            else {
                cellsToRemove[key] = null;
            }
        });
        const cellCompsToRemove = (0, object_1.getAllValuesInObject)(cellsToRemove)
            .filter(cellComp => cellComp != null);
        this.destroyCells(cellCompsToRemove);
        this.ensureDomOrder(cellCtrls);
    }
    ensureDomOrder(cellCtrls) {
        if (!this.domOrder) {
            return;
        }
        const elementsInOrder = [];
        cellCtrls.forEach(cellCtrl => {
            const cellComp = this.cellComps[cellCtrl.getInstanceId()];
            if (cellComp) {
                elementsInOrder.push(cellComp.getGui());
            }
        });
        (0, dom_1.setDomChildOrder)(this.getGui(), elementsInOrder);
    }
    newCellComp(cellCtrl) {
        const cellComp = new cellComp_1.CellComp(this.beans, cellCtrl, this.rowCtrl.isPrintLayout(), this.getGui(), this.rowCtrl.isEditing());
        this.cellComps[cellCtrl.getInstanceId()] = cellComp;
        this.getGui().appendChild(cellComp.getGui());
    }
    destroy() {
        super.destroy();
        this.destroyAllCells();
    }
    destroyAllCells() {
        const cellsToDestroy = (0, object_1.getAllValuesInObject)(this.cellComps).filter(cp => cp != null);
        this.destroyCells(cellsToDestroy);
    }
    setFullWidthRowComp(fullWidthRowComponent) {
        if (this.fullWidthCellRenderer) {
            console.error('AG Grid - should not be setting fullWidthRowComponent twice');
        }
        this.fullWidthCellRenderer = fullWidthRowComponent;
        this.addDestroyFunc(() => {
            this.fullWidthCellRenderer = this.beans.context.destroyBean(this.fullWidthCellRenderer);
        });
    }
    getFullWidthCellRenderer() {
        return this.fullWidthCellRenderer;
    }
    destroyCells(cellComps) {
        cellComps.forEach(cellComp => {
            // could be old reference, ie removed cell
            if (!cellComp) {
                return;
            }
            // check cellComp belongs in this container
            const instanceId = cellComp.getCtrl().getInstanceId();
            if (this.cellComps[instanceId] !== cellComp) {
                return;
            }
            cellComp.detach();
            cellComp.destroy();
            this.cellComps[instanceId] = null;
        });
    }
    refreshFullWidth(getUpdatedParams) {
        const { fullWidthCellRenderer } = this;
        if (!fullWidthCellRenderer || !fullWidthCellRenderer.refresh) {
            return false;
        }
        const params = getUpdatedParams();
        return fullWidthCellRenderer.refresh(params);
    }
}
exports.RowComp = RowComp;
