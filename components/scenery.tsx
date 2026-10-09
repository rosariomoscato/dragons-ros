"use client";
import {useState} from "react";

export default function Scenery({src}:{src:string}) {
  const [shown,setShown]=useState(src);
  const changing=shown!==src;
  return <div className="scenery" aria-hidden="true">
    <div className={`scene-layer ${changing?"outgoing":""}`}>
      {/* Preloaded local illustrations stay mounted throughout an obstacle. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="scene-art" src={shown} alt="" draggable={false}/>
    </div>
    {changing&&<div key={src} className="scene-layer incoming" onAnimationEnd={e=>{if(e.animationName==="scene-reveal")setShown(src);}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="scene-art" src={src} alt="" draggable={false}/>
    </div>}
  </div>;
}
