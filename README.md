# Lilt

A Grammar based generative text library based on [Tracery](https://github.com/galaxykate/tracery).

## Example Grammar
```
{
  // Use an existing grammar file as a base
  _extends: 'core.grammar',

  // Include additional grammar files
  _includes: [
    'animals.grammar'
  ],
  
  // Use variables to save text across all expansions
  _variables: [
      my_pet: '{animal.a}',
      my_name: '{name}'
  ],

  name: [
      'bob',
      'sally',
      {'grant': 0.1}
  ],

  story: [
      'My name is {my_name}. I went to the pet shop to buy {animal.a} but instead I got a {my_pet}.'
  ]
}
```

## Todo
* Save/Load parsed grammar to/from binary file
* More grammars (from [Corpora](https://github.com/dariusk/corpora/tree/master/data))
* Fill out READMEs
    * lilt
        * [Tracery](https://github.com/galaxykate/tracery)
        * json5
    * lilt-core-grammars
        * json5
        * [Corpora](https://github.com/dariusk/corpora/tree/master/data)