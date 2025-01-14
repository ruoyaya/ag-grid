var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { ClientSideRowModelSteps } from "../interfaces/iClientSideRowModel";
var ExpansionService = /** @class */ (function (_super) {
    __extends(ExpansionService, _super);
    function ExpansionService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExpansionService.prototype.postConstruct = function () {
        this.isClientSideRowModel = this.rowModel.getType() === 'clientSide';
    };
    ExpansionService.prototype.expandRows = function (rowIds) {
        if (!this.isClientSideRowModel) {
            return;
        }
        var rowIdSet = new Set(rowIds);
        this.rowModel.forEachNode(function (node) {
            if (node.id && rowIdSet.has(node.id)) {
                node.expanded = true;
            }
        });
        this.onGroupExpandedOrCollapsed();
    };
    ExpansionService.prototype.getExpandedRows = function () {
        var expandedRows = [];
        this.rowModel.forEachNode(function (_a) {
            var expanded = _a.expanded, id = _a.id;
            if (expanded && id) {
                expandedRows.push(id);
            }
        });
        return expandedRows;
    };
    ExpansionService.prototype.expandAll = function (value) {
        if (!this.isClientSideRowModel) {
            return;
        }
        this.rowModel.expandOrCollapseAll(value);
    };
    ExpansionService.prototype.setRowNodeExpanded = function (rowNode, expanded, expandParents) {
        if (rowNode) {
            // expand all parents recursively, except root node.
            if (expandParents && rowNode.parent && rowNode.parent.level !== -1) {
                this.setRowNodeExpanded(rowNode.parent, expanded, expandParents);
            }
            rowNode.setExpanded(expanded);
        }
    };
    ExpansionService.prototype.onGroupExpandedOrCollapsed = function () {
        if (!this.isClientSideRowModel) {
            return;
        }
        // we don't really want the user calling this if only one rowNode was expanded, instead they should be
        // calling rowNode.setExpanded(boolean) - this way we do a 'keepRenderedRows=false' so that the whole
        // grid gets refreshed again - otherwise the row with the rowNodes that were changed won't get updated,
        // and thus the expand icon in the group cell won't get 'opened' or 'closed'.
        this.rowModel.refreshModel({ step: ClientSideRowModelSteps.MAP });
    };
    __decorate([
        Autowired('rowModel')
    ], ExpansionService.prototype, "rowModel", void 0);
    __decorate([
        PostConstruct
    ], ExpansionService.prototype, "postConstruct", null);
    ExpansionService = __decorate([
        Bean('expansionService')
    ], ExpansionService);
    return ExpansionService;
}(BeanStub));
export { ExpansionService };
