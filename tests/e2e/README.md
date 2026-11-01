# Pruebas de navegador (opcionales, fuera de `npm test`)

Usan Playwright para Python y Chromium. Sirven la app con un servidor local y la ejercitan como un usuario.

```bash
pip install playwright && playwright install chromium
python3 -m http.server 8766 &                 # desde la raíz del repo (o: --directory dist/site)
BASE_URL=http://localhost:8766/ python3 tests/e2e/version_visible.py
```

| Script | Qué comprueba | ¿Falla solo? |
|---|---|---|
| `version_visible.py` | La versión se ve en Ajustes (`desarrollo` o `vX.Y.Z · build hash · fecha`) y no hay errores de página | **Sí** (código de salida ≠ 0) |
| `pro_ui.py` | Modo Pro: duraciones, cadencias, añadir/eliminar intervalos, límites, persistencia | No: imprime resultados para revisarlos |
| `pro_borrar.py` | Modo Pro: «Borrar todos» deja un intervalo de partida, «Deshacer», caducidad, bloqueo en sesión y persistencia | **Sí** (código de salida ≠ 0) |
| `idioma.py` | Español/inglés: detección según el dispositivo, selector, persistencia, textos sin mezclar, modo Pro en marcha y desbordes a 320/360/412 px | **Sí** (código de salida ≠ 0) |
| `audio_pitido.py` | Ajustes, tema, offline y medidas del pitido (pico, RMS, centroide) | No: imprime resultados para revisarlos |

Variables: `BASE_URL` (por defecto `http://localhost:8766/`) y `OUT_DIR` (capturas y datos, por defecto `/tmp/ritmo-e2e/`).

Los scripts que no son `version_visible.py` son comprobaciones de inspección: solo fallan si el navegador no puede completar la acción,
no si un valor impreso es el equivocado. Convertirlos en pruebas con aserciones queda pendiente. La lógica de temporización
(lo más delicado) sí está cubierta con aserciones en `tests/scheduler.test.js`, que forma parte de `npm test`.
