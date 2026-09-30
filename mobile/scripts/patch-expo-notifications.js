const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'warnOfExpoGoPushUsage.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'warnOfExpoGoPushUsage.ts'),
];

targetFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, 'export const warnOfExpoGoPushUsage = () => {};\n', 'utf8');
    console.log(`✅ Patched no-op: ${file}`);
  }
});
