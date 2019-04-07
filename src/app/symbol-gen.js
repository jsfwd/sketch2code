/**
 * Notes on symbol scraping:
 * - If a symbol is used in another symbol, it MUST have the same name as the original
 *   on the symbol master page.
 * - For now, the naming convention dictates that all content sections should be named
 *   "content/name" and all icons should be named "icons/name"
 * - Currently, other types of objects are not yet supported.
 * - When a new part is added, a .pug template file is created, where the content
 *   structure can be written.
 * - A .js file with the part's fields is also created, with temporary variable names
 *   from the names of the fields (usually the default value).
 * - These can be given a new variable name that can then be used in the template file.
*/
const fs = require('fs')
function scrapeSymbols(sketchData){
  var symbolToJSON = {};
  var overrideSet = {};
  var overridePrefix = '';
  var masterPage;
  var imageCount;
  var textCount;
  var objectLocation;

  // contains a map of subcomponent IDs mapped to their path
  var symbolToStringMap = require(__dirname + '/symbol-id-to-string.js').symbolToStringMap;
  
  // contains maps of all sketch library symbols mapped to their json ids
  var mapIdToTemplateFiles = require(__dirname + '/sketch-map-json-to-symbol.js').mapIdToTemplateFiles;
  for (var page in sketchData.pages) {
    if (sketchData.pages[page].name === 'Symbols') {
      masterPage = page;
      for (var master in sketchData.pages[page].layers) {
        // if it's a content area, add it to the symbol map
        var masterName = 'src/views/' + sketchData.pages[page].layers[master].name;
        if (masterName.includes('content/') && !Object.values(mapIdToTemplateFiles).includes(masterName)) {
          mapIdToTemplateFiles[sketchData.pages[page].layers[master].symbolID] = masterName;
          fs.writeFileSync(__dirname + '/../../' + masterName + '.pug', 'p [ Placeholder for a new component at: ' + masterName + ' ]');
          console.log('New component at ' + masterName);
        // if it's an image, notify that the URL must be added
        } else if (masterName.includes('icons/') && !(sketchData.pages[page].layers[master].symbolID in symbolToStringMap)){
          console.log('New image with ID: '+ sketchData.pages[page].layers[master].symbolID + ' and name: ' + sketchData.pages[page].layers[master].name);
          symbolToStringMap[sketchData.pages[page].layers[master].symbolID] = 'Put the URL for: ' + sketchData.pages[page].layers[master].name + ' here';
        }
      }
    }
  }

  generateAllOverrides();
  fs.writeFileSync(__dirname + '/sketch-map-json-to-symbol.js', 'var mapIdToTemplateFiles = ' + JSON.stringify(mapIdToTemplateFiles, null, 2) + ';module.exports.mapIdToTemplateFiles = mapIdToTemplateFiles;');
  fs.writeFileSync(__dirname + '/symbol-id-to-string.js', 'var symbolIDToString = ' + JSON.stringify(symbolToStringMap, null, 2) + ';module.exports.symbolToStringMap = symbolIDToString;');
  return {symbolToStringMap: symbolToStringMap, mapIdToTemplateFiles: mapIdToTemplateFiles};
  
  function generateAllOverrides(){
  	for (var master in sketchData.pages[masterPage].layers){
  	  symbolToJSON[sketchData.pages[masterPage].layers[master].name] = master;
    }
  	for (var master in sketchData.pages[masterPage].layers){
  	  if (sketchData.pages[masterPage].layers[master].name.includes('content/')){
  	  	overrideSet = {};
  	  	overridePrefix = '';
        objectLocation = [];
  	  	if (fs.existsSync(__dirname + '/../views/' + sketchData.pages[masterPage].layers[master].name + '.js')){
  	  	  overrideSet = require(__dirname + '/../views/' + sketchData.pages[masterPage].layers[master].name + '.js').overrideMap;
  	  	}
  	  	textCount = 1;
  	  	imageCount = 1;
  	  	generateOverrides(sketchData.pages[masterPage].layers[master].name);
        objectLocation.sort(compareHeights);
        for (var object of objectLocation){
          overrideSet[object.overrideName] = object.variableName;
        }
        console.log(overrideSet);
  	  	fs.writeFileSync(__dirname + '/../views/' + sketchData.pages[masterPage].layers[master].name + '.js', '// format = override ID: pug template variable \nvar overrideMap = ' + JSON.stringify(overrideSet, null, 2) + ';\n\nmodule.exports.overrideMap = overrideMap;');
  	  }
  	}
  }
  
  function generateOverrides(objectID){
    loopThroughLayers(sketchData.pages[masterPage].layers[symbolToJSON[objectID]].layers);
    function loopThroughLayers(jsonSlice){
      for (var master in jsonSlice){
        var symbolClass = jsonSlice[master]._class;
        if (symbolClass === 'group'){
          loopThroughLayers(jsonSlice[master].layers);
        } else if (symbolClass === 'text' && !(overridePrefix + jsonSlice[master].do_objectID + '_stringValue' in overrideSet)){
          objectLocation.push({height: jsonSlice[master].frame.y, overrideName: overridePrefix + jsonSlice[master].do_objectID + '_stringValue', variableName: 'text_' + jsonSlice[master].name});
          //overrideSet[overridePrefix + jsonSlice[master].do_objectID + '_stringValue'] = 'text_' + jsonSlice[master].name;
        } else if (symbolClass === 'symbolInstance'){
        	if (jsonSlice[master].name.includes('icons/') && !(overridePrefix + jsonSlice[master].do_objectID + '_symbolID' in overrideSet)){
        	  //overrideSet[overridePrefix + jsonSlice[master].do_objectID + '_symbolID'] = 'image_' + jsonSlice[master].name;
            objectLocation.push({height: jsonSlice[master].frame.y, overrideName: overridePrefix + jsonSlice[master].do_objectID + '_symbolID', variableName: 'image_' + jsonSlice[master].name});
        	} else {
        	  overridePrefix += jsonSlice[master].do_objectID + '/';
        	  generateOverrides(jsonSlice[master].name);
        	  overridePrefix = overridePrefix.replace(jsonSlice[master].do_objectID + '/', '');
        	}
        }
      }		
    }
  }
}

function compareHeights(a, b){
  return a.height - b.height;
}

module.exports.scrapeSymbols = scrapeSymbols;