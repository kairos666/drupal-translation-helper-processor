"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');
const clui = require('clui');
const config_1 = require("./config");
const po_file_utils_1 = require("./utils/po-file.utils");
const search_in_file_utils_1 = require("./utils/search-in-file.utils");
/* MAIN */
async function init() {
    // start screen
    console.log(chalk.green(figlet.textSync('Drupal v8')));
    console.log(chalk.green(figlet.textSync('translations helper processor')));
    console.log(chalk.white(config_1.inquirerTexts.translationExportPreRequisite));
    // choose main action
    const mainActionAnswer = (await inquirer.prompt(config_1.launchQuestions)).mainAction;
    switch (mainActionAnswer) {
        case config_1.inquirerChoices.mainActions[0]:
            await fileCrawler();
            break;
        case config_1.inquirerChoices.mainActions[1]:
            await labelHuntLanguageGenerator();
            break;
    }
}
;
/* MAIN ACTIONS */
async function labelHuntLanguageGenerator() {
    // process inquiry answers after command line questions have been answered
    const answers = await inquirer.prompt(config_1.labelHuntQuestions);
    const drupalCorePoFileValues = await po_file_utils_1.default.getPoKeyValues('drupal-8.7.0-rc1.fr.po'); // official drupal v8 i18n FR translations (only used to get keys so whatever language will do)
    const drupalCoreTranslationKeys = new Set(drupalCorePoFileValues.map(entry => entry.key));
    const poFileValues = await po_file_utils_1.default.getPoKeyValues(answers.drupalTranslationsExportFileName);
    const totalKeysCount = poFileValues.length;
    const totalTranslatedKeysCount = poFileValues.filter(entry => entry.isTranslated).length;
    const customPoFileValues = poFileValues.filter(entry => !drupalCoreTranslationKeys.has(entry.key));
    const customKeysCount = customPoFileValues.length;
    const customTranslatedKeysCount = customPoFileValues.filter(entry => entry.isTranslated).length;
    /* ANALYTICS */
    // total file translation stat
    console.log(clui.Gauge(totalTranslatedKeysCount, totalKeysCount, 20, 0.15, `${Math.round(100 * totalTranslatedKeysCount / totalKeysCount)}% translated (${totalTranslatedKeysCount}/${totalKeysCount})`));
    // custom entries file translation stat
    console.log(clui.Gauge(customTranslatedKeysCount, customKeysCount, 20, 0.9, `${Math.round(100 * customTranslatedKeysCount / customKeysCount)}% translated (${customTranslatedKeysCount}/${customKeysCount})`));
    /* OUTPUT */
    // generate desired technical language file
    const generatedFileString = po_file_utils_1.default.generatePoFile(answers.drupalTranslationsOutputCulture, poFileValues, answers.untranslatedLabelMarker, answers.translatedLabelAction);
    const outputFileName = `drupal-hunting-language-${answers.drupalTranslationsOutputCulture}.po`;
    await clearOutput();
    // write file
    writeFile(`output-files/${outputFileName}`, generatedFileString, 'utf8')
        .then(() => console.log(chalk.bgGreen(chalk.black(`file output: ${chalk.yellow(outputFileName)} happy hunting!`))))
        .catch(err => console.log(chalk.red(err)));
}
async function fileCrawler() {
    const fileCrawlerAnswers = await inquirer.prompt(config_1.autoLabelHuntQuestions);
    const { labelHuntRegExp, drupalDirectoriesToBeCrawled, drupalFilesToConsider } = fileCrawlerAnswers;
    // analyze
    const allMatches = await search_in_file_utils_1.default.autoHuntKeysInDirectories(drupalDirectoriesToBeCrawled, labelHuntRegExp, drupalFilesToConsider);
    search_in_file_utils_1.default.analyzeMatches(allMatches);
    // generate master translations json file
    const i18MasterEntries = search_in_file_utils_1.default.autoDetectToMasterFormatting(allMatches);
    writeFile(`output-files/${config_1.generatedFiles.masterTranslationFileName}`, JSON.stringify(i18MasterEntries, null, 2), 'utf8')
        .then(() => console.log(chalk.bgGreen(chalk.black(`file output: ${chalk.yellow(config_1.generatedFiles.masterTranslationFileName)}`))))
        .catch(err => console.log(chalk.red(err)));
}
/* BASIC UTILS */
// clear output folder
async function clearOutput() {
    const outputFiles = await readdir('output-files/');
    // delete all promise
    return Promise.all(outputFiles.map(outFile => {
        return unlink(`output-files/${outFile}`);
    }));
}
// launch
init();
