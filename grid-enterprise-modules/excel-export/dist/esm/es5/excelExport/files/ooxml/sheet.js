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
export default sheetFactory;
