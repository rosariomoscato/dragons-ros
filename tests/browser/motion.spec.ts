import {test,expect} from '@playwright/test';
import {beats} from '../../lib/game';
import {successMs} from '../../lib/motion';

test('salto articolato, ombra a terra e pausa che congela anche l’animazione',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();
 await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();
 await page.clock.runFor(beats[0].introMs+100);await page.keyboard.press('ArrowUp');
 await page.locator('.actor-success .robot-flight').waitFor();
 await page.evaluate(t=>document.querySelector('.milo')!.getAnimations({subtree:true}).forEach(a=>{a.currentTime=t}),successMs*.4);
 const pose=await page.evaluate(()=>{
  const actor=document.querySelector('.milo')!;
  const y=(s:string)=>new DOMMatrix(getComputedStyle(actor.querySelector(s)!).transform).m42;
  const arm=getComputedStyle(actor.querySelector('[data-part="armFront"]')!).transform;
  const body=getComputedStyle(actor.querySelector('[data-part="body"]')!).transform;
  return {flight:y('.robot-flight'),shadow:y('.ground-track'),arm,body};
 });
 expect(pose.flight).toBeLessThan(-50);expect(pose.shadow).toBe(0);
 expect(pose.arm).not.toBe(pose.body);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Sistema in pausa'})).toBeVisible();
 const before=await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).map(a=>({time:a.currentTime,state:a.playState})));
 expect(before.every(a=>a.state==='paused')).toBe(true);
 await page.clock.runFor(12000);
 const after=await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).map(a=>({time:a.currentTime,state:a.playState})));
 expect(after).toEqual(before);
 await page.getByRole('button',{name:'Riprendi la missione'}).click();
 expect(await page.evaluate(()=>document.querySelector('.milo')!.getAnimations({subtree:true}).every(a=>a.playState==='running'))).toBe(true);
});

test('movimento ridotto: posa leggibile e nessun effetto rapido',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();
 await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();
 await page.clock.runFor(beats[0].introMs+100);await page.keyboard.press('ArrowUp');
 await expect(page.locator('.actor-success')).toBeVisible();
 const animationStates=await page.evaluate(()=>document.querySelector('.robot-flight')!.getAnimations({subtree:true}).map(a=>a.playState));
 expect(animationStates.every(s=>s==='paused')).toBe(true);
 await expect(page.locator('.shot-effects')).toBeHidden();
 await page.clock.runFor(successMs+100);
 await expect(page.getByRole('region',{name:'Scena di gioco'})).toHaveAttribute('data-index','1');
});
