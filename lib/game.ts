import {successMs, failureMs} from "./motion";
export type Action = "left" | "up" | "right" | "down" | "action";
export type Room = "bridge" | "hall" | "vault" | "core";
export type Beat = { room: Room; chapter: string; title: string; narration: string; cue: string; correct: Action; success: string; failure: string; introMs: number };
export const actions: {id: Action; symbol: string; label: string; key: string}[] = [
  {id:"left",symbol:"←",label:"Sinistra",key:"← / A"},
  {id:"up",symbol:"↑",label:"Salta",key:"↑ / W"},
  {id:"down",symbol:"↓",label:"Abbassati",key:"↓ / S"},
  {id:"right",symbol:"→",label:"Destra",key:"→ / D"},
  {id:"action",symbol:"✦",label:"Azione",key:"Spazio"},
];
export const beats: Beat[] = [
  {room:"bridge",chapter:"01 · Settore di attracco",title:"Protocollo di risveglio",narration:"MILO era un robot di manutenzione. Salvare la stazione non era nel suo contratto.",cue:"La passerella cede. Salta!",correct:"up",success:"Atterraggio riuscito. Eleganza: non disponibile.",failure:"Gravità: operativa. Passerella: molto meno.",introMs:4600},
  {room:"bridge",chapter:"01 · Settore di attracco",title:"Accesso non autorizzato",narration:"L’AI di bordo ha classificato tutti gli ospiti come minacce. Anche quelli alti mezzo metro.",cue:"Il drone spara. Abbassati!",correct:"down",success:"Un graffio sulla vernice. La garanzia non copre i laser.",failure:"Il drone non accetta reclami.",introMs:3200},
  {room:"hall",chapter:"02 · Corridoio di sicurezza",title:"Un bivio nel sistema",narration:"Due corridoi. A destra, il sensore termico rileva decisamente troppa attività.",cue:"Prendi il corridoio a sinistra!",correct:"left",success:"Percorso alternativo trovato.",failure:"Riconoscimento facciale riuscito. Purtroppo.",introMs:3900},
  {room:"hall",chapter:"02 · Corridoio di sicurezza",title:"La griglia laser",narration:"Una linea rossa attraversa il pavimento. Poi inizia a salire.",cue:"Evita la griglia. Scatta a destra!",correct:"right",success:"Sicurezza aggirata. Con un po’ di fortuna.",failure:"MILO non era progettato per essere affettato.",introMs:3400},
  {room:"vault",chapter:"03 · Archivio di memoria",title:"L’ultima copia",narration:"Un nucleo di memoria contiene il codice di ripristino. Il sistema sta cancellando ogni cosa.",cue:"Recupera il nucleo! Azione.",correct:"action",success:"Backup completato. Speranza ripristinata.",failure:"Operazione scaduta. Anche i robot esitano.",introMs:4200},
  {room:"vault",chapter:"03 · Archivio di memoria",title:"Errore critico",narration:"Le piastre del pavimento si aprono. Il refrigerante invade l’archivio.",cue:"Salta sulle piattaforme!",correct:"up",success:"Circuiti asciutti. Livello di ansia: elevato.",failure:"Resistenza all’acqua: non certificata.",introMs:3500},
  {room:"core",chapter:"04 · Il cuore di NEXUS",title:"Un occhio nel buio",narration:"NEXUS si sveglia. «Unità di manutenzione, la tua presenza è un errore.»",cue:"Arriva il raggio. Riparati a sinistra!",correct:"left",success:"Per una volta, una colonna portante è davvero utile.",failure:"NEXUS ha un modo molto diretto di correggere gli errori.",introMs:4700},
  {room:"core",chapter:"04 · Il cuore di NEXUS",title:"Segnale ritrovato",narration:"La porta di servizio è aperta. Un’ultima connessione può restituire la stazione al suo equipaggio.",cue:"Collega il nucleo! Azione.",correct:"action",success:"Segnale ritrovato. La stazione respira di nuovo.",failure:"Un solo istante separa un piccolo robot da una grande impresa.",introMs:4200},
];
export const checkpointFor = (index: number) => Math.floor(index / 2) * 2;
export const windowFor = (mode: "story" | "arcade") => mode === "story" ? 4200 : 2400;
export const scoreFor = (remaining: number, duration: number) => 100 + Math.round(Math.max(0, Math.min(1, remaining / duration)) * 200);
export function actionForKey(key: string): Action | null {
  const keys: Record<string,Action> = {ArrowLeft:"left",a:"left",ArrowUp:"up",w:"up",ArrowRight:"right",d:"right",ArrowDown:"down",s:"down"," ":"action"};
  return keys[key.length === 1 ? key.toLowerCase() : key] ?? null;
}
export type Phase = "menu" | "intro" | "cue" | "success" | "failure" | "gameover" | "complete";
export type GameState = {phase: Phase; index: number; lives: number; score: number; remaining: number; mode: "story" | "arcade"; paused: boolean; checkpointScore: number};
export const initialState: GameState = {phase:"menu",index:0,lives:3,score:0,remaining:0,mode:"story",paused:false,checkpointScore:0};
export type Event = {type:"start";mode:GameState["mode"]} | {type:"tick";elapsed:number} | {type:"input";action:Action} | {type:"pause"} | {type:"resume"} | {type:"retry"} | {type:"menu"};
function fail(state: GameState): GameState {return {...state,phase:"failure",lives:state.lives-1,remaining:failureMs};}
export function reducer(state: GameState, event: Event): GameState {
  if(event.type === "menu") return {...initialState,mode:state.mode};
  if(event.type === "start") return {...initialState,mode:event.mode,phase:"intro",remaining:beats[0].introMs};
  if(event.type === "pause") return ["intro","cue","success","failure"].includes(state.phase) ? {...state,paused:true} : state;
  if(event.type === "resume") return {...state,paused:false};
  if(event.type === "retry") return state.phase === "gameover" ? {...state,phase:"intro",index:checkpointFor(state.index),score:state.checkpointScore,lives:3,paused:false,remaining:beats[checkpointFor(state.index)].introMs} : state;
  if(state.paused) return state;
  if(event.type === "input") {
    if(state.phase !== "cue") return state;
    if(event.action !== beats[state.index].correct) return fail(state);
    return {...state,phase:"success",score:state.score+scoreFor(state.remaining,windowFor(state.mode)),remaining:successMs};
  }
  if(event.type === "tick") {
    if(!["intro","cue","success","failure"].includes(state.phase)) return state;
    const remaining = state.remaining - Math.max(0,event.elapsed);
    if(remaining > 0) return {...state,remaining};
    if(state.phase === "intro") return {...state,phase:"cue",remaining:windowFor(state.mode)};
    if(state.phase === "cue") return fail(state);
    if(state.phase === "failure") return {...state,phase:state.lives<=0?"gameover":"intro",remaining:beats[state.index].introMs};
    if(state.index === beats.length - 1) return {...state,phase:"complete",remaining:0};
    const index=state.index+1;
    return {...state,index,phase:"intro",remaining:beats[index].introMs,checkpointScore:index%2===0?state.score:state.checkpointScore};
  }
  return state;
}
