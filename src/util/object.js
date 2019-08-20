const fs = require('fs');

function objectValuesAndFlat(object) {
    return flatArray(Object.values(object));
}

function flatArray(arr) {
    const newArr = [];
    arr.forEach((value) => {
        if (value instanceof Array) { newArr.push(...value) }
        else { newArr.push(value) }
    });
    return newArr;
}

module.exports = {
    flatArray,
    objectValuesAndFlat
}
