"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const figlet = require('figlet');
const chalk = require('chalk');
const inquirer = require('inquirer');
const clui = require('clui');
const readdirp = require('readdirp');
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
            await labelHuntLanguageGenerator();
            break;
        case config_1.inquirerChoices.mainActions[1]:
            await fileCrawler();
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
    const pattern = /[ >]t\( *'(.+)' *\)/g; // will match & capture either ' t('<capture>')', '>t('<capture>')' with any number of spaces between parameter quotes 
    const fileFilter = ['*.twig', '*.po', '*.php', '*.theme'];
    // const directoryFilter = ['modules', 'custom', 'themes'];
    const fileMatchesPromises = [];
    const rootPath = path.resolve(process.cwd(), 'C://_data/B&B/sourcehub/bnb-bo/drupal/web/modules/custom');
    // find all files and extract matching regexp
    readdirp(rootPath, { fileFilter, type: 'files', depth: 15, alwaysStat: false })
        .on('data', entry => {
        fileMatchesPromises.push(search_in_file_utils_1.default.searchInEntry(entry, pattern));
    })
        .on('end', () => {
        console.log(chalk.yellow(`${fileMatchesPromises.length} files found`));
        // wait for all files to be checked for matches
        Promise.all(fileMatchesPromises)
            .then(rawFileMatches => rawFileMatches.filter(fileMatch => fileMatch.fileMatches.length > 0))
            .then(fileMatches => {
            // final matches array
            fileMatches.map(fileMatch => {
                fileMatch.fileMatches.forEach(lineMatches => {
                    console.log(lineMatches);
                });
            });
        })
            .catch(err => { console.log(chalk.red('error processing files for matches'), err); });
    })
        .on('error', err => console.error('fatal error', err))
        .on('warn', err => console.warn('non-fatal error', err));
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
