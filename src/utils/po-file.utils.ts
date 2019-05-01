const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

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

export default {
    readAndParseInputFiles
}