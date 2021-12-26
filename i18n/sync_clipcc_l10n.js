#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const locales = require('clipcc-l10n').default;
const PATH_OUTPUT = path.resolve(__dirname, '../msg');
let file = `// This file was automatically generated.  Do not modify.

'use strict';

goog.provide('Blockly.ScratchMsgs.allLocales');

goog.require('Blockly.ScratchMsgs');

`;

function getLocaleData (locale) {
  return new Promise(resolve => {
    const translations = fs.readFileSync('./node_modules/clipcc-l10n/locale/block/'+locale+'.json');
    resolve({
      locale: locale,
      translations: JSON.parse(translations)
    });
  });
}

Promise.all(Object.keys(locales).map(getLocaleData)).then(function (values) {
  values.forEach(function (translation) {
    file += '\n';
    file += `Blockly.ScratchMsgs.locales["${translation.locale}"] =\n`;
    file += JSON.stringify(translation.translations, null, 4);
    file += ';\n';
  });
  file += '// End of combined translations\n';
  // write combined file
  fs.writeFileSync(`${PATH_OUTPUT}/scratch_msgs.js`, file);
  console.log('Success Sync Translate from clipcc-l10n')
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
