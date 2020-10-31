/* eslint-disable no-unused-vars */
import nlp from 'compromise';
import Articles from 'articles';
import numWords from 'num-words';

import { expandLexeme, ExpansionContext, pickLexeme } from './expand';

function _isVowel(s: string): boolean {
    return s === 'a' || s === 'e' || s === 'i' || s === 'o' || s === 'u' || s === 'y' || s === 'A' || s === 'E' || s === 'I' || s === 'O' || s === 'U' || s === 'Y';
}

function _isConsonant(s: string): boolean {
    return !_isVowel(s);
}

function _funcCapitalize(s: string, _: ExpansionContext): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function _funcCapitalizeAll(s: string, _: ExpansionContext): string {
    return s.replace(/(?:^|\s)\S/g, (a) => {
        return a.toUpperCase();
    });
}

function _funcQuotes(s: string, _: ExpansionContext): string {
    return `"${s}"`;
}

function _funcTimes(s: string, _: ExpansionContext, n: number) {
    if (n === undefined || Number.isNaN(n) || typeof n !== 'number') {
        throw new Error('Expected number parameter. Ex: times(3)');
    }
    return Array(n).fill(s).join(' ');
}

function _funcArtical(s: string, _: ExpansionContext): string {
    return Articles.articlize(s);
}

function _funcPluralize(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Noun").nouns()
        .toPlural()
        .text();
}

function _funcSingularize(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Noun").nouns()
        .toSingular()
        .text();
}

function _funcPossessive(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Noun").nouns()
        .toPossessive()
        .text();
}

function _funcPastTense(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toPastTense()
        .text();
}

function _funcPresentTense(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toPresentTense()
        .text();
}

function _funcFutureTense(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toFutureTense()
        .text();
}

function _funcGerund(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toGerund()
        .text();
}

function _funcInfinitive(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toInfinitive()
        .text();
}

function _funcPositive(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toPositive()
        .text();
}

function _funcNegative(s: string, _: ExpansionContext): string {
    return nlp(s).tag("#Verb").verbs()
        .toNegative()
        .text();
}

function _funcNounify(s: string, context: ExpansionContext): string {
    const infinitive = _funcInfinitive(s, context);
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

function _funcRandomNumber(_: string, context: ExpansionContext, minString: string = '0', maxString: string = '99'): string {
    const min = parseInt(minString, 10);
    const max = parseInt(maxString, 10);
    return context.grammar.random.intBetween(min, max).toString();
}

function _funcRoll(_: string, context: ExpansionContext, rollString: string): string {
    if (!rollString) {
        throw new Error(`Tried to invoke roll() without argument`);
    }

    const matches = rollString.match(/(?<num>\d+)d(?<sides>\d+)(?:(?:\s?\+\s?(?<plus>\d+))|(?:\s?-\s?(?<minus>\d+)))?/);
    if (!matches || !matches.groups?.num || !matches.groups?.sides) {
        throw new Error(`Failed to parse die roll string: ${rollString}`);
    }

    const num = parseInt(matches.groups.num, 10);
    const sides = parseInt(matches.groups.sides, 10);

    let val = 0;
    for (let i = 0; i < num; ++i) {
        val += context.grammar.random.intBetween(1, sides);
    }

    if (matches.groups.plus) {
        val += parseInt(matches.groups.plus, 10);
    }
    if (matches.groups.minus) {
        val -= parseInt(matches.groups.minus, 10);
    }

    return val.toString();
}

function _funcUniques(_: string, context: ExpansionContext, ruleName: string, num: number, separator: string = " "): string {
    const rule = context.grammar.rules.get(ruleName);
    if (!rule) {
        throw new Error(`Failed to call modifier 'uniques'. Rule {ruleName} not found in loaded grammar.`);
    }

    const picks: string[] = [];
    const pickedLexemes = [];

    const maxTries = 9999;
    let tries = 0;
    while (picks.length < num && tries++ < maxTries) {

        const lexeme = pickLexeme(rule, context, pickedLexemes);
        if (!lexeme) {
            break;
        }

        const expanded = expandLexeme(lexeme, context);
        if (picks.includes(expanded)) {
            continue;
        }
        pickedLexemes.push(lexeme);
        picks.push(expanded);
    }

    return picks.join(separator);
}

function _funcNumberToWords(s: string, _: ExpansionContext): string {
    const parsed = parseInt(s, 10);
    if (isNaN(parsed)) {
        return s;
    }
    return numWords(parsed);
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
    numberToWords: _funcNumberToWords,

    // Genrative
    randomNumber: _funcRandomNumber,
    roll: _funcRoll,
    uniques: _funcUniques,
}));

function getBuiltInModifier(name: string): Function | undefined {
    return builtInModifiers.get(name);
}

export {
    getBuiltInModifier,
};
