import type { Phase } from "./game";

// Angles are in degrees; travel is relative to the actor's size. Each shot has
// anticipation, contact and recovery, rather than returning to its start pose.
export const successMs = 2800;
export const failureMs = 2200;
export type Pose = {
  x: number; y: number; turn: number; size: number; face: number; body: number; bob: number;
  head: number; armBack: number; elbowBack: number; armFront: number; elbowFront: number;
  legBack: number; kneeBack: number; legFront: number; kneeFront: number; scarf: number;
};
export const neutral: Pose = { x:0, y:0, turn:0, size:1, face:1, body:0, bob:0, head:0,
  armBack:12, elbowBack:-15, armFront:-8, elbowFront:-12,
  legBack:0, kneeBack:0, legFront:0, kneeFront:0, scarf:0 };
export type MotionFrame = { offset: number; pose: Pose };
const frames = (...entries: [number, Partial<Pose>][]): MotionFrame[] => entries.map(([offset, pose])=>({offset, pose:{...neutral,...pose}}));
const tuck = {body:18, head:-12, armFront:-105, elbowFront:-50, armBack:70, elbowBack:-55, legFront:-62, kneeFront:105, legBack:38, kneeBack:85, scarf:24};
const crouch = {bob:43, body:26, head:-21, legFront:-55, kneeFront:95, legBack:40, kneeBack:65, armFront:-38, elbowFront:-65, armBack:40};
const strideA = {body:15, head:-8, armFront:55, elbowFront:-80, armBack:-65, elbowBack:-70, legFront:-40, kneeFront:22, legBack:38, kneeBack:60, scarf:16};
const strideB = {body:15, head:-8, armFront:-65, elbowFront:-70, armBack:55, elbowBack:-80, legFront:38, kneeFront:60, legBack:-40, kneeBack:22, scarf:-12};

const jump = (distance: number) => frames(
  [0,{}], [.09,{...crouch,x:-6}], [.2,{x:distance*.16,y:-20,body:-10,armFront:-150,elbowFront:-20,armBack:-110,legFront:-32,kneeFront:55,legBack:25,kneeBack:35,scarf:-18}],
  [.4,{...tuck,x:distance*.46,y:-78,turn:-7}], [.57,{...tuck,x:distance*.72,y:-54,body:-8,head:8,turn:4}],
  [.72,{x:distance,y:-3,body:-6,legFront:-20,kneeFront:12,armFront:-90,armBack:65,scarf:30}],
  [.78,{...crouch,x:distance,bob:30,body:18,scarf:-20}], [.87,{x:distance,body:-12,head:15,armFront:-85,elbowFront:-35,armBack:60}], [1,{x:distance}]);
const run = (direction: number, shelter = false) => frames(
  [0,{}], [.08,{...crouch,body:32}],
  [.18,{...strideA,x:direction*.15,y:-4}], [.29,{...strideB,x:direction*.35,y:-2}],
  [.41,{...strideA,x:direction*.58,y:-8}], [.53,{...strideB,x:direction*.78,y:-2}],
  [.64,{...strideA,x:direction,y:-4}], [.76,{x:direction,body:-22,head:20,legFront:-28,kneeFront:20,armFront:-60,armBack:65}],
  [.87,{x:direction,...(shelter?crouch:{}),head:shelter?28:12}], [1,{x:direction,...(shelter?{...crouch,head:24}:{}),size:shelter?.92:1}]).map(f=>({...f,pose:{...f.pose,face:f.offset===0?1:direction<0?-1:1}}));

export function motionFor(index: number, phase: Phase): MotionFrame[] {
  if(phase === "intro") {
    return frames([0,{...strideA,x:-20}], [.06,{...strideB,x:-14,y:-3}], [.12,{...strideA,x:-7}], [.18,{...strideB,x:0,y:-3}],
      [.25,{}], [.48,{head:-10,armFront:-20,elbowFront:-25}], [.68,{head:14,body:3}], [1,{}]);
  }
  if(phase === "cue") return frames([0,{}],[.15,{body:-5,head:-12,armFront:-30,elbowFront:-35,legFront:-8,kneeFront:12}], [1,{body:-5,head:-12,armFront:-30,elbowFront:-35,legFront:-8,kneeFront:12}]);
  if(phase === "failure") {
    if(index===0 || index===5) return frames([0,{}],[.12,{...crouch,head:12}], [.3,{y:12,turn:-20,armFront:-145,armBack:80,legFront:-35,kneeFront:35}], [.6,{y:85,turn:-85,armFront:-180,armBack:120,legBack:60,kneeFront:100,scarf:40}], [1,{y:240,turn:-140,size:.7}]);
    return frames([0,{}],[.1,{x:5,body:-25,head:25,armFront:-110,armBack:100}], [.24,{x:-8,turn:-14,body:22,legFront:40,kneeFront:80,armFront:-170}], [.48,{x:-12,y:22,turn:-78,body:-10,head:20,legFront:-35,kneeFront:70,armBack:130}], [.7,{x:-14,y:26,turn:-84,legFront:-20,kneeFront:55,armFront:-90}], [1,{x:-14,y:26,turn:-84,legFront:-20,kneeFront:55,armFront:-90}]);
  }
  if(phase !== "success") return frames([0,{}],[1,{}]);
  switch(index) {
    case 0: return jump(145);
    case 1: return frames([0,{}],[.08,{...crouch}], [.2,{x:22,y:18,turn:-52,body:12,armFront:-140,elbowFront:-40,armBack:85,legFront:-65,kneeFront:40,legBack:48,kneeBack:30,scarf:35}],
      [.48,{x:100,y:18,turn:-60,body:8,armFront:-160,elbowFront:-25,legFront:-45,kneeFront:24,legBack:55,kneeBack:20,scarf:30}], [.64,{x:125,y:8,turn:-25,...crouch}], [.78,{x:125,...crouch,head:15}], [.9,{x:125,body:-12,armFront:-40}], [1,{x:125}]);
    case 2: return run(-55);
    case 3: return run(155);
    case 4: return frames([0,{}],[.1,{...crouch,body:10}], [.25,{...strideA,x:20}], [.38,{...strideB,x:50}], [.49,{x:75,body:15,head:-12,armFront:-100,elbowFront:-20,armBack:-25}],
      [.61,{x:75,body:22,head:-16,armFront:-110,elbowFront:12,armBack:-70,elbowBack:-30}], [.74,{x:75,body:-9,head:8,armFront:-60,elbowFront:-100,armBack:-38}], [1,{x:75,head:8,armFront:-35,elbowFront:-110}]);
    case 5: return frames([0,{}],[.07,{...crouch}], [.18,{...tuck,x:30,y:-65,turn:-8}], [.3,{x:65,y:-10,armFront:-100,legFront:-20}], [.35,{...crouch,x:68,bob:28}],
      [.45,{...tuck,x:95,y:-75,turn:8}], [.58,{...tuck,x:120,y:-50,turn:-4}], [.71,{x:145,y:-3,armFront:-110,legFront:-25}], [.79,{...crouch,x:145,bob:30}], [.9,{x:145,body:-12,armBack:60}], [1,{x:145}]);
    case 6: return run(-55,true);
    default: return frames([0,{}],[.1,{head:-15}], [.23,{...strideA,x:26}], [.34,{...strideB,x:55}], [.46,{x:80,body:25,head:-20,armFront:-110,elbowFront:-10,armBack:-40}],
      [.57,{x:80,body:32,head:-22,armFront:-105,elbowFront:10,armBack:-72,elbowBack:-30}], [.7,{x:80,body:-14,head:15,armFront:-135,elbowFront:-40,armBack:70}], [.85,{x:80,head:-12,armFront:-165,elbowFront:-10,armBack:-120}], [1,{x:80,head:-5,armFront:-155,elbowFront:-15,armBack:-115,elbowBack:-20}]);
  }
}
