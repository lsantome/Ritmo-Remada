# Publicar «Ritmo de Remada» en Google Play

Guía en orden. Lo marcado con ⚠️ es lo que más suele salir mal. Nada de esto se ha ejecutado contra Play Console: los requisitos de Google cambian a menudo, así que **confirma cada uno en tu panel** (fuentes al final).

## 0. Qué hay ya preparado y qué falta

| Pieza | Estado | Dónde |
|---|---|---|
| AAB firmado | Se genera al subir una etiqueta `vX.Y.Z` | Release de GitHub (`ritmo-remada-X.Y.Z.aab`) |
| Textos de la ficha (español e inglés) | Listos; `npm test` vigila los límites de Play | `store/ficha-play-store.md` |
| Icono 512×512, gráfico 1024×500, capturas | Listos (generados desde la interfaz real en el navegador) | `store/` |
| Política de privacidad | Escrita; **falta tu correo** y publicarla | `privacidad.html` → `https://lsantome.github.io/Ritmo-Remada/privacidad.html` |
| Cuenta de desarrollador de Play | **Falta** | — |
| Capturas del APK en tu móvil | Opcional; sustituyen a las del navegador | — |

Para regenerar los gráficos tras cambiar la interfaz: `npm run build:pwa && python3 store/generar-material.py` (Python con Pillow y Playwright).

## 1. Política de privacidad (antes de nada)

Play la exige y debe ser una **URL pública** que cargue sin iniciar sesión.

1. Abre `privacidad.html` y sustituye `[CORREO DE CONTACTO]` y `[CONTACT EMAIL]` por tu correo. **Play muestra públicamente el correo de contacto de la ficha**: usa una dirección dedicada, no la personal.
2. Súbelo a `main` por PR. El workflow *Pages* publica el fichero junto con la web.
3. Abre `https://lsantome.github.io/Ritmo-Remada/privacidad.html` en el navegador y comprueba que carga, **antes** de pegarla en Play Console.
4. Si algún día la app añade analíticas, anuncios o cualquier conexión, hay que reescribirla **y** cambiar la declaración de seguridad de los datos. `tests/store.test.js` falla si `index.html` empieza a usar red.

## 2. Cuenta de desarrollador de Google Play

- Cuota **única de 25 USD**, con tarjeta. Mayor de 18 años.
- **Personal** u **organización** (esta exige número D-U-N-S, gratuito pero puede tardar hasta 30 días). Verificación de identidad y de contacto; puede tardar varios días.
- Las cuentas personales deben demostrar que tienen un dispositivo Android desde la app móvil de Play Console.
- **UE:** Play pide declarar si actúas como comerciante; si lo declaras, publica tu dirección y teléfono. Decídelo con la ayuda de Play y tu situación.

⚠️ **Cuentas personales creadas después del 13/11/2023:** antes de publicar en producción hay que hacer una **prueba cerrada con al menos 12 testers inscritos de forma continua durante 14 días** y solicitar el acceso a producción (paso 7). Si tu cuenta es anterior o de organización puede no aplicarte; compruébalo en tu panel.

## 3. Firma: la decisión que no se puede deshacer

La app ya está repartida como APK firmado con tu clave (alias `ritmo`; ver [ANDROID.md](ANDROID.md)). Con **Play App Signing**, Google firma lo que reciben los usuarios de Play y tu clave pasa a ser la **clave de subida**.

⚠️ **Consecuencia:** si dejas que Google genere su propia clave de firma, quien tenga el APK instalado a mano **no podrá actualizar desde Play** (la firma es distinta) y tendrá que desinstalar y reinstalar, perdiendo los ajustes de ese dispositivo. Creo que la consola permite aportar tu clave actual en el primer envío para evitarlo, pero **no lo he verificado** y la elección no se puede cambiar después. Decide antes de subir el primer AAB:

- Si los usuarios del APK son pocos y avisables: deja que Google genere la clave (lo habitual) y pídeles que reinstalen desde Play.
- Si no quieres que nadie reinstale: aporta tu clave en el primer envío (sigue las instrucciones de «Usar una clave de firma existente» de la consola).

Guarda siempre el keystore, el alias y las contraseñas **fuera del PC**. Nunca los subas al repositorio.

## 4. Crear la app en Play Console

**Todas las apps ▸ Crear app**: nombre «Ritmo de Remada», idioma **es-ES**, **App** (no juego), **Gratuita**, y acepta las declaraciones. El `applicationId` es `es.trainera.ritmo` y **no se puede cambiar** una vez publicado.

## 5. Ficha de la tienda

1. **Ficha principal (es-ES):** pega los textos de `store/ficha-play-store.md` (sección Español).
2. Sube `store/icono-512.png`, `store/grafico-funciones-1024x500.png` y las capturas `store/captura-es-*.png`.
3. **Añadir traducción ▸ English (en-US):** pega la sección English y sube `store/captura-en-*.png`.
4. Categoría **Deportes**, correo de contacto, sitio web (opcional) y URL de la política (paso 1).

⚠️ Las capturas son del navegador con la interfaz real. Si quieres, sustitúyelas por capturas del APK instalado en tu móvil.

## 6. «Contenido de la app»

Respuestas previstas, en la tabla de `store/ficha-play-store.md`: anuncios **No**; acceso **sin registro**; público **13 años o más**; clasificación de contenido con cuestionario («No» a todo); **seguridad de los datos: no se recopilan ni se comparten datos**; noticias, salud, finanzas y gobierno: **No**.

La declaración se apoya en el código: `index.html` no usa red y la app solo depende de Capacitor, sin plugins. Dos matices que conviene conocer:

- El manifiesto declara el permiso `INTERNET` (viene por defecto con Capacitor). La app no lo usa para enviar datos; Play lo mostrará en la ficha. Quitarlo sería una mejora para una versión futura, y habría que probarlo en un móvil real.
- `android:allowBackup="true"`: Android puede incluir los ajustes (BPM, tema, lista de intervalos…) en la copia de seguridad de la cuenta de Google del usuario. El desarrollador no tiene acceso a esa copia, y la política de privacidad lo dice. Si quieres evitarlo, `allowBackup="false"` es un cambio de código aparte.

## 7. Prueba cerrada y producción

1. **Pruebas ▸ Prueba cerrada ▸ Crear versión** y sube el `ritmo-remada-X.Y.Z.aab` de la Release.
2. Crea una lista de testers (correos de Google o un grupo de Google) y comparte el **enlace de aceptación**.
3. Si tu cuenta lo exige, necesitas **≥12 testers que acepten y se mantengan 14 días seguidos**. Recluta 15–20 para tener margen: si bajas de 12 el contador se reinicia.
4. Que **usen la app de verdad**: el formulario de acceso a producción pregunta por el feedback recibido.
5. Cuando se cumpla: **Panel ▸ Solicitar acceso a producción** y responde las secciones del formulario. La revisión puede tardar días y cumplir los números no garantiza la aprobación.
6. **Producción ▸ Crear versión**: sube el AAB (con `versionCode` mayor que el de la prueba), añade las notas de la versión y envía a revisión.

⚠️ **API objetivo:** Play exige apuntar al nivel de Android vigente para apps nuevas y actualizaciones; este proyecto usa `targetSdk = 36`. Confirma el requisito actual en la consola y mantén Capacitor y el SDK al día.

## 8. Actualizar la app más adelante

1. Edita `index.html` en una rama; sube `version` en `package.json` y añade la entrada en `CHANGELOG.md`.
2. PR y merge a `main` (la web se publica sola en Pages).
3. Etiqueta `vX.Y.Z` **igual que `package.json`** y súbela: `android.yml` genera APK y AAB firmados y los adjunta a la Release (ver [ANDROID.md](ANDROID.md)).
4. Sube ese AAB a Play Console en una versión nueva. Los cambios de Pages **no llegan** a la app de Play: cada cambio exige una versión nueva.
5. Si cambia la interfaz, regenera los gráficos (`store/generar-material.py`) y revisa que las capturas y la ficha siguen siendo ciertas.

## 9. Pruebas que debes hacer en un móvil real (no se han ejecutado)

Ordenadas por riesgo:

1. **Audio con pantalla apagada o app en segundo plano:** el sistema puede cortarlo (no hay servicio en primer plano). La ficha ya lo avisa; comprueba qué ocurre en tu móvil y con el ahorro de batería.
2. **Idioma:** con el móvil en español la app arranca en español; con otro idioma distinto de español e inglés, en inglés. Prueba también el selector de Ajustes.
3. **Actualización sobre la versión anterior:** instala el APK nuevo sobre uno viejo y comprueba que los ajustes y la lista Pro siguen ahí.
4. **Botón Atrás** en Ajustes y barras del sistema (arriba y abajo) en un móvil con muesca.
5. **Pantalla encendida** durante varios minutos con la sesión en marcha.

## 10. Riesgos que conviene conocer

- **«Funcionalidad mínima».** Google puede rechazar apps que sean un simple envoltorio de una web. Esta funciona sin conexión y mantiene la pantalla encendida y en vertical, pero **no puedo garantizar la aprobación**. Si la rechazaran, pide revisión explicando la funcionalidad.
- **WebView desactualizado.** La app usa el «Android System WebView» del móvil; el mínimo configurado es Android 7.0 (API 24).
- **Datos locales.** Desinstalar o «Borrar datos» elimina los ajustes.

## Fuentes oficiales

- [Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Información requerida para crear la cuenta](https://support.google.com/googleplay/android-developer/answer/13628312)
- [Requisitos de prueba para cuentas personales nuevas](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Capacitor – Android](https://capacitorjs.com/docs/android)
