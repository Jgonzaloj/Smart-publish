const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/app.js', 'utf8');

// Extract all getElementById in app.js
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
const idsInJs = new Set();
let match;
while ((match = idRegex.exec(js)) !== null) {
  idsInJs.add(match[1]);
}

console.log(`Checking ${idsInJs.size} element IDs accessed in app.js...`);

const missingIds = [];
for (const id of Array.from(idsInJs).sort()) {
  // Check if id exists in index.html (as id="...") or is dynamically generated
  const inHtml = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  const isDynamic = id.includes('${') || id.startsWith('card-') || id.startsWith('chip-') || id.startsWith('sec-') || id.startsWith('tab-') || id.startsWith('pill-') || id.startsWith('drawer-') || id.startsWith('mob-nav-');
  
  if (!inHtml && !isDynamic) {
    missingIds.push(id);
    console.log(`⚠️ Potential missing ID in index.html: "${id}"`);
  }
}

console.log(`\nTotal potentially missing IDs: ${missingIds.length}`);
