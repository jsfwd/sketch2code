sketch2code: Generate code from a Sketch design
===============================================

This tool accepts a .sketch file and outputs it as code ready for import into a CMS or other platform of your choice.

The assumption is that you are using a .sketch file that has a library of symbols that have been mapped to components within this tool. See *Using the .sketch file' below.

There is a sample sketch file in `/src/sketch/sample.sketch` you can use to demo.

### How to use

- Open Sketch file and make changes (add symbols, modify symbol overrides)
- Open Terminal
- `cd path/to/this/repo`
- Run `npm install`
- Run `node app.js` or use one of the commands below
- Your browser will now open to display your preview on `http://localhost:3000`
- Your saved HTML ready for the CMS is saved to the `output` folder

### Commands
- Run `node app.js` or `nodemon app.js` (preview code output of sketch file)
- Run `node app.js relative-path/to/file.sketch` (preview code output of custom sketch file)
- Run `node app.js -sandbox` (open as sandbox code where you can modify output)


### Using the .sketch file

Sample sketch file: `/src/sketch/sample.sketch`

**Artboard name**

- Format "Sample Page (template: page)"
- "Sample Page" is the HTML page title
- "page" defines which template to use in the sketch2code app

![](https://cdn.ctg.intuit.ca/sketch-to-code/skch-artboard-name.png)
![](https://cdn.ctg.intuit.ca/sketch-to-code/skch-artboard-name-views.png)

**Symbols mapped from Sketch to sketch2code**

![](https://cdn.ctg.intuit.ca/sketch-to-code/skch-symbols.png)
![](https://cdn.ctg.intuit.ca/sketch-to-code/skch-symbols-views.png)


### Future improvements

- **More designer friendly** (*most* designers don't like terminal, setup a url where designers can upload their .sketch file and get output)
- **Sketch symbol mapping** (easier way to map new sketch symbol IDs and override IDs, currently this needs to be done by browsing the json)
- **Sketch multiple artboards** (currently only supports 1 artboard per sketch file)
- **Error handling** (add handling for unexpected errors, like .sketch file missing, sketch library not using expected library, etc...)
- **More layout support** (define layouts in sketch, with corresponding layouts in sketch2code)
- **Platform support** (multi-platform support, output components for different platforms, ex./ "opencms", "email" or "newplatform")
- **Image handling** (handle image symbols, export + compression)
- **Sketch component text formatting** (sketch file text overrides do not support inline formatting like bold or italics or allow you to add links)