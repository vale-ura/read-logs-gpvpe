const express = require('express');
require('dotenv/config');
const fs = require('fs');
const app = express();
const ejs = require('ejs');
const { consolidateDataAndCreateDataStruct } = require('../common/consolidation')
const reportController = require('./reportController');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', `${process.cwd()}\\view`);
app.engine('html', ejs.renderFile);

console.log(app.get('views'));
console.log(`${process.env.DB_EXTRACTED_SERVER}`);

app.get('/db', async (req, res) => {
    const dbParsed = await consolidateDataAndCreateDataStruct(`${process.env.DB_EXTRACTED_SERVER}`, `${process.env.DB_NAMES}`);
    res.status(200).send(dbParsed);
});

app.use('/report', reportController);

app.get('/', async (req, res) => {
    res.render('index.html');
})

app.listen(process.env.PORT);
