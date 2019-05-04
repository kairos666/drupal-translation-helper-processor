import { ReadDirPEntry, FileMatch, i18nMasterEntry } from "../config";

const fs            = require('fs');
const path          = require('path');
const chalk         = require('chalk');
const readdirp      = require('readdirp');
const clui          = require('clui');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

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
        const patternMatches = pattern.exec(line as string);
        // remove first array element to keep only captured strings
        if (Array.isArray(patternMatches) && patternMatches.length > 1) {
            patternMatches.shift();
            delete patternMatches.index;
            delete patternMatches.input;

            if(patternMatches.length > 1) console.log(patternMatches);
        }

        return {
            matches: patternMatches, 
            line: line, 
            lineNumber: index + 1
        }
    }).filter(processedLine => (processedLine !== null && processedLine.matches !== null));

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

export default {
    autoHuntKeysInDirectories,
    analyzeMatches,
    autoDetectToMasterFormatting
}