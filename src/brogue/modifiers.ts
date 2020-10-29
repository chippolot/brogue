import nlp from 'compromise';
import Articles from 'articles';

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

function _funcArtical(s: string): string {
    return Articles.articlize(s);
}

function _funcPluralize(s: string): string {
    return nlp(s).tag("#Noun").nouns()
        .toPlural()
        .text();
}

function _funcSingularize(s: string): string {
    return nlp(s).tag("#Noun").nouns()
        .toSingular()
        .text();
}

function _funcPossessive(s: string): string {
    return nlp(s).tag("#Noun").nouns()
        .toPossessive()
        .text();
}

function _funcPastTense(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toPastTense()
        .text();
}

function _funcPresentTense(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toPresentTense()
        .text();
}

function _funcFutureTense(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toFutureTense()
        .text();
}

function _funcGerund(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toGerund()
        .text();
}

function _funcInfinitive(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toInfinitive()
        .text();
}

function _funcPositive(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toPositive()
        .text();
}

function _funcNegative(s: string): string {
    return nlp(s).tag("#Verb").verbs()
        .toNegative()
        .text();
}

function _funcNounify(s: string): string {
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

function _funcRandomNumber(min: number = 0, max: number = 99): string {
    return (Math.floor(Math.random() * (max - min + 1) + min)).toString();
}

function _funcRoll(_: string, rollString: string): string {
    if (!rollString) {
        throw new Error(`Tried to invoke roll() without argument`);
    }

    const matches = rollString.match(/(?<num>\d)d(?<sides>\d)(?:(?:\s?\+\s?(?<plus>\d))|(?:\s?-\s?(?<minus>\d)))?/);
    if (!matches || !matches.groups?.num || !matches.groups?.sides) {
        throw new Error(`Failed to parse die roll string: ${rollString}`);
    }

    const num = parseInt(matches.groups.num, 10);
    const sides = parseInt(matches.groups.sides, 10);

    let val = 0;
    for (let i = 0; i < num; ++i) {
        val += Math.floor(Math.random() * sides + 1);
    }

    if (matches.groups.plus) {
        val += parseInt(matches.groups.plus, 10);
    }
    if (matches.groups.minus) {
        val -= parseInt(matches.groups.minus, 10);
    }

    return val.toString();
}

const builtInModifiers: Map<string, Function> = new Map<string, Function>(Object.entries({
    // Lexical
    capitalize: _funcCapitalize,
    capitalizeall: _funcCapitalizeAll,
    quotes: _funcQuotes,
    times: _funcTimes,
    a: _funcArtical,
    s: _funcPluralize,
    singular: _funcSingularize,
    past: _funcPastTense,
    present: _funcPresentTense,
    future: _funcFutureTense,
    ing: _funcGerund,
    infinitive: _funcInfinitive,
    nounify: _funcNounify,
    possessive: _funcPossessive,
    positive: _funcPositive,
    negative: _funcNegative,

    // Numeric
    randomNumber: _funcRandomNumber,
    roll: _funcRoll,
}));

function getBuiltInModifier(name: string): Function | undefined {
    return builtInModifiers.get(name);
}

export {
    getBuiltInModifier,
};
