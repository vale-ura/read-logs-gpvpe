const fs = require('fs');
const voca = require('voca');

/* (async () => {
    const files = await fs.readdirSync('//brvix5valeas222/log');
    fs.writeFileSync('../db/name_files.txt',files);
})(); */

(async () => {
    const files = await fs.readFileSync('../db/name_files.txt',{encoding: 'utf8'});
    const filesWithoutSpaces = files.split(',').filter(nameFile => nameFile.trim());
    const replacementResult = await voca.replaceAll(filesWithoutSpaces,',','\n\r');
    fs.writeFileSync('../db/name2_files.txt',replacementResult);
})();