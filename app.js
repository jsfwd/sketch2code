/**
 * Generate code from a Sketch file
 *
 */

const express = require('express')
const fs = require('fs')
const { promisify } = require('util')
const pug = require('pug')
const sketch2json = require('sketch2json')
const pretty = require('pretty')
const app = express()
const open = require('open')
const program = require('commander')
const multer = require('multer')

// load sketch file reading function
const readSketch = require(__dirname + '/src/app/read-sketch-file.js')

// TODO: refactor map objects into Maps
// load symbol scraper function
const scrapeFile = require(__dirname + '/src/app/symbol-gen.js')

// contains a map of subcomponent IDs mapped to their path
var symbolToStringMap = require(__dirname + '/src/app/symbol-id-to-string.js').symbolToStringMap;

// contains maps of all sketch library symbols mapped to their json ids
var mapIdToTemplateFiles = require(__dirname + '/src/app/sketch-map-json-to-symbol.js').mapIdToTemplateFiles;

// set the default sketch file
var sketchFile = '/src/sketch/sample.sketch';

var sketchData;
var outputFileName;
var templateName;
var pageTitle;
var outputHTML;

// set up terminal commands
program
  .option('--scrape', 'Scrape Sketch file for new symbols')
  .option('--sandbox', 'Open an editable sandbox');
program.on('--help', function(){
  console.log('After your options, you can either drag a Sketch file into the terminal or copy the path in to specify the file to be used.')
});
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
program.parse(process.argv);

// set up file uploader
const upload = multer();
const type = upload.single('file');

// create global to disable sandbox message on subsequent loads
var firstSandboxLoad = true;

// endpoint where the sketch code will be previewed
var endpoint = '/preview';

// read Sketch file if specified
if (program.args[0] !== undefined) {
  if (program.args[0].includes('.sketch')){
    sketchFile = program.args[0];
  }
}
var sketchFileName = sketchFile.substring(sketchFile.lastIndexOf('/')+1, sketchFile.indexOf('.sketch')) + '.html';

async function startServer(){
  sketchData = await readSketch.readSketchFile(sketchFile);
  if (program.scrape) {
    newData = scrapeFile.scrapeSymbols(sketchData);
    symbolToStringMap = newData.symbolToStringMap;
    mapIdToTemplateFiles = newData.mapIdToTemplateFiles;
  }
  createHTML();
}
startServer();

// set public folder for static files
app.use(express.static('public'));

// set views directory
app.set('views', 'src/views/');

// set the public viewing directory for images
app.locals.basedir = '/public';

// set templating engine to 'pug'
app.set('view engine', 'pug');

function createHTML() {

  // generate the page content by looping through the sketch json
  for (var page in sketchData.pages) { 
    // ignore the symbol master page
    if (sketchData.pages[page].name === 'Symbols') {
      break;
    }
    outputHTML = '';

    // set the page name + template from the sketch artboard title
    var artboardName = sketchData.pages[page].layers[0].name;
    var artboardNameDelimiter = '(template:';
    pageTitle = artboardName.substring(0, artboardName.indexOf('(')).trim();
    templateName = artboardName.substring(artboardName.indexOf(artboardNameDelimiter) + artboardNameDelimiter.length).trim().replace(')', '');
    
    // access every layer
    for (var obj in sketchData.pages[page].layers[0].layers) {
      if (sketchData.pages[page].layers[0].layers[obj]._class === 'text') {
        // this is not a symbol that already exists in our library
        // if text, add the text to the HTML file
        outputHTML += pug.renderFile('src/views/content/generic-text.pug', { text: sketchData.pages[page].layers[0].layers[obj].attributedString.string});
      } else {
        // this is a sketch symbol
        var layer = sketchData.pages[page].layers[0].layers[obj];
        
        // exclude the header/footer, output page content only, preview template will output the header/footer
        if (layer.name != 'layout/header' && layer.name != 'layout/footer') {
          // check if this symbol uses defaults or has any values overridden
          var overrides = {};
          for (var overrideField in layer.overrideValues) {
            // add the overrides to the list
            var overrideMap = require('./' + mapIdToTemplateFiles[layer.symbolID]+'.js').overrideMap;
            var overrideID = layer.overrideValues[overrideField].overrideName;
            var overrideVal = layer.overrideValues[overrideField].value;
            // if override points to a symbol, point to the symbol's path
            if (overrideID.includes('symbolID')) {
              overrideVal = symbolToStringMap[overrideVal];
            }
            overrides[overrideMap[overrideID]] = overrideVal;
          }
          // output this symbol to the HTML using the corresponding template file
          outputHTML += pug.renderFile(mapIdToTemplateFiles[layer.symbolID]+'.pug', overrides);
        }
      }
    }
  }

  // write the HTML to a file (same name as the .sketch file)
  outputFileName = __dirname + '/output/' + sketchFileName;
  fs.writeFileSync(outputFileName, pretty(outputHTML));
  
  // launch the specified view
  if (program.sandbox){
    open('http://localhost:3000' + endpoint + '-sandbox');
  } else {
    open('http://localhost:3000' + endpoint);
  }
}

// preview the sketch file in browser
app.get(endpoint, function (req, res) {
  // render the preview
  res.render('templates/' + templateName + '-preview', { outputFile: sketchFileName, title: 'sketch2code: ' + pageTitle, content: outputHTML})
})

// create the HTML sandbox in browser
app.get(endpoint + '-sandbox', function(req, res) {
  // read output file
  fs.readFile(outputFileName, function read(err, data) {
    if (err) {
      throw err;
    }
    res.render('templates/' + templateName + '-sandbox', { outputFile: sketchFileName, title: 'sketch2code: Sandbox', content: data, showMessage: firstSandboxLoad});
    firstSandboxLoad = false;
  })
})

app.get('/dragdrop', function(req, res){
  res.sendFile(__dirname + '/public/file-input-form.html', function(err){
    if (err) {
      next(err);
    }
  });
})

app.post('/upload', type, function(req, res){
  sketchFileName = req.file.originalname.replace('.sketch', '.html');
  sketchFile = req.file.buffer;
  startServer();
})

app.listen(3000, function() {
  console.log('Sketch to code will open your browser to: http://localhost:3000' + endpoint + (program.sandbox ? '-sandbox' : ''));
});
