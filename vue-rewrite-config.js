#!/usr/bin/env node

// modified version of rewrite script from
// https://blog.container-solutions.com/deploying-configurable-frontend-web-application-containers

const cheerio = require("cheerio");
const copy = require("recursive-copy");
const fs = require("fs");
const rimraf = require("rimraf");

const DIST_DIR = process.env.DIST_DIR;
const DEST_DIR = process.env.DEST_DIR;

// all environment variables that start with VUE_APP_
const ENV = Object.keys(process.env)
  .filter(k => k.startsWith("VUE_APP_"))
  .reduce((obj, key) => {
    obj[key] = process.env[key];
    return obj;
  }, {});

/**
 * Rewrite meta tag config values in "index.html".
 * @param {string} file
 * @param {object} values
 */
function rewriteIndexHTML(file, values) {
  console.info(`Reading '${file}'`);
  fs.readFile(file, "utf8", function(error, data) {
    if (!error) {
      const $ = cheerio.load(data);
      console.info(`Rewriting values '${values}'`);
      for (const [key, value] of Object.entries(values)) {
        console.log(key, value);
        $(`[property=${key}]`).attr("content", value);
      }

      fs.writeFile(file, $.html(), function(error) {
        if (!error) {
          console.info(`Wrote '${file}'`);
        } else {
          console.error(error);
        }
      });
    } else {
      console.error(error);
    }
  });
}

// - Delete existing files from public directory
// - Copy `dist` assets to public directory
// - Rewrite config meta tags on public directory `index.html`
rimraf(DEST_DIR + "/*", {}, function() {
  copy(`${DIST_DIR}`, `${DEST_DIR}`, { debug: true }, function(error, results) {
    if (error) {
      console.error("Copy failed: " + error);
    } else {
      console.info("Copied " + results.length + " files");

      rewriteIndexHTML(`${DEST_DIR}/index.html`, ENV);
    }
  });
});
