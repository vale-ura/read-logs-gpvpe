const express = require('express');
const fs = require('fs');
const app = express();
const ejs = require('ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_EXTRACTED_SERVER = 'db/db.json';
const DB_NAMES = 'db/dbNames.json';

//app.use(express.static(__dirname + '/view'));
app.set('views', __dirname + '/../view');
app.engine('html', ejs.renderFile);

app.get('/db', async (req, res) => {
    const dbExtractServer = await readAndParse(DB_EXTRACTED_SERVER);
    const dbNames = await readAndParse(DB_NAMES);
    await onCreateDataStruct(dbExtractServer,dbNames)
    res.status(200).send(dbParsed)
});

app.get('/', async (req, res) => {
    res.render('index.html')
})

async function onCreateDataStruct(...db) {
    const [dbExtractServer, dbNames] = db;
    
    console.log(dbExtractServer,dbNames);
}

async function readAndParse(file) {
    const rawdata = await fs.readFileSync(file);
    return JSON.parse(rawdata);
}

app.listen(3000);
