"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
/**
 * PO FILES
 */
// read input po file and parse line to array
const readAndParseInputFiles = async (fileName, path = '') => {
    try {
        const rawData = await readFileAsync(`${(path) ? path + '/' : ''}${fileName}`);
        return rawData.toString().split("\n");
    }
    catch (err) {
        return Object.assign(err);
    }
};
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
const getPoKeyValues = async function (fileName) {
    return readAndParseInputFiles(fileName, 'input-files').then(data => {
        return formatLines(data);
    });
};
exports.default = {
    getPoKeyValues
};
