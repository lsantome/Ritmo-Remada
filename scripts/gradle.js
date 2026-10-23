'use strict';
/* Lanza el Gradle Wrapper del proyecto Android en cualquier sistema (Windows, macOS, Linux):
   node scripts/gradle.js assembleDebug */
const { spawnSync } = require('child_process');
const path = require('path');

const dir = path.join(__dirname, '..', 'android');
const win = process.platform === 'win32';
const r = spawnSync(win ? 'gradlew.bat' : './gradlew', process.argv.slice(2), { cwd: dir, stdio: 'inherit', shell: win });
process.exit(r.status === null ? 1 : r.status);
