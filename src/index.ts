const figlet        = require('figlet');
const chalk         = require('chalk');
const inquirer      = require('inquirer');
const clui          = require('clui');
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
    const drupalCorePoFileValues = await poUtils.getPoKeyValues('drupal-8.7.0-rc1.fr.po'); // official drupal v8 i18n FR translations (only used to get keys so whatever language will do)
    const drupalCoreTranslationKeys = new Set(drupalCorePoFileValues.map(entry => entry.key));
    const poFileValues = await poUtils.getPoKeyValues(answers.drupalTranslationsExportFileName);

    
    const totalKeysCount = poFileValues.length;
    const totalTranslatedKeysCount = poFileValues.filter(entry => entry.isTranslated).length;
    const customPoFileValues = poFileValues.filter(entry => !drupalCoreTranslationKeys.has(entry.key));
    console.log(chalk.red('need to rework with custom entry filtering'));
    const customKeysCount = customPoFileValues.length;
    const customTranslatedKeysCount = customPoFileValues.filter(entry => entry.isTranslated).length;
    // analytics report - total file translation stat
    console.log(clui.Gauge(totalTranslatedKeysCount, totalKeysCount, 20, 0.15, `${Math.round(100 * totalTranslatedKeysCount/totalKeysCount)}% translated (${totalTranslatedKeysCount}/${totalKeysCount})`));

    // analytics report - custom entries file translation stat
    console.log(clui.Gauge(customTranslatedKeysCount, customKeysCount, 20, 0.9, `${Math.round(100 * customTranslatedKeysCount/customKeysCount)}% translated (${customTranslatedKeysCount}/${customKeysCount})`));
};

// launch
init();
