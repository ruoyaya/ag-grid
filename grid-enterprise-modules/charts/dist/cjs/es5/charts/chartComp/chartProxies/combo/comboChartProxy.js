"use strict";
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboChartProxy = void 0;
var cartesianChartProxy_1 = require("../cartesian/cartesianChartProxy");
var seriesTypeMapper_1 = require("../../utils/seriesTypeMapper");
var ComboChartProxy = /** @class */ (function (_super) {
    __extends(ComboChartProxy, _super);
    function ComboChartProxy(params) {
        return _super.call(this, params) || this;
    }
    ComboChartProxy.prototype.getAxes = function (params) {
        var fields = params ? params.fields : [];
        var fieldsMap = new Map(fields.map(function (f) { return [f.colId, f]; }));
        var _a = this.getYKeys(fields, params.seriesChartTypes), primaryYKeys = _a.primaryYKeys, secondaryYKeys = _a.secondaryYKeys;
        var axes = [
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
            secondaryYKeys.forEach(function (secondaryYKey) {
                var field = fieldsMap.get(secondaryYKey);
                var secondaryAxisIsVisible = field && field.colId === secondaryYKey;
                if (!secondaryAxisIsVisible) {
                    return;
                }
                var secondaryAxisOptions = {
                    type: 'number',
                    keys: [secondaryYKey],
                    position: 'right',
                };
                axes.push(secondaryAxisOptions);
            });
        }
        return axes;
    };
    ComboChartProxy.prototype.getSeries = function (params) {
        var fields = params.fields, seriesChartTypes = params.seriesChartTypes;
        var _a = __read(params.categories, 1), category = _a[0];
        return fields.map(function (field) {
            var seriesChartType = seriesChartTypes.find(function (s) { return s.colId === field.colId; });
            if (seriesChartType) {
                var chartType = seriesChartType.chartType;
                var grouped = ['groupedColumn', 'groupedBar'].includes(chartType);
                var groupedOpts = grouped ? { grouped: true } : {};
                return __assign({ type: (0, seriesTypeMapper_1.getSeriesType)(chartType), xKey: category.id, yKey: field.colId, yName: field.displayName, stacked: ['stackedArea', 'stackedColumn'].includes(chartType) }, groupedOpts);
            }
        });
    };
    ComboChartProxy.prototype.getYKeys = function (fields, seriesChartTypes) {
        var primaryYKeys = [];
        var secondaryYKeys = [];
        fields.forEach(function (field) {
            var colId = field.colId;
            var seriesChartType = seriesChartTypes.find(function (s) { return s.colId === colId; });
            if (seriesChartType) {
                seriesChartType.secondaryAxis ? secondaryYKeys.push(colId) : primaryYKeys.push(colId);
            }
        });
        return { primaryYKeys: primaryYKeys, secondaryYKeys: secondaryYKeys };
    };
    return ComboChartProxy;
}(cartesianChartProxy_1.CartesianChartProxy));
exports.ComboChartProxy = ComboChartProxy;
