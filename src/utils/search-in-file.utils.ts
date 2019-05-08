import { ReadDirPEntry, FileMatch, i18nMasterEntry } from "../config";

const fs            = require('fs');
const path          = require('path');
const chalk         = require('chalk');
const readdirp      = require('readdirp');
const clui          = require('clui');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const _             = require('lodash');

// take a string and reply with all captured groups (allow multiple correct matches on a single line)
const multiCapturePatternExec = function(pattern:RegExp, src:string):string[] {
    const allMatches:string[] = [];
    let currentMatch;

    while((currentMatch = pattern.exec(src)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (currentMatch.index === pattern.lastIndex) {
            pattern.lastIndex++;
        }

        // only register the captured group
        allMatches.push(currentMatch[1]);
    }

    return allMatches;
}

const searchInEntry = async function(entry:ReadDirPEntry, pattern:RegExp):Promise<FileMatch> {
    let fileLines;

    // read file and separate it line by line
    try {
        const rawData = await readFileAsync(entry.fullPath);
        fileLines = rawData.toString().split("\n");
    }
    catch(err) { 
        console.error(err);
        return null;
    }

    // match to pattern
    const lineMatches = fileLines.map((line, index) => {
        const patternMatches = multiCapturePatternExec(pattern, line);

        return {
            matches: patternMatches, 
            line: line, 
            lineNumber: index + 1
        }
    }).filter(processedLine => (processedLine !== null && processedLine.matches.length !== 0));

    return Object.assign({ lineMatches }, entry);
}

const autoHuntKeysInDirectories = async function(directoryAbsolutePath:string[], pattern:RegExp, fileFilter:string[]):Promise<FileMatch[]> {
    const spinner = new clui.Spinner('hunting translation keys...', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
    spinner.start();
    const allRootMatches = directoryAbsolutePath.map(root => {
        const rootPath = path.resolve(process.cwd(), root);
        const fileMatchesPromises:Promise<FileMatch>[] = [];

        // stats
        let analyzedFilesCount:number;

        // promisify stream to promise until end of stream resolution
        return new Promise((resolve, reject) => {
            readdirp(rootPath, { fileFilter, type: 'files', depth: 15, alwaysStat: false})
            .on('data', entry => {
                fileMatchesPromises.push(searchInEntry(entry, pattern));
            })
            .on('end', () => { 
                // /!\ root crawling for files is resolved but not file analyzing
                analyzedFilesCount = fileMatchesPromises.length;

                // wait for all files to be checked for matches
                Promise.all(fileMatchesPromises)
                .then(rawFileMatches => rawFileMatches.filter(fileMatch => (fileMatch as FileMatch).lineMatches.length > 0))
                .then(fileMatches => { 
                    // final matches array for this root
                    console.log(chalk.yellow(`${ analyzedFilesCount } files analyzed in root ${ root }`));
                    resolve((fileMatches as FileMatch[]));
                })
                .catch(err => { console.log(chalk.red('error processing files for matches'), err); });
            })
            .on('error', err => reject(err))
            .on('warn', err => reject(err));
        });
    });

    return Promise.all(allRootMatches).then(allRootMatchesResolved => {
        spinner.stop();
        return (allRootMatchesResolved as FileMatch[][]).reduce((a ,b) => a.concat(b), [])
    });
}

const analyzeMatches = function(src:FileMatch[]):void {
    console.log('\n');
    const totalFoundKeyCount:number = src.reduce((a, b) => {
        // all files --> lines
        return a + b.lineMatches.reduce((c, d) => {
            // lines --> matches per line
            return c + d.matches.length;
        }, 0);
    }, 0);
    const totalFilesWithMatchCount:number = src.length;

    // matches distrbution per file
    src.forEach(fileMatch => {
        const fileMatchCount:number = fileMatch.lineMatches.reduce((c, d) => {
            // lines --> matches per line
            return c + d.matches.length;
        }, 0);
        console.log(chalk.gray(`${ chalk.green(fileMatchCount) } keys detected in ${ chalk.blue(fileMatch.basename) } file`));
    });

    console.log(chalk.bold(`${ chalk.green(totalFoundKeyCount) } total keys detected in ${ chalk.yellow(totalFilesWithMatchCount) } files`));

    // duplicate vs unique keys
    const allDetectedKeys:string[] = src
        .map(fileMatch => fileMatch.lineMatches).reduce((a, b) => [...a, ...b], [])
        .map(lineMatch => lineMatch.matches).reduce((a, b) => [...a, ...b], []);
    const uniqueDetectedKeys:string[] = [...new Set(allDetectedKeys)];
    console.log('\n');
    console.log(clui.Gauge(uniqueDetectedKeys.length, allDetectedKeys.length, 40, allDetectedKeys.length, chalk.white(`${Math.round(100 * uniqueDetectedKeys.length/allDetectedKeys.length)}% unique keys in all detected key occurrences (${uniqueDetectedKeys.length}/${allDetectedKeys.length})`)));
}

const autoDetectToMasterFormatting = function(src:FileMatch[]):i18nMasterEntry[] {
    // explode matches, 1 entry per match
    const explodedDetectedKeys:{ key:string, fileMatch:FileMatch, lineNumber:number }[] = src
        .reduce((accumulatorFileMatches, fileMatch) => {
            // get all detected lines --> keys
            const lines = fileMatch.lineMatches.reduce((accumulatorLineMatches, lineMatch) => {
                accumulatorLineMatches.push(...lineMatch.matches.map(key => {
                    return {
                        key,
                        fileMatch,
                        lineNumber: lineMatch.lineNumber
                    }
                }));

                return accumulatorLineMatches;
            }, []);

            accumulatorFileMatches.push(...lines);
            return accumulatorFileMatches;
        }, []);
    
    // unique key entries
    const uniqueDetectedKeys:string[] = [...new Set(explodedDetectedKeys.map(item => item.key))];

    // sort keys alphabetically
    const uniqueDetectedKeysSorted = uniqueDetectedKeys.sort();

    // create master entries & register all occurrences
    const masterEntries:i18nMasterEntry[] = uniqueDetectedKeysSorted.map(uniqueKey => {
        // build occurences array
        const occurrences:{ file:string, path:string, lineNumber:number }[] = explodedDetectedKeys
            .filter(item => (item.key == uniqueKey))
            .map(occurrence => {
                return {
                    file: occurrence.fileMatch.basename,
                    path: occurrence.fileMatch.path,
                    lineNumber: occurrence.lineNumber
                }
            });

        return {
            key: uniqueKey, // english translation (default if no translation available in the targeted language)
            uiKey: null, // auto detect do not handle uiKeys
            occurrences,
            translations: {} // auto detect do not handle translations
        }
    });
    
    return masterEntries;
}

const extractUIKeysMappings = async function(filePath:string):Promise<{ uiKey:string, key:string}[]> {
    // get file string -> extract uiKey map string -> format to lines array -> mapping array
    return readFileAsync(filePath)
        .then(rawData => /\/\/ <START UI KEY TRANSLATABLE MAPPING>([\s\S]*?)\/\/ <END UI KEY TRANSLATABLE MAPPING>/.exec(rawData.toString())[1])
        .then(matchData => matchData.toString().split("\n"))
        .then(linesData => {
            return linesData.map(line => {
                const lineMatch = /.*"(.+?)": ".*t\(\'(.+?)\'\)/.exec(line);

                if(lineMatch !== null && lineMatch[1] && lineMatch[2]) {
                    return {
                        uiKey: lineMatch[1],
                        key: lineMatch[2]
                    }
                }
            })
        })
        .then(formatedDataArray => formatedDataArray.filter(item => (item !== null && item !== undefined)));
}

const mapUIKeysOntoMaster = function(src:{ uiKey:string, key:string}[], master:i18nMasterEntry[]):i18nMasterEntry[] {
    const masterClone:i18nMasterEntry[] = _.cloneDeep(master);
    let uiKeyFoundCounter = 0;
    let uiKeyFoundWithoutMasterMatch:{ uiKey:string, key:string}[] = [];

    src.forEach(uiKeyMap => {
        const masterEntryMatch:i18nMasterEntry = masterClone.find(item => (item.key == uiKeyMap.key));

        if(masterEntryMatch) {
            // update ui key in master entry
            masterEntryMatch.uiKey = uiKeyMap.uiKey;
            uiKeyFoundCounter++;
        } else {
            uiKeyFoundWithoutMasterMatch.push(uiKeyMap);
        }
    });

    const masterEntryTotal = masterClone.length;
    const masterEntryWithUIKeyTotal = masterClone.filter(item => !!item.uiKey).length;

    // report
    console.log('\n');
    console.log(clui.Gauge(masterEntryWithUIKeyTotal, masterEntryTotal, 40, src.length, chalk.white(`${Math.round(100 * masterEntryWithUIKeyTotal/masterEntryTotal)}% keys have a uiKey mapped to (${masterEntryWithUIKeyTotal}/${masterEntryTotal})`)));
    console.log(`${ chalk.green(uiKeyFoundCounter) } uiKey were successfully mapped in master`);
    console.log(`${ (uiKeyFoundWithoutMasterMatch.length > 0) ? chalk.red(uiKeyFoundWithoutMasterMatch.length) : chalk.green(uiKeyFoundWithoutMasterMatch.length) } uiKey found couldn\'t be mapped onto a proper master key (probably new keys that weren't properly translated in PO files yet)`);
    if(uiKeyFoundWithoutMasterMatch.length > 0) uiKeyFoundWithoutMasterMatch.forEach(missingEntry => console.log(chalk.red(`no match in master for entry: uiKey = "${ missingEntry.uiKey }" & key = "${ missingEntry.key }"`)));

    return masterClone;
}

export default {
    autoHuntKeysInDirectories,
    analyzeMatches,
    autoDetectToMasterFormatting,
    extractUIKeysMappings,
    mapUIKeysOntoMaster
}