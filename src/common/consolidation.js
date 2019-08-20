const { objectValuesAndFlat } = require('../util/object');
const fs = require('fs');

async function consolidateDataAndCreateDataStruct(dbExtractServer, dbNames) {
    const dbExtractServerParsed = await readAndParse(dbExtractServer);
    const dbNamesParsed = await readAndParse(dbNames);
    return await onCreateDataStruct(dbExtractServerParsed, dbNamesParsed);
}

/**
 * Consiladtion data from data struct
 * @param  {...any} db local databases names and content extracted server
 */
async function onCreateDataStruct(...db) {
    const [dbExtractServer, dbNames] = db;
    // console.log(dbNames);
    const allUsersData = objectValuesAndFlat(dbExtractServer);
    const allPages = objectValuesAndFlat(dbNames);

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
    });
}

async function getDbNamesParsed() {
    return await readAndParse(`${process.env.DB_NAMES}`);
}

async function getDbDataParsed() {
    return await readAndParse(`${process.env.DB_EXTRACTED_SERVER}`);
}

async function readAndParse(file) {
    const rawdata = await fs.readFileSync(file);
    return JSON.parse(rawdata);
}

module.exports = {
    consolidateDataAndCreateDataStruct,
    getDbNamesParsed,
    getDbDataParsed
}