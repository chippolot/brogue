# Brogue
A Grammar based generative text library based on [@galaxykate's](https://github.com/galaxykate) [Tracery](https://github.com/galaxykate/tracery).

## Installation
For use with Node.js, simply install using NPM:
```
npm install --save brogue
```

## Table of Contents
- [Usage](#usage)
- [Grammars](#grammars)
    * [Grammar Syntax](#grammar-syntax)
    * [Loading or Parsing Grammars](#loading-or-parsing-grammars)
    * [Variables](#variables)
    * [Modifiers](#modifiers)
    * [Core Grammars](#core-grammars)
    * [Grammar Structure](#grammar-structure)
- [Advanced Topics](#advanced-topics)
    * [Custom Modifiers](#custom-modifiers)
    * [Rule Weighting](#rule-weighting)
    * [Markov Chains](#markov-chains)
- [Special Thanks](#special-thanks)

## Usage
1. Load or Parse a grammar:  `brogue.loadGrammar(filePath)` or `brogue.parseGrammar(string)')`
2. Expand some text:         `brogue.expand('{symbol}')`

The code:
```
const Brogue = require('brogue');

// Create a new brogue instance
const brogue = new Brogue();

// Load or parse a grammar
brogue.parseGrammar({
    animal: ['cat', 'dog', 'fish', 'goose', 'rat', { 'dinosaur': 0.1 }],
    pronoun: ['her', 'his', 'their'],
    vehicle: ['motorcycle', 'sled', 'bullet train', 'ridable ostrich'],
    destination: ['Hawaii', 'space', 'the grocery store', 'Burger King', 'the finish line'],

    story: 'The {animal} got on {pronoun} {vehicle} and headed for {destination}.'
});

// Expand to your heart's content
for (let i = 0; i < 3; ++i) {
    const story = brogue.expand('{story}');
    console.log(story);
}
```

Produces:
```
The dog got on his motorcycle and headed for space.
The fish got on their bullet train and headed for the grocery store.
The cat got on her ridable ostrich and headed for the finish line.
```

## Grammars
A grammar is a set of rules used by the expander to generate text.

Each rule is represented as a name followed by a list of text strings:
```
rule_name: ['word1', 'word2', 'or a phrase']
```

Rules can also contain expansion symbols. Expansion symbols are rule names wrapped in curly braces:
```
hairy_animal: ['{hairstyle}-{animal}'],
hairstyle: ['mohawk', 'bowl cut'],
animal: ['cat', 'dog', 'fish']
```

When the expander runs it will replace all expansion symbols with a randomly chosen text string from
the associated rule. This happens recursively, so you can have expansion symbols which expand to expansion symbols,
and so on.
```
my_descriptive_animal: ['my {descriptive_animal}'],
descriptive_animal: ['fun {animal}', 'cool {animal}'],
animal: ['cat', 'dog', 'fish']
```

You can chain together any number of modifiers after an expansion symbol to change the final output.  
For example, expanding:
```
animal_part: ['{animal.capitalize.possessive} {body_part.capitalize}']
```

Might produce:
```
Dolphin's Nose
```

### Grammar Syntax
Grammars use the [JSON5](https://json5.org/) syntax. JSON5 is a superset of JSON so feel free to write standard JSON. 
However, JSON5 has some nice syntax changes (no requiement to quote keys, support for line breaks in strings, etc) which can help make your grammar files more human readable.

Compare this (JSON5):
```
{
    animal: ['cat', 'dog', 'squid'],
    story: ['\
      Once upon a time,\n\
      There was an {animal}\n\
      and it was very cute.\
    ']
}
```

With this (JSON):
```
{
    "animal": ["cat", "dog", "squid"],
    "story": ["Once upon a time,\nThere was an {animal}\nand it was very cute."]
}
```

Both are valid grammars which Brogue can parse. Choose whichever syntax works for you!

### Loading or Parsing Grammars

Grammars can be loaded into brogue in several different ways:

#### Loading from files
Grammars can be loaded from files using the `brogue.loadGrammar('path/to/file.grammar')` method.
Loaded grammars can use the `_includes: ['other.grammar', 'another.grammar']` key-value pairs to mix-in additional grammar files. File paths specified using these mix-in methods will be resolved relative to the initial file that is being parsed.

#### Parsing in code
Grammars can also be parsed from either JSON5 strings or Javascript objects using the `brogue.parseGrammar()` method.
Grammars parsed this way can still use the `_includes` feature to mix in additional files. These file paths will be resolved relative to the current working directory.

### Variables
Variables are special expansions which are evaluated once and then re-used everywhere they appear. They can be used to "save data" during an expansion if you want to refer to the same random choice multiple times.  

Variables look similar to standard expansions but with a name and a value.
The variable value is parsed just like a normal text string so it can contain one or more expansions.
```
//{variable_name= variable_value}
{my_cat= {name.possessive} {animal}}
```

This value can be 

#### Global Variables
Any variables defined in the `_variables` key in a grammar can be used anywhere during expansions.

Example:
```
{
    _variables: [
        '{hero_name= {name}}'
    ],
    name: ['Barbara', 'Gwendolyn', 'Sally'],
    artifact: ['Sacred Stone', 'Shiny Fork', 'Holy Donut'],
    story: '{hero_name} went questing one day. As {hero_name} opened the treasure chest, they found {artifact}, {artifact}, and {artifact}.'
}
```

This example would use the same randomly chosen name everywhere the `{hero_name}` variable appears, but choose a new random artifact for each of the three `{artifact}` symbols.

#### Inline Variables
Variables can also be declared inline in text strings. When declaring variables in this manner, they can only be used in that string and in expansions stemming from that string. Inline variable declarations will not be expanded in the strings in which they are declared -- they are erased from the string after they are parsed.

Example:
```
{
    name: ['Barbara', 'Gwendolyn', 'Sally'],
    artifact: ['Sacred Stone', 'Shiny Fork', 'Holy Donut'],
    story: '{hero_name= {name}}{hero_name} went questing one day. As {hero_name} opened the treasure chest, they found {artifact}, {artifact}, and {artifact}.'
}
```

### Modifiers
Expansion symbols can have any number of modifiers chained to them to affect the output.

```
{name.capitalize} ate all of {name.capitalize.possessive} {food.s}.
```

Might produce: 

```
Billy ate all of Trisha's tarts.
```

#### Built-in Modifiers
Brogue uses both the [Articles](https://github.com/chadkirby/Articles) and [Compromise](https://github.com/spencermountain/compromise/) libraries to provide several built-in modifiers:

| Name | Description |
| ------------- | ------------- |
| capitalize  | `'a nice house' → 'A nice house'` |
| capitalizeall  | `'a nice house' → 'A Nice House'` |
| quotes | `'ham' → '"ham"'` |
| times(number) | `'go.times(3)' → 'go go go'` |
| a | `'cat' → 'a cat', 'ostrich' → 'an ostrict'` |
| s | `'football captain' → 'football captains'` |
| singular | `'turnovers' → 'turnover'` |
| past | `'will go' → 'went'` |
| present | `'walked' → 'walks'` |
| future | `'walked' → 'will walk'` |
| ing | `'help' → 'helping'` |
| infinitive | `'walks' → 'walk'` |
| nounify | `'swim' → 'swimmer'` |
| possessive | `'Bill' → 'Bill's'` |
| positive | `'didn't study' → 'studied'` |
| negative | `'went' → 'did not go'` |
| numberToWords | `'3.numberToWords' → 'three'` |
| randomNumber | `'.randomNumber(0, 10)' → '8'` |
| roll | `'.roll("1d6+1")' → '5'` |
| uniques | `'.uniques("animals", 3, ", ")' → 'cat, dog, mouse'` |
| choose | `'.choose("cat", "dog", "bird")' → 'dog'` |

### Core Grammars
You can always create your own grammars to use with Brogue, but there is also a core set of existing grammars you can explore and import.
The core grammar set can be found here: [Brogue Core Grammars](https://github.com/chippolot/brogue-core-grammars)

To install the core grammars:
```
npm install --save brogue-core-grammars
```

To include the core grammars in your grammar:
```
{
    _includes: [
        'path_to_node_modules_folder/brogue-core-grammars/grammars/core.grammar',
    ]
}
```

### Grammar Structure
```
{
    // Include additional grammar files
    _includes: [
    'animals.grammar'
    ],

    // Use variables to save text across all expansions
    _variables: [
        my_pet: '{animal.a}',
        my_name: '{name}'
    ],

    _markov: {
        random_phrase: [ 'never say never', 'never say anything', 'always say something', 'always take a vacation' ]
    },

    // All key-value pairs that do not start with an
    // underscore are parsed as rules.
    // Rules values can either be arrays of text or...
    name: [
        'bob',
        'sally',
        {'grant': 0.1}
    ],

    // Rule values can be strings where there is only
    // a single rule element.
    animal: 'cat',

    story: [
        'My name is {my_name}. I went to the pet shop to buy {animal.a} but instead I got a {my_pet}.'
    ]
}
```

## Advanced Topics
### Custom Modifiers
You can register your own modifiers in script after loading a grammar:
```
brogue.loadGrammar('words.grammar');

brogue.registerModifier('reverse', (text) => {
    return text.split('').reverse().join('');
});

brogue.expand('{animal.reverse}');
```

### Rule Weighting
Each text string in a rule has an equal chance of being picked during expansion. However, you can also apply custom weights to text strings to have more control over the frequency in which they are chosen.

To weight a string, simply change it to a key-value pair in which the value is the random weight. Unless otherwise specified, all text strings have a weight of `1`.
```
{
    animals: [
        // This has a weight of 1
        'cat',

        // This has a weight of 2 -- it will be twice as likely to be picked
        {'dog': 2},

        // This has a weight of 0.5 -- it will be half as likely to be picked
        {'fish': 0.5}
    ]
}
```

### Markov Chains
Brogue supports markov chain generation via the `_markov` key in grammar objects. 

Markov chains can be used to generate new sequences (in this case, sentences) based on analyzing some input data and determining the probabilities of elements appearing after other elements. 

For example, given some input data:
```
A cat likes rice.
A dog likes pies.
A dog likes cheese.
```

A markov chain may generate:
```
A cat likes rice.
A cat likes cheese.
A cat likes pies.
A dog likes rice.
A dog likes cheese.
A dog likes pies.
```

To use markov chains in Brogue, simply add a `_markov` section in a grammar. Each entry in the `_markov` section will register a new expansion symbol which, when expanded, will generate a new sentence using markov chains.

```
{
    _markov: {
        animals_like_food: [
            'A cat likes rice',
            'A dog likes pies',
            'A dog likes cheese'
        ],
        story: '{animals_like_food} and I do too!'
    }
}
```

#### Markov Settings
Markov chain entries support additional settings which control the markov chain generation process.  
To specify settings, simply add them to your `_markov` entries like so:
```
_markov: {
    animals_like_food: {
        sentences: [
            'A cat likes rice',
            'A dog likes pies',
            'A dog likes cheese'
        ], 
        minCharacters: 50,
        maxCharacters: 280,
        maxTries: 100,
        order: 2
    },
}
```

| Setting  | Default | Description |
| ------------- | ------------- | ------------- |
| minCharacters | 0 | Generation algorithm will retry generation if the resulting sentence has fewer characters than this value. |
| maxCharacters | 100000 | Generation algorithm will retry generation if the resulting sentence has more characters than this value. |
| maxTries | 100 | Number of times generation will be attempted before failing and returning an empty string. |
| order | 2 | Determines how many previous words are used to pick the next word in the generated sentence. The larger the value, the more similar generated sentences will be to the input sentences to the point where they will eventually become identical. |
| uniqueOutput | true | If true, generation will retry until the output string does not appear in the source list. |

### Decorator Expansions
There's a special syntax to mark expansions as 'decorators', meaning that they don't meaningfully change the string that they're in. This markup is used by certain modifiers, for example the `uniques` modifier, to determine which strings are considered to be equal.

Decorator expansions are identified by double curly braces:
```
{{rule_name}}
```

For example:
```
// The uniques modifier will not choose this string twice, even though it contains an expansion.
// That is because the only expansion is this string is marked as a decorator and thus expanding twice will not yield "unique" strings.
"I can jump {{number_of_feet}} feet"

// The uniques modifier will choose this string twice, because it is using a standard expansion.
"I can {action} 10 feet"
```

## Special Thanks
* [zumpiez](https://github.com/zumpiez)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>