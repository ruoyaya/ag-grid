"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartProxy = void 0;
const ag_charts_community_1 = require("ag-charts-community");
const seriesTypeMapper_1 = require("../utils/seriesTypeMapper");
const integration_1 = require("../utils/integration");
const chartTheme_1 = require("./chartTheme");
const object_1 = require("../utils/object");
class ChartProxy {
    constructor(chartProxyParams) {
        this.chartProxyParams = chartProxyParams;
        this.clearThemeOverrides = false;
        this.chart = chartProxyParams.chartInstance;
        this.chartType = chartProxyParams.chartType;
        this.crossFiltering = chartProxyParams.crossFiltering;
        this.crossFilterCallback = chartProxyParams.crossFilterCallback;
        this.standaloneChartType = (0, seriesTypeMapper_1.getSeriesType)(this.chartType);
        if (this.chart == null) {
            this.chart = ag_charts_community_1.AgCharts.create(this.getCommonChartOptions());
        }
        else {
            // On chart change, reset formatting panel changes.
            this.clearThemeOverrides = true;
        }
    }
    getChart() {
        return (0, integration_1.deproxy)(this.chart);
    }
    getChartRef() {
        return this.chart;
    }
    downloadChart(dimensions, fileName, fileFormat) {
        const { chart } = this;
        const rawChart = (0, integration_1.deproxy)(chart);
        const imageFileName = fileName || (rawChart.title ? rawChart.title.text : 'chart');
        const { width, height } = dimensions || {};
        ag_charts_community_1.AgCharts.download(chart, { width, height, fileName: imageFileName, fileFormat });
    }
    getChartImageDataURL(type) {
        return this.getChart().scene.getDataURL(type);
    }
    getChartOptions() {
        return this.chart.getOptions();
    }
    getChartThemeOverrides() {
        var _a;
        const chartOptionsTheme = this.getChartOptions().theme;
        return (_a = chartOptionsTheme.overrides) !== null && _a !== void 0 ? _a : {};
    }
    getChartPalette() {
        return ag_charts_community_1._Theme.getChartTheme(this.getChartOptions().theme).palette;
    }
    setPaired(paired) {
        // Special handling to make scatter charts operate in paired mode by default, where 
        // columns alternate between being X and Y (and size for bubble). In standard mode,
        // the first column is used for X and every other column is treated as Y
        // (or alternates between Y and size for bubble)
        const seriesType = (0, seriesTypeMapper_1.getSeriesType)(this.chartProxyParams.chartType);
        ag_charts_community_1.AgCharts.updateDelta(this.chart, { theme: { overrides: { [seriesType]: { paired } } } });
    }
    isPaired() {
        const seriesType = (0, seriesTypeMapper_1.getSeriesType)(this.chartProxyParams.chartType);
        return (0, object_1.get)(this.getChartThemeOverrides(), `${seriesType}.paired`, true);
    }
    lookupCustomChartTheme(themeName) {
        return (0, chartTheme_1.lookupCustomChartTheme)(this.chartProxyParams, themeName);
    }
    transformData(data, categoryKey, categoryAxis) {
        if (categoryAxis) {
            // replace the values for the selected category with a complex object to allow for duplicated categories
            return data.map((d, index) => {
                const value = d[categoryKey];
                const valueString = value && value.toString ? value.toString() : '';
                const datum = Object.assign({}, d);
                datum[categoryKey] = { id: index, value, toString: () => valueString };
                return datum;
            });
        }
        return data;
    }
    getCommonChartOptions(updatedOverrides) {
        var _a, _b;
        // Only apply active overrides if chart is initialised.
        const existingOptions = this.clearThemeOverrides ? {} : (_b = (_a = this.chart) === null || _a === void 0 ? void 0 : _a.getOptions()) !== null && _b !== void 0 ? _b : {};
        const formattingPanelOverrides = this.chart != null ? this.getActiveFormattingPanelOverrides() : undefined;
        this.clearThemeOverrides = false;
        // Create a base theme and apply the various layers of overrides.
        const baseTheme = (0, chartTheme_1.createAgChartTheme)(this.chartProxyParams, this);
        const chartThemeDefaults = this.getChartThemeDefaults();
        const theme = (0, chartTheme_1.applyThemeOverrides)(baseTheme, [
            chartThemeDefaults,
            updatedOverrides !== null && updatedOverrides !== void 0 ? updatedOverrides : formattingPanelOverrides,
        ]);
        return Object.assign(Object.assign({}, existingOptions), { theme, container: this.chartProxyParams.parentElement, mode: 'integrated' });
    }
    /**
     * Retrieve default theme overrides for the current chart type
     */
    getChartThemeDefaults() {
        // Override this method to provide chart type specific theme overrides
        return undefined;
    }
    getActiveFormattingPanelOverrides() {
        var _a, _b;
        if (this.clearThemeOverrides) {
            return {};
        }
        const inUseTheme = (_a = this.chart) === null || _a === void 0 ? void 0 : _a.getOptions().theme;
        return (_b = inUseTheme === null || inUseTheme === void 0 ? void 0 : inUseTheme.overrides) !== null && _b !== void 0 ? _b : {};
    }
    destroy({ keepChartInstance = false } = {}) {
        if (keepChartInstance) {
            // Reset Charts animation state, so that future updates to this re-used chart instance
            // behave as-if the chart is brand new. When switching chartTypes, this means we hide
            // the fact we are reusing the chart instance; the user sees a new chart which behaves
            // as-if it is a completely new and distinct chart instance.
            this.chart.resetAnimations();
            return this.chart;
        }
        this.destroyChart();
    }
    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = undefined;
        }
    }
}
exports.ChartProxy = ChartProxy;
