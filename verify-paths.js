const fs = require('fs');
const path = require('path');

// Read the HTML files in the docs directory
const docsDir = path.join(__dirname, 'docs');
const files = fs.readdirSync(docsDir, { recursive: true })
  .filter(f => typeof f === 'string' && f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix asset paths
  content = content.replace(/"\/_next\//g, '"/daily-focus/_next/');
  content = content.replace(/href="\//g, 'href="/daily-focus/');
  content = content.replace(/src="\//g, 'src="/daily-focus/');
  content = content.replace(/\/daily-focus\/daily-focus\//g, '/daily-focus/');
  
  fs.writeFileSync(filePath, content);
});

console.log('Asset paths verified and fixed');
