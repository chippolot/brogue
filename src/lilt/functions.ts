import nlp from 'compromise';

const Articles = require('articles');

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

function _funcArtical(s: string) {
    return Articles.articlize(s);
}

function _funcPluralize(s: string) {
    return nlp(s).tag("#Noun").nouns()
        .toPlural()
        .text();
}

function _funcSingularize(s: string) {
    return nlp(s).tag("#Noun").nouns()
        .toSingular()
        .text();
}

function _funcPastTense(s: string) {
    return nlp(s).tag("#Verb").verbs()
        .toPastTense()
        .text();
}

function _funcPresentTense(s: string) {
    return nlp(s).tag("#Verb").verbs()
        .toPresentTense()
        .text();
}

function _funcFutureTense(s: string) {
    return nlp(s).tag("#Verb").verbs()
        .toFutureTense()
        .text();
}

function _funcGerund(s: string) {
    return nlp(s).tag("#Verb").verbs()
        .toGerund()
        .text();
}

function _funcInfinitive(s: string) {
    return nlp(s).tag("#Verb").verbs()
        .toInfinitive()
        .text();
}

function _funcNounify(s: string) {
    const infinitive = _funcInfinitive(s);
    return infinitive.slice(-1) === 'e' ? `${infinitive}r` : `${infinitive}er`;
 }

const builtInFunctions: Map<string, Function> = new Map<string, Function>(Object.entries({
    capitalize: _funcCapitalize,
    capitalizeall: _funcCapitalizeAll,
    quotes: _funcQuotes,
    times: _funcTimes,
    a: _funcArtical,
    plural: _funcPluralize,
    singular: _funcSingularize,
    past: _funcPastTense,
    present: _funcPresentTense,
    future: _funcFutureTense,
    gerund: _funcGerund,
    infinitive: _funcInfinitive,
    nounify: _funcNounify
}));

function getBuiltInFunction(name: string) : Function | undefined {
    return builtInFunctions.get(name);
}

export {
    getBuiltInFunction,
};
