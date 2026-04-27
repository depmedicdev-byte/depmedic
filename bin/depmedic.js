#!/usr/bin/env node
'use strict';

const { run } = require('../lib/index.js');

run(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(2);
  }
);
