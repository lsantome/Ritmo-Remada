import asyncio
from playwright.async_api import async_playwright
import os; S=os.environ.get('OUT_DIR','/tmp/ritmo-e2e/'); os.makedirs(S,exist_ok=True)
URL=os.environ.get('BASE_URL','http://localhost:8766/')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        ctx=await b.new_context(viewport={'width':400,'height':860},device_scale_factor=2,has_touch=True)
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(500)
        vis=lambda sel: pg.evaluate(f"!document.querySelector('{sel}').hidden")
        print('Pro desactivado por defecto -> Cadencia visible:',await vis('#bpmPanel'),'| lista visible:',await vis('#proList'))
        await pg.click('#openSettings'); await pg.wait_for_timeout(250)
        print('interruptor:',await pg.get_attribute('#proSwitch','aria-checked'),'| "Probar aviso" visible:',await vis('#testWarn'))
        await pg.screenshot(path=S+'pro-settings-off.png')
        await pg.click('#proSwitch'); await pg.wait_for_timeout(200)
        print('interruptor ON:',await pg.get_attribute('#proSwitch','aria-checked'),'| "Probar aviso" visible:',await vis('#testWarn'))
        await pg.click('#testWarn'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=S+'pro-settings-on.png')
        await pg.click('#backBtn'); await pg.wait_for_timeout(300)
        print('Pro ON en principal -> Cadencia:',await vis('#bpmPanel'),'| estado:',await vis('#proStatus'),'| lista:',await vis('#proList'),'| filas:',await pg.evaluate("document.querySelectorAll('#ivRows .iv').length"))
        txt=lambda sel: pg.inner_text(sel)
        print('reposo:',await txt('#proState'),'|',await txt('#proClock'),'|',(await txt('#proNext')),'|',await txt('#proLeft'),'| play:',(await txt('#playSub')))
        await pg.screenshot(path=S+'pro-main-idle.png',full_page=True)
        # +5 s con un toque
        row=pg.locator('#ivRows .iv').first
        await row.locator('[data-a="sec+"]').click(); 
        print('duración 1 tras un toque en + :',await row.locator('[data-v="sec"]').inner_text(),'(esperado 2:05)')
        # mantener pulsado 2 s -> acelera (5 s, luego 15 s, luego 60 s por repetición)
        bx=await row.locator('[data-a="sec+"]').bounding_box()
        await pg.mouse.move(bx['x']+bx['width']/2,bx['y']+bx['height']/2); await pg.mouse.down(); await pg.wait_for_timeout(2000); await pg.mouse.up()
        print('duración 1 tras mantener 2 s:',await row.locator('[data-v="sec"]').inner_text())
        await row.locator('[data-a="bpm+"]').click(); await row.locator('[data-a="bpm+"]').click()
        print('cadencia 1 tras 2 toques en + :',await row.locator('[data-v="bpm"]').inner_text(),'(esperado 26)')
        # límites
        for _ in range(60): await row.locator('[data-a="bpm+"]').click()
        print('cadencia máxima:',await row.locator('[data-v="bpm"]').inner_text(),'(límite 80)')
        # añadir y eliminar
        await pg.click('#addIv'); await pg.click('#addIv')
        vals=await pg.evaluate("[...document.querySelectorAll('#ivRows .iv')].map(r=>r.querySelector('[data-v=sec]').textContent+'@'+r.querySelector('[data-v=bpm]').textContent)")
        print('tras añadir 2:',vals,'(el nuevo copia al anterior)')
        await pg.locator('#ivRows .iv').nth(1).locator('.iv-del').click()
        vals2=await pg.evaluate("[...document.querySelectorAll('#ivRows .iv')].map(r=>r.querySelector('.iv-title').textContent+' '+r.querySelector('[data-v=sec]').textContent+'@'+r.querySelector('[data-v=bpm]').textContent)")
        print('tras eliminar el 2º:',vals2)
        print('total:',await txt('#ivTotal'))
        # un solo intervalo: no se puede borrar
        for _ in range(5):
            n=await pg.evaluate("document.querySelectorAll('#ivRows .iv').length")
            if n<=1: break
            await pg.locator('#ivRows .iv').first.locator('.iv-del').click()
        print('último intervalo: botón eliminar deshabilitado =',await pg.locator('#ivRows .iv').first.locator('.iv-del').is_disabled())
        await pg.click('#addIv'); await pg.click('#addIv')
        # persistencia
        await pg.wait_for_timeout(400); await pg.reload(); await pg.wait_for_timeout(500)
        print('tras recargar -> Pro:',await vis('#proList'),'| filas:',await pg.evaluate("document.querySelectorAll('#ivRows .iv').length"),'| guardado:',(await pg.evaluate("localStorage.getItem('ritmo-remada-v1')"))[:200])
        # límite de 30
        for _ in range(40):
            if await pg.locator('#addIv').is_disabled(): break
            await pg.click('#addIv')
        print('máximo de intervalos:',await pg.evaluate("document.querySelectorAll('#ivRows .iv').length"),'| "+" deshabilitado:',await pg.locator('#addIv').is_disabled())
        # desactivar Pro vuelve a la vista clásica
        await pg.click('#openSettings'); await pg.click('#proSwitch'); await pg.click('#backBtn'); await pg.wait_for_timeout(250)
        print('Pro OFF -> Cadencia:',await vis('#bpmPanel'),'| lista:',await vis('#proList'),'| BPM clásico:',await txt('#bpmOut'))
        print('errores:',errs or 'ninguno')
        await b.close()
asyncio.run(main())
