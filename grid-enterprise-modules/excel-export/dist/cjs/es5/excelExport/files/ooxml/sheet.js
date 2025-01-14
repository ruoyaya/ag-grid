"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sheetFactory = {
    getTemplate: function (name, idx) {
        var sheetId = (idx + 1).toString();
        return {
            name: "sheet",
            properties: {
                rawMap: {
                    "name": name,
                    "sheetId": sheetId,
                    "r:id": "rId".concat(sheetId)
                }
            }
        };
    }
};
exports.default = sheetFactory;
