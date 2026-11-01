# Ritmo de Remada

Metrónomo de dos tonos para marcar el ritmo de una tripulación de trainera: **tono agudo = inicio de la palada, tono grave = fin**. Funciona sin conexión, como PWA y como app Android (APK).

- **PWA:** <https://lsantome.github.io/Ritmo-Remada/> (se publica con cada push a `main`; disponible cuando se active GitHub Pages en los ajustes del repositorio)
- **APK:** pestaña [Releases](https://github.com/lsantome/Ritmo-Remada/releases) del repositorio

## Qué hace

- **Cadencia (BPM):** de 10 a 80 paladas por minuto.
- **Fin de remada (%):** posición del tono grave dentro del ciclo. A 30 BPM y 50 %, hay un tono de inicio cada 2 s y el de fin llega 1 s después, justo en medio de dos inicios. Al 25 % llega 0,5 s después del inicio.
- **Ajustes:** frecuencia de los tonos de inicio y de fin (deslizadores verticales con nota musical), volumen general y tema claro/oscuro (claro por defecto).
- **Idioma:** español e inglés. Usa el del dispositivo (español si el dispositivo lo prefiere; en cualquier otro caso, inglés) y se puede cambiar en Ajustes → Idioma (Auto · Español · English).
- **Modo Pro:** una lista de intervalos con duración (5 s a 60 min) y cadencia propias, hasta 30. Antes del final de cada intervalo suenan 4 tonos agudos muy seguidos, a 10 s, a 5 s y al terminar (los avisos de 10 s y 5 s solo se dan si el intervalo dura más de esos segundos). Al acabar el último intervalo la sesión se detiene sola. El % de fin de remada es común a toda la sesión.
- **En el APK:** la pantalla no se apaga mientras la app está abierta y se mantiene en vertical.

## Instalación

**PWA (Android):** abre la URL en Chrome → *Instalar aplicación*. **iPhone:** Safari → Compartir → *Añadir a pantalla de inicio*. Tras la primera carga funciona sin conexión.

**APK:** descarga `ritmo-remada-X.Y.Z.apk` de la última Release e instálalo (Android pedirá permitir la instalación desde el navegador o el gestor de archivos). Las versiones nuevas se instalan encima de la anterior porque se firman siempre con la misma clave.

## Datos y privacidad

La app no envía nada a ningún servidor: los ajustes (BPM, %, frecuencias, volumen, tema, idioma, lista del modo Pro) se guardan solo en el dispositivo. **La PWA y el APK son instalaciones distintas y no comparten esos datos.**

## Limitaciones conocidas

- Con la pantalla apagada o la app en segundo plano, el sistema puede cortar el audio. No hay servicio en primer plano.
- Probado en Chromium y compilado para Android; **no verificado en un dispositivo real** en esta estructura del repositorio.

## Desarrollo

Requisitos: Node ≥ 22. Para Android además JDK 21 y el SDK de Android (plataforma 36 y build-tools 36.0.0) con `ANDROID_HOME` definido. Detalles en [`docs/ANDROID.md`](docs/ANDROID.md).

```bash
npm ci                    # dependencias (solo Capacitor, para Android)
npm test                  # pruebas: planificadores de audio, PWA, versión, Android y seguridad
npm run build:pwa         # dist/site: lo que se publica en Pages, con versión y caché selladas
npm run build:android-web # dist/app: la web que entra en el APK
npm run android:debug     # APK de depuración → android/app/build/outputs/apk/debug/
npm run android:release   # APK y AAB de release (firmados si hay clave configurada)
```

Estructura: `index.html`, `manifest.webmanifest`, `sw.js`, `icons/` y `fonts/` en la raíz (es la app, sin dependencias ni paso de compilación para usarla) · `scripts/` build y versión · `tests/` pruebas (`tests/e2e/`, de navegador y opcionales) · `android/` proyecto Capacitor · `.github/workflows/` CI.

Para probar en local sin construir: `python3 -m http.server 8000` en la raíz y abrir `http://localhost:8000/`. La versión mostrada en Ajustes será «desarrollo».

## Versiones

La versión vive en `package.json`. Cada construcción la sella junto al hash del commit y la fecha, y se ve al final de Ajustes (`v1.4.0 · build abc1234 · 2026-10-23`). Historial en [`CHANGELOG.md`](CHANGELOG.md). Para publicar una versión, ver [`docs/ANDROID.md`](docs/ANDROID.md#publicar-una-versión).

## Licencia

MIT
