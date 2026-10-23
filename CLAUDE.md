# CLAUDE.md — Ritmo de Remada

Metrónomo de dos tonos para trainera (agudo = inicio de palada, grave = fin). PWA en GitHub Pages + APK de Android con Capacitor. Responde y comenta en **español**.

## Stack y comandos

HTML/CSS/JS en un solo `index.html` (sin dependencias en ejecución), Web Audio API. Capacitor 8.5.3 solo para empaquetar Android. Node ≥ 22, JDK 21.

```bash
npm ci
npm test                  # debe pasar siempre antes de un commit
npm run build:pwa         # dist/site
npm run build:android-web # dist/app
npm run android:debug     # APK de depuración
```

## Estructura

`index.html`, `manifest.webmanifest`, `sw.js`, `icons/`, `fonts/` en la raíz · `scripts/` (versión y builds) · `tests/` (`*.test.js` en `npm test`; `tests/e2e/` opcional con Playwright) · `android/` (proyecto Capacitor) · `docs/ANDROID.md` · `.github/workflows/pages.yml` y `android.yml`.

Los planificadores de audio viven en `index.html` entre `/*SCHED-START*/` y `/*SCHED-END*/`; las pruebas los extraen de ahí, no los copies a otro sitio.

## Reglas (no negociables)

1. **Nunca subir claves.** Ni `*.keystore`, `*.jks`, `*.p12`, `keystore.properties`, ni contraseñas en ningún fichero. Las pruebas y el CI fallan si aparece alguno. La firma va por variables de entorno o secretos de GitHub (ver `docs/ANDROID.md`).
2. **No mover el HTML de la raíz.**
3. **No renombrar el repositorio** (cambia la URL de Pages y rompe las PWA ya instaladas).
4. **No cambiar `appId` (`es.trainera.ritmo`) ni el `id` del manifest (`ritmo-remada`)**: son la identidad de la app instalada.
5. **No renombrar la clave de `localStorage` `ritmo-remada-v1`**: se perderían los ajustes de quien ya usa la app. Cualquier clave nueva debe empezar por `ritmo-remada`.
6. Las apps de `lsantome.github.io` comparten origen: el service worker solo debe borrar cachés con prefijo `ritmo-remada-`.
7. No hacer push directo a `main` (despliega la PWA): rama + PR.
8. No tocar la lógica de audio sin ejecutar `npm test`; cubre los tiempos de inicio, fin y avisos.
9. No dar por verificado lo que no se ha ejecutado, y decir qué queda sin comprobar (por ejemplo, el comportamiento en un móvil real).

## Subir de versión

1. Editar `version` en `package.json` (semver) y añadir la entrada en `CHANGELOG.md`.
2. `npm test`, commit (`tipo: resumen`, en español), PR y merge a `main` (publica la PWA).
3. Etiquetar `vX.Y.Z` **igual que `package.json`**, y `git push origin vX.Y.Z`: `android.yml` compila, firma y adjunta APK y AAB a la Release. Falla si la etiqueta no coincide o si faltan los secretos de firma.

`versionCode` de Android = `major*10000 + minor*100 + patch` (nunca puede bajar).

## Commits

Atómicos, en español, `tipo: resumen` con `feat`, `fix`, `chore`, `docs`, `test`, `ci`.
