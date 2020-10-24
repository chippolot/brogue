import Pluralize from 'pluralize';
const Articles = require('articles');
const Tensify = require('tensify');

function _funcCapitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function _funcCapitalizeAll(s: string): string {
    return s.replace(/(?:^|\s)\S/g, (a) => {
        return a.toUpperCase();
    });
}

function _funcQuotes(s: string): string {
    return `"${s}"`;
}

function _funcTimes(s: string, n: any) {
    return Array(Number(n)).fill(s).join(' ');
}

function _funcArticalize(s: string) {
    return Articles.articlize(s);
}

function _funcPluralize(s: string, n: any) {
    if (n !== undefined) {
        return Pluralize(s, Number(n), true);
    }
    return Pluralize(s);
}

function _funcSingularize(s: string) {
    return Pluralize.singular(s);
}

function _funcPastTense(s: string) {
    return Tensify(s).past;
}

const builtInFunctions: Map<string, Function> = new Map<string, Function>(Object.entries({
    capitalize: _funcCapitalize,
    capitalizeall: _funcCapitalizeAll,
    quotes: _funcQuotes,
    times: _funcTimes,
    artical: _funcArticalize,
    plural: _funcPluralize,
    singular: _funcSingularize,
    past: _funcPastTense,
}));

function getBuiltInFunction(name: string) : Function | undefined {
    return builtInFunctions.get(name);
}

export {
    getBuiltInFunction,
};
