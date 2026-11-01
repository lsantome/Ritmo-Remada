# Ritmo de Remada / Rowing Stroke Rhythm

Metrónomo de dos tonos para marcar el ritmo de una tripulación de trainera: tono agudo = inicio de la palada, tono grave = fin. / Two-tone metronome for a rowing crew: high tone = stroke start, low tone = stroke end.

A PWA that works offline and an Android app packaged with Capacitor. / Una PWA que funciona sin conexión y una app Android empaquetada con Capacitor.

- PWA / PWA: https://lsantome.github.io/Ritmo-Remada/
- APK / APK: Releases tab in the repository / pestaña [Releases](https://github.com/lsantome/Ritmo-Remada/releases)

## Overview / Resumen

Ritmo de Remada is a lightweight rowing cadence trainer designed for trainera crews. It helps maintain a consistent rhythm between athletes by signaling the start and end of each stroke with distinct tones. / Ritmo de Remada es un entrenador ligero de cadencia para tripulaciones de trainera. Ayuda a mantener un ritmo constante entre los remeros al señalar el inicio y el fin de cada palada con tonos distintos.

## What it does / Qué hace

- Cadence (BPM): from 10 to 80 strokes per minute / Cadencia (BPM): de 10 a 80 paladas por minuto.
- Stroke end (%): position of the low tone within the cycle / Fin de remada (%): posición del tono grave dentro del ciclo.
- Settings: start/end tone frequencies, general volume, light/dark theme, and language / Ajustes: frecuencias de los tonos de inicio y fin, volumen general, tema claro/oscuro e idioma.
- Pro mode: a list of intervals with customized duration and cadence, up to 30 entries / Modo Pro: una lista de intervalos con duración y cadencia personalizadas, hasta 30 entradas.
- In the APK: the screen stays on while open and the app remains in portrait orientation / En la APK: la pantalla no se apaga mientras la app está abierta y se mantiene en vertical.
- English and Spanish UI, following the device language by default / Interfaz en inglés y español, siguiendo el idioma del dispositivo por defecto.

## Installation / Instalación

### PWA / PWA

Open the app URL in Chrome and choose Install app. On iPhone, use Safari > Share > Add to Home Screen. After the first load it works offline. / Abre la URL en Chrome y elige Instalar aplicación. En iPhone, usa Safari > Compartir > Añadir a pantalla de inicio. Tras la primera carga funciona sin conexión.

### APK / APK

Download the `ritmo-remada-X.Y.Z.apk` file from the latest Release and install it. Android may ask you to allow installation from the browser or file manager. New versions replace older installs while preserving local settings. / Descarga `ritmo-remada-X.Y.Z.apk` de la última Release e instálalo. Android puede pedirte permitir la instalación desde el navegador o el gestor de archivos. Las versiones nuevas reemplazan las instalaciones anteriores y conservan los ajustes locales.

## Data and privacy / Datos y privacidad

The app does not send any data to a server. Settings such as BPM, stroke end percentage, frequencies, volume, theme, language, and Pro-mode intervals are stored only on the device. The PWA and APK are separate installations. / La app no envía nada a ningún servidor. Los ajustes como BPM, porcentaje de fin de remada, frecuencias, volumen, tema, idioma y los intervalos del modo Pro se guardan solo en el dispositivo. La PWA y la APK son instalaciones distintas.

## Known limitations / Limitaciones conocidas

- With the screen off or the app in the background, the system may interrupt playback. There is no foreground service. / Con la pantalla apagada o la app en segundo plano, el sistema puede cortar el audio. No hay servicio en primer plano.
- Tested on Chromium and built for Android; not verified on a real device in this repository layout. / Probado en Chromium y compilado para Android; no verificado en un dispositivo real en esta estructura del repositorio.

## Development / Desarrollo

Requirements / Requisitos: Node ≥ 22. For Android, JDK 21 and Android SDK with `ANDROID_HOME` defined. See [`docs/ANDROID.md`](docs/ANDROID.md). / Requisitos: Node ≥ 22. Para Android, JDK 21 y Android SDK con `ANDROID_HOME` definido. Consulta [`docs/ANDROID.md`](docs/ANDROID.md).

```bash
npm ci
npm test
npm run build:pwa
npm run build:android-web
npm run android:debug
```

The app is a simple static site built with HTML, CSS, and JavaScript in `index.html`; the project also includes the Android packaging with Capacitor. / La app es un sitio estático simple construido con HTML, CSS y JavaScript en `index.html`; el proyecto también incluye el empaquetado para Android con Capacitor.

To test locally without building: run `python3 -m http.server 8000` from the project root and open `http://localhost:8000/`. The version shown in Settings will read as “development”. / Para probar en local sin construir: ejecuta `python3 -m http.server 8000` en la raíz del proyecto y abre `http://localhost:8000/`. La versión mostrada en Ajustes aparecerá como “desarrollo”.

## Versions / Versiones

The version lives in `package.json`. Each build seals the version along with the commit hash and date, and it is shown at the end of Settings (`v1.4.0 · build abc1234 · 2026-10-23`). / La versión vive en `package.json`. Cada compilación sella la versión junto con el hash del commit y la fecha, y se muestra al final de Ajustes (`v1.4.0 · build abc1234 · 2026-10-23`).

See [`CHANGELOG.md`](CHANGELOG.md) for the release history. / Consulta [`CHANGELOG.md`](CHANGELOG.md) para ver el historial de versiones.

## License / Licencia

MIT

## Project structure / Estructura del proyecto

- `index.html` — main app / app principal
- `manifest.webmanifest` — PWA manifest / manifiesto PWA
- `sw.js` — service worker / service worker
- `icons/` and `fonts/` — assets / recursos
- `scripts/` — build and version tooling / herramientas de compilación y versión
- `tests/` — automated tests / pruebas automatizadas
- `android/` — Capacitor Android project / proyecto Android de Capacitor
- `docs/ANDROID.md` — Android instructions / instrucciones de Android
- `.github/workflows/` — CI/CD for Pages and Android / CI/CD para Pages y Android

## Notes / Notas

This README is intentionally bilingual so it can be read by both Spanish-speaking and English-speaking users. / Este README está intencionalmente en dos idiomas para que pueda leerse tanto por usuarios hispanohablantes como por usuarios de habla inglesa.

For the most up-to-date build and release instructions, also check the project’s configuration files and Android docs. / Para ver las instrucciones más actualizadas de compilación y publicación, consulta también los archivos de configuración del proyecto y la documentación de Android.

"""
}],