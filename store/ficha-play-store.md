# Ficha de Google Play · Ritmo de Remada

Texto listo para pegar en Play Console (*Crecimiento ▸ Presencia en la tienda ▸ Ficha de tienda principal*). Los límites los vigila `npm test` (`tests/store.test.js`): nombre 30, descripción breve 80, completa 4.000, novedades 500 caracteres. Cada campo va en su bloque de código; la prueba lee esos bloques.

El nombre de la app no se traduce (es la misma en los dos idiomas).

## Español (es-ES) — idioma predeterminado

### Nombre
```text
Ritmo de Remada
```

### Descripción breve
```text
Metrónomo de remo para interiorizar ritmos. Interior, exterior y sin conexión.
```

### Descripción completa
```text
Ritmo de Remada es un metrónomo de dos tonos para deportes de remo. Ayuda a interiorizar ritmos y a sincronizar a la tripulación, tanto en interior como en exterior.

• Tono agudo = inicio de la palada.
• Tono grave = fin de la palada.

Así toda la tripulación oye cuándo entrar y cuándo terminar, sin mirar la pantalla.

CADENCIA Y FIN DE REMADA
• Cadencia de 10 a 80 paladas por minuto.
• Posición del tono grave ajustable (% del ciclo). Con 30 paladas/min y 50 %, hay un tono de inicio cada 2 s y el de fin llega 1 s después, justo en medio de dos inicios.

SONIDO A TU MEDIDA
• Frecuencia de cada tono con deslizadores verticales que muestran la nota musical.
• Volumen general.
• Tema claro u oscuro.

MODO PRO: ENTRENAMIENTOS POR INTERVALOS
• Hasta 30 intervalos, cada uno con su duración (de 5 s a 60 min) y su cadencia.
• Aviso sonoro (4 tonos agudos seguidos) a 10 s, a 5 s y al terminar cada intervalo.
• La sesión se detiene sola al acabar el último intervalo.
• Botón «Borrar todos» para vaciar la lista de una vez, con «Deshacer».

INTERIOR Y EXTERIOR
• Sirve en ergómetro, tanque y gimnasio, y también en el agua.
• Funciona sin conexión.
• Sin anuncios, sin cuentas y sin recopilar datos: tus ajustes se guardan en tu dispositivo.
• La pantalla permanece encendida mientras la app está abierta y se mantiene en vertical.
• Español e inglés: usa el idioma del dispositivo y puedes cambiarlo en Ajustes.

IMPORTANTE
Mantén la app abierta y en pantalla durante la sesión. Si el sistema apaga la pantalla o la envía a segundo plano, puede cortar el audio.

Ritmo de Remada es software libre (licencia MIT). Código y novedades: https://github.com/lsantome/Ritmo-Remada
```

### Novedades
```text
Novedades 1.6.0: la app ya está en español e inglés (usa el idioma del dispositivo; se cambia en Ajustes). Nuevo botón «Borrar todos» en el modo Pro, con «Deshacer».
```

## English (en-US) — traducción

### Name
```text
Ritmo de Remada
```

### Short description
```text
Two-tone rowing metronome to learn rhythm and sync crews, indoors and outdoors.
```

### Full description
```text
Ritmo de Remada is a two-tone metronome for rowing sports. It helps you internalize rhythms and keeps a crew in sync, both indoors and outdoors.

• High tone = start of the stroke.
• Low tone = end of the stroke.

The whole crew hears when to catch and when to finish, without looking at the screen.

STROKE RATE AND END OF STROKE
• Stroke rate from 10 to 80 strokes per minute.
• Adjustable position of the low tone (% of the cycle). At 30 spm and 50 %, a start tone sounds every 2 s and the end tone comes 1 s later, exactly halfway between two starts.

SOUND YOUR WAY
• Pitch of each tone with vertical sliders that show the musical note.
• Master volume.
• Light or dark theme.

PRO MODE: INTERVAL TRAINING
• Up to 30 intervals, each with its own duration (5 s to 60 min) and stroke rate.
• Audible warning (4 quick high tones) at 10 s, at 5 s and at the end of each interval.
• The session stops by itself when the last interval ends.
• "Clear all" button to empty the list in one tap, with "Undo".

INDOORS AND OUTDOORS
• Works on an ergometer, in a rowing tank, in the gym and on the water.
• Works offline.
• No ads, no accounts and no data collection: your settings are stored on your device.
• The screen stays on while the app is open, in portrait.
• English and Spanish: it follows your device language and you can change it in Settings.

IMPORTANT
Keep the app open and on screen during your session. If the system turns the screen off or sends the app to the background, it may cut the audio.

Ritmo de Remada is free software (MIT license). Source code and release notes: https://github.com/lsantome/Ritmo-Remada
```

### What's new
```text
What's new in 1.6.0: the app is now available in English and Spanish (it follows your device language; change it in Settings). New "Clear all" button in Pro mode, with "Undo".
```

## Datos de la app (Play Console ▸ Contenido de la app)

| Campo | Valor |
|---|---|
| Tipo / precio | Aplicación · Gratuita |
| Categoría | Deportes (alternativa: Música y audio) |
| Correo de contacto | El tuyo; se muestra públicamente en la ficha |
| Política de privacidad | `https://lsantome.github.io/Ritmo-Remada/privacidad.html` (comprueba que carga antes de pegarla) |
| Anuncios | No |
| Acceso a la app | Toda la funcionalidad disponible sin registro |
| Público objetivo | 13 años o más (no marcar menores de 13 evita la política de Familias) |
| Clasificación de contenido | Cuestionario: «No» a violencia, sexo, drogas, juego, contenido de usuarios, ubicación compartida y compras |
| Seguridad de los datos | No se recopilan ni se comparten datos |
| ¿Noticias / salud / finanzas / gobierno? | No |

## Gráficos (en esta carpeta)

| Elemento | Archivo | Requisito de Play |
|---|---|---|
| Icono | `icono-512.png` | PNG 512×512, cuadrado y sin esquinas redondeadas |
| Gráfico de funciones | `grafico-funciones-1024x500.png` | PNG/JPG 1024×500 |
| Capturas (español) | `captura-es-*.png` | 2–8 capturas, 1080 px de ancho y unos 1920 de alto |
| Capturas (inglés) | `captura-en-*.png` | Para la traducción al inglés |

Las capturas y el gráfico se generan con `python3 store/generar-material.py` (ver la guía). Son del navegador con la interfaz real, no del APK instalado: si quieres, sustitúyelas por capturas reales de tu móvil.
