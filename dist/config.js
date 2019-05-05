"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const chalk = require('chalk');
exports.generatedFiles = {
    masterTranslationFileName: 'master-translations.json'
};
exports.inquirerTexts = {
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
    drupalTranslationsPoFile: 'Enter absolute path to a PO file'
};
exports.inquirerChoices = {
    untranslatedLabelMarker: [
        { name: '[untranslated label]', format: (entry) => `[${entry.key}]` },
        { name: '{untranslated label}', format: (entry) => `{${entry.key}}` },
        { name: '*untranslated label*', format: (entry) => `*${entry.key}*` },
        { name: '<untranslated label>', format: (entry) => `<${entry.key}>` },
        { name: '#untranslated label#', format: (entry) => `#${entry.key}#` }
    ],
    translatedLabelAction: [
        { name: 'show translation', format: (entry) => entry.value },
        { name: 'replace translation by Xs', format: (entry) => entry.value.replace(/[A-Z]/g, 'X').replace(/[a-z]/g, 'x') },
        { name: 'show key like so |key|', format: (entry) => `|${entry.key}|` }
    ],
    mainActions: [
        `auto search for ${chalk.blue("t('<label key>')")} in folder (generates ${exports.generatedFiles.masterTranslationFileName})`,
        'map translated languages to master',
        { name: 'generate translation PO file to be imported in Drupal', disabled: 'in construction' },
        { name: 'generate label hunting language', disabled: 'in construction' },
        { name: 'map uiKeys to master', disabled: 'in construction' }
    ]
};
exports.launchQuestions = [
    {
        type: 'list',
        name: 'mainAction',
        message: exports.inquirerTexts.mainActionChoice,
        choices: exports.inquirerChoices.mainActions
    }
];
exports.labelHuntQuestions = [
    {
        type: 'input',
        name: 'drupalTranslationsExportFileName',
        message: exports.inquirerTexts.translationExportFileName
    },
    {
        type: 'input',
        name: 'drupalTranslationsOutputCulture',
        message: exports.inquirerTexts.drupalTranslationsOutputCulture,
        filter: val => val.toUpperCase(),
        validate: text => { return (text.length == 2) ? true : 'ISO 3166-2 is exactly 2 characters'; }
    },
    {
        type: 'list',
        name: 'untranslatedLabelMarker',
        message: exports.inquirerTexts.untranslatedLabelMarker,
        choices: exports.inquirerChoices.untranslatedLabelMarker.map(choice => choice.name),
        filter: val => exports.inquirerChoices.untranslatedLabelMarker.find(choice => (val == choice.name)).format
    },
    {
        type: 'list',
        name: 'translatedLabelAction',
        message: exports.inquirerTexts.translatedLabelAction,
        choices: exports.inquirerChoices.translatedLabelAction.map(choice => choice.name),
        filter: val => exports.inquirerChoices.translatedLabelAction.find(choice => (val == choice.name)).format
    }
];
exports.autoLabelHuntQuestions = [
    {
        type: 'input',
        name: 'labelHuntRegExp',
        message: exports.inquirerTexts.labelHuntRegExp,
        default: '[ >]t\\( *\'(.+?)\' *\\)',
        filter: val => new RegExp(val, 'g')
    },
    {
        type: 'input',
        name: 'drupalDirectoriesToBeCrawled',
        message: exports.inquirerTexts.drupalDirectoriesToBeCrawled,
        default: 'C://_data/B&B/sourcehub/bnb-bo/drupal/web/modules/custom|C://_data/B&B/sourcehub/bnb-bo/drupal/web/themes/custom',
        filter: val => val.toString().split('|'),
        validate: val => {
            const hasAtLeastOneEntry = (val !== '');
            const nonAbsoluteValues = val.toString().split('|')
                .map(value => {
                return {
                    isValidPath: path.isAbsolute(value),
                    path: value
                };
            })
                .filter(item => !item.isValidPath);
            const errorMsg = `invalid absolute paths to directories: ${nonAbsoluteValues.map(item => item.path).join(' | ')}`;
            return (hasAtLeastOneEntry && nonAbsoluteValues.length == 0) ? true : errorMsg;
        }
    },
    {
        type: 'input',
        name: 'drupalFilesToConsider',
        message: exports.inquirerTexts.drupalFilesToConsider,
        default: '*.twig|*.php|*.theme|*.yml',
        filter: val => val.toString().split('|'),
        validate: val => {
            const hasAtLeastOneEntry = (val !== '');
            return (hasAtLeastOneEntry) ? true : 'at least one file type to analyze is needed';
        }
    }
];
exports.mapLanguagePoFileQuestions = [
    {
        type: 'input',
        name: 'drupalTranslationsOutputCulture',
        message: exports.inquirerTexts.drupalTranslationsOutputCulture,
        filter: val => val.toUpperCase(),
        validate: text => { return (text.length == 2) ? true : 'ISO 3166-2 is exactly 2 characters'; }
    },
    {
        type: 'input',
        name: 'drupalTranslationsPoFile',
        message: exports.inquirerTexts.drupalTranslationsPoFile,
        validate: val => {
            const nonEmptyEntry = (val !== '');
            const nonAbsoluteValues = path.isAbsolute(val.toString());
            const errorMsg = `invalid absolute paths to PO file: ${val}`;
            return (nonEmptyEntry && nonAbsoluteValues) ? true : errorMsg;
        }
    }
];
