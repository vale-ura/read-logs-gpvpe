const express = require('express');
const { consolidateDataAndCreateDataStruct, getDbNamesParsed, getDbDataParsed } = require('../common/consolidation');
require('dotenv/config');
const { objectValuesAndFlat } = require('../util/object');
const report = require('./report');

const OUTPUT_FILE_ACESS = `${process.env.OUTPUT_REPORTS}/accessPages.xlsx`;
const OUTPUT_FILE_UNUSED = `${process.env.OUTPUT_REPORTS}/unusedPages.xlsx`;
const router = express.Router();

router.get('/access', (async (req, res) => {
    const dbParsed = await consolidateDataAndCreateDataStruct(process.env.DB_EXTRACTED_SERVER, process.env.DB_NAMES);
    const report = await onGenerateReport(dbParsed);
    res.sendFile(report, { root: process.cwd() });
}))

router.get('/unused', (async (req, res) => {
    const allPages = objectValuesAndFlat(await getDbNamesParsed());
    const dataBaseParsed = objectValuesAndFlat(await getDbDataParsed());
    const report = await onGenerateDifferenceBetweenDataBases(allPages, dataBaseParsed);
    res.sendFile(report, { root: process.cwd() });
}))

async function onGenerateReport(dbParsed) {
    const header = ['Codigo da Tela', 'Nome da tela', 'Quantidade de acessos']; //'User'
    const reportContentStruct = [];
    dbParsed.forEach((log, index) => {
        createDataStructToReportSupport({ struct: reportContentStruct, data: log.transaction, position: 0, index });
        createDataStructToReportSupport({ struct: reportContentStruct, data: log.Description, position: 1, index });
        createDataStructToReportSupport({ struct: reportContentStruct, data: log.counter, position: 2, index });
        //createDataStructToReportSupport({ struct: reportContentStruct, data: log.user, position: 3, index });
    });

    await report.generateReport({ header, content: reportContentStruct, sheet: "FY", outputFile: OUTPUT_FILE_ACESS });
    return OUTPUT_FILE_ACESS;
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


async function onGenerateDifferenceBetweenDataBases(...db) {
    const [allPages, dataBaseLogs] = db;

    const header = ['Codigo da Tela', 'Nome da tela']; //'User'
    const reportPagesunused = [];

    allPages.filter(page => {
        return dataBaseLogs.find(log => {
            return (log.transaction.trim() === page.Code.trim())
        }) === undefined;
    }).forEach((page, index) => {
        createDataStructToReportSupport({ struct: reportPagesunused, data: page.Code, position: 0, index });
        createDataStructToReportSupport({ struct: reportPagesunused, data: page.Description, position: 1, index });
    });

    await report.generateReport({ header, content: reportPagesunused, sheet: "Pages unused", outputFile: OUTPUT_FILE_UNUSED });
    return OUTPUT_FILE_UNUSED;
}

module.exports = router;