const chalk         = require('chalk');

export const inquirerTexts = {
    translationExportPreRequisite: `1. Go to ${ chalk.blue("<your-drupal-domain>/admin/config/regional/translate/export") } as an ${ chalk.blue("administrator user") }
2. Select a language (best is to use the language with missing translations you try to find of course)
3. Ensure all export options are checked
4. Export and copy the file into the ${ chalk.blue("input-files") } folder
5. Enter the name of the file ${ chalk.blue("<my-export-file>.po") } in the command prompt below
`,
    translationExportFileName: 'Enter the name of the file (ex: label-hunt-language.po):',
    drupalTranslationsOutputCulture: 'Enter the ISO 3166-2 country code for the file (ex: FR):',
    untranslatedLabelMarker: 'Choose the untranslated label markers:',
    translatedLabelAction: 'Choose how to display the already translated labels'
}

export const inquirerChoices = {
    untranslatedLabelMarker: [
        { name: '[untranslated label]', format: (entry:PoEntry) => `[${entry.key}]`},
        { name: '{untranslated label}', format: (entry:PoEntry) => `{${entry.key}}`},
        { name: '*untranslated label*', format: (entry:PoEntry) => `*${entry.key}*`},
        { name: '<untranslated label>', format: (entry:PoEntry) => `<${entry.key}>`},
        { name: '#untranslated label#', format: (entry:PoEntry) => `#${entry.key}#`}
    ],
    translatedLabelAction: [
        { name: 'show translation', format: (entry:PoEntry) => entry.value},
        { name: 'replace translation by Xs', format: (entry:PoEntry) => entry.value.replace(/[A-Z]/g, 'X').replace(/[a-z]/g, 'x')},
        { name: 'show key like so |key|', format: (entry:PoEntry) => `|${entry.key}|`}
    ]
}

/* INTERFACES */
export interface UserInputs {
    drupalTranslationsExportFileName: string,
    drupalTranslationsOutputCulture: string,
    untranslatedLabelMarker: (entry:PoEntry)=>string,
    translatedLabelAction: (entry:PoEntry)=>string
}

export interface PoEntry {
    key: string,
    value: string,
    isTranslated: boolean
}