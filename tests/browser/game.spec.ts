import {test,expect,type Page} from '@playwright/test';
import {beats,windowFor,transitionMs,type Step} from '../../lib/game';
import {failureMs} from '../../lib/motion';
const keys={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',action:'Space'};
export async function playCommand(page:Page,command:Step,final=false){
 if(command.holdMs){await page.keyboard.down(keys[command.action]);await page.clock.runFor(command.holdMs+50);await page.keyboard.up(keys[command.action]);}
 else await page.keyboard.press(keys[command.action]);
 await expect(page.getByRole('region',{name:'Scena di gioco'})).toHaveAttribute('data-phase','success');
 const ms=final?1500:command.action==='up'?1050:command.action==='action'?850:800;
 await page.clock.runFor(ms+50);
}
export async function playBeat(page:Page,index:number){
 await page.clock.runFor(beats[index].introMs+50);
 for(let j=0;j<3;j++)await playCommand(page,beats[index].sequence[j],index===7&&j===2);
 if(index<7)await page.clock.runFor(transitionMs+50);
}
test('livello completo, 24 comandi e record persistente',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();
 await page.screenshot({path:'/tmp/signal-lost-desktop.png',fullPage:true,animations:'disabled'});
 await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();
 const stage=page.getByRole('region',{name:'Scena di gioco'});
 for(let i=0;i<beats.length;i++){await expect(stage).toHaveAttribute('data-index',String(i));await playBeat(page,i);}
 await expect(page.getByRole('dialog',{name:'Missione completata'})).toBeVisible();
 await expect(stage).toHaveAttribute('data-combo','24');
 const best=await page.evaluate(()=>Number(localStorage.getItem('signal-lost-best-v2-story')));
 expect(best).toBeGreaterThan(8000);expect(best).toBeLessThanOrEqual(9400);
 await page.getByRole('button',{name:'Torna al menu'}).click();await page.reload();
 await expect(page.locator('.below-stage')).toContainText(String(best));expect(errors).toEqual([]);
});
test('pausa congela la scelta; timeout, game over e checkpoint',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();
 await page.getByRole('button',{name:/Arcade/}).click();await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();
 const stage=page.getByRole('region',{name:'Scena di gioco'});await page.clock.runFor(beats[0].introMs+50);await page.keyboard.press('Escape');
 const remaining=await page.getByRole('progressbar').getAttribute('aria-valuenow');await page.clock.runFor(15000);
 expect(await page.getByRole('progressbar').getAttribute('aria-valuenow')).toEqual(remaining);
 await page.getByRole('button',{name:'Riprendi la missione'}).click();await page.clock.runFor(windowFor('arcade')+50);
 await expect(stage).toHaveAttribute('data-phase','failure');await expect(page.getByLabel('2 vite rimaste')).toBeVisible();
 await page.clock.runFor(failureMs+50);
 for(let n=0;n<2;n++){await page.clock.runFor(beats[0].introMs+50);await page.keyboard.press('ArrowLeft');await page.clock.runFor(failureMs+50);}
 await expect(page.getByRole('dialog',{name:'Connessione interrotta'})).toBeVisible();
 await page.getByRole('button',{name:'Riprova dal checkpoint'}).click();await expect(stage).toHaveAttribute('data-phase','intro');await expect(page.getByLabel('3 vite rimaste')).toBeVisible();
});
test('mobile: touch, sequenza, istruzioni e viewport da 390 e 320 px',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();
 await page.screenshot({path:'/tmp/signal-lost-mobile.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Come si gioca'}).tap();await expect(page.locator('#how-to')).toBeVisible();await page.getByRole('button',{name:'Chiudi istruzioni'}).tap();
 await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).tap();await page.clock.runFor(beats[0].introMs+50);
 await expect(page.getByRole('list',{name:'Sequenza dell’ostacolo'})).toBeVisible();
 await page.getByRole('button',{name:'Salta',exact:true}).tap();await expect(page.getByRole('region',{name:'Scena di gioco'})).toHaveAttribute('data-phase','success');
 await page.clock.runFor(1100);await page.getByRole('button',{name:'Azione',exact:true}).tap();
 await expect(page.getByRole('region',{name:'Scena di gioco'})).toHaveAttribute('data-combo','2');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await context.close();
});
test('scorciatoia cambia sequenza e tempo di reazione',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();
 await playBeat(page,0);await playBeat(page,1);await page.clock.runFor(beats[2].introMs+50);
 await page.getByRole('button',{name:/Scorciatoia/}).click();await page.clock.runFor(850);
 const stage=page.getByRole('region',{name:'Scena di gioco'});await expect(stage).toHaveAttribute('data-route','fast');await expect(stage).toHaveAttribute('data-step','1');
 await expect(page.locator('.cinematic-caption')).toContainText('salta il sensore');await page.keyboard.press('ArrowUp');await expect(stage).toHaveAttribute('data-phase','success');
});
test('cambio di visibilità mette in pausa; audio e storage sono opzionali',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage unavailable');}}));
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();await page.getByRole('button',{name:'Disattiva audio'}).click();
 await expect(page.getByRole('button',{name:'Attiva audio'})).toHaveAttribute('aria-pressed','false');
 await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).click();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.getByRole('dialog',{name:'Sistema in pausa'})).toBeVisible();await page.clock.runFor(10000);expect(errors).toEqual([]);
});
test('ripristino touch: rilascio e pausa interrompono il mantenimento',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 await page.goto('/');await expect(page.getByRole('button',{name:'Avvia la missione'})).toBeEnabled();await page.clock.install();await page.getByRole('button',{name:'Avvia la missione'}).tap();
 for(let i=0;i<7;i++)await playBeat(page,i);
 await page.clock.runFor(beats[7].introMs+50);
 await playCommand(page,beats[7].sequence[0]);await playCommand(page,beats[7].sequence[1]);
 const button=page.getByRole('button',{name:'Azione',exact:true});await button.scrollIntoViewIfNeeded();
 const bounds=(await button.boundingBox())!;const session=await context.newCDPSession(page);
 const down=()=>session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2}]});
 const up=()=>session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const stage=page.getByRole('region',{name:'Scena di gioco'});
 await down();await page.clock.runFor(350);await up();await expect(stage).toHaveAttribute('data-phase','cue');
 expect(await page.locator('.hold-meter i').evaluate(e=>(e as HTMLElement).style.width)).toBe('0%');
 await down();await page.clock.runFor(300);await page.keyboard.press('Escape');await up();
 await expect(page.getByRole('dialog',{name:'Sistema in pausa'})).toBeVisible();await page.clock.runFor(5000);
 await page.getByRole('button',{name:'Riprendi la missione'}).tap();
 await down();await page.clock.runFor(950);await up();await expect(stage).toHaveAttribute('data-phase','success');
 await page.clock.runFor(1550);await expect(page.getByRole('dialog',{name:'Missione completata'})).toBeVisible();await context.close();
});
