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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, PostConstruct, CssClassApplier } from '@ag-grid-community/core';
import { ExcelXlsxFactory } from './excelXlsxFactory';
import { BaseCreator, Downloader, RowType, ZipContainer } from "@ag-grid-community/csv-export";
import { ExcelSerializingSession } from './excelSerializingSession';
var createExcelXMLCoreFolderStructure = function () {
    ZipContainer.addFolders([
        '_rels/',
        'docProps/',
        'xl/',
        'xl/theme/',
        'xl/_rels/',
        'xl/worksheets/'
    ]);
    if (!ExcelXlsxFactory.images.size) {
        return;
    }
    ZipContainer.addFolders([
        'xl/worksheets/_rels',
        'xl/drawings/',
        'xl/drawings/_rels',
        'xl/media/',
    ]);
    var imgCounter = 0;
    ExcelXlsxFactory.images.forEach(function (value) {
        var firstImage = value[0].image[0];
        var ext = firstImage.imageType;
        ZipContainer.addFile("xl/media/image".concat(++imgCounter, ".").concat(ext), firstImage.base64, true);
    });
};
var createExcelXmlWorksheets = function (data) {
    var imageRelationCounter = 0;
    data.forEach(function (value, idx) {
        ZipContainer.addFile("xl/worksheets/sheet".concat(idx + 1, ".xml"), value, false);
        if (ExcelXlsxFactory.images.size && ExcelXlsxFactory.worksheetImages.get(idx)) {
            createImageRelationsForSheet(idx, imageRelationCounter++);
        }
    });
};
var createExcelXmlCoreSheets = function (fontSize, author, sheetLen) {
    ZipContainer.addFile('xl/workbook.xml', ExcelXlsxFactory.createWorkbook());
    ZipContainer.addFile('xl/styles.xml', ExcelXlsxFactory.createStylesheet(fontSize));
    ZipContainer.addFile('xl/sharedStrings.xml', ExcelXlsxFactory.createSharedStrings());
    ZipContainer.addFile('xl/theme/theme1.xml', ExcelXlsxFactory.createTheme());
    ZipContainer.addFile('xl/_rels/workbook.xml.rels', ExcelXlsxFactory.createWorkbookRels(sheetLen));
    ZipContainer.addFile('docProps/core.xml', ExcelXlsxFactory.createCore(author));
    ZipContainer.addFile('[Content_Types].xml', ExcelXlsxFactory.createContentTypes(sheetLen));
    ZipContainer.addFile('_rels/.rels', ExcelXlsxFactory.createRels());
};
var createExcelFileForExcel = function (data, fontSize, author) {
    if (fontSize === void 0) { fontSize = 11; }
    if (author === void 0) { author = 'AG Grid'; }
    if (data && data.length > 0) {
        createExcelXMLCoreFolderStructure();
        createExcelXmlWorksheets(data);
        createExcelXmlCoreSheets(fontSize, author, data.length);
    }
    else {
        console.warn("AG Grid: Invalid params supplied to getMultipleSheetsAsExcel() - `ExcelExportParams.data` is empty.");
    }
    // reset the internal variables of the Excel Factory
    ExcelXlsxFactory.resetFactory();
    if (!data || data.length === 0) {
        return false;
    }
    return true;
};
var getMultipleSheetsAsExcelCompressed = function (params) {
    var data = params.data, fontSize = params.fontSize, author = params.author;
    var mimeType = params.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!createExcelFileForExcel(data, fontSize, author)) {
        return Promise.resolve(undefined);
    }
    return ZipContainer.getZipFile(mimeType);
};
export var getMultipleSheetsAsExcel = function (params) {
    var data = params.data, fontSize = params.fontSize, author = params.author;
    var mimeType = params.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!createExcelFileForExcel(data, fontSize, author)) {
        return;
    }
    return ZipContainer.getUncompressedZipFile(mimeType);
};
export var exportMultipleSheetsAsExcel = function (params) {
    var _a = params.fileName, fileName = _a === void 0 ? 'export.xlsx' : _a;
    getMultipleSheetsAsExcelCompressed(params).then(function (contents) {
        if (contents) {
            var downloadFileName = typeof fileName === 'function'
                ? fileName()
                : fileName;
            Downloader.download(downloadFileName, contents);
        }
    });
};
var createImageRelationsForSheet = function (sheetIndex, currentRelationIndex) {
    var drawingFolder = 'xl/drawings';
    var drawingFileName = "".concat(drawingFolder, "/drawing").concat(currentRelationIndex + 1, ".xml");
    var relFileName = "".concat(drawingFolder, "/_rels/drawing").concat(currentRelationIndex + 1, ".xml.rels");
    var worksheetRelFile = "xl/worksheets/_rels/sheet".concat(sheetIndex + 1, ".xml.rels");
    ZipContainer.addFile(relFileName, ExcelXlsxFactory.createDrawingRel(sheetIndex));
    ZipContainer.addFile(drawingFileName, ExcelXlsxFactory.createDrawing(sheetIndex));
    ZipContainer.addFile(worksheetRelFile, ExcelXlsxFactory.createWorksheetDrawingRel(currentRelationIndex));
};
var ExcelCreator = /** @class */ (function (_super) {
    __extends(ExcelCreator, _super);
    function ExcelCreator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExcelCreator.prototype.postConstruct = function () {
        this.setBeans({
            gridSerializer: this.gridSerializer,
            gridOptionsService: this.gridOptionsService
        });
    };
    ExcelCreator.prototype.getMergedParams = function (params) {
        var baseParams = this.gridOptionsService.get('defaultExcelExportParams');
        return Object.assign({}, baseParams, params);
    };
    ExcelCreator.prototype.export = function (userParams) {
        var _this = this;
        if (this.isExportSuppressed()) {
            console.warn("AG Grid: Export cancelled. Export is not allowed as per your configuration.");
            return;
        }
        var mergedParams = this.getMergedParams(userParams);
        var data = this.getData(mergedParams);
        var exportParams = {
            data: [data],
            fontSize: mergedParams.fontSize,
            author: mergedParams.author,
            mimeType: mergedParams.mimeType
        };
        this.packageCompressedFile(exportParams).then(function (packageFile) {
            if (packageFile) {
                var fileName = mergedParams.fileName;
                var providedFileName = typeof fileName === 'function'
                    ? fileName(_this.gridOptionsService.getGridCommonParams())
                    : fileName;
                Downloader.download(_this.getFileName(providedFileName), packageFile);
            }
        });
    };
    ExcelCreator.prototype.exportDataAsExcel = function (params) {
        this.export(params);
    };
    ExcelCreator.prototype.getDataAsExcel = function (params) {
        var mergedParams = this.getMergedParams(params);
        var data = this.getData(mergedParams);
        var exportParams = {
            data: [data],
            fontSize: mergedParams.fontSize,
            author: mergedParams.author,
            mimeType: mergedParams.mimeType
        };
        return this.packageFile(exportParams);
    };
    ExcelCreator.prototype.setFactoryMode = function (factoryMode) {
        ExcelXlsxFactory.factoryMode = factoryMode;
    };
    ExcelCreator.prototype.getFactoryMode = function () {
        return ExcelXlsxFactory.factoryMode;
    };
    ExcelCreator.prototype.getSheetDataForExcel = function (params) {
        var mergedParams = this.getMergedParams(params);
        var data = this.getData(mergedParams);
        return data;
    };
    ExcelCreator.prototype.getMultipleSheetsAsExcel = function (params) {
        return getMultipleSheetsAsExcel(params);
    };
    ExcelCreator.prototype.exportMultipleSheetsAsExcel = function (params) {
        exportMultipleSheetsAsExcel(params);
    };
    ExcelCreator.prototype.getDefaultFileExtension = function () {
        return 'xlsx';
    };
    ExcelCreator.prototype.createSerializingSession = function (params) {
        var _a = this, columnModel = _a.columnModel, valueService = _a.valueService, gridOptionsService = _a.gridOptionsService, valueFormatterService = _a.valueFormatterService, valueParserService = _a.valueParserService;
        var sheetName;
        if (params.sheetName != null) {
            var sheetNameParam = params.sheetName;
            var sheetNameValue = typeof sheetNameParam === 'function'
                ? sheetNameParam(this.gridOptionsService.getGridCommonParams())
                : sheetNameParam;
            sheetName = String(sheetNameValue).substring(0, 31);
        }
        else {
            sheetName = 'ag-grid';
        }
        var config = __assign(__assign({}, params), { sheetName: sheetName, columnModel: columnModel, valueService: valueService, gridOptionsService: gridOptionsService, valueFormatterService: valueFormatterService, valueParserService: valueParserService, suppressRowOutline: params.suppressRowOutline || params.skipRowGroups, headerRowHeight: params.headerRowHeight || params.rowHeight, baseExcelStyles: this.gridOptionsService.get('excelStyles') || [], styleLinker: this.styleLinker.bind(this) });
        return new ExcelSerializingSession(config);
    };
    ExcelCreator.prototype.styleLinker = function (params) {
        var rowType = params.rowType, rowIndex = params.rowIndex, value = params.value, column = params.column, columnGroup = params.columnGroup, node = params.node;
        var isHeader = rowType === RowType.HEADER;
        var isGroupHeader = rowType === RowType.HEADER_GROUPING;
        var col = (isHeader ? column : columnGroup);
        var headerClasses = [];
        if (isHeader || isGroupHeader) {
            headerClasses.push('header');
            if (isGroupHeader) {
                headerClasses.push('headerGroup');
            }
            if (col) {
                headerClasses = headerClasses.concat(CssClassApplier.getHeaderClassesFromColDef(col.getDefinition(), this.gridOptionsService, column || null, columnGroup || null));
            }
            return headerClasses;
        }
        var styles = this.gridOptionsService.get('excelStyles');
        var applicableStyles = ["cell"];
        if (!styles || !styles.length) {
            return applicableStyles;
        }
        var styleIds = styles.map(function (it) {
            return it.id;
        });
        this.stylingService.processAllCellClasses(column.getDefinition(), this.gridOptionsService.addGridCommonParams({
            value: value,
            data: node.data,
            node: node,
            colDef: column.getDefinition(),
            column: column,
            rowIndex: rowIndex
        }), function (className) {
            if (styleIds.indexOf(className) > -1) {
                applicableStyles.push(className);
            }
        });
        return applicableStyles.sort(function (left, right) {
            return (styleIds.indexOf(left) < styleIds.indexOf(right)) ? -1 : 1;
        });
    };
    ExcelCreator.prototype.isExportSuppressed = function () {
        return this.gridOptionsService.get('suppressExcelExport');
    };
    ExcelCreator.prototype.packageCompressedFile = function (params) {
        return getMultipleSheetsAsExcelCompressed(params);
    };
    ExcelCreator.prototype.packageFile = function (params) {
        return getMultipleSheetsAsExcel(params);
    };
    __decorate([
        Autowired('columnModel')
    ], ExcelCreator.prototype, "columnModel", void 0);
    __decorate([
        Autowired('valueService')
    ], ExcelCreator.prototype, "valueService", void 0);
    __decorate([
        Autowired('stylingService')
    ], ExcelCreator.prototype, "stylingService", void 0);
    __decorate([
        Autowired('gridSerializer')
    ], ExcelCreator.prototype, "gridSerializer", void 0);
    __decorate([
        Autowired('gridOptionsService')
    ], ExcelCreator.prototype, "gridOptionsService", void 0);
    __decorate([
        Autowired('valueFormatterService')
    ], ExcelCreator.prototype, "valueFormatterService", void 0);
    __decorate([
        Autowired('valueParserService')
    ], ExcelCreator.prototype, "valueParserService", void 0);
    __decorate([
        PostConstruct
    ], ExcelCreator.prototype, "postConstruct", null);
    ExcelCreator = __decorate([
        Bean('excelCreator')
    ], ExcelCreator);
    return ExcelCreator;
}(BaseCreator));
export { ExcelCreator };
