import {failureMs} from "./motion";
export type Action = "left" | "up" | "right" | "down" | "action";
export type Room = "bridge" | "hall" | "vault" | "core";
export type Step = {action:Action;cue:string;holdMs?:number};
export type Beat = {room:Room;chapter:string;title:string;narration:string;sequence:Step[];alternative?:Step[];success:string;failure:string;introMs:number};
export const actions: {id:Action;symbol:string;label:string;key:string}[] = [
 {id:"left",symbol:"←",label:"Sinistra",key:"← / A"}, {id:"up",symbol:"↑",label:"Salta",key:"↑ / W"},
 {id:"down",symbol:"↓",label:"Abbassati",key:"↓ / S"}, {id:"right",symbol:"→",label:"Destra",key:"→ / D"},
 {id:"action",symbol:"✦",label:"Azione",key:"Spazio"},
];
export const beats:Beat[] = [
 {room:"bridge",chapter:"01 · Settore di attracco",title:"La passerella cede",narration:"NEXUS ha chiuso la stazione. MILO è l’ultima speranza.",introMs:2100,
  sequence:[{action:"up",cue:"La passerella cede. Salta!"},{action:"action",cue:"Afferra il bordo!"},{action:"right",cue:"Scatta via dai detriti!"}],success:"Passerella superata. Non fermarti.",failure:"Gravità: operativa. Passerella: molto meno."},
 {room:"bridge",chapter:"01 · Settore di attracco",title:"Il drone ti ha visto",narration:"Una luce rossa. Il drone ha acquisito il bersaglio.",introMs:300,
  sequence:[{action:"down",cue:"Sotto il laser!"},{action:"right",cue:"Scatta oltre il drone!"},{action:"up",cue:"Salta l’ultimo raggio!"}],success:"Bersaglio perso. Verso il corridoio.",failure:"Il drone non accetta reclami."},
 {room:"hall",chapter:"02 · Corridoio di sicurezza",title:"Scegli il tuo percorso",narration:"Sinistra: al riparo. Destra: una scorciatoia sorvegliata.",introMs:1100,
  sequence:[{action:"left",cue:"Scegli: sinistra al riparo, destra più veloce."},{action:"down",cue:"Passa sotto il sensore!"},{action:"action",cue:"Apri la porta di servizio!"}],
  alternative:[{action:"right",cue:"Scegli: sinistra al riparo, destra più veloce."},{action:"up",cue:"Scorciatoia: salta il sensore!"},{action:"down",cue:"Giù! Il drone ti sta seguendo."}],success:"Percorso aperto. Il sistema ti cerca ancora.",failure:"Riconoscimento facciale riuscito. Purtroppo."},
 {room:"hall",chapter:"02 · Corridoio di sicurezza",title:"La griglia laser",narration:"La griglia si chiude. MILO deve trovare il varco.",introMs:300,
  sequence:[{action:"right",cue:"Scatta nel varco!"},{action:"down",cue:"Scivola sotto la griglia!"},{action:"up",cue:"Supera l’ultimo laser!"}],success:"La sicurezza è alle tue spalle.",failure:"MILO non era progettato per essere affettato."},
 {room:"vault",chapter:"03 · Archivio di memoria",title:"L’ultima copia",narration:"L’ultimo backup sta per sparire. Recuperalo.",introMs:1100,
  sequence:[{action:"right",cue:"Raggiungi il nucleo!"},{action:"action",cue:"Prendi la memoria!"},{action:"left",cue:"Torna al riparo!"}],success:"Backup al sicuro. Il pavimento, meno.",failure:"Operazione scaduta. Anche i robot esitano."},
 {room:"vault",chapter:"03 · Archivio di memoria",title:"Errore critico",narration:"Il refrigerante sale. Restano soltanto tre piattaforme.",introMs:300,
  sequence:[{action:"up",cue:"Salta sulla prima piattaforma!"},{action:"right",cue:"Scatta prima che ceda!"},{action:"up",cue:"Un ultimo salto!"}],success:"Circuiti asciutti. Il cuore di NEXUS è vicino.",failure:"Resistenza all’acqua: non certificata."},
 {room:"core",chapter:"04 · Il cuore di NEXUS",title:"Un occhio nel buio",narration:"«Unità MILO. La tua presenza è un errore.»",introMs:1100,
  sequence:[{action:"left",cue:"Riparati dal raggio!"},{action:"down",cue:"Abbassati. Ti sta cercando!"},{action:"right",cue:"Adesso! Raggiungi il terminale."}],success:"Porta di servizio aperta. È il tuo momento.",failure:"NEXUS ha un modo diretto di correggere gli errori."},
 {room:"core",chapter:"04 · Il cuore di NEXUS",title:"Segnale ritrovato",narration:"Un’ultima connessione può salvare l’intero equipaggio.",introMs:300,
  sequence:[{action:"right",cue:"Avvicinati alla porta di servizio!"},{action:"action",cue:"Inserisci il nucleo di memoria!"},{action:"action",cue:"Tieni premuta Azione per ripristinare NEXUS!",holdMs:900}],success:"Segnale ritrovato. La stazione respira di nuovo.",failure:"Non mollare proprio adesso, MILO."},
];
export const transitionMs=800;
export const checkpointFor=(index:number)=>Math.floor(index/2)*2;
export const windowFor=(mode:"story"|"arcade")=>mode==="story"?3000:1700;
export const scoreFor=(remaining:number,duration:number)=>100+Math.round(Math.max(0,Math.min(1,remaining/duration))*200);
export function actionForKey(key:string):Action|null {
 const keys:Record<string,Action>={ArrowLeft:"left",a:"left",ArrowUp:"up",w:"up",ArrowRight:"right",d:"right",ArrowDown:"down",s:"down"," ":"action"};
 return keys[key.length===1?key.toLowerCase():key]??null;
}
export type Phase="menu"|"intro"|"cue"|"success"|"transition"|"failure"|"gameover"|"complete";
export type GameState={phase:Phase;index:number;step:number;lives:number;score:number;remaining:number;mode:"story"|"arcade";paused:boolean;
 checkpointScore:number;beatScore:number;combo:number;maxCombo:number;grade:"perfetto"|"buono"|null;route:"safe"|"fast"|null;
 holding:boolean;holdElapsed:number;lastAction:Action|null;travel:number;beatTravel:number;nextIndex:number|null;transitionRoom:boolean};
export const initialState:GameState={phase:"menu",index:0,step:0,lives:3,score:0,remaining:0,mode:"story",paused:false,
 checkpointScore:0,beatScore:0,combo:0,maxCombo:0,grade:null,route:null,holding:false,holdElapsed:0,lastAction:null,travel:0,beatTravel:0,nextIndex:null,transitionRoom:false};
export const sequenceFor=(state:GameState)=>state.index===2&&state.route==="fast"?beats[2].alternative!:beats[state.index].sequence;
export const stepFor=(state:GameState)=>sequenceFor(state)[state.step];
export const isBranch=(state:GameState)=>state.index===2&&state.step===0&&state.phase==="cue";
export const durationFor=(state:GameState)=>windowFor(state.mode)-(state.index===2&&state.route==="fast"&&state.step>0?350:0);
export const distanceFor=(action:Action)=>({left:-45,right:60,up:95,down:40,action:0})[action];
export const performanceMs=(state:GameState)=>state.index===7&&state.step===2?1500:state.lastAction==="up"?1050:state.lastAction==="action"?850:800;
export type Event={type:"start";mode:GameState["mode"]}|{type:"tick";elapsed:number}|{type:"input";action:Action}|{type:"release"}|{type:"pause"}|{type:"resume"}|{type:"retry"}|{type:"menu"};
function fail(state:GameState):GameState {return {...state,phase:"failure",lives:state.lives-1,remaining:failureMs,combo:0,holding:false,holdElapsed:0,grade:null};}
function succeed(state:GameState,action:Action):GameState {
 const combo=state.combo+1;
 const grade:GameState["grade"]=state.remaining/durationFor(state)>.65?"perfetto":"buono";
 const next={...state,phase:"success" as const,lastAction:action,combo,maxCombo:Math.max(state.maxCombo,combo),grade,
  score:state.score+scoreFor(state.remaining,durationFor(state))+Math.min(100,combo*10)+(isBranch(state)&&action==="right"?60:0),holding:false,holdElapsed:0};
 return {...next,remaining:performanceMs(next)};
}
export function reducer(state:GameState,event:Event):GameState {
 if(event.type==="menu")return {...initialState,mode:state.mode};
 if(event.type==="start")return {...initialState,mode:event.mode,phase:"intro",remaining:beats[0].introMs};
 if(event.type==="pause")return ["intro","cue","success","transition","failure"].includes(state.phase)?{...state,paused:true,holding:false,holdElapsed:0}:state;
 if(event.type==="resume")return {...state,paused:false};
 if(event.type==="retry")return state.phase==="gameover"?{...state,phase:"intro",index:checkpointFor(state.index),step:0,score:state.checkpointScore,beatScore:state.checkpointScore,lives:3,paused:false,remaining:beats[checkpointFor(state.index)].introMs,route:null,travel:0,beatTravel:0,nextIndex:null,transitionRoom:false}:state;
 if(state.paused)return state;
 if(event.type==="release")return state.holding?{...state,holding:false,holdElapsed:0}:state;
 if(event.type==="input") {
  if(state.phase!=="cue")return state;
  const branch=isBranch(state);
  if(event.action!==stepFor(state).action&&!(branch&&event.action==="right"))return fail({...state,lastAction:event.action});
  const selected=branch?{...state,route:event.action==="right"?"fast" as const:"safe" as const}:state;
  if(stepFor(selected).holdMs)return {...selected,holding:true,lastAction:event.action};
  return succeed(selected,event.action);
 }
 if(event.type!=="tick"||!["intro","cue","success","transition","failure"].includes(state.phase))return state;
 const elapsed=Math.max(0,event.elapsed);
 const remaining=state.remaining-elapsed;
 if(state.phase==="cue"&&state.holding){
  const holdMs=stepFor(state).holdMs!;
  const available=Math.max(0,Math.min(elapsed,state.remaining));
  const holdElapsed=state.holdElapsed+available;
  if(holdElapsed>=holdMs)return succeed({...state,remaining:Math.max(0,state.remaining-(holdMs-state.holdElapsed))},stepFor(state).action);
  if(remaining>0)return {...state,remaining,holdElapsed};
 }
 if(state.phase==="transition") {
  let next=state;
  if(state.nextIndex!==null&&remaining<=transitionMs/2){
   const index=state.nextIndex;
   next={...state,index,step:0,route:null,travel:state.transitionRoom?0:state.travel,beatTravel:state.transitionRoom?0:state.travel,beatScore:state.score,
    checkpointScore:state.transitionRoom?state.score:state.checkpointScore,nextIndex:null,grade:null};
  }
  return remaining>0?{...next,remaining}:{...next,phase:"intro",remaining:beats[next.index].introMs,transitionRoom:false};
 }
 if(remaining>0)return {...state,remaining};
 if(state.phase==="intro")return {...state,phase:"cue",remaining:durationFor(state)};
 if(state.phase==="cue")return fail(state);
 if(state.phase==="failure")return {...state,phase:state.lives<=0?"gameover":"intro",remaining:beats[state.index].introMs,step:0,score:state.beatScore,route:null,travel:state.beatTravel,grade:null};
 const travel=state.travel+distanceFor(state.lastAction!);
 if(state.step<sequenceFor(state).length-1){const next={...state,step:state.step+1,travel,holdElapsed:0,grade:null,phase:"cue" as const};return {...next,remaining:durationFor(next)};}
 if(state.index===beats.length-1)return {...state,phase:"complete",remaining:0,travel};
 return {...state,phase:"transition",remaining:transitionMs,nextIndex:state.index+1,travel,transitionRoom:beats[state.index+1].room!==beats[state.index].room};
}
