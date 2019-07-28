/**
 * The Program get directory, interate inside the all .log files (number names) and extract the information 
 * with the params.
 * 
 * Params accepted by program:
 * @ The date of considered registers
 * @ The name of the elements accepted
 * 
 */

const Papa = require('papaparse');
const fs = require('fs');
require('colors');
const voca = require('voca');
const FileSync = require('lowdb/adapters/FileSync')
const low = require('lowdb')

const CODIFICATION = "utf8";
const INITIAL_DATE = new Date('01/01/19').getTime();
const FINAL_DATE = Date.now();
const ACCEPTED_VALUE_COLUMNS = [
    'VISIT'
];
const FILE_LOGS = 'logs';
const PATH_LOCAL_DB = "db/db.json";

main();

/* 

fileMatch: {
            initialDate,
            finalDate,
            ACCEPTED_VALUE_COLUMNS,
        },
        pathDirectory,
        nameFilesExtracted,
        CODIFICATION

*/

async function main() {

    const connectionLocalDB = await connectToLocalDB(PATH_LOCAL_DB);

    let dto = {
        fileMatch: {
            initialDate: INITIAL_DATE,
            finalDate: FINAL_DATE,
            ACCEPTED_VALUE_COLUMNS,
        },
        pathDirectory: FILE_LOGS,
        nameFilesExtracted: null,
        CODIFICATION,
        connectionLocalDB: connectionLocalDB,
        pathLocalDB: PATH_LOCAL_DB
    }

    console.log('Initiated the script'.white.bgGreen);

    Promise.resolve(dto)
        .then(readSyncDirectory)
        .then(filterFilesNames)
        .then(extractInfoAccordingDTO)
}

async function readSyncDirectory(params) {

    console.log(`Reading the directory ${params.pathDirectory}`.bgGreen.black);
    let dir = [];
    try {
        // Verify the options in future
        dir = await fs.readdirSync(params.pathDirectory);
    } catch (error) {
        console.error(`Error reading directory ${params.pathDirectory}`.bgRed.black);
        throw error;
    }

    params.nameFilesExtracted = dir;
    return params;
}

async function filterFilesNames(params) {
    console.log(`Filtering the files inside directory`.bgGreen.black)
    params.nameFilesExtracted = await params.nameFilesExtracted.filter(nameFile => {
        console.log(`Checking file: ${nameFile}`.bgBlue.black);
        const nameFileWithoutDotLog = voca.trim(voca.replace(nameFile, ".log", ""));
        return voca.isNumeric(nameFileWithoutDotLog);
    });
    console.log(`Filtered files: ${params.nameFilesExtracted}`.bgGreen.black);

    return params;
}

async function extractInfoAccordingDTO(params) {
    console.log(`Interacting inside all files and Extract information that match the File Match`.bgBlue.bgBlack);

    params.nameFilesExtracted.forEach(async nameFile => {
        try {
            console.log(`Reading the file: ${nameFile}`.bgBlue.black);
            const csvContent = await readSyncFile(params, nameFile);
            const resultParsedtContent = await parseCsvContent(csvContent);
            const filteredContent = await filterParsedContent(resultParsedtContent.data, params);
            persistRowInLocalDB(params, filteredContent);

        } catch (error) {
            console.log(`Error extracting information of the file: ${nameFile}`.bgRed.black);
            throw error;
        }
    })

    return params;
}

async function readSyncFile(params, nameFile) {
    let csvContent = "";
    try {
        csvContent = await fs.readFileSync(`${params.pathDirectory}/${nameFile}`, `${CODIFICATION}`);
    } catch (error) {
        console.error(`Error on read inside de file: ${nameFile}`.bgRed.black);
        throw error;
    }
    return csvContent;
}

async function parseCsvContent(csvContent) {
    const result = await Papa.parse(csvContent, {
        worker: false,
        skipEmptyLines: true
    });
    return result;
}

/**
 * The method filters all lines of a file for lines that match the parameters that were defined in this script.
 * @param {*} parsedContent The csv content file in matrix format
 * @param {*} params The main DTO of the application
 */
async function filterParsedContent(parsedContent, params) {
    const filteredParsedContent = await parsedContent.filter(line => {
        const [date, typeOfTransaction] = line; // Extracts the first two columns that match the date and transaction type of the row
        const timeStampCurrentDate = new Date(date).getTime();
        const currentTypeOfTransaction = voca.upperCase(voca.trim(typeOfTransaction));

        // Compare the initial Date, final Date with the date of the current line
        // Check if the type of transation has includes in ACCEPTED VALUE COLUMNS defined in the params of the script
        return ((timeStampCurrentDate >= params.fileMatch.initialDate
            && timeStampCurrentDate <= params.fileMatch.finalDate) && params.fileMatch.ACCEPTED_VALUE_COLUMNS.includes(currentTypeOfTransaction));
    })

    return filteredParsedContent;

}

async function persistRowInLocalDB(params, filterdContent) {
    let [row] = filterdContent;
    let [, , user] = row;
    console.log(`Writing user ${user} async in file`.bgGreen.black, `${params.pathLocalDB}`.bgRed.black);
    try {
        await params.connectionLocalDB.set(`${user}`, filterdContent)
            .write()
    } catch (error) {
        console.error(`Error Writing the user ${user}`.bgRed.black);
        throw error;
    }
}

async function connectToLocalDB(pathFile) {
    const adapterFileSync = initiatedFileSync(pathFile);
    return await low(adapterFileSync);
}

function initiatedFileSync(pathFile) {
    return new FileSync(pathFile);
}