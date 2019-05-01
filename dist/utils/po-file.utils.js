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
exports.default = {
    readAndParseInputFiles
};
