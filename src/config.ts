const chalk         = require('chalk');

export const inquirerTexts = {
    translationExportPreRequisite: `1. go to ${ chalk.blue("<your-drupal-domain>/admin/config/regional/translate/export") } as an ${ chalk.blue("administrator user") }
2. select a language (best is to use the language with missing translations you try to find of course)
3. ensure all export options are checked
4. export and copy the file into the ${ chalk.blue("input-files") } folder
5. enter the name of the file ${ chalk.blue("<my-export-file>.po") } in the command prompt below
`,
    translationExportFileName: 'enter the name of the file (ex: label-hunt-language.po):'
}