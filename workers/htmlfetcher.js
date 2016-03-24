// Use the code in `archive-helpers.js` to actually download the urls
// that are waiting.

var archive = require('../helpers/archive-helpers');
var _ = require('underscore');
var fs = require('fs');

exports.htmlFetcher = function () {
  // read sites.txt file
  archive.readListOfUrls(function(urlArray) {
    console.log(urlArray);
    // if the array contains a blank url element then just delete it
    urlArray = _.reduce(urlArray, function (accum, url) {
      if (url !== '') {
        accum.push(url);
      }
      return accum;
    }, []);

    console.log(urlArray);

    // download each url if it isn't archived already
    archive.downloadUrls(urlArray, function(url) {
      // callback that runs on successful download - do nothing
    });
    
  });
};

exports.htmlFetcher();
