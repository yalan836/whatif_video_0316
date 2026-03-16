const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/SetupScreens.tsx',
];

const replacements = [
  { from: /border-celestial-gold bg-celestial-gold\/10/g, to: 'deep-brown-card dynamic-border' },
  { from: /border-celestial-gold\/30 hover:bg-celestial-gold\/5/g, to: 'deep-brown-card opacity-70 hover:opacity-100' },
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
