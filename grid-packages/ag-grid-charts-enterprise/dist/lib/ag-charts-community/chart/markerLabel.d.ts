import type { FontStyle, FontWeight } from '../options/agChartOptions';
import { Group } from '../scene/group';
import type { RenderContext } from '../scene/node';
import type { Marker } from './marker/marker';
export declare class MarkerLabel extends Group {
    static className: string;
    private label;
    private line;
    constructor();
    text?: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    markerFill?: string;
    markerStroke?: string;
    markerStrokeWidth?: number;
    markerFillOpacity?: number;
    markerStrokeOpacity?: number;
    markerVisible?: boolean;
    lineStroke?: string;
    lineStrokeWidth?: number;
    lineStrokeOpacity?: number;
    lineLineDash?: number[];
    lineVisible?: boolean;
    private _marker;
    set marker(value: Marker);
    get marker(): Marker;
    private _markerSize;
    set markerSize(value: number);
    get markerSize(): number;
    private _spacing;
    set spacing(value: number);
    get spacing(): number;
    setSeriesStrokeOffset(xOff: number): void;
    private update;
    render(renderCtx: RenderContext): void;
}
