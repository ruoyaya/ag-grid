import { CartesianChartProxy } from "../cartesian/cartesianChartProxy.mjs";
import { getSeriesType } from "../../utils/seriesTypeMapper.mjs";
export class ComboChartProxy extends CartesianChartProxy {
    constructor(params) {
        super(params);
    }
    getAxes(params) {
        const fields = params ? params.fields : [];
        const fieldsMap = new Map(fields.map(f => [f.colId, f]));
        const { primaryYKeys, secondaryYKeys } = this.getYKeys(fields, params.seriesChartTypes);
        const axes = [
            {
                type: this.getXAxisType(params),
                position: 'bottom',
            },
        ];
        if (primaryYKeys.length > 0) {
            axes.push({
                type: 'number',
                keys: primaryYKeys,
                position: 'left',
            });
        }
        if (secondaryYKeys.length > 0) {
            secondaryYKeys.forEach((secondaryYKey) => {
                const field = fieldsMap.get(secondaryYKey);
                const secondaryAxisIsVisible = field && field.colId === secondaryYKey;
                if (!secondaryAxisIsVisible) {
                    return;
                }
                const secondaryAxisOptions = {
                    type: 'number',
                    keys: [secondaryYKey],
                    position: 'right',
                };
                axes.push(secondaryAxisOptions);
            });
        }
        return axes;
    }
    getSeries(params) {
        const { fields, seriesChartTypes } = params;
        const [category] = params.categories;
        return fields.map(field => {
            const seriesChartType = seriesChartTypes.find(s => s.colId === field.colId);
            if (seriesChartType) {
                const chartType = seriesChartType.chartType;
                const grouped = ['groupedColumn', 'groupedBar'].includes(chartType);
                const groupedOpts = grouped ? { grouped: true } : {};
                return Object.assign({ type: getSeriesType(chartType), xKey: category.id, yKey: field.colId, yName: field.displayName, stacked: ['stackedArea', 'stackedColumn'].includes(chartType) }, groupedOpts);
            }
        });
    }
    getYKeys(fields, seriesChartTypes) {
        const primaryYKeys = [];
        const secondaryYKeys = [];
        fields.forEach(field => {
            const colId = field.colId;
            const seriesChartType = seriesChartTypes.find(s => s.colId === colId);
            if (seriesChartType) {
                seriesChartType.secondaryAxis ? secondaryYKeys.push(colId) : primaryYKeys.push(colId);
            }
        });
        return { primaryYKeys, secondaryYKeys };
    }
}
