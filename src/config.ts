import { pathToFileURL } from "url";
const path          = require('path');
const chalk         = require('chalk');

export const generatedFiles = {
    masterTranslationFileName: 'master-translations.json'
}

export const inquirerTexts = {
    translationExportPreRequisite: `Easily track custom translatable labels from your Drupal code.
1. auto-detect keys in code (default language)
2. easily map available translations from PO files (makes it easy to find missing translations)
3. generate a fake language PO file that makes it easy to hunt for keys usage in UI
4. custom B&B BO --> map uiKeys for use in UI    
`,
    mainActionChoice: 'what action to process',
    translationExportFileName: 'Enter the name of the file (ex: label-hunt-language.po):',
    drupalTranslationsOutputCulture: 'Enter the ISO 3166-2 country code for the file (ex: FR):',
    untranslatedLabelMarker: 'Choose the untranslated label markers:',
    translatedLabelAction: 'Choose how to display the already translated labels',
    drupalDirectoriesToBeCrawled: 'Enter directories to be searched for labels (separate directories with "|")',
    labelHuntRegExp: 'Enter regular expression for hunting labels',
    drupalFilesToConsider: 'Enter file glob descriptors to be considered for label hunt (separate file types with "|")',
    drupalTranslationsPoFile: 'Enter absolute path to a PO file',
    drupalTranslationsPoFileName: 'Enter generated file name',
    drupalUIKeysHolderFileName: 'Enter file holding mapping between UI keys (for use in front-end) and translatable keys'
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
        `auto search for ${ chalk.blue("t('<label key>')") } in folder (generates ${ generatedFiles.masterTranslationFileName })`,
        'map translated languages to master',
        'generate translation PO file to be imported in Drupal',
        { name:'generate label hunting language', disabled: 'in construction'},
        'map uiKeys to master'
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

export const autoLabelHuntQuestions = [
    { 
        type: 'input', 
        name: 'labelHuntRegExp',
        message: inquirerTexts.labelHuntRegExp,
        default: '[ >]t\\( *\'(.+?)\' *\\)', // capture is lazy to avoid overreaching when multiple hits on a single line
        filter: val => new RegExp(val, 'g')
    },
    { 
        type: 'input', 
        name: 'drupalDirectoriesToBeCrawled', 
        message: inquirerTexts.drupalDirectoriesToBeCrawled, 
        default: 'C://_data/B&B/sourcehub/bnb-bo/drupal/web/modules/custom|C://_data/B&B/sourcehub/bnb-bo/drupal/web/themes/custom',
        filter: val => val.toString().split('|'),
        validate: val => {
            const hasAtLeastOneEntry = (val !== '');
            const nonAbsoluteValues = val.toString().split('|')
                .map(value => {
                    return {
                        isValidPath: path.isAbsolute(value),
                        path: value
                    }
                })
                .filter(item => !item.isValidPath);

            const errorMsg:string = `invalid absolute paths to directories: ${ nonAbsoluteValues.map(item => item.path).join(' | ') }`

            return (hasAtLeastOneEntry && nonAbsoluteValues.length == 0) ? true : errorMsg
        }
    },
    { 
        type: 'input', 
        name: 'drupalFilesToConsider', 
        message: inquirerTexts.drupalFilesToConsider, 
        default: '*.twig|*.php|*.theme|*.yml|*.module',
        filter: val => val.toString().split('|'),
        validate: val => {
            const hasAtLeastOneEntry = (val !== '');

            return (hasAtLeastOneEntry) ? true : 'at least one file type to analyze is needed'
        }
    }
]

export const mapLanguagePoFileQuestions = [
    { 
        type: 'input', 
        name: 'drupalTranslationsOutputCulture', 
        message: inquirerTexts.drupalTranslationsOutputCulture, 
        filter: val => (val as string).toUpperCase(),
        validate: text => { return ((text as string).length == 2) ? true : 'ISO 3166-2 is exactly 2 characters' }
    },
    { 
        type: 'input', 
        name: 'drupalTranslationsPoFile', 
        message: inquirerTexts.drupalTranslationsPoFile, 
        validate: val => {
            const nonEmptyEntry = (val !== '');
            const nonAbsoluteValues = path.isAbsolute(val.toString());
            const errorMsg:string = `invalid absolute paths to PO file: ${ val }`

            return (nonEmptyEntry && nonAbsoluteValues) ? true : errorMsg
        }
    }
];

export const generateLanguagePoFileQuestions = [
    { 
        type: 'input', 
        name: 'drupalTranslationsOutputCulture', 
        message: inquirerTexts.drupalTranslationsOutputCulture, 
        filter: val => (val as string).toUpperCase(),
        validate: text => { return ((text as string).length == 2) ? true : 'ISO 3166-2 is exactly 2 characters' }
    },
    { 
        type: 'input', 
        name: 'drupalTranslationsPoFileName', 
        message: inquirerTexts.drupalTranslationsPoFileName, 
        validate: val => {
            const nonEmptyEntry = (val !== '');
            const noSpaces = !val.toString().includes(' ');
            const hasPoSuffix = val.toString().endsWith('.po');
            let errorMsg:string = !nonEmptyEntry
                ? `file name mandatory`
                : !noSpaces
                ? `no spaces allowed in filename`
                : !hasPoSuffix
                ? `file name should respect format my-language-file.po`
                : 'wrong input'

            return (nonEmptyEntry && hasPoSuffix && noSpaces) ? true : errorMsg
        }
    }
];

export const mapUIKeysQuestions = [
    { 
        type: 'input', 
        name: 'drupalUIKeysHolderFileName', 
        message: inquirerTexts.drupalUIKeysHolderFileName,
        default: 'C://_data/B&B/sourcehub/bnb-bo/drupal/web/themes/custom/bb_theme/bb_theme.theme',
        validate: val => {
            const nonEmptyEntry = (val !== '');
            const noSpaces = !val.toString().includes(' ');
            let errorMsg:string = !nonEmptyEntry
                ? `file name mandatory`
                : !noSpaces
                ? `no spaces allowed in filename`
                : 'wrong input'

            return (nonEmptyEntry && noSpaces) ? true : errorMsg
        }
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

export interface FileMatch extends ReadDirPEntry {
    lineMatches: { matches: string[], line: string, lineNumber: number }[]
}

// entry for master-translations.json
export interface i18nMasterEntry {
    key: string, // english translation (default if no translation available in the targeted language)
    uiKey: string, // global window.configuration.i18n property to retrieve label from front-end
    occurrences: { file:string, path:string, lineNumber:number }[],
    translations: {
        fr?: string, // fr translation
        it?: string, // it translation
        es?: string, // es translation
        de?: string // de translation
    }
}