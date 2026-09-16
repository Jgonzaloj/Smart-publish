const fs = require('fs');

const js = fs.readFileSync('public/app.js', 'utf8');

// Find all onclick/onsubmit/onchange/oninput inside string literals in app.js
const dynamicHandlerRegex = /on(?:click|submit|change|input)\s*=\s*\\?["']([^"'\\]+)\\?["']/gi;
const dynamicFunctions = new Set();
let match;
while ((match = dynamicHandlerRegex.exec(js)) !== null) {
  const code = match[1];
  const calls = code.match(/([a-zA-Z0-9_$]+)\s*\(/g);
  if (calls) {
    calls.forEach(c => {
      const name = c.replace('(', '').trim();
      if (!['if', 'for', 'switch', 'alert', 'confirm', 'prompt', 'encodeURIComponent', 'event'].includes(name)) {
        dynamicFunctions.add(name);
      }
    });
  }
}

console.log('--- Functions called dynamically in app.js template strings ---');
const missing = [];
for (const fn of Array.from(dynamicFunctions).sort()) {
  const hasInJs = js.includes(`function ${fn}`) || js.includes(`const ${fn} =`) || js.includes(`window.${fn} =`) || js.includes(`let ${fn} =`);
  if (!hasInJs) {
    missing.push(fn);
    console.log(`❌ MISSING: ${fn}`);
  } else {
    console.log(`✅ OK: ${fn}`);
  }
}

console.log(`\nTotal dynamic checked: ${dynamicFunctions.size}. Missing: ${missing.length}`);
