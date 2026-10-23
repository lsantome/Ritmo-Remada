import asyncio, numpy as np
from playwright.async_api import async_playwright
import os; URL=os.environ.get('BASE_URL','http://localhost:8766/'); SR=48000
import os; S=os.environ.get('OUT_DIR','/tmp/ritmo-e2e/'); os.makedirs(S,exist_ok=True)
INIT="""(()=>{class OAC extends OfflineAudioContext{constructor(){super(1,Math.floor(48000*1.0),48000);window.__ctx=this}resume(){return Promise.resolve()}}
window.AudioContext=OAC;window.webkitAudioContext=OAC})();"""
def met(x,t0):
    seg=x[int(t0*SR):int(t0*SR)+int(0.38*SR)]; peak=float(np.max(np.abs(seg)))
    rms=20*np.log10(np.sqrt(np.mean(seg[:int(.1*SR)]**2))+1e-12)
    f=seg[:int(.08*SR)]*np.hanning(int(.08*SR)); sp=np.abs(np.fft.rfft(f,8192))**2; fr=np.fft.rfftfreq(8192,1/SR)
    return peak,rms,float(np.sum(fr*sp)/np.sum(sp))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        # 1) UI sin selector + ajustes antiguos con otro tipo (bell) no rompen nada
        ctx=await b.new_context(viewport={'width':400,'height':800},device_scale_factor=2,has_touch=True)
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        await pg.goto(URL)
        await pg.evaluate("localStorage.setItem('ritmo-remada-v1',JSON.stringify({bpm:45,frac:40,fs:1700,fe:350,tone:'bell',ts:'wood',te:'drum',vol:70,theme:'light'}))")
        await pg.reload(); await pg.wait_for_timeout(500)
        txt=await pg.evaluate("document.body.innerText")
        print('ajustes antiguos cargados:', await pg.inner_text('#bpmOut'), await pg.inner_text('#fracOut'), '| Hz', await pg.inner_text('#fsOut'), await pg.inner_text('#feOut'))
        print('elementos de sonido en la página -> #types:', await pg.evaluate("!!document.getElementById('types')"), '| texto "Campana/Tambor/Sonido":', any(w in txt for w in ['Campana','Tambor','Sonido','Bombo']))
        await pg.screenshot(path=S+'v4-main.png',full_page=True)
        await pg.click('#openSettings'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=S+'v4-settings.png',full_page=True)
        print('secciones de ajustes:', await pg.evaluate("[...document.querySelectorAll('#viewSettings .sec-h')].map(e=>e.textContent)"))
        await pg.evaluate("window.scrollTo(0,document.body.scrollHeight)")
        box=await pg.locator('#backBtn').bounding_box(); print('Volver visible con scroll:', 0<=box['y']<800)
        await pg.click('#themeDark'); await pg.click('#backBtn'); await pg.wait_for_timeout(300)
        print('Volver -> principal:', not await pg.evaluate("document.getElementById('viewMain').hidden"), '| tema:', await pg.evaluate("document.documentElement.dataset.theme"))
        await pg.click('#playBtn'); await pg.wait_for_timeout(2600); print('marcha:', await pg.inner_text('#playLabel')); await pg.click('#playBtn')
        print('guardado:', await pg.evaluate("(()=>new Promise(r=>setTimeout(()=>r(localStorage.getItem('ritmo-remada-v1')),400)))()"))
        await pg.goto(URL); await pg.wait_for_timeout(1500); await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(600)
        print('offline:', await pg.title(), '| errores:', errs or 'ninguno')
        await ctx.close()
        # 2) audio real renderizado: Pitido con las frecuencias por defecto (inicio 1400 / fin 440)
        res={}
        for key,sel in (('inicio','#fsSlider'),('fin','#feSlider')):
            c=await b.new_context(viewport={'width':400,'height':800}); await c.add_init_script(INIT)
            q=await c.new_page(); e2=[]; q.on('pageerror',lambda e:e2.append(str(e)))
            await q.goto(URL+'#ajustes'); await q.wait_for_timeout(300)
            await q.focus(sel); await q.keyboard.press('ArrowUp'); await q.keyboard.press('ArrowDown')   # suelta un cambio -> reproduce prueba
            data=await q.evaluate("window.__ctx.startRendering().then(b=>Array.from(b.getChannelData(0)))")
            x=np.array(data,dtype=np.float32)
            # dos pruebas encadenadas en t=0.03: medimos la primera
            res[key]=(met(x,0.03),e2); await c.close()
        for k,(m,e2) in res.items(): print(f'pitido {k}: pico {m[0]:.2f} | RMS {m[1]:.1f} dB | centroide {m[2]:.0f} Hz', e2 or '')
        await b.close()
asyncio.run(main())
