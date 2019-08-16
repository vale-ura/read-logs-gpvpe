const fs = require('fs');
const xl = require('excel4node');

// test
/* (() => {
    let header = ['Codigo da Tela', 'Nome da tela', 'Quantidade de acessos', 'Porcentagem'];
    let content = [['3_CHARS', '8_ORDER', '5_CLIENT', '2_LABTEST'],
    ['Buscador de Características', 'Buscador de Embarques', 'Buscador de Empresas', 'Buscador de Ensaios de Laboratório'],
    ['50', '500', '35', '789'],
    ['22%', '23%', '45%', '66%']];
    let outputFile = "excel.xlsx";
    generateReport({ header, content, sheet: "Pages report of the Gpv pelletizing", outputFile })
})(); */

/**
 * This method is Specific to one Sheet
 * 
 * DTO Description: 
 * {
 *      workbookClass?: Workbook,
 *      workSheet?: WorkSheet
 *      header: Array,
 *      content: Array,
 *      sheet: String,
 *      outputFile: String
 * 
 * }
 * @param {*} params
 */
async function generateReport(params) {

    params.workbookClass = new xl.Workbook();

    Promise.resolve(params)
        .then(createNewSheet)
        .then(createCellHeader)
        .then(createCellContent)
        .then(writeInExcel)
}

async function createNewSheet(params) {
    const { workbookClass } = params;
    params.workSheet = await workbookClass.addWorksheet(params.sheet);
    return Promise.resolve(params);
}

async function createCellHeader(params) {
    const { header } = params;
    for (let index = 1; index < header.length + 1; index++) {
        params.workSheet.cell(1, index)
            .string(header[index - 1]);
    }
    return Promise.resolve(params);
}

//2, 1  //A2
//1, 2 //B1
async function createCellContent(params) {
    const { content } = params;
    for (let i = 1; i < content.length + 1; i++) {
        for (let j = 2; j < content[i - 1].length + 2; j++) {
            params.workSheet.cell(j, i)
                .string(String(content[i - 1][j - 2]));
        }
    }
    return Promise.resolve(params);
}

async function writeInExcel(params) {
    await params.workbookClass.write(params.outputFile);
    return Promise.resolve(params);
}

module.exports = {
    generateReport
}