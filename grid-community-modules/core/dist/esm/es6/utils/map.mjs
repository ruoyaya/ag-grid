export function convertToMap(arr) {
    const map = new Map();
    arr.forEach(pair => map.set(pair[0], pair[1]));
    return map;
}
// handy for organising a list into a map, where each item is mapped by an attribute, eg mapping Columns by ID
export function mapById(arr, callback) {
    const map = new Map();
    arr.forEach(item => map.set(callback(item), item));
    return map;
}
export function keys(map) {
    const arr = [];
    map.forEach((_, key) => arr.push(key));
    return arr;
}
