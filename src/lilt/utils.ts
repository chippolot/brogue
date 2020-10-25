function _replacer(_: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

function _reviver(_: any, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

function stringifyJSONEx(value: any): string {
    return JSON.stringify(value, _replacer);
}

function parseJSONEx(text: string): any {
    return JSON.parse(text, _reviver);
}

export {
    stringifyJSONEx,
    parseJSONEx,
}