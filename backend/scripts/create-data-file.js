// This script will help you create the JSON file
// Paste your JSON data between the quotes below
const data = {
  "total": 93,
  "page": 1,
  "docs": []
  // Paste your docs array here
  
};

const fs = require('fs');
fs.writeFileSync('scripts/g2a-data.json', JSON.stringify(data, null, 2));
console.log('✅ JSON file created!');
