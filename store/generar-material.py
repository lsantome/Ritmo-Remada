"""Genera el material gráfico de la ficha de Google Play en esta carpeta (store/):
  icono-512.png · grafico-funciones-1024x500.png · captura-es-*.png · captura-en-*.png

Uso (desde la raíz del repositorio):  npm run build:pwa && python3 store/generar-material.py
Requiere Python con Pillow y Playwright (Chromium). Sirve dist/site en un puerto local libre.

Las capturas son de la interfaz real en el navegador (móvil de 412×732 px a escala 2,62 = 1080 px de ancho, unos 1920 de alto),
no del APK instalado."""
import asyncio, base64, json, os, shutil, socket, subprocess, sys, time
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

RAIZ = Path(__file__).resolve().parent.parent
STORE = RAIZ / 'store'
SITE = RAIZ / 'dist' / 'site'
KEY = 'ritmo-remada-v1'

# Entrenamiento de ejemplo para el modo Pro (6 intervalos, 17 min en total).
PRO = [{'sec': 120, 'bpm': 24}, {'sec': 240, 'bpm': 28}, {'sec': 180, 'bpm': 32},
       {'sec': 120, 'bpm': 36}, {'sec': 240, 'bpm': 28}, {'sec': 120, 'bpm': 22}]


def puerto_libre():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


def icono():
    """El icono de Play es cuadrado a sangre: Play le aplica su propia máscara."""
    im = Image.open(RAIZ / 'icons' / 'icon-maskable-512.png').convert('RGB')
    assert im.size == (512, 512)
    im.save(STORE / 'icono-512.png', optimize=True)


def font_b64(nombre):
    return base64.b64encode((RAIZ / 'fonts' / nombre).read_bytes()).decode()


async def grafico(browser):
    f700 = font_b64('barlow-condensed-latin-700-normal.woff2')
    f500 = font_b64('barlow-latin-500-normal.woff2')
    icono_b64 = base64.b64encode((STORE / 'icono-512.png').read_bytes()).decode()
    html = f"""<!doctype html><meta charset=utf-8><style>
@font-face{{font-family:C;font-weight:700;src:url(data:font/woff2;base64,{f700}) format('woff2')}}
@font-face{{font-family:B;font-weight:500;src:url(data:font/woff2;base64,{f500}) format('woff2')}}
html,body{{margin:0;width:1024px;height:500px;background:#0c2430;color:#f4fafb;overflow:hidden}}
.fila{{position:absolute;left:70px;top:0;height:500px;display:flex;align-items:center;gap:56px}}
img{{width:230px;height:230px;border-radius:48px}}
h1{{font:700 92px/0.95 C;margin:0;letter-spacing:.5px}}
p{{font:500 34px/1.3 B;margin:18px 0 0;color:#b9d3dc;max-width:640px}}
.barra{{position:absolute;left:0;right:0;bottom:0;height:14px;display:flex}}
.barra i{{flex:1;background:#ff8a2b}} .barra i+i{{background:#52c2ee}}
</style><div class=fila><img src="data:image/png;base64,{icono_b64}"><div>
<h1>Ritmo de Remada</h1><p>Rowing metronome · Metrónomo de remo</p></div></div>
<div class=barra><i></i><i></i></div>"""
    pg = await browser.new_page(viewport={'width': 1024, 'height': 500})
    await pg.set_content(html)
    await pg.wait_for_timeout(300)
    await pg.screenshot(path=str(STORE / 'grafico-funciones-1024x500.png'))
    await pg.close()
    im = Image.open(STORE / 'grafico-funciones-1024x500.png').convert('RGB'); im.save(STORE / 'grafico-funciones-1024x500.png', optimize=True)


async def capturas(browser, base):
    # (idioma, prefijo, tema, [(nombre, preparación)])
    casos = [
        ('es-ES', 'es', 'light', ['1-principal', '2-ajustes', '3-modo-pro', '4-borrar-todos']),
        ('en-US', 'en', 'dark', ['1-main', '2-pro-mode']),
    ]
    for locale, pref, tema, nombres in casos:
        ctx = await browser.new_context(locale=locale, viewport={'width': 412, 'height': 732},
                                        device_scale_factor=1080 / 412, has_touch=True, is_mobile=True)
        await ctx.add_init_script("""if(!sessionStorage.__sembrado){sessionStorage.__sembrado=1;localStorage.setItem('%s',%s)}""" % (
            KEY, json.dumps(json.dumps({'theme': tema, 'lang': 'auto', 'bpm': 30, 'frac': 50, 'pro': False}))))
        pg = await ctx.new_page()
        await pg.goto(base); await pg.wait_for_timeout(500)

        async def salir(n):
            await pg.wait_for_timeout(350)
            ruta = STORE / f'captura-{pref}-{n}.png'
            await pg.screenshot(path=str(ruta))
            Image.open(ruta).convert('RGB').save(ruta, optimize=True)   # Play no admite transparencia
            print('OK', ruta.name, Image.open(ruta).size)

        async def activar_pro():
            await pg.click('#openSettings'); await pg.click('#proSwitch'); await pg.click('#backBtn')
            await pg.wait_for_timeout(300)
            await pg.evaluate("""p => { const S = JSON.parse(localStorage.getItem('%s')); S.intervals = p; S.pro = true; localStorage.setItem('%s', JSON.stringify(S)); }""" % (KEY, KEY), PRO)
            await pg.reload(); await pg.wait_for_timeout(500)

        for n in nombres:
            if n in ('1-principal', '1-main'):
                await salir(n)
            elif n == '2-ajustes':
                await pg.click('#openSettings'); await salir(n)
                await pg.click('#backBtn')
            elif n in ('3-modo-pro', '2-pro-mode'):
                await activar_pro(); await salir(n)
            elif n == '4-borrar-todos':
                await pg.locator('#proList').scroll_into_view_if_needed()
                await pg.locator('#clearIv').scroll_into_view_if_needed(); await salir(n)
        await ctx.close()


async def main():
    if not (SITE / 'index.html').exists():
        sys.exit('Falta dist/site: ejecuta antes «npm run build:pwa».')
    STORE.mkdir(exist_ok=True)
    icono()
    puerto = puerto_libre()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(puerto), '--bind', '127.0.0.1'], cwd=SITE,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            b = await p.chromium.launch()
            await grafico(b)
            await capturas(b, f'http://127.0.0.1:{puerto}/')
            await b.close()
    finally:
        srv.terminate(); srv.wait()


asyncio.run(main())
