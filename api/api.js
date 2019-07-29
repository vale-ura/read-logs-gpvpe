const express = require('express');
const fs = require('fs');
const app = express();
const ejs = require('ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use(express.static(__dirname + '/view'));
app.set('views', __dirname + '/../view');
app.engine('html', ejs.renderFile);

app.get('/db', async (req, res) => {
    let rawdata = await fs.readFileSync('db/db.json');
    let dbParsed = JSON.parse(rawdata);
    res.status(200).send(dbParsed)
});

app.get('/', async (req, res) => {
    res.render('index.html')
})

app.listen(3000);
