const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'backend', 'src', 'geo-data');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let hasError = false;
for (const file of files) {
  const filePath = path.join(dir, file);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    JSON.parse(data);
    console.log(`✅ ${file} is valid JSON.`);
  } catch (err) {
    console.error(`❌ ${file} has a JSON syntax error:`, err.message);
    hasError = true;
  }
}

if (hasError) process.exit(1);
