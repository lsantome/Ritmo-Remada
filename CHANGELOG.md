# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

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
