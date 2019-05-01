"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');
const config_1 = require("./config");
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
    console.log(answers);
}
;
// launch
init();
