"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readdirp = require('readdirp');
const clui = require('clui');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const searchInEntry = async function (entry, pattern) {
    let fileLines;
    // read file and separate it line by line
    try {
        const rawData = await readFileAsync(entry.fullPath);
        fileLines = rawData.toString().split("\n");
    }
    catch (err) {
        console.error(err);
        return null;
    }
    // match to pattern
    const lineMatches = fileLines.map((line, index) => {
        const patternMatches = pattern.exec(line);
        // remove first array element to keep only captured strings
        if (Array.isArray(patternMatches) && patternMatches.length > 1) {
            patternMatches.shift();
            delete patternMatches.index;
            delete patternMatches.input;
            if (patternMatches.length > 1)
                console.log(patternMatches);
        }
        return {
            matches: patternMatches,
            line: line,
            lineNumber: index + 1
        };
    }).filter(processedLine => (processedLine !== null && processedLine.matches !== null));
    return Object.assign({ lineMatches }, entry);
};
const autoHuntKeysInDirectories = async function (directoryAbsolutePath, pattern, fileFilter) {
    const spinner = new clui.Spinner('hunting translation keys...', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
    spinner.start();
    const allRootMatches = directoryAbsolutePath.map(root => {
        const rootPath = path.resolve(process.cwd(), root);
        const fileMatchesPromises = [];
        // stats
        let analyzedFilesCount;
        // promisify stream to promise until end of stream resolution
        return new Promise((resolve, reject) => {
            readdirp(rootPath, { fileFilter, type: 'files', depth: 15, alwaysStat: false })
                .on('data', entry => {
                fileMatchesPromises.push(searchInEntry(entry, pattern));
            })
                .on('end', () => {
                // /!\ root crawling for files is resolved but not file analyzing
                analyzedFilesCount = fileMatchesPromises.length;
                // wait for all files to be checked for matches
                Promise.all(fileMatchesPromises)
                    .then(rawFileMatches => rawFileMatches.filter(fileMatch => fileMatch.lineMatches.length > 0))
                    .then(fileMatches => {
                    // final matches array for this root
                    console.log(chalk.yellow(`${analyzedFilesCount} files analyzed in root ${root}`));
                    resolve(fileMatches);
                })
                    .catch(err => { console.log(chalk.red('error processing files for matches'), err); });
            })
                .on('error', err => reject(err))
                .on('warn', err => reject(err));
        });
    });
    return Promise.all(allRootMatches).then(allRootMatchesResolved => {
        spinner.stop();
        return allRootMatchesResolved.reduce((a, b) => a.concat(b), []);
    });
};
const analyzeMatches = function (src) {
    console.log('\n');
    const totalFoundKeyCount = src.reduce((a, b) => {
        // all files --> lines
        return a + b.lineMatches.reduce((c, d) => {
            // lines --> matches per line
            return c + d.matches.length;
        }, 0);
    }, 0);
    const totalFilesWithMatchCount = src.length;
    // matches distrbution per file
    src.forEach(fileMatch => {
        const fileMatchCount = fileMatch.lineMatches.reduce((c, d) => {
            // lines --> matches per line
            return c + d.matches.length;
        }, 0);
        console.log(chalk.gray(`${chalk.green(fileMatchCount)} keys detected in ${chalk.blue(fileMatch.basename)} file`));
    });
    console.log(chalk.bold(`${chalk.green(totalFoundKeyCount)} total keys detected in ${chalk.yellow(totalFilesWithMatchCount)} files`));
    // duplicate vs unique keys
    const allDetectedKeys = src
        .map(fileMatch => fileMatch.lineMatches).reduce((a, b) => [...a, ...b], [])
        .map(lineMatch => lineMatch.matches).reduce((a, b) => [...a, ...b], []);
    const uniqueDetectedKeys = [...new Set(allDetectedKeys)];
    console.log('\n');
    console.log(clui.Gauge(uniqueDetectedKeys.length, allDetectedKeys.length, 40, allDetectedKeys.length, chalk.white(`${Math.round(100 * uniqueDetectedKeys.length / allDetectedKeys.length)}% unique keys in all detected key occurrences (${uniqueDetectedKeys.length}/${allDetectedKeys.length})`)));
};
const autoDetectToMasterFormatting = function (src) {
    // explode matches, 1 entry per match
    const explodedDetectedKeys = src
        .reduce((accumulatorFileMatches, fileMatch) => {
        // get all detected lines --> keys
        const lines = fileMatch.lineMatches.reduce((accumulatorLineMatches, lineMatch) => {
            accumulatorLineMatches.push(...lineMatch.matches.map(key => {
                return {
                    key,
                    fileMatch,
                    lineNumber: lineMatch.lineNumber
                };
            }));
            return accumulatorLineMatches;
        }, []);
        accumulatorFileMatches.push(...lines);
        return accumulatorFileMatches;
    }, []);
    // unique key entries
    const uniqueDetectedKeys = [...new Set(explodedDetectedKeys.map(item => item.key))];
    // sort keys alphabetically
    const uniqueDetectedKeysSorted = uniqueDetectedKeys.sort();
    // create master entries & register all occurrences
    const masterEntries = uniqueDetectedKeysSorted.map(uniqueKey => {
        // build occurences array
        const occurrences = explodedDetectedKeys
            .filter(item => (item.key == uniqueKey))
            .map(occurrence => {
            return {
                file: occurrence.fileMatch.basename,
                path: occurrence.fileMatch.path,
                lineNumber: occurrence.lineNumber
            };
        });
        return {
            key: uniqueKey,
            uiKey: null,
            occurrences,
            translations: {} // auto detect do not handle translations
        };
    });
    return masterEntries;
};
exports.default = {
    autoHuntKeysInDirectories,
    analyzeMatches,
    autoDetectToMasterFormatting
};
