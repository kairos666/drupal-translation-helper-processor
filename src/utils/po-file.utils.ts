const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
import { PoEntry } from '../config';

/**
 * PO FILES
 */
// read input po file and parse line to array
const readAndParseInputFiles = async(fileName:string, path:string = '') => {
    try { 
        const rawData = await readFileAsync(`${(path) ? path + '/' : ''}${ fileName }`);
        return rawData.toString().split("\n");
    }
    catch(err) { return Object.assign(err); }
}

// filter out unneeded lines and assemble key/values in po files
const formatLines = function(lines:string[]):PoEntry[] {
    // remove all lines that are not related to key nor value
    const lineFilter = line => (String(line).match(/^msgid/) || String(line).match(/^msgstr/));

    // bundle lines together key + value
    const lineBundler = function(lines:string[]):[string, string, boolean][] {
        let bundledLines = [];

        for (let i = 0 ; i <= lines.length - 2 ; i += 2) {
            // key (msgid) values (msgstr) always follow each others
            const keyRegExp = /^msgid "(.+)"/g;
            const valueRegExp = /^msgstr "(.+)"/g;
            const capturedKey = keyRegExp.exec(lines[i]);
            const capturedValue = valueRegExp.exec(lines[i+1]);
            const key:string|false = (capturedKey && capturedKey.length > 0) ? capturedKey[1] : false;
            const value:string|false = (capturedValue && capturedValue.length > 0) ? capturedValue[1] : false;
            if(key && value) {
                // translated key case
                bundledLines.push([key, value, true]);
            } else if(key && !value) {
                // untranslated key case
                bundledLines.push([key, '', false]);
            } else {
                // invalid key do nothing
            }
        }

        return bundledLines;
    };

    // loop and combine values
    return lineBundler(lines.filter(lineFilter)).map(bundle => { 
        return { key: bundle[0], value: bundle[1], isTranslated: bundle[2] };
    });
}

const getPoKeyValues = async function(fileName:string):Promise<PoEntry[]> {
    return readAndParseInputFiles(fileName, 'input-files').then(data => {
        return formatLines(data);
    })
}

const generatePoFile = function(culture:string, entries:PoEntry[], untranslatedFormater:(entry:PoEntry)=>string, translatedFormater:(entry:PoEntry)=>string):string {
    const filePrefix:string = 
    `# ${ culture } mock translation - for missing translation hunting
#
#
msgid ""
msgstr ""
"POT-Creation-Date: 2018-12-18 14:00+0000"
"PO-Revision-Date: ${ new Date().toISOString() }"
"Language-Team: ${ culture }"
"MIME-Version: 1.0"
"Content-Type: text/plain; charset=utf-8"
"Content-Transfer-Encoding: 8bit"
"Plural-Forms: nplurals=2; plural=(n>1);"`;

    // format translation entries
    const tradPoEntries = [];
    entries.forEach(entry => {
        if(entry.isTranslated) {
            // known key
            tradPoEntries.push(`msgid "${entry.key}"`, `msgstr "${translatedFormater(entry)}"`);
        } else {
            // key to be hunted
            tradPoEntries.push(`msgid "${entry.key}"`, `msgstr "${untranslatedFormater(entry)}"`);
        }
    });

    return `${filePrefix}\n\n${ tradPoEntries.join('\n') }`;
}

export default {
    getPoKeyValues,
    generatePoFile
}