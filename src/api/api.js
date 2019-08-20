const express = require('express');
const fs = require('fs');
const app = express();
const ejs = require('ejs');
const report = require('./report');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_EXTRACTED_SERVER = 'db/db.json';
const DB_NAMES = 'db/dbNames.json';
const OUTPUT_REPORT = 'output-files/pages.xlsx';

app.set('views', `${process.cwd()}\\view`);
app.engine('html', ejs.renderFile);

console.log(app.get('views'));


app.get('/db', async (req, res) => {
    const dbParsed = await consolidateDataAndCreateDataStruct(DB_EXTRACTED_SERVER, DB_NAMES);
    res.status(200).send(dbParsed);
});

app.get('/report', async (req, res) => {
    const dbParsed = await consolidateDataAndCreateDataStruct(DB_EXTRACTED_SERVER, DB_NAMES);
    const report = await onGenerateReport(dbParsed);
    res.sendFile(report, {root: process.cwd()});
})

app.get('/', async (req, res) => {
    res.render('index.html')
})

async function onGenerateReport(dbParsed) {
    const header = ['Codigo da Tela', 'Nome da tela', 'Quantidade de acessos']; //'User'
    const reportContentStruct = [];
    dbParsed.forEach((log, index) => {
        createDataStructToReportSupport({ struct: reportContentStruct, data: log.transaction, position: 0, index });
        createDataStructToReportSupport({ struct: reportContentStruct, data: log.Description, position: 1, index });
        createDataStructToReportSupport({ struct: reportContentStruct, data: log.counter, position: 2, index });
        //createDataStructToReportSupport({ struct: reportContentStruct, data: log.user, position: 3, index });
    });

    console.log(reportContentStruct);

    await report.generateReport({ header, content: reportContentStruct, sheet: "Pages report of the Gpv pelletizing", outputFile: OUTPUT_REPORT});
    return OUTPUT_REPORT;
}

async function consolidateDataAndCreateDataStruct(dbExtractServer, dbNames) {
    const dbExtractServerParsed = await readAndParse(dbExtractServer);
    const dbNamesParsed = await readAndParse(dbNames);
    return await onCreateDataStruct(dbExtractServerParsed, dbNamesParsed);
}

/**
 * {struct, data, position, index}
 * 
 * @param {*} {struct, data, position, index} 
 */
function createDataStructToReportSupport(params) {
    const { struct, data, position, index } = params;
    if (!struct[position]) struct[position] = [];
    struct[position][index] = data;
}

/**
 * Consiladtion data from data struct
 * @param  {...any} db local databases names and content extracted server
 */
async function onCreateDataStruct(...db) {
    const [dbExtractServer, dbNames] = db;
    // console.log(dbNames);
    const allUsersData = [];
    const allPages = [];


    Object.keys(dbExtractServer).map(Key => dbExtractServer[Key]).forEach((valueOfExtractedObject) => {
        allUsersData.push(...valueOfExtractedObject);

    });
    Object.keys(dbNames).map(Key => dbNames[Key]).forEach((valueOfExtractedObject) => {
        allPages.push(...valueOfExtractedObject);
    })
    // Construction map.set(key,value);
    let map = new Map();
    allUsersData.forEach(log => {
        log.transaction = log.transaction.trim();
        const hasInMap = map.has(log.transaction); //hasInMap
        let actualLog = undefined;
        if (hasInMap) { //exist in map
            actualLog = map.get(log.transaction);
            actualLog.counter = Number(actualLog.counter) + Number(log.counter);
        }
        if (!(log.transaction !== "" && log.transaction !== undefined)) return;
        map.set(log.transaction, actualLog ? actualLog : log);

    })

    allPages.forEach(page => {
        let correspondingLog = map.get(page.Code);
        if (!correspondingLog) return;
        correspondingLog.Description = page.Description;
    })

    let arayUnique = Array.from(map.values());

    return arayUnique.sort((previous, next) => {
        if (previous.counter > next.counter) {
            return -1;
        }
        if (previous.counter < next.counter) {
            return 1;
        } else
            return 0;
    })
}

async function readAndParse(file) {
    const rawdata = await fs.readFileSync(file);
    return JSON.parse(rawdata);
}

app.listen(3000);
