"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNonNullObject = exports.removeAllReferences = exports.getValueUsingField = exports.mergeDeep = exports.getAllValuesInObject = exports.deepCloneDefinition = exports.cloneObject = exports.iterateObject = void 0;
const generic_1 = require("./generic");
function iterateObject(object, callback) {
    if (object == null) {
        return;
    }
    if (Array.isArray(object)) {
        for (let i = 0; i < object.length; i++) {
            callback(i.toString(), object[i]);
        }
        return;
    }
    for (const [key, value] of Object.entries(object)) {
        callback(key, value);
    }
}
exports.iterateObject = iterateObject;
function cloneObject(object) {
    const copy = {};
    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = object[key];
        copy[key] = value;
    }
    return copy;
}
exports.cloneObject = cloneObject;
// returns copy of an object, doing a deep clone of any objects with that object.
// this is used for eg creating copies of Column Definitions, where we want to
// deep copy all objects, but do not want to deep copy functions (eg when user provides
// a function or class for colDef.cellRenderer)
function deepCloneDefinition(object, keysToSkip) {
    if (!object) {
        return;
    }
    const obj = object;
    const res = {};
    Object.keys(obj).forEach(key => {
        if (keysToSkip && keysToSkip.indexOf(key) >= 0) {
            return;
        }
        const value = obj[key];
        // 'simple object' means a bunch of key/value pairs, eg {filter: 'myFilter'}. it does
        // NOT include the following:
        // 1) arrays
        // 2) functions or classes (eg ColumnAPI instance)
        const sourceIsSimpleObject = isNonNullObject(value) && value.constructor === Object;
        if (sourceIsSimpleObject) {
            res[key] = deepCloneDefinition(value);
        }
        else {
            res[key] = value;
        }
    });
    return res;
}
exports.deepCloneDefinition = deepCloneDefinition;
function getAllValuesInObject(obj) {
    if (!obj) {
        return [];
    }
    const anyObject = Object;
    if (typeof anyObject.values === 'function') {
        return anyObject.values(obj);
    }
    const ret = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj.propertyIsEnumerable(key)) {
            ret.push(obj[key]);
        }
    }
    return ret;
}
exports.getAllValuesInObject = getAllValuesInObject;
function mergeDeep(dest, source, copyUndefined = true, makeCopyOfSimpleObjects = false) {
    if (!(0, generic_1.exists)(source)) {
        return;
    }
    iterateObject(source, (key, sourceValue) => {
        let destValue = dest[key];
        if (destValue === sourceValue) {
            return;
        }
        // when creating params, we don't want to just copy objects over. otherwise merging ColDefs (eg DefaultColDef
        // and Column Types) would result in params getting shared between objects.
        // by putting an empty value into destValue first, it means we end up copying over values from
        // the source object, rather than just copying in the source object in it's entirety.
        if (makeCopyOfSimpleObjects) {
            const objectIsDueToBeCopied = destValue == null && sourceValue != null;
            if (objectIsDueToBeCopied) {
                // 'simple object' means a bunch of key/value pairs, eg {filter: 'myFilter'}, as opposed
                // to a Class instance (such as ColumnAPI instance).
                const sourceIsSimpleObject = typeof sourceValue === 'object' && sourceValue.constructor === Object;
                const dontCopy = sourceIsSimpleObject;
                if (dontCopy) {
                    destValue = {};
                    dest[key] = destValue;
                }
            }
        }
        if (isNonNullObject(sourceValue) && isNonNullObject(destValue) && !Array.isArray(destValue)) {
            mergeDeep(destValue, sourceValue, copyUndefined, makeCopyOfSimpleObjects);
        }
        else if (copyUndefined || sourceValue !== undefined) {
            dest[key] = sourceValue;
        }
    });
}
exports.mergeDeep = mergeDeep;
function getValueUsingField(data, field, fieldContainsDots) {
    if (!field || !data) {
        return;
    }
    // if no '.', then it's not a deep value
    if (!fieldContainsDots) {
        return data[field];
    }
    // otherwise it is a deep value, so need to dig for it
    const fields = field.split('.');
    let currentObject = data;
    for (let i = 0; i < fields.length; i++) {
        if (currentObject == null) {
            return undefined;
        }
        currentObject = currentObject[fields[i]];
    }
    return currentObject;
}
exports.getValueUsingField = getValueUsingField;
// used by GridAPI to remove all references, so keeping grid in memory resulting in a
// memory leak if user is not disposing of the GridAPI references
function removeAllReferences(obj, preserveKeys = [], preDestroyLink) {
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        // we want to replace all the @autowired services, which are objects. any simple types (boolean, string etc)
        // we don't care about
        if (typeof value === 'object' && !preserveKeys.includes(key)) {
            obj[key] = undefined;
        }
    });
    const proto = Object.getPrototypeOf(obj);
    const properties = {};
    const msgFunc = (key) => `AG Grid: Grid API function ${key}() cannot be called as the grid has been destroyed.
    It is recommended to remove local references to the grid api. Alternatively, check gridApi.isDestroyed() to avoid calling methods against a destroyed grid.
    To run logic when the grid is about to be destroyed use the gridPreDestroy event. See: ${preDestroyLink}`;
    Object.getOwnPropertyNames(proto).forEach(key => {
        const value = proto[key];
        // leave all basic types and preserveKeys this is needed for GridAPI to leave the "destroyed: boolean" attribute and isDestroyed() function.
        if (typeof value === 'function' && !preserveKeys.includes(key)) {
            const func = () => {
                console.warn(msgFunc(key));
            };
            properties[key] = { value: func, writable: true };
        }
    });
    Object.defineProperties(obj, properties);
}
exports.removeAllReferences = removeAllReferences;
function isNonNullObject(value) {
    return typeof value === 'object' && value !== null;
}
exports.isNonNullObject = isNonNullObject;
