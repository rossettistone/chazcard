var fs = require('fs');
var cheerio = require('cheerio');
var _ = require('lodash');

var html = fs.readFileSync('songdata.html').toString();

var $ = cheerio.load(html);
var songdata = [];
$('td:first-child').each(function (i, node) {
  songdata.push( $(node).text() );
});

var songs = [];
_.each(songdata, function (row) {
  var row = row.replace(/\s*$/g, '');
  row = row.replace(/^\n\s*/g, '');
  var splitRow = row.split(' / ');
  console.log(splitRow);
  var title = splitRow[0];
  var pitch = _(splitRow).last();
  if (pitch !== 'Starting Pitch Missing') {
    songs.push({
      title: title,
      pitch: pitch
    });
  }
});

fs.writeFileSync('songData.json', JSON.stringify(songs));
