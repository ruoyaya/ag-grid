var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../context/beanStub.mjs";
import { Autowired, Bean, PostConstruct } from "../context/context.mjs";
import { Events } from "../eventKeys.mjs";
let PinnedWidthService = class PinnedWidthService extends BeanStub {
    postConstruct() {
        const listener = this.checkContainerWidths.bind(this);
        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, listener);
        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED, listener);
        this.addManagedPropertyListener('domLayout', listener);
    }
    checkContainerWidths() {
        const printLayout = this.gridOptionsService.isDomLayout('print');
        const newLeftWidth = printLayout ? 0 : this.columnModel.getDisplayedColumnsLeftWidth();
        const newRightWidth = printLayout ? 0 : this.columnModel.getDisplayedColumnsRightWidth();
        if (newLeftWidth != this.leftWidth) {
            this.leftWidth = newLeftWidth;
            this.eventService.dispatchEvent({ type: Events.EVENT_LEFT_PINNED_WIDTH_CHANGED });
        }
        if (newRightWidth != this.rightWidth) {
            this.rightWidth = newRightWidth;
            this.eventService.dispatchEvent({ type: Events.EVENT_RIGHT_PINNED_WIDTH_CHANGED });
        }
    }
    getPinnedRightWidth() {
        return this.rightWidth;
    }
    getPinnedLeftWidth() {
        return this.leftWidth;
    }
};
__decorate([
    Autowired('columnModel')
], PinnedWidthService.prototype, "columnModel", void 0);
__decorate([
    PostConstruct
], PinnedWidthService.prototype, "postConstruct", null);
PinnedWidthService = __decorate([
    Bean('pinnedWidthService')
], PinnedWidthService);
export { PinnedWidthService };
