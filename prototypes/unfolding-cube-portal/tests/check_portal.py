import asyncio,json
from pathlib import Path
import base64
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
def inline_html():
 h=ROOT.joinpath('index.html').read_text()
 js=ROOT.joinpath('cube-viewer.js').read_text()
 b64=base64.b64encode(ROOT.joinpath('assets/stone-cube.glb').read_bytes()).decode()
 stub="<script>window.fetch=async (url)=>{if(String(url).includes('stone-cube.glb'))return new Response(Uint8Array.from(atob('"+b64+"'),c=>c.charCodeAt(0)),{status:200}); throw Error('Network blocked');};</script>"
 h=h.replace('<script type="module" src="./cube-viewer.js"></script>',stub+'<script type="module">'+js+'</script>')
 for file in ['stone-cube-fallback.webp']:
  h=h.replace('./assets/'+file,'data:image/webp;base64,'+base64.b64encode(ROOT.joinpath('assets',file).read_bytes()).decode())
 return h
URL=inline_html()
async def main():
 reports=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  for label,width,height in [('desktop',1440,900),('mobile',390,844)]:
   ctx=await browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
   page=await ctx.new_page();errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   await page.set_content(URL,wait_until='load');await page.wait_for_timeout(420)
   await page.screenshot(path=str(ROOT/f'portal-{label}-home.png'),full_page=True)
   await page.get_by_role('link',name='Work / selected projects').click();await page.wait_for_timeout(420)
   midway=await page.evaluate('''() => ({phase:site.dataset.phase, cubeTransform:getComputedStyle(cubeArea).transform,clip:getComputedStyle(portalStage).clipPath,visible:getComputedStyle(portalStage).visibility})''')
   await page.screenshot(path=str(ROOT/f'portal-{label}-opening.png'),full_page=True)
   await page.wait_for_timeout(720)
   done=await page.evaluate('''() => ({phase:site.dataset.phase,view:site.dataset.view,clip:getComputedStyle(portalStage).clipPath,inert:portalStage.inert,active:document.activeElement.id,bodyOverflow:document.body.style.overflow,canvasStatus:window.__cube3d,scrollWidth:document.documentElement.scrollWidth})''')
   await page.screenshot(path=str(ROOT/f'portal-{label}-work.png'),full_page=True)
   await page.go_back();await page.wait_for_timeout(780)
   back=await page.evaluate('''() => ({phase:site.dataset.phase,view:site.dataset.view,inert:portalStage.inert,homeFocusable:!cubeArea.inert})''')
   await page.get_by_role('button',name='Switch to dark mode').click();await page.wait_for_timeout(100)
   await page.screenshot(path=str(ROOT/f'portal-{label}-dark.png'),full_page=True)
   reports.append(dict(layout=label,midway=midway,done=done,back=back,errors=errors,overflow=done['scrollWidth']>width))
   await ctx.close()
  ctx=await browser.new_context(viewport={'width':1024,'height':768},reduced_motion='reduce');page=await ctx.new_page();await page.set_content(URL)
  await page.get_by_role('link',name='Work / selected projects').click();await page.wait_for_timeout(80)
  reports.append(dict(layout='reduced',phase=await page.locator('#site').get_attribute('data-phase'),clip=await page.locator('#portalStage').evaluate('(e)=>getComputedStyle(e).clipPath')))
  await ctx.close()
  ctx=await browser.new_context(viewport={'width':1024,'height':768});page=await ctx.new_page();await page.set_content(URL)
  await page.get_by_role('link',name='Work / selected projects').click();await page.wait_for_timeout(240)
  await page.go_back();await page.wait_for_timeout(850)
  reports.append(dict(layout='interrupted',phase=await page.locator('#site').get_attribute('data-phase'),location=await page.evaluate('location.hash'),visible=await page.locator('#portalStage').evaluate('(e)=>getComputedStyle(e).visibility')))
  await ctx.close();await browser.close()
 ROOT.joinpath('tests/portal-results.json').write_text(json.dumps(reports,indent=2))
 print(json.dumps(reports,indent=2)[:9000])
if __name__ == '__main__':
 asyncio.run(main())
