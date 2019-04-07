const fs = require('fs')
const { promisify } = require('util')
const sketch2json = require('sketch2json')
const readFileAsync = promisify(fs.readFile);
async function readSketchFile(file){
  var fileName;
  var data;
  if (Buffer.isBuffer(file)){
  	data = file;
  } else {
  	fileName = __dirname + '/../..' + file;
  	data = await readFileAsync(fileName);
  }
  return sketch2json(data);
}

module.exports.readSketchFile = readSketchFile;