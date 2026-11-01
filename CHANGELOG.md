# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [Sin publicar]

### Añadido
- **Política de privacidad** (`privacidad.html`, en español e inglés), publicada con la web en `https://lsantome.github.io/Ritmo-Remada/privacidad.html`, que es la URL que pide Google Play. No va dentro del APK. Falta sustituir el marcador del correo de contacto antes de pegar la URL en Play Console.
- **Material de la ficha de Google Play** en `store/`: textos en español e inglés (`ficha-play-store.md`), icono 512×512, gráfico de funciones 1024×500 y capturas de móvil, más `generar-material.py` para regenerarlos. Las capturas son del navegador, no del APK.
- `docs/GUIA-PLAY-STORE.md`: pasos para publicar, la decisión sobre la firma de Play, declaraciones de contenido de la app y pruebas pendientes en un móvil real.
- `tests/store.test.js`: límites de caracteres de la ficha, tamaños de las imágenes, coherencia con los textos de la app y que la política no cargue recursos externos ni la app use red sin actualizar la declaración de datos.

## [1.6.0] - 2026-11-01

### Añadido
- **Interfaz en español e inglés.** Al abrir la app por primera vez usa el idioma del dispositivo: español si es el primero de su lista de idiomas preferidos entre español e inglés, e inglés en cualquier otro caso (por ejemplo, un dispositivo en francés o en alemán). Un dispositivo en catalán con el español como segunda lengua usa español.
- **Selector en Ajustes** (Auto · Español · English). «Auto» sigue al dispositivo; la elección manual se guarda y se conserva al recargar. El cambio es inmediato, también con una sesión en marcha.
- Se traduce todo: textos visibles, etiquetas para lectores de pantalla, la descripción de la página y el formato de los números (`2,00 s` / `2.00 s`). Las notas musicales pasan de solfeo (Fa6) a letras (F6) en inglés. En inglés, la palada se llama *stroke*; remada, *drive*; y recobro, *recovery*.
- Pruebas: `tests/i18n.test.js` (diccionarios con las mismas claves y marcadores, detección del idioma, claves usadas y huérfanas) y `tests/e2e/idioma.py` (navegador: detección, selector, persistencia, textos sin mezclar, modo Pro en marcha y desbordes de pantalla a 320, 360 y 412 px).

### Cambiado
- El idioma elegido se guarda dentro del ajuste existente (`ritmo-remada-v1`, campo `lang`); no se renombra ninguna clave. Los datos guardados con versiones anteriores se conservan y quedan en «Auto».
- `manifest.webmanifest`: la descripción incluye también el texto en inglés. El nombre de la app («Ritmo de Remada») y el título de la pantalla principal no se traducen.

## [1.5.0] - 2026-10-31

### Añadido
- **Modo Pro: «Borrar todos».** Un botón al principio de la lista de intervalos los elimina en una sola pulsación y deja un único intervalo de partida (2:00 a 24 BPM), porque la lista no puede quedar vacía. Durante 8 segundos el mismo botón pasa a «Deshacer» y recupera la lista completa; si antes se edita, se añade un intervalo o se inicia la sesión, el «Deshacer» desaparece. Con la sesión en marcha está bloqueado, como el resto de la lista.
- Prueba de navegador `tests/e2e/pro_borrar.py` y comprobación estática en `npm test`.

## [1.4.0] - 2026-10-23

Primera versión en este repositorio. La funcionalidad es la de la 1.4 repartida como APK y PWA antes de existir el repo; cambia la estructura, la compilación y el empaquetado.

### Añadido
- Versión visible al final de Ajustes: `v1.4.0 · build hash · fecha` (en desarrollo, «Versión: desarrollo»).
- Integración continua: pruebas y despliegue de la PWA en GitHub Pages (`pages.yml`) y APK/AAB firmados al crear una etiqueta (`android.yml`).
- Pruebas automáticas (`npm test`): planificadores de audio normal y Pro, PWA, versión, Android y seguridad.
- Documentación: README, `docs/ANDROID.md` y `CLAUDE.md`.

### Cambiado
- **Android:** el envoltorio WebView propio se sustituye por Capacitor 8.5.3. Misma identidad (`es.trainera.ritmo`) y misma clave de firma, así que se instala encima de la versión anterior. `versionCode` pasa de 5 a 10400 (`major*10000 + minor*100 + patch`).
- **Service worker:** la caché se llama `ritmo-remada-<hash del commit>` y, al activarse, solo borra cachés con el prefijo `ritmo-remada-`. Antes borraba todas las demás, lo que en `lsantome.github.io` habría eliminado las de otras apps.
- **Manifiesto:** `id` pasa de `./` a `ritmo-remada`, para no colisionar con otras PWA del mismo origen.
- La clave de firma y su contraseña salen del proyecto: la firma se lee de variables de entorno o de un fichero ignorado por Git.

### Nota de migración
- El APK anterior servía la web desde otro origen interno. Se ha mantenido el mismo nombre de origen en la configuración de Capacitor para conservar los ajustes guardados, pero **no está verificado en un dispositivo**: si al actualizar los ajustes (BPM, %, lista del modo Pro, tema) vuelven a sus valores por defecto, es esperable y basta con configurarlos de nuevo.
