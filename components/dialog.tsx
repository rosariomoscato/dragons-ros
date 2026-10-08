"use client";
import {useEffect, useRef} from "react";
export default function Dialog({title, children}: {title: string; children: React.ReactNode}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { if(previous?.isConnected) previous.focus(); };
  }, []);
  return <section ref={ref} className="dialog" role="dialog" aria-modal="true" aria-label={title} onKeyDown={e=>{
    if(e.key !== "Tab") return;
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const first=buttons[0], last=buttons.at(-1);
    if(e.shiftKey && document.activeElement===first) {e.preventDefault();last?.focus();}
    else if(!e.shiftKey && document.activeElement===last) {e.preventDefault();first?.focus();}
  }}><div className="dialog-card">{children}</div></section>;
}
