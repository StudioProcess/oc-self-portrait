// Shape input file into a rectangle, with a window, and inject about text

const width = 74;
const inname = 'index.in.html'
const outname = 'index.html';
const aboutname = 'about.txt'

// window position
const window_top    = 60;
const window_width  = 50;
const window_height = 30;


let fs = require('fs');

let text = fs.readFileSync('./' + inname, {encoding:'utf-8'});
// console.log(text);

// trim
text = text.trim();

// outname
// text = text.replace('index.html', outname);

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
function clipoffline(text, width) {
  words = text.split(' ');
  line = '';
  while (words.length > 0) {
    word = words[0];
    if (line.length == 0) {
      if (word.length > width) {
        let split = splitString(word, width); // try to split
        if (split !== word) { // got a split
          let parts = split.split(' ');
          line += parts[0];
          words[0] = parts[1];
          break;
        }
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

// Split js strings
// 'AAA' -> 'A'+ 'AA'
function splitString(str, len) {
  let quote = '\'';
  function checkStr() {
    if (len < 4) return false; // can't split less then 4
    if (str.length < 5) return false; // string is too short for splitting to make sense 
    if (len >= str.length) return false; // wan't to split off too much
    if (str[0] == '\'' && str[str.length-1] == '\'') return true;
    if (str[0] ==  '"' && str[str.length-1] ==  '"') {
      quote = '"';
      return true;
    }
  }
  if ( !checkStr() ) return str;
  str = str.slice(0, len-2) + quote + '+ ' + quote + str.slice(len-2);
  return str;
}

// Insert newlines into text to wrap to specified width
function wrapLine(text, width) {
  text = text.replace(/\n/, ' '); // newlines are ignored
  let wrapped = "";
  let clip;
  do {
    clip = clipoffline(text, width)
    wrapped += clip.line + '\n';
    text = clip.rest;
  } while (clip.rest.length > 0)
  wrapped = wrapped.trim();
  return wrapped;
}

function centerLine(text, width) {
  text = text.replace(/\n/, ' '); // newlines are ignored
  let add = width - text.length;
  if (add <= 0) return text;
  let left  = Math.floor(add / 2);
  let right = width - text.length - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function centerText(text, width) {
  let lines = text.split('\n');
  let centeredLines = [];
  for (let line of lines) {
    let wrapped  = wrapLine(line, width);
    wrappedLines = wrapped.split('\n');
    for (let line of wrappedLines) {
      let centered = centerLine(line, width);
      centeredLines.push(centered);
    }
  }
  return centeredLines.join('\n');
}

function injectIntoWindow(lines, text, margin_left = 0, margin_right = 0) {
  text = text.split('\n'); // split text into lines
  let left = Math.floor( (width - window_width) / 2 );
  let out = [];
  for (let [i, line] of lines.entries()) {
    let window_line = i - window_top;
    let insert = text[window_line];
    if (window_line < 0 || window_line >= window_height || insert === undefined) {
      out.push(line);
      continue;
    }
    insert = insert.slice(0, window_width - margin_left - margin_right); // limit to width
    let newline = line.slice(0, left + margin_left) + insert + line.slice(left + margin_left + insert.length);
    out.push(newline);
  }
  return out;
}


let lines = [];
let line, fitted;
let idx = 1;
do {
  if (idx > window_top && idx < window_top + window_height) {
    // windowed line
    let left  = Math.floor( (width - window_width) / 2 ) - 3;
    let right = width - window_width - left - 6 ;
    let clip_left  = clipoffline(text, left);
    let clip_right = clipoffline(clip_left.rest, right);
    fitted = stretch(clip_left.line, left) + ' /*' + ' '.repeat(window_width) + '*/ ' + stretch(clip_right.line, right);
    line = clip_right;
    line.length = clip_left.length + clip_right.length;
  } else {
    // normal line
    line = clipoffline(text, width);
    fitted = stretch(line.line, width);
  }
  
  lines.push( fitted );
  console.log(`${(''+idx).padStart(3,0)} (${(''+line.length).padStart(3,0)}): ${fitted}`);
  idx++;
  text = line.rest;
} while (line.rest.length > 0);

let txt = fs.readFileSync(aboutname, {encoding:'utf-8'});
txt = centerText(txt, window_width - 2);
lines = injectIntoWindow(lines, txt, 1, 1);

fs.writeFileSync(outname, lines.join('\n'));
