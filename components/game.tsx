"use client";
import {useEffect, useReducer, useRef, useState, type CSSProperties} from "react";
import {actionForKey, actions, beats, checkpointFor, initialState, reducer, durationFor, stepFor, sequenceFor, isBranch, performanceMs, transitionMs, type GameState} from "@/lib/game";
import {GameAudio} from "@/lib/audio";
import Dialog from "./dialog";
import Icon from "./icon";
import Robot from "./robot";
import Scenery from "./scenery";
import {failureMs} from "@/lib/motion";

const roomNames = ["Attracco", "Sicurezza", "Archivio", "NEXUS"];
const art = {bridge:"/scenes/bridge.webp",hall:"/scenes/hall.webp",vault:"/scenes/vault.webp",core:"/scenes/core.webp"};
const assets = Object.values(art);
const format = (n: number) => String(n).padStart(4,"0");
export default function Game() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mode, setMode] = useState<GameState["mode"]>("story");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sound, setSound] = useState(true);
  const [help, setHelp] = useState(false);
  const [best, setBest] = useState(0);
  const audio = useRef<GameAudio | null>(null);
  const beat=beats[state.index];
  const step=stepFor(state);
  const sequence=sequenceFor(state);
  const branch=isBranch(state);
  const clipMs=state.phase==="intro"?beat.introMs:state.phase==="cue"?durationFor(state):state.phase==="success"?performanceMs(state):state.phase==="transition"?transitionMs:failureMs;
  const carrying=(state.index>4||(state.index===4&&(state.step>1||(state.step===1&&state.phase==="success"))))&&(state.index<7||state.step<2);
  const active = !["menu","complete","gameover"].includes(state.phase);
  const cue = state.phase === "cue" && !state.paused;

  useEffect(() => {
    let cancelled=false;
    Promise.all(assets.map(src=>new Promise<void>((resolve,reject)=>{
      const img=new window.Image(); img.onload=()=>resolve(); img.onerror=()=>reject(new Error(src)); img.src=src;
    }))).then(()=>{if(!cancelled)setReady(true);}).catch(()=>{if(!cancelled)setLoadError(true);});
    return ()=>{cancelled=true;};
  }, []);
  useEffect(()=>{
    try {const n=Number(localStorage.getItem(`signal-lost-best-v2-${mode}`));setBest(Number.isFinite(n)?Math.max(0,n):0);}catch{setBest(0);}
  },[mode]);
  useEffect(()=>{
    if(state.phase !== "complete")return;
    try {
      const key=`signal-lost-best-v2-${state.mode}`;
      const saved=Number(localStorage.getItem(key));
      const value=Math.max(Number.isFinite(saved)?saved:0,state.score);
      localStorage.setItem(key,String(value));setBest(value);
    }catch{setBest(n=>Math.max(n,state.score));}
  },[state.phase,state.score,state.mode]);
  useEffect(()=>{
    if(!active || state.paused)return;
    let last=performance.now();
    const timer=window.setInterval(()=>{const now=performance.now();dispatch({type:"tick",elapsed:now-last});last=now;},50);
    return ()=>clearInterval(timer);
  },[active,state.phase,state.paused]);
  useEffect(()=>{
    const keydown=(event: KeyboardEvent)=>{
      if(event.repeat || event.ctrlKey || event.metaKey || event.altKey)return;
      if(event.key === "Escape" || event.key.toLowerCase() === "p") {
        if(active){event.preventDefault();dispatch({type:state.paused?"resume":"pause"});}return;
      }
      if(!active || state.paused)return;
      if(event.target instanceof HTMLElement && event.target.closest("[data-ui]") && (event.key===" " || event.key==="Enter"))return;
      const action=actionForKey(event.key);
      if(action){event.preventDefault();dispatch({type:"input",action});}
    };
    const keyup=(event:KeyboardEvent)=>{if(actionForKey(event.key))dispatch({type:"release"});};
    const visibility=()=>{if(document.hidden)dispatch({type:"pause"});};
    window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);document.addEventListener("visibilitychange",visibility);
    return ()=>{window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);document.removeEventListener("visibilitychange",visibility);};
  },[active,state.paused]);
  useEffect(()=>{
    if(["cue","success","failure","complete"].includes(state.phase))audio.current?.tone(state.phase as "cue"|"success"|"failure"|"complete");
    if(state.phase==="transition"&&state.transitionRoom)audio.current?.tone("transition");
  },[state.phase,state.step,state.transitionRoom]);
  useEffect(()=>()=>{audio.current?.close();},[]);
  const unlock=()=>{audio.current??=new GameAudio();audio.current.enabled=sound;audio.current.unlock();};
  const start=()=>{unlock();setHelp(false);dispatch({type:"start",mode});};
  const toggleSound=()=>{
    const next=!sound;setSound(next);audio.current??=new GameAudio();audio.current.enabled=next;
    if(next){audio.current.unlock();audio.current.tone("cue");}
  };
  const cueAction=actions.find(a=>a.id===step.action)!;
  const reaction={up:"Atterraggio!",down:"Laser evitato.",left:"Al riparo.",right:"Varco raggiunto.",action:state.index===4?"Memoria recuperata.":"Presa salda."};
  const message=state.phase==="success"?(state.step===sequence.length-1?beat.success:reaction[state.lastAction||step.action]):state.phase==="failure"?beat.failure:state.phase==="cue"?step.cue:beat.narration;

  return <main className="app-shell">
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Signal Lost, pagina iniziale"><span className="logo-mark" aria-hidden="true">◉</span>SIGNAL<span>LOST</span></a>
      <div className="header-right"><span className="prototype"><i/>PROTOTIPO · 01</span><button data-ui className="quiet-button" onClick={()=>{if(active)dispatch({type:"pause"});setHelp(!help);}} aria-expanded={help}>Come si gioca <span><Icon name="arrow"/></span></button></div>
    </header>
    {help && <aside id="how-to" className="help-panel"><strong>Guarda. Scegli. Sopravvivi.</strong><p>Ogni ostacolo richiede tre comandi consecutivi: segui la sequenza e agisci al segnale. Usa frecce, WASD o i pulsanti touch; Spazio è Azione. I comandi rapidi aumentano la combo. Nel corridoio scegli il percorso al riparo oppure una scorciatoia più impegnativa. Alla fine tieni premuta Azione per completare il ripristino.</p><p><kbd>Esc</kbd> o <kbd>P</kbd> per la pausa. Una scelta errata o il tempo scaduto costa una vita e riavvia l’ostacolo. Tre vite per tentativo; ogni settore salva un checkpoint. La pausa interrompe anche un comando tenuto premuto.</p><button data-ui className="quiet-button" onClick={()=>setHelp(false)}>Chiudi istruzioni ×</button></aside>}
    <section className="mission-heading"><div><span className="eyebrow">UN’AVVENTURA CINEMATOGRAFICA INTERATTIVA</span><h1>Un piccolo robot.<br className="mobile-break"/> Una grande anomalia.</h1></div><span className="episode-label">EPISODIO 01<span>Protocollo di risveglio</span></span></section>
    <section className={`game-stage phase-${state.phase} ${state.paused?"is-paused":""} room-${beat.room} ${state.transitionRoom?"cross-sector":""}`} aria-label="Scena di gioco" data-phase={state.phase} data-index={state.index} data-step={state.step} data-action={state.lastAction||""} data-combo={state.combo} data-route={state.route||""} data-paused={state.paused} style={{"--clip-ms":`${clipMs}ms`} as CSSProperties}>
      <div className="scene-camera">
        <Scenery src={state.phase==="menu"?"/scenes/cover.webp":art[beat.room]}/>
        <div className="scene-platform" aria-hidden="true"/><div className="cover-column" aria-hidden="true"/>
        {state.phase!=="menu"&&<Robot index={state.index} phase={state.phase} paused={state.paused} duration={clipMs} action={state.phase==="success"||state.phase==="failure"?state.lastAction||step.action:step.action} step={state.step} travel={state.travel} carrying={carrying}/>}

        <div className="atmosphere" aria-hidden="true"/>
        <div className="particles" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{"--x":`${(i*37+9)%100}%`,"--delay":`${-i*.7}s`,"--speed":`${4+i%4}s`} as CSSProperties}/>)}</div>
        {active && state.index===1 && <svg className="security-drone" viewBox="0 0 120 60" aria-hidden="true"><path d="M15 15 42 8l18 12 18-12 27 7-15 15 8 12-26 3-12-10-12 10-26-3 8-12Z" fill="#394858" stroke="#10212b" strokeWidth="3"/><ellipse cx="60" cy="27" rx="18" ry="10" fill="#111922" stroke="#dba05b" strokeWidth="2"/><circle cx="60" cy="27" r="5" fill="#ff6c6c"/><path d="M8 18h23M89 18h23" stroke="#67d6e8" strokeWidth="3"/></svg>}
        {active && <div className={`hazard hazard-${state.index} ${["cue","success","failure"].includes(state.phase)?"armed":""}`} aria-hidden="true"><span/><span/><span/></div>}
        {active && <div key={`${state.index}-${state.phase}-fx`} className={`shot-effects shot-${state.index}`} aria-hidden="true"><div className="impact-flash"/><div className="energy-wave"/><div className="foreground-debris">{Array.from({length:6},(_,i)=><i key={i} style={{"--piece":i} as CSSProperties}/>)}</div></div>}
      </div>
      <div className="sector-wipe" aria-hidden="true"><span>PASSAGGIO DI SERVIZIO</span></div>
      <div className="vignette" aria-hidden="true"/>
      <div className="stage-topline"><span className="live-tag"><i/>{state.phase==="menu"?"STAZIONE ORBITALE · NEXUS":beat.chapter.toUpperCase()}</span><div className="stage-tools"><button data-ui className="icon-button" onClick={toggleSound} aria-label={sound?"Disattiva audio":"Attiva audio"} aria-pressed={sound}><Icon name={sound?"sound":"mute"}/></button>{active&&<button data-ui className="icon-button" onClick={()=>dispatch({type:state.paused?"resume":"pause"})} aria-label={state.paused?"Riprendi":"Pausa"}><Icon name={state.paused?"play":"pause"}/></button>}</div></div>
      {state.phase==="menu" && <div className="menu-content"><span className="eyebrow">IL SEGNALE È PERSO. LA SPERANZA NO.</span><h2>SIGNAL<br/><span>LOST</span><em>01</em></h2><p>NEXUS ha preso il controllo della stazione.<br/>L’unica speranza? Un robot fuori protocollo.</p><fieldset className="difficulty"><legend className="sr-only">Difficoltà</legend><button aria-pressed={mode==="story"} onClick={()=>setMode("story")} className={mode==="story"?"selected":""}>Storia <small>3 s per comando</small></button><button aria-pressed={mode==="arcade"} onClick={()=>setMode("arcade")} className={mode==="arcade"?"selected":""}>Arcade <small>1,7 s per comando</small></button></fieldset><button className="primary-button" onClick={start} disabled={!ready}>{ready?"Avvia la missione":loadError?"Errore nel caricamento":"Caricamento della stazione…"}<span aria-hidden="true"><Icon name="arrow"/></span></button>{loadError&&<p role="alert">Impossibile caricare le scene. Ricarica la pagina per riprovare.</p>}<span className="menu-footnote">24 COMANDI · 4 SETTORI · 3 VITE</span></div>}
      {active && <><div className="game-hud"><span className="lives" aria-label={`${state.lives} vite rimaste`}>{[0,1,2].map(i=><span key={i} className={i<state.lives?"":"empty"} aria-hidden="true">◆</span>)}</span><span className="score-label">PUNTI <b>{format(state.score)}</b></span></div><div className="combo-hud"><span>COMBO</span><strong>×{state.combo}</strong>{state.route&&<small>{state.route==="fast"?"SCORCIATOIA +60":"PERCORSO AL RIPARO"}</small>}</div><ol className="command-chain" aria-label="Sequenza dell’ostacolo">{sequence.map((command,i)=><li key={i} className={i<state.step||state.phase==="success"&&i===state.step?"done":i===state.step?"current":"pending"} aria-current={i===state.step?"step":undefined}><span aria-hidden="true">{i<state.step?"✓":actions.find(a=>a.id===command.action)!.symbol}</span><small>{i+1}</small></li>)}</ol><div className="cinematic-caption" aria-live="polite" aria-atomic="true"><span className="caption-label">{state.phase==="cue"?"SCEGLI ORA":state.phase==="success"?`${state.grade==="perfetto"?"PERFETTO":"RIUSCITO"} · COMBO ×${state.combo}`:state.phase==="failure"?"ERRORE DI SISTEMA":beat.title.toUpperCase()}</span><p key={`${state.index}-${state.step}-${state.phase}`}>{message}</p></div>{branch&&<div className="route-choice"><button data-ui onClick={()=>dispatch({type:"input",action:"left"})}><b>← Al riparo</b><small>Più tempo, via di servizio</small></button><button data-ui onClick={()=>dispatch({type:"input",action:"right"})}><b>Scorciatoia →</b><small>+60 punti, meno tempo</small></button></div>}{state.phase==="cue"&&!branch&&<div className="qte" aria-hidden="true"><span className="qte-symbol">{cueAction.symbol}</span><span className="qte-key">{step.holdMs?state.holding?"MANTIENI PREMUTO":"TIENI PREMUTO":cueAction.key}</span>{step.holdMs&&<span className="hold-meter"><i style={{width:`${state.holdElapsed/step.holdMs*100}%`}}/></span>}</div>}<div className="time-track" role="progressbar" aria-label="Tempo per scegliere" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.phase==="cue"?state.remaining/durationFor(state)*100:0)}><i style={{width:`${state.phase==="cue"?state.remaining/durationFor(state)*100:0}%`}}/></div></>}
      {state.paused && <Dialog title="Sistema in pausa"><span className="dialog-emblem"><Icon name="pause"/></span><span className="eyebrow">NESSUN SEGNALE ANDRÀ PERSO</span><h2>Sistema in pausa.</h2><p>Prenditi un istante. MILO ti aspetta.</p><button data-ui className="primary-button" onClick={()=>dispatch({type:"resume"})}>Riprendi la missione <span>→</span></button><button data-ui className="quiet-button" onClick={()=>dispatch({type:"menu"})}>Torna al menu</button></Dialog>}
      {state.phase==="gameover"&&<Dialog title="Connessione interrotta"><span className="dialog-emblem danger">×</span><span className="eyebrow">TENTATIVO NON RIUSCITO</span><h2>Connessione interrotta.</h2><p>Anche i piccoli eroi hanno bisogno di un riavvio.<br/>Riparti da «{roomNames[Math.floor(checkpointFor(state.index)/2)]}» con tre vite.</p><button data-ui className="primary-button" onClick={()=>{unlock();dispatch({type:"retry"});}}>Riprova dal checkpoint <span><Icon name="retry"/></span></button><button data-ui className="quiet-button" onClick={()=>dispatch({type:"menu"})}>Torna al menu</button></Dialog>}
      {state.phase==="complete"&&<Dialog title="Missione completata"><span className="dialog-emblem">✦</span><span className="eyebrow">PROTOCOLLO DI RIPRISTINO COMPLETATO</span><h2>Un piccolo robot.<br/>Un nuovo inizio.</h2><p>NEXUS è tornata online. L’equipaggio è salvo.<br/>E MILO ha decisamente meritato una lucidatura.</p><div className="result-score"><span>PUNTEGGIO FINALE<strong>{format(state.score)}</strong></span><span>RECORD · {state.mode==="story"?"STORIA":"ARCADE"}<strong>{format(best)}</strong></span><span>COMBO MASSIMA<strong>×{state.maxCombo}</strong></span></div><button data-ui className="primary-button" onClick={start}>Gioca ancora <span><Icon name="retry"/></span></button><button data-ui className="quiet-button" onClick={()=>dispatch({type:"menu"})}>Torna al menu</button></Dialog>}
    </section>
    <div className="below-stage"><span><i className="status-dot"/>{state.phase==="menu"?"IN ATTESA DI UN EROE":state.phase==="complete"?"SEGNALE RIPRISTINATO":state.paused?"SISTEMA IN PAUSA":"MISSIONE IN CORSO"}</span><span>{mode==="story"?"MODALITÀ STORIA":"MODALITÀ ARCADE"}<span className="divider">/</span>RECORD {format(best)}</span></div>
    <section className="control-deck" aria-label="Comandi di gioco"><div className="control-explanation"><span className="eyebrow">OGNI ISTANTE CONTA</span><h2>Un comando. Poi il prossimo.</h2><p>{branch?"Scegli il percorso: più sicurezza o più punti.":cue&&step.holdMs?"Tieni premuta Azione fino a completare il collegamento.":cue?"Agisci ora. Anticipa la prossima mossa guardando la sequenza.":active?"La prossima mossa arriva subito. Preparati.":"Frecce o WASD per scegliere. Spazio per agire."}</p></div><fieldset className="controls" disabled={!cue}><legend className="sr-only">Azioni</legend>{actions.map(a=><button key={a.id} className={`action-button ${cue&&(step.action===a.id||branch&&a.id==="right")?"hint":""} ${a.id==="action"?"space-button":""}`} aria-label={a.label} onClick={()=>{if(!step.holdMs){unlock();dispatch({type:"input",action:a.id});}}} onPointerDown={e=>{if(step.holdMs){e.currentTarget.setPointerCapture(e.pointerId);unlock();dispatch({type:"input",action:a.id});}}} onPointerUp={()=>dispatch({type:"release"})} onPointerCancel={()=>dispatch({type:"release"})}><span aria-hidden="true">{a.symbol}</span><small>{a.id==="action"?"SPAZIO":a.label.toUpperCase()}</small></button>)}</fieldset></section>
    <section className="chapter-strip" aria-label="Avanzamento del livello">{roomNames.map((name,i)=><div key={name} className={`${active&&Math.floor(state.index/2)===i?"current":""} ${state.phase==="complete"||(state.phase!=="menu"&&state.index>=i*2+2)?"visited":""}`}><span>0{i+1}</span><div><small>SETTORE</small><strong>{name}</strong></div><span className="chapter-indicator" aria-hidden="true">{state.phase==="complete"||state.index>=i*2+2?"✓":"·"}</span></div>)}</section>
    <footer className="site-footer"><span>SIGNAL LOST <span className="footer-dot">·</span> Un’avventura fuori protocollo.</span><span>EPISODIO 01 <span className="footer-dot">·</span> PROTOTIPO GIOCABILE</span></footer>
  </main>;
}
