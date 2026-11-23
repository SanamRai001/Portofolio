import asyncio
from pathlib import Path
from PIL import Image
from io import BytesIO
from playwright.async_api import async_playwright
from check_portal import inline_html
ROOT=Path(__file__).resolve().parents[1]
async def main():
 frames=[];delays=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  page=await browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  await page.set_content(inline_html(),wait_until='load')
  async def shot(ms):
   blob=await page.screenshot(type='png',animations='allow')
   image=Image.open(BytesIO(blob)).convert('RGB')
   frames.append(image.resize((720,450),Image.Resampling.LANCZOS))
   delays.append(ms)
  await page.wait_for_timeout(200)
  await shot(650)
  await page.get_by_role('link',name='Work / selected projects').click()
  for t in [100,160,190,180,160,170]:
   await page.wait_for_timeout(t)
   await shot(150)
  await page.wait_for_timeout(150)
  await shot(850)
  await page.locator('#backButton').click()
  for t in [160,170,170,210]:
   await page.wait_for_timeout(t);await shot(150)
  await page.wait_for_timeout(170);await shot(800)
  await browser.close()
 frames[0].save(str(ROOT/'cube-portal-motion.gif'),save_all=True,append_images=frames[1:],duration=delays,loop=0,optimize=True)
 print('wrote',ROOT/'cube-portal-motion.gif', 'frames',len(frames))
asyncio.run(main())
