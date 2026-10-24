'use strict';
/* Android (Capacitor): configuración coherente, versión derivada de package.json y ni una clave en el repositorio. */
const test = require('node:test');
const assert = require('node:assert');
const { execSync } = require('node:child_process');
const { ROOT, read, exists } = require('./helpers');

const pkg = JSON.parse(read('package.json'));
const cap = JSON.parse(read('capacitor.config.json'));
const gradle = read('android/app/build.gradle');

test('capacitor.config.json: appId y carpeta web', () => {
  assert.strictEqual(cap.appId, 'es.trainera.ritmo');   // no se cambia: es la identidad de la app ya instalada
  assert.strictEqual(cap.webDir, 'dist/app');
});

test('build.gradle: applicationId y namespace coinciden con appId', () => {
  assert(gradle.includes(`applicationId "${cap.appId}"`));
  assert(gradle.includes(`namespace = "${cap.appId}"`));
});

test('build.gradle: la versión sale de package.json', () => {
  assert(gradle.includes("file('../../package.json')"));
  assert(gradle.includes('versionName pkg.version'));
  assert(gradle.includes('versionCode verMajor * 10000 + verMinor * 100 + verPatch'));
});

test('versionCode (major*10000 + minor*100 + patch) no es menor que el del APK anterior (5)', () => {
  const [a, b, c] = pkg.version.split('-')[0].split('.').map(Number);
  assert(a * 10000 + b * 100 + c >= 5);
});

/* Contraseña literal: «storePassword 'x'», «keyPassword = "x"» o «storePassword: 'x'». No cuenta p['storePassword'] ni getenv(...). */
const LITERAL_PASSWORD = /(?<!['"\w.])(?:store|key)Password\s*[=:]?\s*['"][^'"\n]+['"]/i;

test('el detector de contraseñas literales distingue casos reales de falsos positivos', () => {
  for (const mal of ["storePassword 'abc'", 'keyPassword = "abc"', "storePassword: 'abc'"]) assert(LITERAL_PASSWORD.test(mal), 'debía detectar: ' + mal);
  for (const bien of ["storePassword: p['storePassword'],\n keyAlias : p['keyAlias']", "storePassword System.getenv('X')", 'storePassword releaseSigning.storePassword']) {
    assert(!LITERAL_PASSWORD.test(bien), 'falso positivo: ' + bien);
  }
});

test('build.gradle: sin contraseñas ni rutas de claves en texto plano', () => {
  assert(!LITERAL_PASSWORD.test(gradle), 'contraseña literal en build.gradle');
  assert(!/storeFile\s+file\(\s*['"][^'"]*\.(keystore|jks)/i.test(gradle), 'ruta de keystore literal en build.gradle');
  assert(gradle.includes('System.getenv(\'ANDROID_KEYSTORE_PATH\')'));
  assert(gradle.includes('keystore.properties'));
});

test('.gitignore: protege claves, binarios y salidas de build', () => {
  const gi = read('.gitignore').split('\n').map(s => s.trim());
  for (const p of ['*.keystore', '*.jks', '*.p12', 'keystore.properties', 'local.properties', '*.apk', '*.aab', 'node_modules/', 'dist/']) {
    assert(gi.includes(p), '.gitignore no incluye ' + p);
  }
});

test('ningún keystore, binario ni fichero de contraseñas está versionado', () => {
  let files;
  try { files = execSync('git ls-files', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n'); }
  catch (e) { return; /* sin git (p. ej. un zip descargado): se comprueba en CI */ }
  const bad = files.filter(f => /\.(keystore|jks|p12|apk|aab)$/i.test(f) || /(^|\/)(keystore|local)\.properties$/.test(f));
  assert.deepStrictEqual(bad, []);
});

test('manifest de Android: vertical y MainActivity con pantalla siempre encendida', () => {
  assert(/android:screenOrientation="portrait"/.test(read('android/app/src/main/AndroidManifest.xml')));
  const main = read('android/app/src/main/java/es/trainera/ritmo/MainActivity.java');
  assert(main.includes('FLAG_KEEP_SCREEN_ON'));
  assert(main.includes('registerPlugin(RitmoNativePlugin.class)'));
});

test('Capacitor fijado a la misma versión en las tres dependencias', () => {
  const v = new Set(['@capacitor/cli', '@capacitor/core', '@capacitor/android'].map(n => pkg.devDependencies[n]));
  assert.strictEqual(v.size, 1);
  assert(/^\d+\.\d+\.\d+$/.test([...v][0]), 'versión exacta, sin ^ ni ~');
});
