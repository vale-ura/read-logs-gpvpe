/* 
 The Program get directory, interate inside the all .log files (number names) and extract the information 
 with the params.
 
 Params accepted by program:
 @ The date of considered registers
 @ The name of the elements accepted

*/

const Papa = require('papaparse');
const fs = require('fs');
const CODIFICATION = "utf8";

const INITIAL_DATE = new Date('01/01/19').getTime();
const FINAL_DATE = Date.now();
const ACCEPTED_VALUE_COLUMNS = [
    'VISIT'
];
const FILE_LOGS = 'logs'

main();

/* 

Default DTO

{
initialDate,
finalDate,
ACCEPTED_VALUE_COLUMNS,
pathDirectory
}

*/

function main() {

    let dto = {
        initialDate: INITIAL_DATE,
        finalDate: FINAL_DATE,
        ACCEPTED_VALUE_COLUMNS,
        pathDirectory: FILE_LOGS
    }

    Promise.resolve(dto)
        .then(readSyncDirectory)

}

async function readSyncDirectory(param) {
    return param;
}

async function readSyncFile({ logFile, CODIFICATION }) {
    const bigFile = await fs.readFileSync(logFile, `${CODIFICATION}`);
    return { csvString: bigFile };
}

async function parseCsvString({ csvString }) {
    const result = Papa.parse(csvString, {
        worker: false
    });
    return { data: result.data };
}