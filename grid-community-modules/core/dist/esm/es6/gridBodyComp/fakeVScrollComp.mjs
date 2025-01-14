var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PostConstruct } from "../context/context.mjs";
import { AbstractFakeScrollComp } from "./abstractFakeScrollComp.mjs";
import { isVisible, setFixedWidth } from "../utils/dom.mjs";
import { SetHeightFeature } from "./rowContainer/setHeightFeature.mjs";
import { Events } from "../eventKeys.mjs";
export class FakeVScrollComp extends AbstractFakeScrollComp {
    constructor() {
        super(FakeVScrollComp.TEMPLATE, 'vertical');
    }
    postConstruct() {
        super.postConstruct();
        this.createManagedBean(new SetHeightFeature(this.eContainer));
        this.ctrlsService.registerFakeVScrollComp(this);
        this.addManagedListener(this.eventService, Events.EVENT_ROW_CONTAINER_HEIGHT_CHANGED, this.onRowContainerHeightChanged.bind(this));
    }
    setScrollVisible() {
        const vScrollShowing = this.scrollVisibleService.isVerticalScrollShowing();
        const invisibleScrollbar = this.invisibleScrollbar;
        const scrollbarWidth = vScrollShowing ? (this.gridOptionsService.getScrollbarWidth() || 0) : 0;
        const adjustedScrollbarWidth = (scrollbarWidth === 0 && invisibleScrollbar) ? 16 : scrollbarWidth;
        this.addOrRemoveCssClass('ag-scrollbar-invisible', invisibleScrollbar);
        setFixedWidth(this.getGui(), adjustedScrollbarWidth);
        setFixedWidth(this.eViewport, adjustedScrollbarWidth);
        setFixedWidth(this.eContainer, adjustedScrollbarWidth);
        this.setDisplayed(vScrollShowing, { skipAriaHidden: true });
    }
    onRowContainerHeightChanged() {
        const { ctrlsService } = this;
        const gridBodyCtrl = ctrlsService.getGridBodyCtrl();
        const gridBodyViewportEl = gridBodyCtrl.getBodyViewportElement();
        const eViewportScrollTop = this.getScrollPosition();
        const gridBodyViewportScrollTop = gridBodyViewportEl.scrollTop;
        if (eViewportScrollTop != gridBodyViewportScrollTop) {
            this.setScrollPosition(gridBodyViewportScrollTop, true);
        }
    }
    getScrollPosition() {
        return this.getViewport().scrollTop;
    }
    setScrollPosition(value, force) {
        if (!force && !isVisible(this.getViewport())) {
            this.attemptSettingScrollPosition(value);
        }
        this.getViewport().scrollTop = value;
    }
}
FakeVScrollComp.TEMPLATE = `<div class="ag-body-vertical-scroll" aria-hidden="true">
            <div class="ag-body-vertical-scroll-viewport" ref="eViewport">
                <div class="ag-body-vertical-scroll-container" ref="eContainer"></div>
            </div>
        </div>`;
__decorate([
    PostConstruct
], FakeVScrollComp.prototype, "postConstruct", null);
