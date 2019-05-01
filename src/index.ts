const figlet        = require('figlet');
const chalk         = require('chalk');
const inquirer      = require('inquirer');
import { inquirerTexts } from './config';

async function init() {
    console.log(chalk.green(figlet.textSync('Drupal v8')));
    console.log(chalk.green(figlet.textSync('translations helper processor')));
    console.log(chalk.white(inquirerTexts.translationExportPreRequisite));

    const questions:any[] = [
        { type: 'input', name: 'drupalTranslationsExportFileName', message: inquirerTexts.translationExportFileName }
    ]

    const answers = await inquirer.prompt(questions);
    console.log(answers);
};

// launch
init();
