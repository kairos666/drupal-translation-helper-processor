# drupal-translation-helper-processor

small CLI tool to help manage `t('<tranlatable keys>')` that are distributed inside a Drupal code base. Let's be honest that's a pain.

## utility functions
1. auto detect keys in code base and track their occurrences in a  **master-translations.json** conf file.
2. read and parse **language-file.po** to map translated keys with what was detected in the code base, easily detect unused tranlations and non translated keys
3. generate all your different languages **language-file.po** from a single source of truth.
4. generate a fake language that help hunt translations in your UI

## use CLI
```node
// install dependecies
npm install

// launch CLI
npm start
```
