import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beats,initialState,reducer,windowFor,transitionMs,stepFor,sequenceFor,durationFor,type GameState} from '../lib/game';
import {failureMs,sampleMotion,motionFor} from '../lib/motion';
const tick=(s:GameState,n=s.remaining)=>reducer(s,{type:'tick',elapsed:n});
function finishBeat(s:GameState,fast=false){
 if(s.phase==='intro')s=tick(s);
 while(s.phase==='cue'){
  const command=stepFor(s);
  s=reducer(s,{type:'input',action:fast&&s.index===2&&s.step===0?'right':command.action});
  if(command.holdMs)s=tick(s,command.holdMs);
  assert.equal(s.phase,'success');s=tick(s);
 }
 return s;
}
test('24 comandi, combo e ripristino tenuto premuto completano il livello',()=>{
 let s=reducer(initialState,{type:'start',mode:'story'});
 for(let i=0;i<beats.length;i++){
  assert.equal(s.index,i);s=finishBeat(s);
  if(s.phase==='transition')s=tick(s,transitionMs);
 }
 assert.equal(s.phase,'complete');assert.equal(s.combo,24);assert.equal(s.maxCombo,24);
 assert.ok(s.score>8500&&s.score<9400);assert.equal(s.lives,3);
});
test('due percorsi validi cambiano i comandi, la finestra e il bonus',()=>{
 let s=reducer(initialState,{type:'start',mode:'story'});
 for(let n=0;n<2;n++){s=finishBeat(s);s=tick(s,transitionMs);}
 s=tick(s);
 const safe=reducer(s,{type:'input',action:'left'}),fast=reducer(s,{type:'input',action:'right'});
 assert.equal(safe.phase,'success');assert.equal(fast.phase,'success');assert.equal(fast.score-safe.score,60);
 const safeNext=tick(safe),fastNext=tick(fast);
 assert.equal(stepFor(safeNext).action,'down');assert.equal(stepFor(fastNext).action,'up');
 assert.equal(safeNext.remaining-fastNext.remaining,350);
});
test('gli input anticipati sono ignorati; un errore riavvia l’ostacolo senza duplicare punti o movimento',()=>{
 let s=reducer(initialState,{type:'start',mode:'arcade'});
 assert.deepEqual(reducer(s,{type:'input',action:'left'}),s);s=tick(s);
 s=reducer(s,{type:'input',action:'up'});assert.equal(s.combo,1);s=tick(s);
 assert.equal(s.step,1);assert.ok(s.score>0);assert.ok(s.travel>0);
 s=reducer(s,{type:'input',action:'left'});assert.equal(s.phase,'failure');assert.equal(s.lives,2);assert.equal(s.combo,0);
 s=tick(s,failureMs);assert.equal(s.step,0);assert.equal(s.score,0);assert.equal(s.travel,0);
 s=tick(s);s=tick(s,windowFor('arcade'));assert.equal(s.phase,'failure');
});
test('rilasciare e mettere in pausa interrompono il mantenimento; il timeout non può completarlo',()=>{
 const base:GameState={...initialState,phase:'cue',index:7,step:2,remaining:3000};
 let s=reducer(base,{type:'input',action:'action'});s=tick(s,400);assert.equal(s.holdElapsed,400);
 s=reducer(s,{type:'release'});assert.equal(s.holdElapsed,0);assert.equal(s.holding,false);
 s=reducer(s,{type:'input',action:'action'});s=tick(s,350);s=reducer(s,{type:'pause'});
 assert.equal(s.holding,false);assert.deepEqual(tick(s,10000),s);
 s=reducer(s,{type:'resume'});s=tick(s,950);assert.equal(s.phase,'cue');
 s=reducer(s,{type:'input',action:'action'});s=tick(s,900);assert.equal(s.phase,'success');
 const late=reducer({...base,remaining:400},{type:'input',action:'action'});
 assert.equal(tick(late,900).phase,'failure');
});
test('il cambio settore è coperto, pausabile e salva un checkpoint coerente',()=>{
 let s=reducer(initialState,{type:'start',mode:'story'});s=tick(finishBeat(s),transitionMs);s=finishBeat(s);
 assert.equal(s.phase,'transition');assert.equal(s.index,1);assert.equal(s.transitionRoom,true);
 s=reducer(s,{type:'pause'});assert.deepEqual(tick(s,transitionMs),s);
 s=reducer(s,{type:'resume'});s=tick(s,transitionMs/2);
 assert.equal(s.index,2);assert.equal(s.phase,'transition');assert.equal(s.travel,0);assert.equal(s.checkpointScore,s.score);
 s=tick(s,transitionMs/2);assert.equal(s.phase,'intro');
 const checkpoint=s.checkpointScore;
 for(let n=0;n<3;n++){s=tick(s);s=reducer(s,{type:'input',action:'action'});s=tick(s,failureMs);}
 assert.equal(s.phase,'gameover');s=reducer(s,{type:'retry'});
 assert.equal(s.index,2);assert.equal(s.score,checkpoint);assert.equal(s.step,0);assert.equal(s.lives,3);
});
test('le curve di movimento mantengono limiti, contatto e continuità',()=>{
 const clip=sampleMotion(motionFor(0,'success','up'));
 assert.equal(clip[0].pose.x,0);assert.equal(clip.at(-1)!.pose.x,95);assert.equal(clip.at(-1)!.pose.y,0);
 assert.ok(clip.every(f=>f.pose.y>=-51.001&&f.pose.y<=0.001));
 const run=sampleMotion(motionFor(3,'success','right'));
 assert.ok(run.every((f,i)=>i===0||f.pose.x>=run[i-1].pose.x));
 const midpoint=run[50].pose.x;assert.ok(midpoint>10&&midpoint<55);
});
