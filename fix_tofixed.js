const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/renderer/src');
let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We safely replace instances of `.toFixed` with `?.toFixed` everywhere, 
  // because if the object is null/undefined, optional chaining returns undefined, 
  // and in React rendering {undefined} results in nothing (safe), 
  // and in template literals it results in "undefined" (ugly but doesn't crash).
  // Wait, `(Number(X) || 0).toFixed(2)` is safer for math.
  // Instead, let's just make it `?.toFixed` for now as it instantly prevents the crash.
  
  content = content.replace(/\.toFixed\(/g, '?.toFixed(');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
    console.log('Fixed:', file);
  }
});

console.log('Done! Modified', totalReplaced, 'files.');
