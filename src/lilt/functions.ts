import nlp from 'compromise';

const Articles = require('articles');

function _isVowel(s: string): boolean {
    return s === 'a' || s === 'e' || s === 'i' || s === 'o' || s === 'u' || s === 'y' || s === 'A' || s === 'E' || s === 'I' || s === 'O' || s === 'U' || s === 'Y';
}

function _isConsonant(s: string): boolean {
    return !_isVowel(s);
}

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
    const lastChar = infinitive.charAt(infinitive.length - 1);

    if (lastChar === 'e') {
        return `${infinitive}r`;
    }

    let vowelCount = 0;
    for (let i = 0; i < s.length; ++i) {
        vowelCount += _isVowel(s[i]) ? 1 : 0;
    }

    // Double final consonant if:
    //  word is 1 syllable
    //  has 1 vowel
    //  and has a consonant that follows the vowel

    if (_isConsonant(lastChar) &&
        lastChar !== 'x' &&
        vowelCount === 1 &&
        _isVowel(infinitive.charAt(infinitive.length - 2)) &&
        infinitive.length < 5) {
        return `${infinitive.slice(0, -1) + lastChar + lastChar}er`;
    }
    return `${infinitive}er`;
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
    nounify: _funcNounify,
}));

function getBuiltInFunction(name: string): Function | undefined {
    return builtInFunctions.get(name);
}

export {
    getBuiltInFunction,
};
