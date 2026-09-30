const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'warnOfExpoGoPushUsage.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'warnOfExpoGoPushUsage.ts'),
];

targetFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("throw new Error(message);")) {
      content = content.replace(/if\s*\(Platform\.OS\s*===\s*['"]android['"]\)\s*\{\s*throw new Error\(message\);\s*\}\s*else\s*if\s*\(__DEV__\)/g, 'if (__DEV__)');
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Patched: ${file}`);
    }
  }
});
