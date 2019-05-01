"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');
const config_1 = require("./config");
async function init() {
    console.log(chalk.green(figlet.textSync('Drupal v8')));
    console.log(chalk.green(figlet.textSync('translations helper processor')));
    console.log(chalk.white(config_1.inquirerTexts.translationExportPreRequisite));
    const questions = [
        { type: 'input', name: 'drupalTranslationsExportFileName', message: config_1.inquirerTexts.translationExportFileName }
    ];
    const answers = await inquirer.prompt(questions);
    console.log(answers);
}
;
// launch
init();
