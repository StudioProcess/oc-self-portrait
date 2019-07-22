const width = 132;
const outname = 'index.rect.html';

let fs = require('fs');

let text = fs.readFileSync('./index.html', {encoding:'utf-8'});
// console.log(text);

// trim
text = text.trim();

// outname
text = text.replace('index.html', outname);

// remove comments
text = text.replace(/\/\/(.*)/g, '');

// replace end of line comments with inline ones
// text = text.replace(/\/\/(.*)/g, '/*$1 */ ');

// replace newlines with spaces
text = text.replace(/\n/g, ' ');

// replace multiple spaces with a single one
text = text.replace(/ +/g, ' ');
count = text.length;

console.log(text);
console.log(count + ' characters');

// get a section from the front of text that fits width
// make it fit by inserting spaces if necessary
function clipoffline(text, width) {
  words = text.split(' ');
  line = '';
  while (words.length > 0) {
    word = words[0];
    if (line.length == 0) {
      if (word.length > width) {
        console.log('Warning: Can\'t fit word: ' + word);
        line += words.shift(); // Add it anyway
        break;
      }
      line += words.shift(); // add line
    } else {
      if (line.length + 1 + word.length > width) break;
      line += " " + words.shift(); // add line
    }
  }
  return {
    line,
    length: line.length,
    rest: words.join(' ')
  };
}

// random permutaion of the given length (0-based)
function perm(len) {
  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
  }
  let a = [];
  for (let i=0; i<len; i++) {
    a.push(i);
  }
  shuffle(a);
  return a;
}

// stretch line to target width by inserting whitespace
function stretch(line, width) {
  let words = line.split(' ');
  if (words.length < 2) return line; // no split points
  
  let add = width - line.length;
  if (add < 1) return line;
  let splitpoints = words.length - 1; // number of points where whitespace can be added
  
  let inserts = [];
  while (add > 0) {
    if (add < splitpoints) {
      inserts = inserts.concat( perm(splitpoints).slice(0, add) );
      add = 0;
    } else {
      inserts = inserts.concat( perm(splitpoints) );
      add -= splitpoints;
    }
  }
  
  let stretches = [];
  for (let i=0; i<splitpoints; i++) {
    stretches[i] = 0;
  }
  for (let ins of inserts) {
    stretches[ins]++;
  }
  
  // console.log(inserts);
  // console.log(stretches);
  
  // piece it together
  line = words[0];
  for (let i=0; i<splitpoints; i++) {
    line += ' '.repeat(stretches[i] + 1) + words[i+1];
  }
  return line;
}


let lines = [];
let line;
let idx = 1;
do {
  line = clipoffline(text, width);
  let fitted = stretch(line.line, width);
  lines.push( fitted );
  console.log(`${(''+idx).padStart(3,0)} (${(''+line.length).padStart(3,0)}): ${fitted}`);
  idx++;
  text = line.rest;
} while (line.rest.length > 0);

fs.writeFileSync(outname, lines.join('\n'));
