const fs = require('fs');

(async () => {
    let file = await fs.readFileSync('../db/name_files.txt').toString().split(',');
    const expression = "(?:(((?:^[0-9]+)[uUSsi])|^bct)(?:[0-9]+)|(?:^[0-9]+))[\\s]?(.log)";
    const regex = new RegExp(expression);
    let fileFiltered = await file.filter(nameFile => nameFile.match(regex) !== null);
    console.log(fileFiltered);
    await fs.writeFileSync('../db/outputFile.txt',fileFiltered);
})();