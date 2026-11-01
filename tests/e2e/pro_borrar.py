"""Modo Pro: «Borrar todos» deja un intervalo de partida, se puede deshacer y respeta el bloqueo en sesión.
Falla (código de salida ≠ 0) si alguna comprobación no se cumple."""
import asyncio, os, sys
from playwright.async_api import async_playwright

URL = os.environ.get('BASE_URL', 'http://localhost:8766/')
fallos = []


def chk(nombre, ok, detalle=''):
    print(('OK  ' if ok else 'FALLO ') + nombre + (' · ' + str(detalle) if detalle != '' else ''))
    if not ok:
        fallos.append(nombre)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(locale='es-ES', viewport={'width': 360, 'height': 780}, has_touch=True)   # los textos que comprueba están en español
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(URL)
        await pg.wait_for_timeout(400)
        await pg.click('#openSettings'); await pg.click('#proSwitch'); await pg.click('#backBtn')
        await pg.wait_for_timeout(300)

        filas = lambda: pg.evaluate("[...document.querySelectorAll('#ivRows .iv')].map(r=>r.querySelector('[data-v=sec]').textContent+'@'+r.querySelector('[data-v=bpm]').textContent)")
        guardado = lambda: pg.evaluate("JSON.parse(localStorage.getItem('ritmo-remada-v1')).intervals.length")
        btn = pg.locator('#clearIv')

        for _ in range(4):
            await pg.click('#addIv')
        antes = await filas()
        chk('lista de partida con 6 intervalos', len(antes) == 6, antes)
        chk('botón visible y habilitado', await btn.is_visible() and await btn.is_enabled(), await btn.text_content())

        # Borrar con una sola pulsación
        await btn.click()
        tras = await filas()
        chk('una pulsación deja un solo intervalo de partida (2:00 @ 24)', tras == ['2:00@24'], tras)
        chk('el total se actualiza', (await pg.inner_text('#ivTotal')) == 'Total 2:00', await pg.inner_text('#ivTotal'))
        await pg.wait_for_timeout(400)   # el guardado se retrasa 250 ms
        chk('el borrado se guarda', await guardado() == 1)
        chk('el botón pasa a «Deshacer»', (await btn.text_content()) == 'Deshacer' and await btn.is_enabled(), await btn.text_content())
        chk('«Eliminar» del único intervalo sigue deshabilitado', await pg.locator('#ivRows .iv-del').first.is_disabled())

        # Deshacer recupera la lista exacta
        await btn.click()
        rec = await filas()
        chk('«Deshacer» recupera la lista completa', rec == antes, rec)
        await pg.wait_for_timeout(400)
        chk('lo recuperado también se guarda', await guardado() == 6)
        chk('el botón vuelve a «Borrar todos»', (await btn.text_content()) == 'Borrar todos', await btn.text_content())

        # Editar tras borrar invalida el «Deshacer» (restaurarlo pisaría el cambio)
        await btn.click()
        await pg.locator('#ivRows .iv').first.locator('[data-a="bpm+"]').click()
        chk('editar tras borrar quita el «Deshacer»', (await btn.text_content()) == 'Borrar todos', await btn.text_content())
        chk('con el intervalo editado, «Borrar todos» sigue disponible', await btn.is_enabled())
        await btn.click()
        chk('borrar de nuevo restablece el intervalo de partida', await filas() == ['2:00@24'])

        # Con la lista ya de partida no hay nada que borrar
        await pg.wait_for_timeout(8300)
        chk('a los 8 s caduca el «Deshacer»', (await btn.text_content()) == 'Borrar todos', await btn.text_content())
        chk('con la lista de partida el botón está deshabilitado', await btn.is_disabled())

        # Añadir invalida el «Deshacer»
        await pg.click('#addIv'); await pg.click('#addIv')
        await btn.click()
        await pg.click('#addIv')
        chk('añadir tras borrar quita el «Deshacer»', (await btn.text_content()) == 'Borrar todos')

        # En sesión, bloqueado
        await pg.click('#playBtn'); await pg.wait_for_timeout(300)
        n0 = len(await filas())
        await btn.evaluate('b => b.click()')   # salta el CSS bloqueado: prueba la guarda del código
        chk('con la sesión en marcha no borra nada', len(await filas()) == n0, n0)
        await pg.click('#playBtn')

        # Persistencia tras recargar
        await pg.wait_for_timeout(300); await pg.reload(); await pg.wait_for_timeout(500)
        chk('tras recargar la lista se conserva', len(await filas()) == n0)
        chk('sin errores de página', not errs, errs[:3])
        await b.close()

asyncio.run(main())
if fallos:
    print('\n%d comprobaciones fallidas' % len(fallos)); sys.exit(1)
print('\nTodo correcto')
