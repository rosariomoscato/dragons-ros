import {test,expect} from "@playwright/test";
import {beats,windowFor} from "../../lib/game";
const keys={left:"ArrowLeft",right:"ArrowRight",up:"ArrowUp",down:"ArrowDown",action:"Space"};
test("livello completo, otto QTE da tastiera e record persistente",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/");
 await expect(page.getByRole("button",{name:"Avvia la missione"})).toBeEnabled();
 await page.screenshot({path:"/tmp/signal-lost-desktop.png",fullPage:true,animations:"disabled"});
 await page.clock.install();
 await page.getByRole("button",{name:"Avvia la missione"}).click();
 const stage=page.getByRole("region",{name:"Scena di gioco"});
 for(let i=0;i<beats.length;i++){
  await expect(stage).toHaveAttribute("data-index",String(i));
  await page.clock.runFor(beats[i].introMs+100);
  await expect(stage).toHaveAttribute("data-phase","cue");
  if(i===0)await page.screenshot({path:"/tmp/signal-lost-gameplay.png",fullPage:true,animations:"disabled"});
  await page.keyboard.press(keys[beats[i].correct]);
  await expect(stage).toHaveAttribute("data-phase","success");
  await page.clock.runFor(1800);
 }
 await expect(page.getByRole("dialog",{name:"Missione completata"})).toBeVisible();
 const best=await page.evaluate(()=>Number(localStorage.getItem("signal-lost-best-story")));
 expect(best).toBeGreaterThan(2200);expect(best).toBeLessThanOrEqual(2400);
 await page.getByRole("button",{name:"Torna al menu"}).click();
 await expect(stage).toHaveAttribute("data-phase","menu");
 await page.reload();
 await expect(page.locator(".below-stage")).toContainText(String(best));
 expect(errors).toEqual([]);
});
test("pausa congela la scelta; timeout, game over e nuovo tentativo",async({page})=>{
 await page.goto("/");await expect(page.getByRole("button",{name:"Avvia la missione"})).toBeEnabled();
 await page.getByRole("button",{name:/Arcade/}).click();
 await page.clock.install();await page.getByRole("button",{name:"Avvia la missione"}).click();
 const stage=page.getByRole("region",{name:"Scena di gioco"});
 await page.clock.runFor(beats[0].introMs+100);
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"Sistema in pausa"})).toBeVisible();
 const remaining=await page.getByRole("progressbar").getAttribute("aria-valuenow");
 await page.clock.runFor(15000);
 expect(await page.getByRole("progressbar").getAttribute("aria-valuenow")).toEqual(remaining);
 await page.getByRole("button",{name:"Riprendi la missione"}).click();
 await page.clock.runFor(windowFor("arcade")+100);
 await expect(stage).toHaveAttribute("data-phase","failure");
 await expect(page.getByLabel("2 vite rimaste")).toBeVisible();
 await page.clock.runFor(2100);
 for(let i=0;i<2;i++){
  await page.clock.runFor(beats[0].introMs+100);await page.keyboard.press("ArrowLeft");
  await expect(stage).toHaveAttribute("data-phase","failure");await page.clock.runFor(2100);
 }
 await expect(page.getByRole("dialog",{name:"Connessione interrotta"})).toBeVisible();
 await page.getByRole("button",{name:"Riprova dal checkpoint"}).click();
 await expect(stage).toHaveAttribute("data-phase","intro");await expect(page.getByLabel("3 vite rimaste")).toBeVisible();
});
test("mobile: pulsante touch, istruzioni e nessuno scorrimento orizzontale",async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto("/");await expect(page.getByRole("button",{name:"Avvia la missione"})).toBeEnabled();
 await page.screenshot({path:"/tmp/signal-lost-mobile.png",fullPage:true,animations:"disabled"});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole("button",{name:"Come si gioca"}).tap();await expect(page.locator("#how-to")).toBeVisible();
 await page.getByRole("button",{name:"Chiudi istruzioni"}).tap();
 await page.clock.install();await page.getByRole("button",{name:"Avvia la missione"}).tap();
 await page.clock.runFor(beats[0].introMs+100);
 await page.getByRole("button",{name:"Salta",exact:true}).tap();
 await expect(page.getByRole("region",{name:"Scena di gioco"})).toHaveAttribute("data-phase","success");
 await page.setViewportSize({width:320,height:740});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await context.close();
});
test("cambio di visibilità mette in pausa; audio e storage sono opzionali",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage unavailable");}});});
 await page.goto("/");await expect(page.getByRole("button",{name:"Avvia la missione"})).toBeEnabled();
 await page.getByRole("button",{name:"Disattiva audio"}).click();
 await expect(page.getByRole("button",{name:"Attiva audio"})).toHaveAttribute("aria-pressed","false");
 await page.clock.install();await page.getByRole("button",{name:"Avvia la missione"}).click();
 await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"));});
 await expect(page.getByRole("dialog",{name:"Sistema in pausa"})).toBeVisible();
 await page.clock.runFor(10000);
 await expect(page.getByRole("region",{name:"Scena di gioco"})).toHaveAttribute("data-phase","intro");
 expect(errors).toEqual([]);
});
