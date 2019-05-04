const chalk         = require('chalk');

export const inquirerTexts = {
    translationExportPreRequisite: `1. Go to ${ chalk.blue("<your-drupal-domain>/admin/config/regional/translate/export") } as an ${ chalk.blue("administrator user") }
2. Select a language (best is to use the language with missing translations you try to find of course)
3. Ensure all export options are checked
4. Export and copy the file into the ${ chalk.blue("input-files") } folder
5. Enter the name of the file ${ chalk.blue("<my-export-file>.po") } in the command prompt below
`,
    mainActionChoice: 'what action to process',
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
    ],
    mainActions: [
        'generate label hunting language', 
        `auto search for ${ chalk.blue("t('<label key>')") } in folder`
    ]
}

export const launchQuestions = [
    { 
        type: 'list', 
        name: 'mainAction', 
        message: inquirerTexts.mainActionChoice, 
        choices: inquirerChoices.mainActions
    }
];

export const labelHuntQuestions = [
    { 
        type: 'input', 
        name: 'drupalTranslationsExportFileName', 
        message: inquirerTexts.translationExportFileName 
    },
    { 
        type: 'input', 
        name: 'drupalTranslationsOutputCulture', 
        message: inquirerTexts.drupalTranslationsOutputCulture, 
        filter: val => (val as string).toUpperCase(),
        validate: text => { return ((text as string).length == 2) ? true : 'ISO 3166-2 is exactly 2 characters' }
    },
    { 
        type: 'list', 
        name: 'untranslatedLabelMarker', 
        message: inquirerTexts.untranslatedLabelMarker, 
        choices: inquirerChoices.untranslatedLabelMarker.map(choice => choice.name),
        filter: val => inquirerChoices.untranslatedLabelMarker.find(choice => (val == choice.name)).format
    },
    { 
        type: 'list', 
        name: 'translatedLabelAction', 
        message: inquirerTexts.translatedLabelAction, 
        choices: inquirerChoices.translatedLabelAction.map(choice => choice.name),
        filter: val => inquirerChoices.translatedLabelAction.find(choice => (val == choice.name)).format
    }
];

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

export interface ReadDirPEntry {
    path: string,
    fullPath: string,
    basename: string,
    dirent?: any,
    stats?: any
}

export interface FileMatches extends ReadDirPEntry {
    fileMatches: { lineMatches: string[], line: string, lineNumber: number }[]
}