import type {Action,Phase} from "./game";
export const failureMs=1600;
export type Pose={x:number;y:number;turn:number;size:number;face:number;body:number;bob:number;head:number;armBack:number;elbowBack:number;armFront:number;elbowFront:number;legBack:number;kneeBack:number;legFront:number;kneeFront:number;scarf:number};
export const neutral:Pose={x:0,y:0,turn:0,size:1,face:1,body:0,bob:0,head:0,armBack:12,elbowBack:-15,armFront:-8,elbowFront:-12,legBack:0,kneeBack:0,legFront:0,kneeFront:0,scarf:0};
export type MotionFrame={offset:number;pose:Pose};
const frames=(...entries:[number,Partial<Pose>][]):MotionFrame[]=>entries.map(([offset,pose])=>({offset,pose:{...neutral,...pose}}));
const crouch={body:17,bob:26,head:-12,legFront:-37,kneeFront:66,legBack:22,kneeBack:48,armFront:-30,elbowFront:-42,armBack:35};
const stride=(side:number):Partial<Pose>=>({body:10,head:-5,bob:side>0?-3:0,armFront:side*34,elbowFront:-60,armBack:-side*34,elbowBack:-60,legFront:-side*29,kneeFront:side>0?18:46,legBack:side*29,kneeBack:side>0?46:18,scarf:side*12});
export function motionFor(index:number,phase:Phase,action:Action="up",step=0):MotionFrame[] {
 if(phase==="failure")return frames([0,{}],[.15,{body:-18,head:15,armFront:-95,armBack:70}], [.4,{y:10,turn:-38,armFront:-125,legFront:-30,kneeFront:60}], [1,{y:index===0||index===5?190:22,turn:-80,armFront:-95,legFront:-30,kneeFront:55}]);
 if(phase==="intro")return frames([0,{}],[.4,{body:2,head:-8,armFront:-15,bob:1}],[1,{head:5}]);
 if(phase==="cue")return frames([0,{}],[.2,{body:3,head:-6,armFront:-18,elbowFront:-25}],[.65,{body:1,head:-8,bob:-1,armFront:-18,elbowFront:-25}],[1,{body:3,head:-6,armFront:-18,elbowFront:-25}]);
 if(phase!=="success")return frames([0,{}],[1,{}]);
 if(action==="up")return frames([0,{}],[.1,{...crouch,x:-3}],[.24,{x:13,y:-20,body:-8,armFront:-115,armBack:-70,legFront:-24,kneeFront:40,scarf:-15}],
  [.46,{x:48,y:-51,body:8,head:-8,legFront:-42,kneeFront:78,legBack:20,kneeBack:62,armFront:-95,elbowFront:-40,armBack:65,scarf:22}],
  [.69,{x:80,y:-24,body:-7,armFront:-85,legFront:-18,kneeFront:20,scarf:10}],[.82,{...crouch,x:95,bob:20}],[1,{x:95,body:-3,armFront:-20}]);
 if(action==="down")return frames([0,{}],[.13,{...crouch,x:3}],[.3,{x:12,y:9,body:15,turn:-22,head:-15,armFront:-85,elbowFront:-25,legFront:-42,kneeFront:55,legBack:25,kneeBack:32,scarf:22}],
  [.62,{x:31,y:9,turn:-23,body:10,head:-10,armFront:-80,elbowFront:-25,legFront:-40,kneeFront:50,legBack:25,kneeBack:30}],[.83,{...crouch,x:40,body:12}],[1,{x:40,body:3,head:-4}]);
 if(action==="left"||action==="right") {
  const d=action==="left"?-45:60,face=action==="left"?-1:1;
  return frames([0,{face}],[.1,{...stride(1),face,x:d*.03}],[.25,{...stride(-1),face,x:d*.18}],[.42,{...stride(1),face,x:d*.4}],[.58,{...stride(-1),face,x:d*.64}],
   [.75,{...stride(1),face,x:d*.84}],[.88,{...stride(-1),face,x:d*.97,body:4}],[1,{face,x:d,body:0,armFront:-12}]);
 }
 if(index===7&&step===2)return frames([0,{armFront:-95,elbowFront:-20}],[.3,{armFront:-98,elbowFront:-25,head:-8,bob:-2}], [.65,{head:8,body:-5,armFront:-130,elbowFront:-25,armBack:25}], [1,{armFront:-135,elbowFront:-20,armBack:-90,head:-3}]);
 return frames([0,{}],[.16,{body:10,head:-5,armFront:-60,elbowFront:-40}],[.4,{body:14,head:-8,armFront:-100,elbowFront:-5,armBack:-25}], [.65,{body:5,armFront:-75,elbowFront:-60}], [1,{body:0,head:3,armFront:-38,elbowFront:-75}]);
}

// C1-continuous monotone Hermite interpolation. Unlike easing every pose
// separately, this maintains velocity through a run and avoids angle overshoot.
const fields=Object.keys(neutral) as (keyof Pose)[];
export function sampleMotion(clip:MotionFrame[],count=100):MotionFrame[] {
 const slope=(i:number,key:keyof Pose)=>{
  const a=Math.max(0,i-1),b=Math.min(clip.length-1,i+1);
  if(a===i)return (clip[b].pose[key]-clip[i].pose[key])/(clip[b].offset-clip[i].offset);
  if(b===i)return (clip[i].pose[key]-clip[a].pose[key])/(clip[i].offset-clip[a].offset);
  const left=(clip[i].pose[key]-clip[a].pose[key])/(clip[i].offset-clip[a].offset);
  const right=(clip[b].pose[key]-clip[i].pose[key])/(clip[b].offset-clip[i].offset);
  return left*right<=0?0:2*left*right/(left+right);
 };
 return Array.from({length:count+1},(_,n)=>{
  const offset=n/count;
  let i=0;while(i<clip.length-2&&clip[i+1].offset<offset)i++;
  const a=clip[i],b=clip[i+1],span=b.offset-a.offset,t=(offset-a.offset)/span;
  const pose={...neutral};
  for(const key of fields){
   if(key==="face"){pose.face=t<.5?a.pose.face:b.pose.face;continue;}
   pose[key]=(2*t**3-3*t**2+1)*a.pose[key]+(t**3-2*t**2+t)*span*slope(i,key)+(-2*t**3+3*t**2)*b.pose[key]+(t**3-t**2)*span*slope(i+1,key);
  }
  return {offset,pose};
 });
}
