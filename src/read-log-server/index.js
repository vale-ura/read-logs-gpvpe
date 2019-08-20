const Papa = require('papaparse');
const fs = require('fs');
require('colors');
const voca = require('voca');
const FileSync = require('lowdb/adapters/FileSync')
const low = require('lowdb')

const CODIFICATION = "utf8";
const EXPRESSION_TO_MATCH_NAME_FILES = '(?:(((?:^[0-9]+)[uUSsi])|^bct)(?:[0-9]+)|(?:^[0-9]+))[\\s]?(.log)';
const INITIAL_DATE = newToLocaleString(`${process.argv[3]}`);
const FINAL_DATE = Date.now();
const ACCEPTED_VALUE_COLUMNS = [
    'VISIT'
];
////brvix5valeas222/log
const FILE_LOGS = `${process.argv[2]}`;
const PATH_LOCAL_DB = 'db/db.json';

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

    let connectionLocalDB = {};

    try {
        connectionLocalDB = await connectToLocalDB(PATH_LOCAL_DB);
    } catch (error) {
        console.error(error);
    }


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
        pathLocalDB: PATH_LOCAL_DB,
        EXPRESSION_TO_MATCH_NAME_FILES
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
        console.log(...dir);
    } catch (error) {
        console.error(`Error reading directory ${params.pathDirectory}`.bgRed.black);
        throw error;
    }

    params.nameFilesExtracted = dir;
    return params;
}

async function filterFilesNames(params) {
    console.log(`Filtering the files inside directory`.bgGreen.white)

    const regexToMatchLogFilesUser = new RegExp(params.EXPRESSION_TO_MATCH_NAME_FILES);
    params.nameFilesExtracted = await params.nameFilesExtracted.filter(nameFile => nameFile.match(regexToMatchLogFilesUser) !== null);
    console.log(`Filtered files: ${params.nameFilesExtracted}`.bgGreen.white);

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
            if (filteredContent.length === 0) return;
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
        const timeStampCurrentDate = newToLocaleString(date);
        const currentTypeOfTransaction = voca.upperCase(voca.trim(typeOfTransaction));

        // Compare the initial Date, final Date with the date of the current line
        // Check if the type of transation has includes in ACCEPTED VALUE COLUMNS defined in the params of the script
        return ((timeStampCurrentDate >= params.fileMatch.initialDate
            && timeStampCurrentDate <= params.fileMatch.finalDate) && params.fileMatch.ACCEPTED_VALUE_COLUMNS.includes(currentTypeOfTransaction));
    })

    return filteredParsedContent;

}

async function persistRowInLocalDB(params, filterdContent) {
    let [firstRow] = filterdContent;
    let [, , user] = firstRow;
    console.log(`Writing user ${user} async in file`.bgGreen.black, `${params.pathLocalDB}`.bgRed.black);
    try {
        await params.connectionLocalDB.set(`${user}`, await onCreateDataStruct(params, filterdContent))
            .write()
    } catch (error) {
        console.error(`Error Writing the user ${user}`.bgRed.black);
        throw error;
    }
}
/**
 * 
 * @param {*} params 
 * @param {*} filteredContent read file content
 */
async function onCreateDataStruct(params, filteredContent) {
    const mapperCode = new Map(); //key, value
    const newStructContent = await filteredContent.map(row => {
        const [date, typeOfTransaction, user, transaction] = row;
        if (!existsElementOnMapper(row, mapperCode)) {
            addOnStruct(row, mapperCode);
            return {
                date,
                typeOfTransaction,
                user,
                transaction
            }

        }
    }).filter(row => row !== undefined);

    console.log(newStructContent);

    newStructContent.forEach(row => {
        row.counter = mapperCode.get(row.transaction).counter;
    })

    return newStructContent;
}

function existsElementOnMapper(element, setStruct) {
    const [, , , codeTransaction] = element;
    const codeInStruct = setStruct.get(codeTransaction);
    if (codeInStruct) {
        setStruct.set(codeTransaction, { counter: ++codeInStruct.counter });
        return true;
    } else {
        return codeInStruct !== undefined;
    }
}

function addOnStruct(element, setStruct) {
    const [, , , codeTransaction] = element;
    setStruct.set(codeTransaction, { counter: 1 });
}

async function connectToLocalDB(pathFile) {
    const adapterFileSync = initiatedFileSync(pathFile);
    return await low(adapterFileSync);
}

function initiatedFileSync(pathFile) {
    return new FileSync(pathFile);
}

function newToLocaleString(date) {

    const timeStampDate = new Date(swapDayAndMonth(date)).getTime();
    return timeStampDate;

}

function swapDayAndMonth(date) {
    const dayAndMonth = date.substring(0, date.indexOf('/', 3)); // Extract the {dd/mm} from {dd/mm/yyyy hh:mm:ss}
    const dayInEnUS = dayAndMonth.substring(0, date.indexOf('/')); // Extract the {dd} from {dd/mm}
    const monthInEnUS = dayAndMonth.substring(date.indexOf('/') + 1);

    return `${monthInEnUS}/${dayInEnUS}${date.substring(date.indexOf('/', 3))}`
}