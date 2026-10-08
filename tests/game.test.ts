import {test} from "node:test";
import assert from "node:assert/strict";
import {actionForKey,beats,initialState,reducer,windowFor} from "../lib/game";
test("il livello si completa con le otto azioni corrette",()=>{
 let s=reducer(initialState,{type:"start",mode:"story"});
 for(const beat of beats){
  s=reducer(s,{type:"tick",elapsed:beat.introMs});
  assert.equal(s.phase,"cue");
  s=reducer(s,{type:"input",action:beat.correct});
  assert.equal(s.phase,"success");
  s=reducer(s,{type:"tick",elapsed:1700});
 }
 assert.equal(s.phase,"complete"); assert.equal(s.score,2400); assert.equal(s.lives,3);
});
test("un input prematuro viene ignorato; timeout e azione errata consumano una vita",()=>{
 let s=reducer(initialState,{type:"start",mode:"arcade"});
 assert.deepEqual(reducer(s,{type:"input",action:"left"}),s);
 s=reducer(s,{type:"tick",elapsed:beats[0].introMs});
 s=reducer(s,{type:"tick",elapsed:windowFor("arcade")});
 assert.equal(s.phase,"failure"); assert.equal(s.lives,2);
 s=reducer(s,{type:"tick",elapsed:2000});
 s=reducer(s,{type:"tick",elapsed:beats[0].introMs});
 s=reducer(s,{type:"input",action:"right"});
 assert.equal(s.lives,1);
});
test("la pausa congela il timer e ignora le azioni",()=>{
 let s=reducer(initialState,{type:"start",mode:"story"});
 s=reducer(s,{type:"tick",elapsed:beats[0].introMs});
 s=reducer(s,{type:"pause"});
 assert.deepEqual(reducer(s,{type:"tick",elapsed:10000}),s);
 assert.deepEqual(reducer(s,{type:"input",action:"up"}),s);
 s=reducer(s,{type:"resume"});
 assert.equal(reducer(s,{type:"input",action:"up"}).phase,"success");
});
test("game over e checkpoint ripristinano punteggio senza duplicarlo",()=>{
 let s=reducer(initialState,{type:"start",mode:"story"});
 for(const b of beats.slice(0,3)){
  s=reducer(s,{type:"tick",elapsed:b.introMs});
  s=reducer(s,{type:"input",action:b.correct});
  s=reducer(s,{type:"tick",elapsed:1700});
 }
 assert.equal(s.index,3); assert.equal(s.checkpointScore,600);
 for(let n=0;n<3;n++){
  s=reducer(s,{type:"tick",elapsed:beats[3].introMs});
  s=reducer(s,{type:"input",action:"left"});
  s=reducer(s,{type:"tick",elapsed:2000});
 }
 assert.equal(s.phase,"gameover");
 s=reducer(s,{type:"retry"});
 assert.equal(s.index,2); assert.equal(s.score,600); assert.equal(s.lives,3);
});
test("mappatura tastiera include WASD e spazio",()=>{
 assert.equal(actionForKey("W"),"up"); assert.equal(actionForKey(" "),"action");
 assert.equal(actionForKey("ArrowLeft"),"left"); assert.equal(actionForKey("Escape"),null);
});
