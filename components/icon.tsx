export default function Icon({name}:{name:"arrow"|"pause"|"play"|"sound"|"mute"|"retry"}) {
 const paths={
  arrow:<><path d="M5 17 17 5M5 5h12v12"/></>,
  pause:<><path d="M8 5v14M16 5v14"/></>,
  play:<path d="m8 5 11 7-11 7Z"/>,
  sound:<><path d="m11 5-6 5H2v4h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></>,
  mute:<><path d="m11 5-6 5H2v4h3l6 5ZM16 9l6 6M22 9l-6 6"/></>,
  retry:<><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>,
 };
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
