
const fs = require('fs');
const path = require('path');

function findFile(dir, target) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules') {
                const found = findFile(fullPath, target);
                if (found) return found;
            }
        } else if (file === target) {
            return fullPath;
        }
    }
    return null;
}

const targetFile = 'check_user_service_db.ts';
const root = 'c:\\games\\New folder\\solve error\\school-growth-hub-main';
const foundPath = findFile(root, targetFile);

if (foundPath) {
    console.log('FOUND:', foundPath);
    console.log('CONTENT:');
    console.log(fs.readFileSync(foundPath, 'utf8'));
} else {
    console.log('NOT FOUND');
}
