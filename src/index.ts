const figlet        = require('figlet');
const chalk         = require('chalk');
const inquirer      = require('inquirer');
import { inquirerTexts, inquirerChoices, UserInputs } from './config';
import poUtils from './utils/po-file.utils';

async function init() {
    // start screen
    console.log(chalk.green(figlet.textSync('Drupal v8')));
    console.log(chalk.green(figlet.textSync('translations helper processor')));
    console.log(chalk.white(inquirerTexts.translationExportPreRequisite));

    // inquiry config
    const questions:any[] = [
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
    ]

    // process inquiry answers after command line questions have been answered
    const answers:UserInputs = await inquirer.prompt(questions);
    console.log(answers);
};

// launch
init();
