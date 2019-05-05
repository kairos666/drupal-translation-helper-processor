"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const chalk = require('chalk');
const clui = require('clui');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const _ = require('lodash');
/**
 * PO FILES
 */
// filter out unneeded lines and assemble key/values in po files
const formatLines = function (lines) {
    // remove all lines that are not related to key nor value
    const lineFilter = line => (String(line).match(/^msgid/) || String(line).match(/^msgstr/));
    // bundle lines together key + value
    const lineBundler = function (lines) {
        let bundledLines = [];
        for (let i = 0; i <= lines.length - 2; i += 2) {
            // key (msgid) values (msgstr) always follow each others
            const keyRegExp = /^msgid "(.+)"/g;
            const valueRegExp = /^msgstr "(.+)"/g;
            const capturedKey = keyRegExp.exec(lines[i]);
            const capturedValue = valueRegExp.exec(lines[i + 1]);
            const key = (capturedKey && capturedKey.length > 0) ? capturedKey[1] : false;
            const value = (capturedValue && capturedValue.length > 0) ? capturedValue[1] : false;
            if (key && value) {
                // translated key case
                bundledLines.push([key, value, true]);
            }
            else if (key && !value) {
                // untranslated key case
                bundledLines.push([key, '', false]);
            }
            else {
                // invalid key do nothing
            }
        }
        return bundledLines;
    };
    // loop and combine values
    return lineBundler(lines.filter(lineFilter)).map(bundle => {
        return { key: bundle[0], value: bundle[1], isTranslated: bundle[2] };
    });
};
const getPoKeyValues = async function (filePath) {
    return readFileAsync(filePath)
        .then(rawData => rawData.toString().split("\n"))
        .then(data => formatLines(data));
};
const analyzePoKeyValues = function (src) {
    const totalEntries = src.length;
    const totalTranslatedEntries = src.filter(entry => entry.isTranslated).length;
    const duplicatesKeyCount = totalEntries - [...new Set(src.map(entry => entry.key))].length;
    const duplicatesValuesCount = totalEntries - [...new Set(src.map(entry => entry.value))].length;
    console.log('\n');
    console.log(clui.Gauge(totalTranslatedEntries, totalEntries, 40, totalEntries, chalk.white(`${Math.round(100 * totalTranslatedEntries / totalEntries)}% translated keys in all PO file key occurrences (${totalTranslatedEntries}/${totalEntries})`)));
    console.log(`${(duplicatesKeyCount > 0) ? chalk.red(duplicatesKeyCount) : chalk.green(duplicatesKeyCount)} keys duplicates in PO file (duplicates should be removed)`);
    console.log(`${(duplicatesValuesCount > 0) ? chalk.yellow(duplicatesValuesCount) : chalk.green(duplicatesValuesCount)} translations duplicates in PO file (consider use cases to decide to merge or not)`);
};
const mapPoKeysOntoMaster = function (src, master, culture) {
    const masterClone = _.cloneDeep(master);
    const orphanKeys = []; // exist in PO file but not in master (unused translations)
    const onlyTranslatedKeys = src.filter(entry => entry.isTranslated);
    onlyTranslatedKeys.forEach(entry => {
        // find relevant master entry and modify accordingly
        const matchingMasterEntry = masterClone.find(mEntry => (mEntry.key == entry.key));
        if (matchingMasterEntry) {
            // if match found update master entry
            matchingMasterEntry.translations[culture.toLowerCase()] = entry.value;
        }
        else {
            // if not found add into orphans
            orphanKeys.push(entry);
        }
    });
    // analyse processing impact
    const orphanMasterKeys = masterClone.filter(mEntry => (mEntry.translations[culture.toLowerCase()] !== undefined)); // exist in master but not in PO file (missing translation)
    const unusedTranslationCount = orphanKeys.length;
    const untranslatedCount = orphanMasterKeys.length;
    const translatedCount = masterClone.length - untranslatedCount;
    console.log('\n');
    console.log(clui.Gauge(translatedCount, masterClone.length, 40, masterClone.length, chalk.white(`${Math.round(100 * translatedCount / masterClone.length)}% translated keys in all master key occurrences (${translatedCount}/${masterClone.length})`)));
    console.log(`${(untranslatedCount > 0) ? chalk.red(untranslatedCount) : chalk.green(untranslatedCount)} untranslated keys in master`);
    console.log(`${(unusedTranslationCount > 0) ? chalk.yellow(unusedTranslationCount) : chalk.green(unusedTranslationCount)} unused translations in master (maybe need for clean up or some keys are missing in the master)`);
    return masterClone;
};
const generatePoFile = function (culture, entries) {
    const filePrefix = `# ${culture.toUpperCase()} translation - generated automatically with https://github.com/kairos666/drupal-translation-helper-processor
#
#
msgid ""
msgstr ""
"POT-Creation-Date: 2018-12-18 14:00+0000"
"PO-Revision-Date: ${new Date().toISOString()}"
"Language-Team: ${culture.toUpperCase()}"
"MIME-Version: 1.0"
"Content-Type: text/plain; charset=utf-8"
"Content-Transfer-Encoding: 8bit"
"Plural-Forms: nplurals=2; plural=(n>1);"`;
    // format translation entries
    const knownTradPoEntries = [];
    const unknownTradPoEntries = [];
    entries.forEach(entry => {
        const i18nValue = entry.translations[culture.toLowerCase()] || '';
        if (i18nValue) {
            // known translation
            knownTradPoEntries.push(`msgid "${entry.key}"`, `msgstr "${i18nValue}"`);
        }
        else {
            unknownTradPoEntries.push(`msgid "${entry.key}"`, `msgstr "${i18nValue}"`);
        }
    });
    // report
    // /!\ all po arrays are doubled
    const knownTradCount = knownTradPoEntries.length / 2;
    const unknownTradCount = unknownTradPoEntries.length / 2;
    console.log('\n');
    console.log(clui.Gauge(knownTradCount, entries.length, 40, entries.length, chalk.white(`${Math.round(100 * knownTradCount / entries.length)}% translated keys  in ${culture} language (${knownTradCount}/${entries.length})`)));
    console.log(`${(unknownTradCount > 0) ? chalk.red(unknownTradCount) : chalk.green(unknownTradCount)} untranslated keys in ${culture} language`);
    return `${filePrefix}\n\n${knownTradPoEntries.join('\n')}\n\n${unknownTradPoEntries.join('\n')}`;
};
const generateMockPoFile = function (culture, entries, untranslatedFormater, translatedFormater) {
    const filePrefix = `# ${culture} mock translation - for missing translation hunting
#
#
msgid ""
msgstr ""
"POT-Creation-Date: 2018-12-18 14:00+0000"
"PO-Revision-Date: ${new Date().toISOString()}"
"Language-Team: ${culture}"
"MIME-Version: 1.0"
"Content-Type: text/plain; charset=utf-8"
"Content-Transfer-Encoding: 8bit"
"Plural-Forms: nplurals=2; plural=(n>1);"`;
    // format translation entries
    const tradPoEntries = [];
    entries.forEach(entry => {
        if (entry.isTranslated) {
            // known key
            tradPoEntries.push(`msgid "${entry.key}"`, `msgstr "${translatedFormater(entry)}"`);
        }
        else {
            // key to be hunted
            tradPoEntries.push(`msgid "${entry.key}"`, `msgstr "${untranslatedFormater(entry)}"`);
        }
    });
    return `${filePrefix}\n\n${tradPoEntries.join('\n')}`;
};
exports.default = {
    getPoKeyValues,
    analyzePoKeyValues,
    mapPoKeysOntoMaster,
    generatePoFile,
    generateMockPoFile
};
