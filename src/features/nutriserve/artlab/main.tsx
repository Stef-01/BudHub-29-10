import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CustomerSprite } from '../assets/CustomerSprite';
import { CUSTOMER_SPRITES, type SpriteCustomerId } from '../assets/characters';
import './review.css';

const ids = Object.keys(CUSTOMER_SPRITES) as SpriteCustomerId[];
const stations = ['order', 'build', 'prep', 'finish'] as const;
const stationNames: Record<Station, { label: string; hi: string }> = {
  order: { label: 'Order', hi: 'ऑर्डर' },
  build: { label: 'Build', hi: 'परोसें' },
  prep: { label: 'Prep', hi: 'पकाएँ' },
  finish: { label: 'Finish', hi: 'सजाएँ' },
};
const PREP_SLOTS = 4;
type Station = typeof stations[number];

function Backdrop({ station }: { station: Station }) {
  return <svg className="scene-backdrop" viewBox="0 0 640 480" aria-hidden="true">
    <rect width="640" height="480" fill="var(--wall)" />
    {Array.from({ length: 7 }, (_, n) => <path key={n} d={`M0 ${50 + n * 48}H640`} stroke="#fff" opacity=".2" strokeWidth="3" />)}
    <path d="M0 325H640V445H0Z" fill="#777063" stroke="#30291f" strokeWidth="4" />
    {station === 'order' ? <>
      <rect x="40" y="65" width="112" height="205" rx="6" fill="#d58038" stroke="#3c2b20" strokeWidth="5" />
      <rect x="52" y="79" width="87" height="145" fill="#b4dcdf" stroke="#fff0c6" strokeWidth="5" />
      <path d="M96 80V224M52 153H139" stroke="#fff0c6" strokeWidth="6" />
      <circle cx="133" cy="248" r="5" fill="#ffe2a5" stroke="#3c2b20" strokeWidth="2" />
      <rect x="228" y="59" width="168" height="112" rx="3" fill="#fff4cd" stroke="#3c2b20" strokeWidth="5" />
      <text x="312" y="96" textAnchor="middle" fontSize="23" fontWeight="900" fill="#16816c">NUTRI SERVE</text>
      <text x="312" y="127" textAnchor="middle" fontSize="16" fontWeight="700" fill="#5b3422">INDIAN KITCHEN</text>
      <path d="M18 30Q200 65 436 27" fill="none" stroke="#3c2b20" strokeWidth="3" />
      {[60, 110, 160, 210, 260, 310, 360, 410].map((x, i) => <path key={x} d={`M${x} ${i < 4 ? 37 + i * 3 : 49 - (i - 4) * 4}l12 24 12-24Z`} fill={i % 2 ? '#ed9b39' : '#ec6550'} stroke="#3c2b20" strokeWidth="2" />)}
      <path d="M465 303h60l-10 64h-40Z" fill="#d28b43" stroke="#3c2b20" strokeWidth="4" />
      <path d="M494 311V195M495 249Q446 204 454 181Q495 183 495 237M495 272Q544 219 548 246Q532 276 495 285" fill="#4e994b" stroke="#31552e" strokeWidth="5" />
    </> : <>
      <rect x="21" y="70" width="432" height="24" rx="3" fill="#d8d9ce" stroke="#34312c" strokeWidth="4" />
      <path d="M25 92V308M450 92V308" stroke="#3c3830" strokeWidth="5" />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${30 + i * 45} 100V306`} stroke="#fff" opacity=".12" strokeWidth="2" />)}
      <rect x="0" y="312" width="640" height="82" fill="#bdbdb3" stroke="#30291f" strokeWidth="4" />
      <path d="M0 328H640" stroke="#f5f4dd" strokeWidth="7" />
      <path d="M0 396H640" stroke="#34312c" strokeWidth="8" />
    </>}
  </svg>;
}

function Bowl({ filled = false }: { filled?: boolean }) {
  return <svg viewBox="0 0 160 120" role="img" aria-label={filled ? 'Illustrative rice and curry bowl' : 'Empty steel bowl'}>
    <path d="M18 45Q23 106 80 108Q137 106 142 45Z" fill="#bac6c5" stroke="#30332e" strokeWidth="4" />
    <path d="M38 63Q43 90 58 96" fill="none" stroke="#f7f4df" strokeWidth="9" />
    <ellipse cx="80" cy="45" rx="63" ry="24" fill={filled ? '#f9edc9' : '#778e8c'} stroke="#30332e" strokeWidth="4" />
    {filled && <><ellipse cx="85" cy="45" rx="39" ry="17" fill="#ce7c30" stroke="#69451e" strokeWidth="2" />{[[-18, -5], [0, 5], [18, -5], [-20, 6], [12, 3]].map(([x, y], i) => <circle key={i} cx={83 + x} cy={44 + y} r="6" fill="#eeb65b" stroke="#9d602c" strokeWidth="2" />)}</>}
    <path d="M18 45Q80 78 142 45" fill="none" stroke="#f0f4e9" strokeWidth="6" />
  </svg>;
}

function ArtLab() {
  const [selected, setSelected] = useState<SpriteCustomerId>('arjun_fit');
  const [station, setStation] = useState<Station>('order');
  const [backdrop, setBackdrop] = useState('cream');
  const [size, setSize] = useState(180);
  return <main className="art-lab">
    <header className="lab-header"><div><p className="eyebrow">BUDHUB / NUTRISERVE</p><h1>Character & station review</h1><p>Six original idle sprites. Review the cast and station layout before completing the gameplay remaster.</p></div><a href="/">Back to BudHub</a></header>
    <section className="review-layout" aria-label="Station integration review">
      <div className="stage-wrap"><div className={`game-stage station-${station}`}>
        <Backdrop station={station} />
        <div className="ticket-rail" />
        <aside className="order-ticket"><span className="ticket-number">01</span><b>{CUSTOMER_SPRITES[selected].name}</b><hr /><span>REGULAR</span><strong>Rice<br />Chana masala<br />Raita</strong><hr /><span>MEDIUM PREP</span></aside>
        {station === 'order' ? <><CustomerSprite customerId={selected} className="scene-customer" /><div className="counter-front"><span>Welcome to NutriServe!</span></div></> : station === 'prep' ? <div className="prep-slots">{Array.from({ length: PREP_SLOTS }, (_, i) => <div className="prep-unit" key={i}><div className="heat-meter"><span style={{ width: `${25 + i * 20}%` }} /></div><Bowl filled /><b>{i + 1}</b></div>)}</div> : <div className="bowl-preview"><Bowl filled={station === 'finish'} /></div>}
        {station === 'build' && <div className="ingredient-sign">CHOOSE • PORTION • PREP</div>}
        {station === 'finish' && <div className="ingredient-sign">DRIZZLE • GARNISH • SERVE</div>}
        <nav className="station-tabs" aria-label="Preview station">{stations.map(s => <button key={s} type="button" className={`tab-${s}`} aria-pressed={station === s} onClick={() => setStation(s)}>{stationNames[s].label} <span lang="hi">{stationNames[s].hi}</span></button>)}</nav>
      </div><p className="caption">640 × 480 stage coordinates. Four prep slots. Procedural room and bowl are layout studies; final food and equipment art remains a separate asset gate.</p></div>
      <aside className="review-controls"><h2>Cast</h2><div className="cast-picker">{ids.map(id => <button key={id} type="button" aria-pressed={id === selected} onClick={() => setSelected(id)}>{CUSTOMER_SPRITES[id].name}</button>)}</div><label>Display size <output>{size} px</output><input aria-label="Sprite display height" type="range" min="120" max="260" step="20" value={size} onChange={e => setSize(Number(e.target.value))} /></label><label>Alpha background<select value={backdrop} onChange={e => setBackdrop(e.target.value)}><option value="cream">Cream</option><option value="green">Green</option><option value="dark">Dark</option><option value="checker">Checkerboard</option></select></label><p>Review silhouettes, eye shape, outline weight, clipping, and transparent edges at actual display size. Idle art must not stand in for a missing reaction.</p></aside>
    </section>
    <section aria-labelledby="cast-title"><h2 id="cast-title">Native-size cast check</h2><div className={`cast-sheet bg-${backdrop}`}>{ids.map(id => <figure key={id}><CustomerSprite customerId={id} style={{ height: size, width: size * 2 / 3 }} /><figcaption>{CUSTOMER_SPRITES[id].name}</figcaption></figure>)}</div></section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<ArtLab />);
