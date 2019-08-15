const express = require('express');
const fs = require('fs');
const app = express();
const ejs = require('ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_EXTRACTED_SERVER = 'db/db.json';
const DB_NAMES = 'db/dbNames.json';

// app.use(express.static(__dirname + '/view'));
app.set('views', __dirname + '/../view');
app.engine('html', ejs.renderFile);

app.get('/db', async (req, res) => {
    const dbExtractServer = await readAndParse(DB_EXTRACTED_SERVER);
    const dbNames = await readAndParse(DB_NAMES);
    const dbParsed = await onCreateDataStruct(dbExtractServer, dbNames);
    res.status(200).send(dbParsed);
});

app.get('/', async (req, res) => {
    res.render('index.html')
})


/**
 * 
 * @param  {...any} db 
 * @return { 'data': [ {
      "date": "05/12/2015 21:07:14",
      "typeOfTransaction": "VISIT",
      "user": "01495929",
      "transaction": "REL_TUR_UT",
      "counter": 676,
      "name":"sadsad"
    } ] }
 */
async function onCreateDataStruct(...db) {
    const [dbExtractServer, dbNames] = db;
    // console.log(dbNames);
    const allUsersData = [];
    const allPages = [];
    const nameCodePages = []

    Object.keys(dbExtractServer).map(Key => dbExtractServer[Key]).forEach((valueOfExtractedObject) => {
        allUsersData.push(...valueOfExtractedObject);

    });
    Object.keys(dbNames).map(Key => dbNames[Key]).forEach((valueOfExtractedObject) => {
        allPages.push(...valueOfExtractedObject);
    })


    // map.set(key,value);
    let map = new Map();
    allUsersData.forEach(log => {
        const hasInMap = map.has(log.transaction); //hasInMap
        let actualLog = undefined;
        if(hasInMap){ //exist in map
            actualLog = map.get(log.transaction); //
            actualLog.counter = Number(actualLog.counter) + Number(log.counter); // STR + NUMBER NAN
        }
        map.set(log.transaction, actualLog ? actualLog : log);
    
    })
    console.log(map);
    
    
    // console.log(map);
    /*     allUsersData.map(log => {
        const page = allPages.find(page => page.Code.trim() === log.transaction.trim());
        if(!page)return;
        log.Description = page.Description;
        return log;
    }).filter(log => log !== undefined); */
    /* let result = Array.from(map.values());
    fs.writeFileSync('db/pageAcess.txt',result.toString()); */
    return Array.from(map.values());

}


async function readAndParse(file) {
    const rawdata = await fs.readFileSync(file);
    return JSON.parse(rawdata);
}

app.listen(3000);
