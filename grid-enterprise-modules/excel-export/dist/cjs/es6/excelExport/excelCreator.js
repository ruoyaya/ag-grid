"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelCreator = exports.exportMultipleSheetsAsExcel = exports.getMultipleSheetsAsExcel = void 0;
const core_1 = require("@ag-grid-community/core");
const excelXlsxFactory_1 = require("./excelXlsxFactory");
const csv_export_1 = require("@ag-grid-community/csv-export");
const excelSerializingSession_1 = require("./excelSerializingSession");
const createExcelXMLCoreFolderStructure = () => {
    csv_export_1.ZipContainer.addFolders([
        '_rels/',
        'docProps/',
        'xl/',
        'xl/theme/',
        'xl/_rels/',
        'xl/worksheets/'
    ]);
    if (!excelXlsxFactory_1.ExcelXlsxFactory.images.size) {
        return;
    }
    csv_export_1.ZipContainer.addFolders([
        'xl/worksheets/_rels',
        'xl/drawings/',
        'xl/drawings/_rels',
        'xl/media/',
    ]);
    let imgCounter = 0;
    excelXlsxFactory_1.ExcelXlsxFactory.images.forEach(value => {
        const firstImage = value[0].image[0];
        const ext = firstImage.imageType;
        csv_export_1.ZipContainer.addFile(`xl/media/image${++imgCounter}.${ext}`, firstImage.base64, true);
    });
};
const createExcelXmlWorksheets = (data) => {
    let imageRelationCounter = 0;
    data.forEach((value, idx) => {
        csv_export_1.ZipContainer.addFile(`xl/worksheets/sheet${idx + 1}.xml`, value, false);
        if (excelXlsxFactory_1.ExcelXlsxFactory.images.size && excelXlsxFactory_1.ExcelXlsxFactory.worksheetImages.get(idx)) {
            createImageRelationsForSheet(idx, imageRelationCounter++);
        }
    });
};
const createExcelXmlCoreSheets = (fontSize, author, sheetLen) => {
    csv_export_1.ZipContainer.addFile('xl/workbook.xml', excelXlsxFactory_1.ExcelXlsxFactory.createWorkbook());
    csv_export_1.ZipContainer.addFile('xl/styles.xml', excelXlsxFactory_1.ExcelXlsxFactory.createStylesheet(fontSize));
    csv_export_1.ZipContainer.addFile('xl/sharedStrings.xml', excelXlsxFactory_1.ExcelXlsxFactory.createSharedStrings());
    csv_export_1.ZipContainer.addFile('xl/theme/theme1.xml', excelXlsxFactory_1.ExcelXlsxFactory.createTheme());
    csv_export_1.ZipContainer.addFile('xl/_rels/workbook.xml.rels', excelXlsxFactory_1.ExcelXlsxFactory.createWorkbookRels(sheetLen));
    csv_export_1.ZipContainer.addFile('docProps/core.xml', excelXlsxFactory_1.ExcelXlsxFactory.createCore(author));
    csv_export_1.ZipContainer.addFile('[Content_Types].xml', excelXlsxFactory_1.ExcelXlsxFactory.createContentTypes(sheetLen));
    csv_export_1.ZipContainer.addFile('_rels/.rels', excelXlsxFactory_1.ExcelXlsxFactory.createRels());
};
const createExcelFileForExcel = (data, fontSize = 11, author = 'AG Grid') => {
    if (data && data.length > 0) {
        createExcelXMLCoreFolderStructure();
        createExcelXmlWorksheets(data);
        createExcelXmlCoreSheets(fontSize, author, data.length);
    }
    else {
        console.warn("AG Grid: Invalid params supplied to getMultipleSheetsAsExcel() - `ExcelExportParams.data` is empty.");
    }
    // reset the internal variables of the Excel Factory
    excelXlsxFactory_1.ExcelXlsxFactory.resetFactory();
    if (!data || data.length === 0) {
        return false;
    }
    return true;
};
const getMultipleSheetsAsExcelCompressed = (params) => {
    const { data, fontSize, author } = params;
    const mimeType = params.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!createExcelFileForExcel(data, fontSize, author)) {
        return Promise.resolve(undefined);
    }
    return csv_export_1.ZipContainer.getZipFile(mimeType);
};
const getMultipleSheetsAsExcel = (params) => {
    const { data, fontSize, author } = params;
    const mimeType = params.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!createExcelFileForExcel(data, fontSize, author)) {
        return;
    }
    return csv_export_1.ZipContainer.getUncompressedZipFile(mimeType);
};
exports.getMultipleSheetsAsExcel = getMultipleSheetsAsExcel;
const exportMultipleSheetsAsExcel = (params) => {
    const { fileName = 'export.xlsx' } = params;
    getMultipleSheetsAsExcelCompressed(params).then(contents => {
        if (contents) {
            const downloadFileName = typeof fileName === 'function'
                ? fileName()
                : fileName;
            csv_export_1.Downloader.download(downloadFileName, contents);
        }
    });
};
exports.exportMultipleSheetsAsExcel = exportMultipleSheetsAsExcel;
const createImageRelationsForSheet = (sheetIndex, currentRelationIndex) => {
    const drawingFolder = 'xl/drawings';
    const drawingFileName = `${drawingFolder}/drawing${currentRelationIndex + 1}.xml`;
    const relFileName = `${drawingFolder}/_rels/drawing${currentRelationIndex + 1}.xml.rels`;
    const worksheetRelFile = `xl/worksheets/_rels/sheet${sheetIndex + 1}.xml.rels`;
    csv_export_1.ZipContainer.addFile(relFileName, excelXlsxFactory_1.ExcelXlsxFactory.createDrawingRel(sheetIndex));
    csv_export_1.ZipContainer.addFile(drawingFileName, excelXlsxFactory_1.ExcelXlsxFactory.createDrawing(sheetIndex));
    csv_export_1.ZipContainer.addFile(worksheetRelFile, excelXlsxFactory_1.ExcelXlsxFactory.createWorksheetDrawingRel(currentRelationIndex));
};
let ExcelCreator = class ExcelCreator extends csv_export_1.BaseCreator {
    postConstruct() {
        this.setBeans({
            gridSerializer: this.gridSerializer,
            gridOptionsService: this.gridOptionsService
        });
    }
    getMergedParams(params) {
        const baseParams = this.gridOptionsService.get('defaultExcelExportParams');
        return Object.assign({}, baseParams, params);
    }
    export(userParams) {
        if (this.isExportSuppressed()) {
            console.warn(`AG Grid: Export cancelled. Export is not allowed as per your configuration.`);
            return;
        }
        const mergedParams = this.getMergedParams(userParams);
        const data = this.getData(mergedParams);
        const exportParams = {
            data: [data],
            fontSize: mergedParams.fontSize,
            author: mergedParams.author,
            mimeType: mergedParams.mimeType
        };
        this.packageCompressedFile(exportParams).then(packageFile => {
            if (packageFile) {
                const { fileName } = mergedParams;
                const providedFileName = typeof fileName === 'function'
                    ? fileName(this.gridOptionsService.getGridCommonParams())
                    : fileName;
                csv_export_1.Downloader.download(this.getFileName(providedFileName), packageFile);
            }
        });
    }
    exportDataAsExcel(params) {
        this.export(params);
    }
    getDataAsExcel(params) {
        const mergedParams = this.getMergedParams(params);
        const data = this.getData(mergedParams);
        const exportParams = {
            data: [data],
            fontSize: mergedParams.fontSize,
            author: mergedParams.author,
            mimeType: mergedParams.mimeType
        };
        return this.packageFile(exportParams);
    }
    setFactoryMode(factoryMode) {
        excelXlsxFactory_1.ExcelXlsxFactory.factoryMode = factoryMode;
    }
    getFactoryMode() {
        return excelXlsxFactory_1.ExcelXlsxFactory.factoryMode;
    }
    getSheetDataForExcel(params) {
        const mergedParams = this.getMergedParams(params);
        const data = this.getData(mergedParams);
        return data;
    }
    getMultipleSheetsAsExcel(params) {
        return (0, exports.getMultipleSheetsAsExcel)(params);
    }
    exportMultipleSheetsAsExcel(params) {
        (0, exports.exportMultipleSheetsAsExcel)(params);
    }
    getDefaultFileExtension() {
        return 'xlsx';
    }
    createSerializingSession(params) {
        const { columnModel, valueService, gridOptionsService, valueFormatterService, valueParserService } = this;
        let sheetName;
        if (params.sheetName != null) {
            const { sheetName: sheetNameParam } = params;
            const sheetNameValue = typeof sheetNameParam === 'function'
                ? sheetNameParam(this.gridOptionsService.getGridCommonParams())
                : sheetNameParam;
            sheetName = String(sheetNameValue).substring(0, 31);
        }
        else {
            sheetName = 'ag-grid';
        }
        const config = Object.assign(Object.assign({}, params), { sheetName,
            columnModel,
            valueService,
            gridOptionsService,
            valueFormatterService,
            valueParserService, suppressRowOutline: params.suppressRowOutline || params.skipRowGroups, headerRowHeight: params.headerRowHeight || params.rowHeight, baseExcelStyles: this.gridOptionsService.get('excelStyles') || [], styleLinker: this.styleLinker.bind(this) });
        return new excelSerializingSession_1.ExcelSerializingSession(config);
    }
    styleLinker(params) {
        const { rowType, rowIndex, value, column, columnGroup, node } = params;
        const isHeader = rowType === csv_export_1.RowType.HEADER;
        const isGroupHeader = rowType === csv_export_1.RowType.HEADER_GROUPING;
        const col = (isHeader ? column : columnGroup);
        let headerClasses = [];
        if (isHeader || isGroupHeader) {
            headerClasses.push('header');
            if (isGroupHeader) {
                headerClasses.push('headerGroup');
            }
            if (col) {
                headerClasses = headerClasses.concat(core_1.CssClassApplier.getHeaderClassesFromColDef(col.getDefinition(), this.gridOptionsService, column || null, columnGroup || null));
            }
            return headerClasses;
        }
        const styles = this.gridOptionsService.get('excelStyles');
        const applicableStyles = ["cell"];
        if (!styles || !styles.length) {
            return applicableStyles;
        }
        const styleIds = styles.map((it) => {
            return it.id;
        });
        this.stylingService.processAllCellClasses(column.getDefinition(), this.gridOptionsService.addGridCommonParams({
            value,
            data: node.data,
            node: node,
            colDef: column.getDefinition(),
            column: column,
            rowIndex: rowIndex
        }), (className) => {
            if (styleIds.indexOf(className) > -1) {
                applicableStyles.push(className);
            }
        });
        return applicableStyles.sort((left, right) => {
            return (styleIds.indexOf(left) < styleIds.indexOf(right)) ? -1 : 1;
        });
    }
    isExportSuppressed() {
        return this.gridOptionsService.get('suppressExcelExport');
    }
    packageCompressedFile(params) {
        return getMultipleSheetsAsExcelCompressed(params);
    }
    packageFile(params) {
        return (0, exports.getMultipleSheetsAsExcel)(params);
    }
};
__decorate([
    (0, core_1.Autowired)('columnModel')
], ExcelCreator.prototype, "columnModel", void 0);
__decorate([
    (0, core_1.Autowired)('valueService')
], ExcelCreator.prototype, "valueService", void 0);
__decorate([
    (0, core_1.Autowired)('stylingService')
], ExcelCreator.prototype, "stylingService", void 0);
__decorate([
    (0, core_1.Autowired)('gridSerializer')
], ExcelCreator.prototype, "gridSerializer", void 0);
__decorate([
    (0, core_1.Autowired)('gridOptionsService')
], ExcelCreator.prototype, "gridOptionsService", void 0);
__decorate([
    (0, core_1.Autowired)('valueFormatterService')
], ExcelCreator.prototype, "valueFormatterService", void 0);
__decorate([
    (0, core_1.Autowired)('valueParserService')
], ExcelCreator.prototype, "valueParserService", void 0);
__decorate([
    core_1.PostConstruct
], ExcelCreator.prototype, "postConstruct", null);
ExcelCreator = __decorate([
    (0, core_1.Bean)('excelCreator')
], ExcelCreator);
exports.ExcelCreator = ExcelCreator;
