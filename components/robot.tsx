"use client";
import {useEffect, useRef} from "react";
import {motionFor, type Pose} from "@/lib/motion";
import type {Phase} from "@/lib/game";

type Props = {index:number; phase:Phase; duration:number; paused:boolean};

// A cut-out style rig: pivoted upper/lower limbs, independent head, antenna,
// eyes and scarf. The original cream shell / cyan visor / orange scarf remain.
export default function Robot({index,phase,duration,paused}:Props) {
  const ref=useRef<HTMLDivElement>(null);
  const animations=useRef<Animation[]>([]);
  useEffect(()=>{
    const actor=ref.current!;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const clip=motionFor(index,phase);
    const animate=()=>{
      animations.current.forEach(a=>a.cancel());
      const options:KeyframeAnimationOptions={duration,fill:"both",easing:"linear"};
      const add=(element:Element|null,transform:(p:Pose)=>string)=>{
        if(!element)return;
        const a=element.animate(clip.map(({offset,pose})=>({offset,transform:transform(pose),easing:"cubic-bezier(.3,0,.3,1)"})),options);
        if(reduced.matches){a.currentTime=duration;a.pause();}
        if(actor.closest(".is-paused"))a.pause();
        animations.current.push(a);
      };
      add(actor.querySelector(".robot-flight"),p=>`translate(${p.x}%, ${p.y}%) rotate(${p.turn}deg) scale(${p.size*p.face}, ${p.size})`);
      add(actor.querySelector(".ground-track"),p=>`translateX(${p.x}%) scale(${p.size*Math.max(.25,1+p.y/120)})`);
      add(actor.querySelector('[data-part="body"]'),p=>`translateY(${p.bob}px) rotate(${p.body}deg)`);
      for(const part of ["head","armBack","elbowBack","armFront","elbowFront","legBack","kneeBack","legFront","kneeFront","scarf"] as const)
        add(actor.querySelector(`[data-part="${part}"]`),p=>`rotate(${p[part]}deg)`);
    };
    animate();reduced.addEventListener("change",animate);
    return ()=>{reduced.removeEventListener("change",animate);animations.current.forEach(a=>a.cancel());animations.current=[];};
  },[index,phase,duration]);
  useEffect(()=>{
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    animations.current.forEach(a=>{if(paused||reduced)a.pause();else a.play();});
  },[paused]);
  const prefix=`milo-${index}-${phase}`;
  const shell=`url(#${prefix}-shell)`;
  const dark=`url(#${prefix}-metal)`;
  const glow=`url(#${prefix}-eye)`;
  const leg=(front:boolean)=> <g transform={`translate(${front?180:133} 222)`}>
    <g data-part={front?"legFront":"legBack"}>
      <circle r="16" fill={dark}/><path d="M-14 3Q-18 16-12 51L13 53Q20 24 12 2Z" fill={shell}/><path d="M-9 13 8 14M-10 42 10 43" stroke="#b98f5f" strokeWidth="2"/>
      <g transform="translate(0 55)"><g data-part={front?"kneeFront":"kneeBack"}>
        <circle r="12" fill={dark}/><circle r="5" fill="#697179"/><path d="M-12 9Q-17 24-10 46L15 46 13 9Z" fill={shell}/>
        <path d="M-15 40Q-29 51-25 62L28 62Q33 54 19 43Z" fill={dark}/><path d="M-22 59H27" stroke="#b98f5f" strokeWidth="4"/>
      </g></g>
    </g>
  </g>;
  const arm=(front:boolean)=> <g transform={`translate(${front?202:110} 173)`}>
    <g data-part={front?"armFront":"armBack"}>
      <circle r="19" fill={dark}/><circle r="12" fill="#565b61"/><path d="M-13 4Q-20 21-12 51L14 51Q20 23 12 5Z" fill={shell}/>
      <path d="M-8 15 5 17M-10 40 10 41" stroke="#b98f5f" strokeWidth="2"/>
      <g transform="translate(0 56)"><g data-part={front?"elbowFront":"elbowBack"}>
        <circle r="11" fill={dark}/><circle r="4" fill="#697179"/><path d="M-12 10 -15 43Q0 51 15 43L11 11Z" fill={shell}/>
        <path d="M-10 18 8 19" stroke="#f3a74c" strokeWidth="3"/><path d="M-10 47 -12 59 -4 66 3 61 10 66 17 58 11 47Z" fill={dark}/>
        <path d="M-5 55 -4 63M6 54 8 63" stroke="#92928b" strokeWidth="3"/>
      </g></g>
    </g>
  </g>;
  return <div ref={ref} className={`milo actor-${phase}`} aria-hidden="true" data-motion={index}>
    <div className="ground-track"><div className="actor-shadow"/><div className="landing-dust"><i/><i/><i/><i/></div></div>
    <div className="robot-flight">
    <svg className="robot-rig" viewBox="0 0 320 340" fill="none" stroke="#17222b" strokeWidth="3" strokeLinejoin="round" overflow="visible">
      <defs>
        <linearGradient id={`${prefix}-shell`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0cb"/><stop offset=".48" stopColor="#d8c8aa"/><stop offset="1" stopColor="#ac8555"/></linearGradient>
        <linearGradient id={`${prefix}-metal`}><stop stopColor="#111d29"/><stop offset=".5" stopColor="#485462"/><stop offset="1" stopColor="#19242f"/></linearGradient>
        <radialGradient id={`${prefix}-eye`}><stop stopColor="#d8ffff"/><stop offset=".6" stopColor="#65eee9"/><stop offset="1" stopColor="#14aeb9"/></radialGradient>
      </defs>
      <g data-part="body" className="rig-body">
        {leg(false)}{arm(false)}
        <path d="M116 146Q155 130 196 151L203 204Q192 240 151 241 114 235 105 210Z" fill={shell}/>
        <path d="M114 194Q160 205 201 190M147 202 149 233" stroke="#846a50" strokeWidth="2"/>
        <ellipse cx="158" cy="211" rx="19" ry="17" fill={dark}/><circle cx="160" cy="209" r="9" fill="#12202b"/><path d="M123 159 147 161M184 165 192 179M124 218 128 221" stroke="#f5a33a" strokeWidth="4"/>
        {leg(true)}
        <g transform="translate(129 147)"><g data-part="scarf"><path d="M0 0Q-46-16-81-9L-107 15-81 14-103 38Q-43 28 5 10Z" fill="#dd4f13"/><path d="M-2 4Q-53 10-88 8M-15 12Q-43 16-65 27" stroke="#813416" strokeWidth="2"/></g></g>
        <g transform="translate(160 134)"><g data-part="head">
          <g className="rig-antenna"><path d="M-11-95Q-16-126-36-137" stroke={dark} strokeWidth="7"/><circle cx="-37" cy="-141" r="10" fill={glow} stroke="#1a6670"/></g>
          <path d="M-14-97Q-62-97-67-47L-66-13Q-58 12-5 11 59 16 66-25L61-59Q50-96-14-97Z" fill={shell}/>
          <path d="M2-80Q36-84 55-62L59-25Q57 0 20 3L-5-2Q-19-17-19-45-18-72 2-80Z" fill="#061923"/>
          <path d="M-51-69Q-37-83-16-83M-60-20-43-18M-53-49-33-47" stroke="#fff4d6" strokeWidth="3"/>
          <circle cx="-36" cy="-41" r="12" fill={dark}/><circle cx="-36" cy="-41" r="6" fill="#0f1c26"/><circle cx="-60" cy="-13" r="2" fill="#6c665b"/>
          <g className="rig-eyes"><ellipse cx="10" cy="-37" rx="10" ry="22" fill={glow} stroke="none"/><ellipse cx="40" cy="-37" rx="9" ry="20" fill={glow} stroke="none"/></g>
          <path d="M-19-90-13-84M-58-29-54-35M-46-9-38-6M49-70 52-66" stroke="#b87836" strokeWidth="2"/>
        </g></g>
        <path d="M110 139Q142 154 192 137L206 151Q185 178 143 159L119 160Z" fill="#eb661c"/><path d="M139 155 145 184 173 173 160 158Z" fill="#c64611"/>
        {arm(true)}
      </g>
    </svg>
    <div className="robot-charge"/><div className="carried-core"/><div className="speed-streaks"><i/><i/><i/></div>
    </div>
  </div>;
}
