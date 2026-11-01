"""Idiomas español/inglés en navegador: detección según el dispositivo, selector en Ajustes, persistencia,
textos sin mezclar, formatos, modo Pro en marcha y desbordes de pantalla. Falla (código ≠ 0) si algo no se cumple."""
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

URL = os.environ.get('BASE_URL', 'http://localhost:8766/')
OUT = os.environ.get('OUT_DIR', '/tmp/ritmo-e2e/')
os.makedirs(OUT, exist_ok=True)
fallos = []

ES_WORDS = re.compile(r'\b(intervalo|intervalos|cadencia|iniciar|parar|ajustes|volver|remada|recobro|volumen|tema|claro|oscuro|borrar|deshacer|añadir|siguiente|quedan|palada|paladas|hercios|duración|frecuencia|inicio|agudo|grave|aviso|sesión|eliminar|subir|bajar|apariencia|probar|tonos)\b', re.I)
EN_WORDS = re.compile(r'\b(interval|intervals|stroke|strokes|start|stop|settings|back|drive|recovery|volume|theme|light|dark|clear|undo|add|next|remaining|session|decrease|increase|delete|duration|frequency|high|low|warning|test|appearance|master|tones)\b', re.I)

# Textos visibles y etiquetas accesibles (excluye lo bilingüe a propósito: el selector de idioma y su título)
COLECTA = """() => {
  const out = [];
  document.querySelectorAll('body *').forEach(el => {
    if (el.matches('#viewMain h1') || el.closest('#langAuto,#langEs,#langEn') || (el.classList.contains('sec-h') && /Language/.test(el.textContent)) || el.closest('[aria-label="Idioma · Language"]')) return;
    if (['SCRIPT','STYLE'].includes(el.tagName)) return;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) out.push(n.textContent.trim());
    for (const a of ['aria-label','aria-valuetext','title']) { const v = el.getAttribute(a); if (v) out.push(v); }
  });
  return out;
}"""


def chk(nombre, ok, detalle=''):
    print(('OK  ' if ok else 'FALLO ') + nombre + (' · ' + str(detalle) if detalle != '' else ''))
    if not ok:
        fallos.append(nombre)


async def contexto(b, locale, langs=None, ancho=360, storage=None):
    ctx = await b.new_context(locale=locale, viewport={'width': ancho, 'height': 780}, has_touch=True)
    if langs:
        await ctx.add_init_script("Object.defineProperty(navigator,'languages',{get:()=>%s})" % json.dumps(langs))
    if storage is not None:
        await ctx.add_init_script("if(!sessionStorage.getItem('__seed')){localStorage.setItem('ritmo-remada-v1',%s);sessionStorage.setItem('__seed','1')}" % json.dumps(json.dumps(storage)))
    pg = await ctx.new_page()
    pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.on('console', lambda m: pg.errs.append(m.text) if m.type == 'error' else None)
    await pg.goto(URL)
    await pg.wait_for_timeout(350)
    return ctx, pg


async def textos(pg):
    return await pg.evaluate(COLECTA)


async def activar_pro(pg):
    await pg.click('#openSettings'); await pg.click('#proSwitch'); await pg.click('#backBtn')
    await pg.wait_for_timeout(250)


async def desborde(pg):
    return await pg.evaluate("""() => {
      const w = document.documentElement.clientWidth, malos = [];
      if (document.documentElement.scrollWidth > w + 1) malos.push('página ' + document.documentElement.scrollWidth + '>' + w);
      document.querySelectorAll('.app *').forEach(el => {
        if (el.closest('.slider') || el.closest('svg') || el.hidden) return;
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > w + 1 || r.left < -1)) malos.push((el.id || el.className || el.tagName) + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') malos.push('recortado ' + (el.id || el.className));
      });
      return malos.slice(0, 6);
    }""")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

        # 1) Detección por idioma del dispositivo
        casos = [('es-ES', None, 'es'), ('es-MX', None, 'es'), ('en-US', None, 'en'), ('en-GB', None, 'en'),
                 ('fr-FR', None, 'en'), ('de-DE', None, 'en'), ('ca-ES', ['ca-ES', 'es-ES'], 'es'), ('ja-JP', None, 'en')]
        for loc, langs, esperado in casos:
            ctx, pg = await contexto(b, loc, langs)
            lang = await pg.evaluate('document.documentElement.lang')
            titulo = (await pg.inner_text('#bpmTitle')).strip().lower()
            chk('dispositivo %s %s → %s' % (loc, langs or '', esperado), lang == esperado and titulo == ('cadencia' if esperado == 'es' else 'stroke rate'), '%s / %s' % (lang, titulo))
            await ctx.close()

        # 2) Textos sin mezclar, en las tres pantallas, en cada idioma
        for loc, esperado, malas in (('es-ES', 'es', EN_WORDS), ('en-US', 'en', ES_WORDS)):
            ctx, pg = await contexto(b, loc)
            await activar_pro(pg)
            for _ in range(2): await pg.click('#addIv')
            todo = await textos(pg)                                 # principal con modo Pro
            await pg.click('#openSettings'); await pg.wait_for_timeout(250)
            todo += await textos(pg)                                # ajustes
            await pg.screenshot(path=OUT + 'idioma-%s-ajustes.png' % esperado, full_page=True)
            await pg.click('#testWarn'); await pg.click('#backBtn'); await pg.wait_for_timeout(250)
            await pg.click('#playBtn'); await pg.wait_for_timeout(1200)
            todo += await textos(pg)                                # sesión en marcha
            await pg.screenshot(path=OUT + 'idioma-%s-pro-en-marcha.png' % esperado, full_page=True)
            await pg.click('#playBtn')
            mezcla = sorted({t for t in todo if malas.search(t)})
            chk('sin mezclar idiomas (%s)' % esperado, not mezcla, mezcla[:8])
            chk('sin errores de página (%s)' % esperado, not pg.errs, pg.errs[:2])
            await ctx.close()

        # 3) Formatos y notas
        ctx, pg = await contexto(b, 'en-US')
        chk('inglés: decimal con punto', (await pg.inner_text('#cycleLen')) == '2.00 s per stroke', await pg.inner_text('#cycleLen'))
        chk('inglés: notas con letras (1400 Hz = F6)', (await pg.inner_text('#chipS')).replace('\n', ' ').strip().endswith('F6'), await pg.inner_text('#chipS'))
        chk('inglés: "ends at" en el botón', (await pg.inner_text('#playSub')) == '30 BPM · ends at 50 %', await pg.inner_text('#playSub'))
        vt = await pg.get_attribute('#fsSlider', 'aria-valuetext')
        chk('inglés: texto accesible del deslizador', vt == '1400 hertz, F6', vt)
        await ctx.close()
        ctx, pg = await contexto(b, 'es-ES')
        chk('español: decimal con coma', (await pg.inner_text('#cycleLen')) == '2,00 s por palada', await pg.inner_text('#cycleLen'))
        chk('español: notas en solfeo (Fa6)', (await pg.inner_text('#chipS')).replace('\n', ' ').strip().endswith('Fa6'), await pg.inner_text('#chipS'))
        vt = await pg.get_attribute('#fsSlider', 'aria-valuetext')
        chk('español: texto accesible del deslizador', vt == '1400 hercios, Fa6', vt)
        await ctx.close()

        # 4) Selector: cambio inmediato, persistencia y vuelta a «Auto»
        ctx, pg = await contexto(b, 'en-US')
        await pg.click('#openSettings'); await pg.wait_for_timeout(200)
        chk('selector: «Auto» marcado al empezar', await pg.get_attribute('#langAuto', 'aria-pressed') == 'true')
        await pg.click('#langEs'); await pg.wait_for_timeout(150)
        chk('selector: Español cambia al instante', (await pg.inner_text('#viewSettings h1')).strip().lower() == 'ajustes' and await pg.evaluate('document.documentElement.lang') == 'es')
        chk('selector: Español queda marcado', await pg.get_attribute('#langEs', 'aria-pressed') == 'true' and await pg.get_attribute('#langAuto', 'aria-pressed') == 'false')
        await pg.wait_for_timeout(400)
        guardado = await pg.evaluate("JSON.parse(localStorage.getItem('ritmo-remada-v1')).lang")
        chk('selector: se guarda en el ajuste existente', guardado == 'es', guardado)
        await pg.close(); pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(350)
        chk('persistencia: tras recargar sigue en español aunque el dispositivo esté en inglés', await pg.evaluate('document.documentElement.lang') == 'es')
        await pg.click('#openSettings'); await pg.click('#langEn'); await pg.wait_for_timeout(150)
        chk('selector: English cambia al instante', (await pg.inner_text('#viewSettings h1')).strip().lower() == 'settings')
        await pg.click('#langAuto'); await pg.wait_for_timeout(150)
        chk('selector: «Auto» vuelve al idioma del dispositivo (inglés)', await pg.evaluate('document.documentElement.lang') == 'en' and await pg.get_attribute('#langAuto', 'aria-pressed') == 'true')
        await ctx.close()

        # 5) Datos guardados antes de existir el idioma: se respetan y el idioma es «auto»
        ctx, pg = await contexto(b, 'fr-FR', storage={'bpm': 42, 'frac': 40, 'theme': 'dark'})
        chk('datos antiguos sin «lang»: se conservan', await pg.inner_text('#bpmOut') == '42' and await pg.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark')
        chk('datos antiguos sin «lang»: idioma automático (inglés en un dispositivo francés)', await pg.evaluate('document.documentElement.lang') == 'en')
        await ctx.close()
        ctx, pg = await contexto(b, 'en-US', storage={'bpm': 55, 'lang': 'zz'})
        chk('valor de idioma inválido guardado: se ignora', await pg.evaluate('document.documentElement.lang') == 'en' and await pg.inner_text('#bpmOut') == '55')
        await ctx.close()

        # 6) Cambio de idioma con una sesión Pro en marcha y fin de sesión en inglés
        ctx, pg = await contexto(b, 'en-US', storage={'pro': True, 'intervals': [{'sec': 5, 'bpm': 30}]})
        chk('Pro en inglés: estado de reposo', (await pg.text_content('#proState')) == 'Interval 1 of 1' and (await pg.text_content('#proNext')) == 'Single interval', await pg.text_content('#proState'))
        await pg.click('#playBtn'); await pg.wait_for_timeout(900)
        chk('Pro en inglés: botón «Stop»', (await pg.inner_text('#playLabel')).strip().lower() == 'stop')
        chk('Pro en inglés: subtítulo en marcha', re.fullmatch(r'Interval 1/1 · \d:\d\d · 30 BPM', await pg.inner_text('#playSub')) is not None, await pg.inner_text('#playSub'))
        await pg.click('#openSettings'); await pg.click('#langEs'); await pg.click('#backBtn'); await pg.wait_for_timeout(300)
        chk('cambio en marcha: la sesión sigue y se traduce', (await pg.inner_text('#playLabel')).strip().lower() == 'parar' and (await pg.text_content('#proState')).startswith('Intervalo 1 de 1'), await pg.text_content('#proState'))
        await pg.click('#openSettings'); await pg.click('#langEn'); await pg.click('#backBtn')
        await pg.wait_for_timeout(5500)
        chk('Pro en inglés: «Session finished» al terminar', (await pg.text_content('#proState')) == 'Session finished', await pg.text_content('#proState'))
        chk('Pro en inglés: botón vuelve a «Start»', (await pg.inner_text('#playLabel')).strip().lower() == 'start')
        await ctx.close()

        # 7) «Borrar todos» / «Deshacer» en los dos idiomas
        ctx, pg = await contexto(b, 'en-US')
        await activar_pro(pg)
        btn = pg.locator('#clearIv')
        chk('inglés: «Clear all»', (await btn.text_content()) == 'Clear all', await btn.text_content())
        await btn.click()
        chk('inglés: «Undo»', (await btn.text_content()) == 'Undo' and await btn.get_attribute('aria-label') == 'Undo: restore the cleared intervals')
        await pg.click('#openSettings'); await pg.click('#langEs'); await pg.click('#backBtn'); await pg.wait_for_timeout(200)
        chk('cambiar de idioma con «Deshacer» activo lo conserva (y lo traduce)', (await btn.text_content()) == 'Deshacer', await btn.text_content())
        await btn.click()
        chk('«Deshacer» restaura la lista tras cambiar de idioma', await pg.evaluate("document.querySelectorAll('#ivRows .iv').length") == 2)
        await ctx.close()

        # 8) Desbordes de pantalla en ambos idiomas y varios anchos
        for loc, nombre in (('es-ES', 'es'), ('en-US', 'en')):
            for ancho in (320, 360, 412):
                ctx, pg = await contexto(b, loc, ancho=ancho)
                await activar_pro(pg)
                malos = await desborde(pg)
                await pg.click('#openSettings'); await pg.wait_for_timeout(200)
                malos += await desborde(pg)
                if ancho == 360:
                    await pg.screenshot(path=OUT + 'idioma-%s-%d-ajustes.png' % (nombre, ancho), full_page=True)
                await pg.click('#backBtn'); await pg.wait_for_timeout(200)
                if ancho == 360:
                    await pg.screenshot(path=OUT + 'idioma-%s-%d-principal.png' % (nombre, ancho), full_page=True)
                chk('sin desbordes a %d px (%s)' % (ancho, nombre), not malos, malos[:4])
                await ctx.close()

        await b.close()

asyncio.run(main())
if fallos:
    print('\n%d comprobaciones fallidas' % len(fallos)); sys.exit(1)
print('\nTodo correcto')
