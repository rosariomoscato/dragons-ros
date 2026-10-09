import {test,expect} from '@playwright/test';
import {beats,transitionMs} from '../../lib/game';
const setup=async(page:import('@playwright/test').Page)=>{await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();await page.clock.runFor(beats[0].introMs+50);};
test('salto articolato, ombra a terra, continuità della posa e pausa',async({page})=>{
 await setup(page);await page.evaluate(()=>{(window as unknown as {robot:Element}).robot=document.querySelector('.milo')!;});
 await page.keyboard.press('ArrowUp');
 await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).forEach(a=>{a.currentTime=480}));
 const pose=await page.evaluate(()=>{const a=document.querySelector('.milo')!;const y=(s:string)=>new DOMMatrix(getComputedStyle(a.querySelector(s)!).transform).m42;return {flight:y('.robot-flight'),shadow:y('.ground-track')};});
 expect(pose.flight).toBeLessThan(-40);expect(pose.shadow).toBe(0);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>Promise.all(document.querySelector('.milo')!.getAnimations({subtree:true}).map(a=>a.ready)));
 const before=await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).map(a=>({time:a.currentTime,state:a.playState})));
 expect(before.every(a=>a.state==='paused')).toBe(true);await page.clock.runFor(5000);
 const after=await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).map(a=>({time:a.currentTime,state:a.playState})));expect(after).toEqual(before);
 await page.getByRole('button',{name:'Riprendi la missione'}).click();
 await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).forEach(a=>{a.currentTime=1050}));
 const x=await page.evaluate(()=>new DOMMatrix(getComputedStyle(document.querySelector('.robot-flight')!).transform).m41);
 await page.clock.runFor(1100);
 expect(await page.evaluate(()=>(window as unknown as {robot:Element}).robot===document.querySelector('.milo'))).toBe(true);
 const nextX=await page.evaluate(()=>new DOMMatrix(getComputedStyle(document.querySelector('.robot-flight')!).transform).m41);
 expect(Math.abs(nextX-x)).toBeLessThan(3);
});
test('movimento ridotto: comandi attivi, posa finale e niente effetti rapidi',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await setup(page);await page.keyboard.press('ArrowUp');
 expect(await page.evaluate(()=>document.querySelector('.robot-flight')!.getAnimations().every(a=>a.playState==='paused'))).toBe(true);
 await expect(page.locator('.shot-effects')).toBeHidden();await page.clock.runFor(1100);
 await expect(page.getByRole('region',{name:'Scena di gioco'})).toHaveAttribute('data-step','1');
});
test('tra settori il fondale si sovrappone e MILO resta la stessa istanza',async({page})=>{
 await setup(page);await page.evaluate(()=>{(window as unknown as {robot:Element}).robot=document.querySelector('.milo')!;});
 const keys={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',action:'Space'};
 for(let i=0;i<2;i++){
  if(i===1)await page.clock.runFor(beats[i].introMs+50);
  for(const command of beats[i].sequence){await page.keyboard.press(keys[command.action]);await page.clock.runFor((command.action==='up'?1050:command.action==='action'?850:800)+50);}
  if(i===0)await page.clock.runFor(transitionMs+50);
 }
 const stage=page.getByRole('region',{name:'Scena di gioco'});await expect(stage).toHaveAttribute('data-phase','transition');
 await page.clock.runFor(transitionMs/2);await expect(stage).toHaveAttribute('data-index','2');
 expect(await page.locator('.scene-layer').count()).toBe(2);
 expect(await page.evaluate(()=>(window as unknown as {robot:Element}).robot===document.querySelector('.milo'))).toBe(true);
 await page.keyboard.press('Escape');
 expect(await page.locator('.sector-wipe').evaluate(e=>getComputedStyle(e).animationPlayState)).toBe('paused');
 await page.clock.runFor(5000);await expect(stage).toHaveAttribute('data-phase','transition');
});
