import { ReadDirPEntry, FileMatches } from "../config";

const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const searchInEntry = async function(entry:ReadDirPEntry, pattern:RegExp):Promise<FileMatches> {
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
    const fileMatches = fileLines.map((line, index) => {
        const patternMatches = pattern.exec(line as string);
        // remove first array element to keep only captured strings
        if (Array.isArray(patternMatches) && patternMatches.length > 1) {
            patternMatches.shift();
            delete patternMatches.index;
            delete patternMatches.input;
        }

        return {
            lineMatches: patternMatches, 
            line: line, 
            lineNumber: index + 1
        }
    }).filter(processedLine => (processedLine !== null && processedLine.lineMatches !== null));

    return Object.assign({ fileMatches }, entry);
} 

export default {
    searchInEntry
}