"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractHeaderCellComp = void 0;
const component_1 = require("../../../widgets/component");
class AbstractHeaderCellComp extends component_1.Component {
    constructor(template, ctrl) {
        super(template);
        this.ctrl = ctrl;
    }
    getCtrl() {
        return this.ctrl;
    }
}
exports.AbstractHeaderCellComp = AbstractHeaderCellComp;
