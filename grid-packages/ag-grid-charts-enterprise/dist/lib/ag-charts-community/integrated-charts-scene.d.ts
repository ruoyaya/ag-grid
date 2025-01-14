import * as fromToMotion from './motion/fromToMotion';
export { Caption } from './chart/caption';
export { DropShadow } from './scene/dropShadow';
export { Group } from './scene/group';
export { Scene } from './scene/scene';
export { Node, PointerEvents, RedrawType, SceneChangeDetection } from './scene/node';
export type { RenderContext } from './scene/node';
export { Selection } from './scene/selection';
export type { Point, SizedPoint } from './scene/point';
export { Arc } from './scene/shape/arc';
export { Line } from './scene/shape/line';
export { LinearGradientFill } from './scene/shape/linearGradientFill';
export { Path, ScenePathChangeDetection } from './scene/shape/path';
export { Rect } from './scene/shape/rect';
export { Sector } from './scene/shape/sector';
export { RadialColumnShape, getRadialColumnWidth } from './scene/shape/radialColumnShape';
export { Shape } from './scene/shape/shape';
export type { ShapeLineCap } from './scene/shape/shape';
export { Text, getFont } from './scene/shape/text';
export type { Scale } from './scale/scale';
export { ContinuousScale } from './scale/continuousScale';
export { BandScale } from './scale/bandScale';
export { LinearScale } from './scale/linearScale';
export { toRadians } from './util/angle';
export { Label } from './chart/label';
export { Marker } from './chart/marker/marker';
export { getMarker } from './chart/marker/util';
export { Circle } from './chart/marker/circle';
export { Diamond } from './chart/marker/diamond';
export { Square } from './chart/marker/square';
export { Triangle } from './chart/marker/triangle';
export { Tooltip, toTooltipHtml } from './chart/tooltip/tooltip';
export type { TooltipMeta } from './chart/tooltip/tooltip';
export { BBox } from './scene/bbox';
export type { NearestResult } from './scene/nearest';
export { nearestSquared, nearestSquaredInContainer } from './scene/nearest';
export { HdpiCanvas } from './scene/canvas/hdpiCanvas';
export { Image } from './scene/image';
export { Path2D } from './scene/path2D';
export * as easing from './motion/easing';
declare const motion: {
    resetMotion<N extends import("./scene/node").Node, T extends Partial<N>, D>(selectionsOrNodes: import("./scene/selection").Selection<N, D>[] | N[], propsFn: (node: N, datum: D) => T): void;
    fromToMotion<N_1 extends import("./scene/node").Node, T_1 extends Record<string, string | number | undefined> & Partial<N_1>, D_1>(groupId: string, subId: string, animationManager: import("./module-support").AnimationManager, selectionsOrNodes: import("./scene/selection").Selection<N_1, D_1>[] | N_1[], fns: fromToMotion.FromToFns<N_1, T_1, D_1>, getDatumId?: ((node: N_1, datum: D_1) => string) | undefined, diff?: fromToMotion.FromToDiff | undefined): void;
    staticFromToMotion<N_2 extends import("./scene/node").Node, T_2 extends Record<string, string | number | undefined> & Partial<N_2> & object, D_2>(groupId: string, subId: string, animationManager: import("./module-support").AnimationManager, selectionsOrNodes: import("./scene/selection").Selection<N_2, D_2>[] | N_2[], from: T_2, to: T_2, extraOpts: fromToMotion.ExtraOpts<N_2>): void;
    NODE_UPDATE_PHASES: fromToMotion.NodeUpdateState[];
    NODE_UPDATE_STATE_TO_PHASE_MAPPING: Record<fromToMotion.NodeUpdateState, "trailing" | "end" | "initial" | "remove" | "update" | "add">;
};
export { motion };
export type { NodeUpdateState, FromToMotionPropFn } from './motion/fromToMotion';
