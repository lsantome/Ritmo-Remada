"""La versión es visible en Ajustes. En desarrollo: «Versión: desarrollo»; en una construcción: «vX.Y.Z · build hash · fecha»."""
import asyncio, os, re, sys
from playwright.async_api import async_playwright
URL = os.environ.get('BASE_URL', 'http://localhost:8766/')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 400, 'height': 860})).new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL + '#ajustes')
        await pg.wait_for_selector('#verOut', state='attached')
        txt = (await pg.inner_text('#verOut')).strip()
        print('versión mostrada:', txt)
        ok = txt == 'Versión: desarrollo' or re.fullmatch(r'v\d+\.\d+\.\d+ · build [0-9a-f]{7}|local · \d{4}-\d{2}-\d{2}', txt) or re.fullmatch(r'v\d+\.\d+\.\d+ · build (?:[0-9a-f]{7}|local) · \d{4}-\d{2}-\d{2}', txt)
        print('errores de página:', errs or 'ninguno')
        await b.close()
        sys.exit(0 if ok and not errs else 1)
asyncio.run(main())
