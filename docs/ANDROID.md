# Android (Capacitor)

La app Android es la misma web de la raíz del repositorio empaquetada con [Capacitor](https://capacitorjs.com/) 8.5.3. `npm run build:android-web` genera `dist/app` (sin service worker) y `cap sync` la copia al proyecto `android/`.

- **Identidad:** `es.trainera.ritmo`. No se cambia: es lo que Android usa para reconocer una actualización.
- **Versión:** `versionName` = `version` de `package.json`; `versionCode` = `major*10000 + minor*100 + patch` (1.4.0 → 10400). No puede bajar nunca.
- **Mínimo Android 7.0 (API 24).** `compileSdk` y `targetSdk` 36.

## Funciones nativas (no perder al tocar el proyecto)

| Función | Dónde |
|---|---|
| Pantalla siempre encendida mientras la app está abierta | `MainActivity.java` (`FLAG_KEEP_SCREEN_ON`) |
| Vertical fijo | `AndroidManifest.xml` (`screenOrientation="portrait"`) |
| Barras del sistema y fondo del color del tema (claro/oscuro) | `RitmoNativePlugin.java`; la página lo llama con `Capacitor.Plugins.RitmoNative.setTheme({dark})` |
| Sin service worker dentro de la app | `index.html` (detecta `window.Capacitor` y el sufijo `RitmoRemadaApp/1.0` del user agent, que añade `capacitor.config.json`) |
| Mismo origen interno que el APK anterior (`https://appassets.androidplatform.net`) | `capacitor.config.json` → `server.hostname` |

Se conserva el permiso `INTERNET` que Capacitor añade por defecto; la app no hace ninguna petición de red.

## Compilar en local

Requisitos: Node ≥ 22, **JDK 21** (el JDK que trae Android Studio puede ser más nuevo y no ser compatible con este Gradle), SDK de Android con `platforms;android-36` y `build-tools;36.0.0`, y `ANDROID_HOME` apuntando al SDK.

```bash
npm ci
npm run android:debug        # android/app/build/outputs/apk/debug/app-debug.apk
```

El APK de depuración usa la clave de depuración de tu máquina: sirve para probar, no para repartir.

**Release firmado en local.** Crea `android/keystore.properties` (está ignorado por Git; nunca lo subas):

```properties
storeFile=../ruta/a/ritmo-remada.keystore
storePassword=…
keyAlias=ritmo
keyPassword=…
```

y ejecuta `npm run android:release` → `app-release.apk` y `app-release.aab` en `android/app/build/outputs/`. Sin ese fichero (y sin las variables de entorno `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) se genera un `app-release-unsigned.apk`, que no se puede instalar.

## La clave de firma

Android solo instala una versión nueva **encima** de la anterior si las dos están firmadas con la misma clave. Si la pierdes o la cambias, hay que desinstalar la app (y se pierden sus datos) o publicar una app distinta.

- **Una clave por app. Nunca dentro del repositorio.** `.gitignore`, las pruebas (`npm test`) y `android.yml` lo vigilan.
- **Es la clave que ya firma las versiones 1.1 a 1.4 del APK** (alias `ritmo`). Hay que **reutilizarla**. El fichero `ritmo-remada.keystore` viaja en el zip de proyecto que se entregó con esas versiones; su huella SHA-256 era `a97d6e0dbbc0ecd672e4444a0c90cc558f445df1db41647ef17babc029e0721b` (sirve para comprobar que es el fichero correcto; deja de coincidir si cambias su contraseña).
- **Copia de seguridad fuera del PC** (gestor de contraseñas o similar): el fichero, el alias y las contraseñas. Es lo único irrecuperable del proyecto.
- **La contraseña original es débil.** Se puede cambiar sin cambiar la clave (la firma y la identidad no se alteran), y `keytool` la pide por teclado, sin dejarla en el historial del terminal:

  ```bash
  keytool -storepasswd -keystore ritmo-remada.keystore
  keytool -keypasswd -alias ritmo -keystore ritmo-remada.keystore
  ```

  Si el almacén es PKCS12 (lo habitual desde JDK 9), la contraseña de la clave y la del almacén suelen ser la misma. Usa una sola y cárgala en los dos secretos.

### Cargar los secretos en GitHub

Repositorio → Settings → Secrets and variables → Actions → *New repository secret*:

| Secreto | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | el keystore codificado en base64 (ver abajo) |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del almacén |
| `ANDROID_KEY_ALIAS` | `ritmo` |
| `ANDROID_KEY_PASSWORD` | contraseña de la clave |

Base64 del keystore:

```bash
base64 -w0 ritmo-remada.keystore            # Linux
base64 -i ritmo-remada.keystore             # macOS
```
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ritmo-remada.keystore")) | Set-Clipboard   # Windows (PowerShell)
```

## Publicar una versión

1. Subir `version` en `package.json` y añadir su entrada en `CHANGELOG.md`.
2. `npm test`; commit; PR; merge a `main`. Eso publica la PWA en Pages.
3. Etiquetar con **el mismo número** y subir la etiqueta:
   ```bash
   git tag v1.4.1
   git push origin v1.4.1
   ```
   `android.yml` comprueba que la etiqueta coincide con `package.json`, que no hay claves versionadas y que existen los 4 secretos; compila, firma, verifica el APK con `apksigner` y adjunta `ritmo-remada-X.Y.Z.apk` y `.aab` a la Release.
4. Para probar sin publicar: Actions → *APK y AAB (Android)* → *Run workflow*. Con secretos genera release firmado; sin ellos, un APK de depuración. Los binarios quedan como artefacto de la ejecución.

## Notas y comprobaciones pendientes en un dispositivo

Compilado y validado (APK de depuración y release firmado con una clave de prueba), pero **no probado en un móvil** con esta estructura:

- **Datos guardados al actualizar desde el APK anterior.** Capacitor sirve por defecto desde `https://localhost`; aquí se fija `server.hostname` al origen que usaba el envoltorio anterior para conservar los ajustes. Si no funciona, los ajustes vuelven a sus valores por defecto.
- **Botón atrás de Android:** debe volver de Ajustes a la pantalla principal (la app usa `#ajustes` en la dirección).
- **Barras del sistema:** con `targetSdk 36`, desde Android 15 la app se dibuja de borde a borde; hay que comprobar que el contenido no queda bajo la barra de estado ni la de navegación, y que el color sigue al tema.
- **Audio con la pantalla apagada o en segundo plano:** Capacitor no lo resuelve. Haría falta un servicio en primer plano.
