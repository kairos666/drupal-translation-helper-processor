"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');
const clui = require('clui');
const config_1 = require("./config");
const po_file_utils_1 = require("./utils/po-file.utils");
async function init() {
    // start screen
    console.log(chalk.green(figlet.textSync('Drupal v8')));
    console.log(chalk.green(figlet.textSync('translations helper processor')));
    console.log(chalk.white(config_1.inquirerTexts.translationExportPreRequisite));
    // inquiry config
    const questions = [
        {
            type: 'input',
            name: 'drupalTranslationsExportFileName',
            message: config_1.inquirerTexts.translationExportFileName
        },
        {
            type: 'input',
            name: 'drupalTranslationsOutputCulture',
            message: config_1.inquirerTexts.drupalTranslationsOutputCulture,
            filter: val => val.toUpperCase(),
            validate: text => { return (text.length == 2) ? true : 'ISO 3166-2 is exactly 2 characters'; }
        },
        {
            type: 'list',
            name: 'untranslatedLabelMarker',
            message: config_1.inquirerTexts.untranslatedLabelMarker,
            choices: config_1.inquirerChoices.untranslatedLabelMarker.map(choice => choice.name),
            filter: val => config_1.inquirerChoices.untranslatedLabelMarker.find(choice => (val == choice.name)).format
        },
        {
            type: 'list',
            name: 'translatedLabelAction',
            message: config_1.inquirerTexts.translatedLabelAction,
            choices: config_1.inquirerChoices.translatedLabelAction.map(choice => choice.name),
            filter: val => config_1.inquirerChoices.translatedLabelAction.find(choice => (val == choice.name)).format
        }
    ];
    // process inquiry answers after command line questions have been answered
    const answers = await inquirer.prompt(questions);
    const drupalCorePoFileValues = await po_file_utils_1.default.getPoKeyValues('drupal-8.7.0-rc1.fr.po'); // official drupal v8 i18n FR translations (only used to get keys so whatever language will do)
    const drupalCoreTranslationKeys = new Set(drupalCorePoFileValues.map(entry => entry.key));
    const poFileValues = await po_file_utils_1.default.getPoKeyValues(answers.drupalTranslationsExportFileName);
    const totalKeysCount = poFileValues.length;
    const totalTranslatedKeysCount = poFileValues.filter(entry => entry.isTranslated).length;
    const customPoFileValues = poFileValues.filter(entry => !drupalCoreTranslationKeys.has(entry.key));
    console.log(chalk.red('need to rework with custom entry filtering'));
    const customKeysCount = customPoFileValues.length;
    const customTranslatedKeysCount = customPoFileValues.filter(entry => entry.isTranslated).length;
    // analytics report - total file translation stat
    console.log(clui.Gauge(totalTranslatedKeysCount, totalKeysCount, 20, 0.15, `${Math.round(100 * totalTranslatedKeysCount / totalKeysCount)}% translated (${totalTranslatedKeysCount}/${totalKeysCount})`));
    // analytics report - custom entries file translation stat
    console.log(clui.Gauge(customTranslatedKeysCount, customKeysCount, 20, 0.9, `${Math.round(100 * customTranslatedKeysCount / customKeysCount)}% translated (${customTranslatedKeysCount}/${customKeysCount})`));
}
;
// launch
init();
