interface MarkovSettings {
    order: number;
    minCharacters: number;
    maxCharacters: number;
    maxTries: number;
    uniqueOutput: boolean;
}

const END_SYMBOL = "_END_";

class Markov {
    sentences: string[] = [];
    settings: MarkovSettings;
    trainingData?: Map<string, string[]>;

    static get DefaultSettings(): MarkovSettings {
        return {
            minCharacters: 0,
            maxCharacters: 100000,
            maxTries: 100,
            order: 2,
            uniqueOutput: true,
        };
    }

    constructor(sentences: string[], settings?: MarkovSettings) {
        this.sentences = sentences;
        this.settings = settings ?? Markov.DefaultSettings;
    }

    setSentences(sentences: string[]) {
        this.sentences = sentences;
    }

    train(): void {
        this.trainingData = new Map<string, string[]>();

        const order = this.settings.order;
        this.sentences.forEach((sentence) => {

            // Split the sentence into tokens, removing empty entries
            const tokens = sentence
                .split(/\s+/)
                .filter((x) => x);

            // Add end tokens to know how to end sentences
            tokens.push(END_SYMBOL);

            // Build frquency map
            for (let i = -order; i < tokens.length - order; ++i) {
                const start = i;
                const end = i + order;

                let keyTokens: string[] = tokens.slice(Math.max(start, 0), end);

                if (start < 0) {
                    keyTokens = Array(Math.abs(start))
                        .fill('')
                        .concat(keyTokens);
                }
                const key = keyTokens.join(' ');

                const next = tokens[end];
                if (!this.trainingData!.has(key)) {
                    this.trainingData!.set(key, []);
                }
                this.trainingData!.get(key)!.push(next);
            }
        });
    }

    generate(): string | undefined {
        if (!this.trainingData) {
            throw new Error("Markov is not trained. Call `train()` before generating.");
        }

        const order = this.settings.order;

        const words: string[] = [];
        const keyTokens = Array(order).fill('');

        let numCharacters = 0;
        while (true) {
            const key = keyTokens.join(' ');
            keyTokens.shift();

            const next = this._randomElementForKey(key);
            if (next === END_SYMBOL) {
                break;
            }

            keyTokens.push(next);
            words.push(next);
            numCharacters += next.length;

            if (numCharacters >= this.settings.maxCharacters) {
                return undefined;
            }
        }

        return words.join(' ');
    }

    _randomElementForKey(key: string): string {
        if (!this.trainingData) {
            throw new Error("Markov is not trained. Call `train()` before generating.");
        }

        const set = this.trainingData!.get(key);
        if (!set) {
            throw new Error(`No training data for key ${key}`);
        }

        return set[Math.floor(Math.random() * set.length)];
    }
}

export {
    Markov,
    MarkovSettings,
};
