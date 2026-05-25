import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Cut {
  id: string
  label: string
  x: number
  y: number
  description: string
  bestFor: string[]
  cookingTip: string
}

interface Animal {
  id: string
  name: string
  tagline: string
  cuts: Cut[]
  svgPath: string
  color: string
}

interface FAQ {
  q: string
  a: string
}

interface Testimonial {
  text: string
  author: string
  role: string
}

// ─── Data ────────────────────────────────────────────────────────────────────
const animals: Animal[] = [
  {
    id: 'rabbit',
    name: 'Rabbit',
    tagline: 'Lean, delicate, and prized by chefs for its subtle flavor.',
    color: '#c9a052',
    svgPath: '',
    cuts: [
      { id: 'r1', label: 'Saddle', x: 50, y: 38, description: 'The prized center-back cut — the most tender part of the rabbit.', bestFor: ['Roasting whole', 'Stuffed roulade', 'Fine-dining presentations'], cookingTip: 'Sear in butter, finish in oven at 350°F. Rest 5 min. Slice at the table.' },
      { id: 'r2', label: 'Hind Legs', x: 72, y: 62, description: 'Meatiest part of the rabbit. Rich in connective tissue that breaks down beautifully.', bestFor: ['Slow braise', 'Confit', 'Ragù & pasta sauce'], cookingTip: 'Low and slow — 3 hours at 300°F in white wine, garlic, and herbs.' },
      { id: 'r3', label: 'Front Legs', x: 30, y: 60, description: 'Smaller but full of flavor. Great for stocks and slow-cooked preparations.', bestFor: ['Stocks & consommé', 'Terrine', 'Stews'], cookingTip: 'Ideal for extracting rich gelatin. Simmer 4+ hours for deep stock.' },
      { id: 'r4', label: 'Loin', x: 50, y: 52, description: 'Tender, mild medallions from the spine area. Cooks in minutes.', bestFor: ['Pan-seared', 'Wrapped in pancetta', 'Carpaccio'], cookingTip: 'Never overcook — internal temp 145°F. Keep it pink and juicy.' },
      { id: 'r5', label: 'Ribs', x: 38, y: 42, description: 'Thin but flavorful. Often used rack-style or ground.', bestFor: ['Grilling', 'Ground rabbit', 'Stocks'], cookingTip: 'Marinate overnight. High heat, short cook. Brush with herb butter.' },
      { id: 'r6', label: 'Head & Offal', x: 15, y: 30, description: 'Liver, kidneys, and heart — packed with nutrients and deep flavor.', bestFor: ['Liver pâté', 'Pan-fried kidneys', 'Offal salads'], cookingTip: 'Rabbit liver is extraordinarily delicate. Flash-fry in brown butter 90 seconds per side.' },
    ],
  },
  {
    id: 'duck',
    name: 'Duck',
    tagline: 'Rich, layered fat and deep-red meat that rewards patience.',
    color: '#8b6f3e',
    svgPath: '',
    cuts: [
      { id: 'd1', label: 'Magret Breast', x: 45, y: 35, description: 'The crown jewel of duck — the breast from a fattened bird, scored and seared.', bestFor: ['Pan-seared magret', 'Sliced over salad', 'Fine dining entrée'], cookingTip: 'Score fat in crosshatch, render fat-side down cold pan 8 min, flip 3 min. Rest 10 min. Medium-rare.' },
      { id: 'd2', label: 'Duck Leg', x: 68, y: 60, description: 'Collagen-rich legs perfect for long, slow cooking. Transforms into silk.', bestFor: ['Confit de canard', 'Braised with lentils', 'Duck cassoulet'], cookingTip: 'Salt-cure overnight. Submerge in duck fat. Cook 82°C for 8 hours. Crisp skin to finish.' },
      { id: 'd3', label: 'Duck Fat', x: 50, y: 50, description: 'Not a cut, but our most prized byproduct — pure rendered cooking gold.', bestFor: ['Roasting potatoes', 'Confit medium', 'Pan-frying'], cookingTip: 'Use duck fat at medium heat to roast potatoes. Results are incomparable.' },
      { id: 'd4', label: 'Wings', x: 28, y: 42, description: 'Small but intensely flavored. Excellent for stocks and appetizers.', bestFor: ['Duck wing stock', 'Glazed appetizers', 'Ramen broth'], cookingTip: 'Roast at 400°F until golden, then simmer 3 hours for the deepest stock imaginable.' },
      { id: 'd5', label: 'Carcass & Neck', x: 50, y: 65, description: 'The entire carcass after butchering — essential for stock.', bestFor: ['Duck broth', 'Ramen base', 'Risotto stock'], cookingTip: 'Roast carcass until dark brown before simmering. Adds extraordinary depth.' },
      { id: 'd6', label: 'Duck Liver', x: 35, y: 55, description: 'Rich, velvety, and far more complex than chicken liver.', bestFor: ['Duck liver mousse', 'Pan-fried with port', 'Crostini topping'], cookingTip: 'Season with salt 1 hour before cooking. Sear in butter, deglaze with port. 2 min max.' },
    ],
  },
  {
    id: 'chicken',
    name: 'Chicken',
    tagline: 'Pasture-raised flavor that reminds you what chicken is supposed to taste like.',
    color: '#6b8c3e',
    svgPath: '',
    cuts: [
      { id: 'c1', label: 'Whole Bird', x: 50, y: 45, description: 'Our pasture-raised whole chicken — the benchmark for flavor and versatility.', bestFor: ['Sunday roast', 'Spatchcock grill', 'Poached for salads'], cookingTip: 'Dry-brine 24 hours. Roast at 425°F. Baste with butter every 15 min. Internal 165°F.' },
      { id: 'c2', label: 'Breast', x: 42, y: 35, description: 'Lean, tender, and firm from natural free-range movement. Not the bland supermarket kind.', bestFor: ['Pan-roasted', 'Grilled', 'Stuffed chicken supreme'], cookingTip: 'Pound to even thickness. Brine 1 hour. Sear skin-on in cast iron, finish in oven.' },
      { id: 'c3', label: 'Thighs', x: 58, y: 58, description: 'The most forgiving and flavorful cut. More fat, more flavor, harder to overcook.', bestFor: ['Braised with olives', 'Sheet pan dinner', 'Curry & stews'], cookingTip: 'Skin-on, bone-in. High heat. Let it render. Don\'t move it for 10 minutes.' },
      { id: 'c4', label: 'Drumsticks', x: 70, y: 68, description: 'Rich, affordable, and fantastic glazed or braised.', bestFor: ['Glazed & roasted', 'BBQ', 'Adobo'], cookingTip: 'Score to the bone. Marinate overnight. High indirect heat 45 min. Finish direct.' },
      { id: 'c5', label: 'Wings', x: 28, y: 40, description: 'Full of gelatin and cartilage — incredible for stocks or glazed whole.', bestFor: ['Buffalo-style', 'Yakitori', 'Stock & broth'], cookingTip: 'Bake at 425°F on a rack 45 min for maximum crispness. No frying needed.' },
      { id: 'c6', label: 'Carcass & Oysters', x: 50, y: 60, description: 'The two small "oysters" at the backbone — the most tender morsels on the bird. The carcass makes the finest stock.', bestFor: ['Chef\'s treat', '24-hour stock', 'Risotto base'], cookingTip: 'Roast the carcass at 450°F until deeply browned before simmering for 6+ hours.' },
    ],
  },
]

const faqs: FAQ[] = [
  { q: 'Where do you deliver?', a: 'We deliver refrigerated throughout the Greater Metropolitan Area (GAM) of San José and select areas in the Southern Zone including Río Claro and surroundings. Contact us via WhatsApp to confirm your specific delivery zone.' },
  { q: 'Is the meat really organic and pasture-raised?', a: 'Yes. Our animals are raised on open pasture at our farms in San José and Río Claro, without preventive hormones or antibiotics. They are fed naturally and managed with strict animal welfare standards.' },
  { q: 'How is the cold chain maintained during delivery?', a: 'All meat is vacuum-packed and delivered in refrigerated containers. We coordinate delivery windows to ensure product arrives at optimal temperature. Temperature logs are available on request for restaurant clients.' },
  { q: 'How far in advance do I need to place my order?', a: 'For home orders, we ask for 48 hours notice. Restaurant and hotel accounts receive priority scheduling and can set up recurring weekly deliveries with a dedicated account manager.' },
  { q: 'Do you offer volume pricing for restaurants and hotels?', a: 'Absolutely. We work closely with professional kitchens to provide standardized cuts, consistent gram weights, and tiered volume pricing. Reach out via WhatsApp or email to discuss your specific needs.' },
]

const testimonials: Testimonial[] = [
  { text: 'Working with Juliet\'s has given our kitchen a reliable, premium protein we can actually talk about on the menu. The duck breast is extraordinary — our guests always ask where it comes from.', author: 'Chef Marco Villarreal', role: 'Executive Chef, Restaurant Marea, San José' },
  { text: 'Since we switched to Juliet\'s chicken, the difference is immediately visible in the pan. Real fat, real flavor, real bird. Our roast chicken became our most ordered dish.', author: 'Ana Sofía Peralta', role: 'Owner, Bistró del Campo, San José' },
  { text: 'We\'ve tried ordering premium rabbit from importers. Nothing compares to having it raised 40km away and delivered the same week. Freshness you can taste.', author: 'Carlos Navarro', role: 'Culinary Director, Hotel Hacienda Río Sur' },
  { text: 'The rabbit arrived perfectly portioned and absolutely fresh. My family hasn\'t eaten this well in years. I don\'t think we can go back to supermarket chicken now.', author: 'María González', role: 'Home Customer, Escazú' },
]

const steps = [
  { n: '01', title: 'Place Your Order', desc: 'Select individual cuts, family boxes, or tell us what your restaurant needs. Order online or message us on WhatsApp — we\'re responsive.' },
  { n: '02', title: 'We Schedule Your Delivery', desc: 'We coordinate day and time based on your location — GAM, San José, or the Southern Zone near Río Claro. Restaurants can set up standing weekly orders.' },
  { n: '03', title: 'Receive & Cook', desc: 'Your order arrives refrigerated and vacuum-sealed. Inspect, chill, and enjoy organic meat with genuine flavor.' },
]

// ─── Components ──────────────────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Animated Gold Rule ──────────────────────────────────────────────────────

function GoldRule({ dark = false }: { dark?: boolean }) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      className={`gold-rule${dark ? ' gold-rule--dark' : ''}${visible ? ' gold-rule--drawn' : ''}`}
    />
  )
}

// ─── Anatomical Cut Diagram ───────────────────────────────────────────────────

function RabbitSVG({ activeCut, onHover }: { activeCut: string | null; onHover: (id: string | null) => void }) {
  const cuts = animals[0].cuts
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 40px rgba(201,160,82,0.12))' }}>
      {/* Body outline */}
      <ellipse cx="210" cy="145" rx="130" ry="65" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Head */}
      <ellipse cx="78" cy="125" rx="42" ry="38" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Ears */}
      <ellipse cx="65" cy="72" rx="11" ry="32" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" transform="rotate(-8 65 72)" />
      <ellipse cx="91" cy="68" rx="11" ry="32" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" transform="rotate(8 91 68)" />
      {/* Tail */}
      <circle cx="342" cy="148" r="16" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Hind legs */}
      <ellipse cx="295" cy="200" rx="30" ry="18" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" transform="rotate(-15 295 200)" />
      <ellipse cx="270" cy="215" rx="25" ry="14" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" transform="rotate(-25 270 215)" />
      {/* Front legs */}
      <ellipse cx="118" cy="195" rx="22" ry="14" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" transform="rotate(15 118 195)" />
      <ellipse cx="138" cy="208" rx="20" ry="12" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" transform="rotate(20 138 208)" />
      {/* Eye */}
      <circle cx="65" cy="118" r="5" fill="#0f1f0f" stroke="#c9a052" strokeWidth="1" />
      <circle cx="66" cy="117" r="2" fill="#c9a052" />
      {/* Nose */}
      <ellipse cx="40" cy="128" rx="5" ry="3" fill="#3a5c2a" />

      {/* Cut zone highlights + pins */}
      {cuts.map((cut) => {
        const isActive = activeCut === cut.id
        return (
          <g key={cut.id} style={{ cursor: 'pointer' }} onClick={() => onHover(isActive ? null : cut.id)}>
            <circle
              cx={cut.x * 4}
              cy={cut.y * 2.8}
              r={isActive ? 14 : 10}
              fill={isActive ? '#c9a052' : 'rgba(201,160,82,0.25)'}
              stroke="#c9a052"
              strokeWidth={isActive ? 2 : 1}
              style={{ transition: 'all 0.3s ease' }}
            />
            <text x={cut.x * 4} y={cut.y * 2.8 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={isActive ? '#0f1f0f' : '#c9a052'} fontFamily="Inter" fontWeight="600" style={{ pointerEvents: 'none' }}>
              {cut.id.replace('r', '')}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DuckSVG({ activeCut, onHover }: { activeCut: string | null; onHover: (id: string | null) => void }) {
  const cuts = animals[1].cuts
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 40px rgba(201,160,82,0.12))' }}>
      {/* Body */}
      <ellipse cx="210" cy="155" rx="120" ry="75" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Neck */}
      <path d="M110 140 Q90 110 85 90 Q80 70 95 60" stroke="#3a5c2a" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d="M110 140 Q90 110 85 90 Q80 70 95 60" stroke="#1a2e1a" strokeWidth="15" fill="none" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="100" cy="52" rx="30" ry="24" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Bill */}
      <path d="M72 55 L55 58 L72 62 Z" fill="#2a5c1a" stroke="#3a5c2a" strokeWidth="1" />
      {/* Eye */}
      <circle cx="90" cy="48" r="5" fill="#0f1f0f" stroke="#c9a052" strokeWidth="1" />
      <circle cx="91" cy="47" r="2" fill="#c9a052" />
      {/* Tail feathers */}
      <path d="M325 150 Q355 135 360 155 Q355 175 325 165 Z" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      <path d="M325 148 Q350 130 358 148" stroke="#3a5c2a" strokeWidth="1" fill="none" />
      {/* Wings hint */}
      <path d="M145 100 Q195 80 250 95 Q290 105 300 130" stroke="#3a5c2a" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      {/* Legs */}
      <line x1="235" y1="225" x2="225" y2="255" stroke="#3a5c2a" strokeWidth="8" strokeLinecap="round" />
      <line x1="260" y1="225" x2="270" y2="255" stroke="#3a5c2a" strokeWidth="8" strokeLinecap="round" />
      <path d="M205 255 L225 255 L235 265 M225 255 L230 268 M225 255 L218 268" stroke="#3a5c2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M250 255 L270 255 L280 265 M270 255 L275 268 M270 255 L263 268" stroke="#3a5c2a" strokeWidth="2" fill="none" strokeLinecap="round" />

      {cuts.map((cut) => {
        const isActive = activeCut === cut.id
        return (
          <g key={cut.id} style={{ cursor: 'pointer' }} onClick={() => onHover(isActive ? null : cut.id)}>
            <circle
              cx={cut.x * 4}
              cy={cut.y * 2.8}
              r={isActive ? 14 : 10}
              fill={isActive ? '#c9a052' : 'rgba(201,160,82,0.25)'}
              stroke="#c9a052"
              strokeWidth={isActive ? 2 : 1}
              style={{ transition: 'all 0.3s ease' }}
            />
            <text x={cut.x * 4} y={cut.y * 2.8 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={isActive ? '#0f1f0f' : '#c9a052'} fontFamily="Inter" fontWeight="600" style={{ pointerEvents: 'none' }}>
              {cut.id.replace('d', '')}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ChickenSVG({ activeCut, onHover }: { activeCut: string | null; onHover: (id: string | null) => void }) {
  const cuts = animals[2].cuts
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 40px rgba(201,160,82,0.12))' }}>
      {/* Body */}
      <ellipse cx="200" cy="148" rx="115" ry="80" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="135" y="72" width="28" height="42" rx="14" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Head */}
      <ellipse cx="149" cy="58" rx="26" ry="24" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      {/* Comb */}
      <path d="M142 36 Q145 26 148 34 Q152 24 155 33 Q159 23 162 32" stroke="#8b2020" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Beak */}
      <path d="M125 58 L113 62 L125 66 Z" fill="#8b6f00" stroke="#c9a052" strokeWidth="0.5" />
      {/* Wattle */}
      <ellipse cx="128" cy="66" rx="7" ry="9" fill="#8b2020" opacity="0.8" />
      {/* Eye */}
      <circle cx="142" cy="53" r="5" fill="#0f1f0f" stroke="#c9a052" strokeWidth="1" />
      <circle cx="143" cy="52" r="2" fill="#c9a052" />
      {/* Tail feathers */}
      <path d="M312 140 Q338 120 345 148 Q338 172 312 158 Z" fill="#1a2e1a" stroke="#3a5c2a" strokeWidth="1.5" />
      <path d="M312 135 Q340 112 348 135" stroke="#3a5c2a" strokeWidth="1" fill="none" />
      <path d="M312 155 Q340 170 345 158" stroke="#3a5c2a" strokeWidth="1" fill="none" />
      {/* Wings */}
      <path d="M145 105 Q185 85 245 100 Q285 112 295 140" stroke="#3a5c2a" strokeWidth="2" fill="none" strokeDasharray="5 3" />
      {/* Legs */}
      <line x1="230" y1="222" x2="222" y2="255" stroke="#3a5c2a" strokeWidth="9" strokeLinecap="round" />
      <line x1="258" y1="222" x2="268" y2="255" stroke="#3a5c2a" strokeWidth="9" strokeLinecap="round" />
      <path d="M202 255 L222 255 L232 266 M222 255 L226 270 M222 255 L215 270" stroke="#3a5c2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M248 255 L268 255 L278 266 M268 255 L272 270 M268 255 L261 270" stroke="#3a5c2a" strokeWidth="2" fill="none" strokeLinecap="round" />

      {cuts.map((cut) => {
        const isActive = activeCut === cut.id
        return (
          <g key={cut.id} style={{ cursor: 'pointer' }} onClick={() => onHover(isActive ? null : cut.id)}>
            <circle
              cx={cut.x * 4}
              cy={cut.y * 2.8}
              r={isActive ? 14 : 10}
              fill={isActive ? '#c9a052' : 'rgba(201,160,82,0.25)'}
              stroke="#c9a052"
              strokeWidth={isActive ? 2 : 1}
              style={{ transition: 'all 0.3s ease' }}
            />
            <text x={cut.x * 4} y={cut.y * 2.8 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={isActive ? '#0f1f0f' : '#c9a052'} fontFamily="Inter" fontWeight="600" style={{ pointerEvents: 'none' }}>
              {cut.id.replace('c', '')}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function CutDiagram({ animal }: { animal: Animal }) {
  const [activeCut, setActiveCut] = useState<string | null>(null)
  const activeCutData = animal.cuts.find(c => c.id === activeCut)

  const SVGComponent = animal.id === 'rabbit' ? RabbitSVG : animal.id === 'duck' ? DuckSVG : ChickenSVG

  return (
    <div className="cut-diagram">
      <div className="diagram-grid">
        <div className="diagram-svg-wrap">
          <SVGComponent activeCut={activeCut} onHover={setActiveCut} />
          <div className="cut-legend">
            {animal.cuts.map((cut, i) => (
              <button
                key={cut.id}
                className={`cut-tag ${activeCut === cut.id ? 'cut-tag--active' : ''}`}
                onClick={() => setActiveCut(activeCut === cut.id ? null : cut.id)}
              >
                <span className="cut-num">{i + 1}</span>
                {cut.label}
              </button>
            ))}
          </div>
        </div>
        <div className="diagram-info">
          {!activeCutData ? (
            <div className="diagram-prompt">
              <div className="diagram-prompt-icon">⊕</div>
              <p className="diagram-prompt-text">Select any numbered point on the diagram to explore each cut — what it is, what it's best for, and how to cook it.</p>
            </div>
          ) : (
            <div className="cut-detail" key={activeCutData.id}>
              <div className="cut-detail-label">Cut {activeCut?.replace(/[rdc]/, '')}</div>
              <h3 className="cut-detail-name">{activeCutData.label}</h3>
              <div className="cut-detail-divider" />
              <p className="cut-detail-desc">{activeCutData.description}</p>
              <div className="cut-detail-block">
                <div className="cut-block-title">Best For</div>
                <ul className="cut-best-for">
                  {activeCutData.bestFor.map(b => <li key={b}>{b}</li>)}
                </ul>
              </div>
              <div className="cut-detail-block">
                <div className="cut-block-title">Chef's Tip</div>
                <p className="cut-tip">{activeCutData.cookingTip}</p>
              </div>
              <button className="cut-close" onClick={() => setActiveCut(null)}>Close ✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AnatomySection() {
  const [activeAnimal, setActiveAnimal] = useState(0)
  return (
    <section className="anatomy-section">
      <FadeIn>
        <div className="section-label">The Butcher's Guide</div>
        <h2 className="section-title">Know Your Cuts</h2>
        <p className="anatomy-sub">Explore the anatomy of each animal — select a cut to learn what it is, how to cook it, and why it matters.</p>
      </FadeIn>
      <FadeIn delay={200}>
        <div className="animal-tabs">
          {animals.map((a, i) => (
            <button
              key={a.id}
              className={`animal-tab ${activeAnimal === i ? 'animal-tab--active' : ''}`}
              onClick={() => setActiveAnimal(i)}
            >
              {a.name}
            </button>
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={300}>
        <div className="animal-tagline">{animals[activeAnimal].tagline}</div>
        <CutDiagram animal={animals[activeAnimal]} />
      </FadeIn>
    </section>
  )
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="faq-section">
      <FadeIn>
        <div className="section-label">Questions</div>
        <h2 className="section-title">Frequently Asked</h2>
      </FadeIn>
      <div className="faq-list">
        {faqs.map((f, i) => (
          <FadeIn key={i} delay={i * 80}>
            <div className={`faq-item ${open === i ? 'faq-item--open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-icon">{open === i ? '−' : '+'}</span>
              </button>
              <div className="faq-a-wrap" style={{ maxHeight: open === i ? '300px' : '0' }}>
                <p className="faq-a">{f.a}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={400}>
        <a href="#contacto" className="faq-link">View all frequently asked questions →</a>
      </FadeIn>
    </section>
  )
}

function TestimonialsSection() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 5000)
    return () => clearInterval(t)
  }, [paused])
  const t = testimonials[idx]
  return (
    <section className="testimonials-section">
      <FadeIn>
        <div className="section-label">Social Proof</div>
        <h2 className="section-title">Trusted by Chefs & Families</h2>
      </FadeIn>
      <FadeIn delay={200}>
        <div className="testimonial-card" key={idx} style={{ animation: 'fadeUp 0.6s ease' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="testimonial-quote">"</div>
          <p className="testimonial-text">{t.text}</p>
          <div className="testimonial-divider" />
          <div className="testimonial-author">{t.author}</div>
          <div className="testimonial-role">{t.role}</div>
        </div>
        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button key={i} className={`dot ${i === idx ? 'dot--active' : ''}`} onClick={() => setIdx(i)} />
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={300}>
        <div className="logos-label">We supply:</div>
        <div className="logos-row">
          {['Marea', 'Hacienda Río Sur', 'Bistró del Campo', 'Hotel Vista Verde', 'Restaurante Origen'].map(name => (
            <div key={name} className="logo-chip">{name}</div>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [emailForm, setEmailForm] = useState({ name: '', email: '', restaurant: false })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app">
      {/* ── TOP BAR ── */}
      <div className="topbar">
        <span className="topbar-left">Refrigerated delivery in the Greater Metropolitan Area and Southern Zone · Organic Meat</span>
        <a href="https://wa.me/50660000000" className="topbar-right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          WhatsApp Orders: +506 6000-0000
        </a>
      </div>

      {/* ── NAV ── */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <span className="nav-logo-j">J</span>
            <span className="nav-logo-text">Juliet's<br /><span className="nav-logo-sub">Organic Meats</span></span>
          </a>
          <nav className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
            <a href="#inicio" className="nav-link" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#restaurantes" className="nav-link" onClick={() => setMenuOpen(false)}>For Restaurants</a>
            <a href="#casa" className="nav-link" onClick={() => setMenuOpen(false)}>For Home</a>
            <a href="#finca" className="nav-link" onClick={() => setMenuOpen(false)}>Our Farm</a>
            <a href="#anatomy" className="nav-link" onClick={() => setMenuOpen(false)}>Our Cuts</a>
            <a href="#recetas" className="nav-link" onClick={() => setMenuOpen(false)}>Recipes</a>
            <a href="#contacto" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
          <div className="nav-actions">
            <button className="lang-toggle">ES | EN</button>
            <button className="nav-icon-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </button>
            <button className="nav-icon-btn" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
            </button>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="inicio" className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <FadeIn>
            <div className="hero-eyebrow">Juliet's Organic Meats · Costa Rica</div>
            <h1 className="hero-h1">
              Organic Rabbit,<br />
              <em>Duck & Chicken</em><br />
              from Costa Rica
            </h1>
            <p className="hero-sub">
              Pasture-raised between San José and Río Claro — no hormones, no antibiotics — delivered refrigerated to your kitchen.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="hero-ctas">
              <div className="hero-cta-block">
                <a href="#restaurantes" className="btn btn--gold">I'm a Restaurant / Hotel</a>
                <p className="cta-sub">Special cuts, volume pricing & scheduled deliveries.</p>
              </div>
              <div className="hero-cta-block">
                <a href="#casa" className="btn btn--outline">Shop for My Home</a>
                <p className="cta-sub">Family boxes, individual cuts & subscriptions.</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={500}>
            <div className="hero-badges">
              <div className="badge"><span className="badge-icon">◈</span> Farms in San José & Río Claro</div>
              <div className="badge"><span className="badge-icon">◈</span> Pasture-raised & animal welfare</div>
              <div className="badge"><span className="badge-icon">◈</span> Cold chain guaranteed</div>
            </div>
          </FadeIn>
        </div>
        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <span className="hero-scroll-line" />
        </div>
      </section>

      {/* ── TWO PATHWAYS ── */}
      <section className="pathways-section">
        <FadeIn>
          <div className="section-label">Who Is It For</div>
          <h2 className="section-title">One Farm, Two Ways to Enjoy It</h2>
          <GoldRule />
        </FadeIn>
        <div className="pathways-grid">
          <FadeIn delay={100}>
            <div className="pathway-card pathway-card--dark" id="restaurantes">
              <div className="pathway-icon">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#c9a052" strokeWidth="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>
              </div>
              <div className="pathway-label">For Restaurants & Hotels</div>
              <h3 className="pathway-h3">Professional Kitchen Partner</h3>
              <ul className="pathway-list">
                <li>Consistent supply from San José and Río Claro.</li>
                <li>Rabbit, duck and organic chicken for fine dining menus.</li>
                <li>Personalized service and special volume pricing.</li>
              </ul>
              <a href="#contacto" className="btn btn--gold-sm">View Restaurant Solutions</a>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="pathway-card pathway-card--light">
              <div className="pathway-icon">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2a4a1a" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <div className="pathway-label pathway-label--dark">For Your Home</div>
              <h3 className="pathway-h3 pathway-h3--dark" id="casa">The Home Table</h3>
              <ul className="pathway-list pathway-list--dark">
                <li>Organic boxes with chicken, duck and rabbit ready to cook.</li>
                <li>Practical cuts for everyday meals or special dinners.</li>
                <li>Refrigerated delivery in San José, GAM and select Southern Zone areas.</li>
              </ul>
              <a href="#cajas" className="btn btn--dark">Shop Family Boxes</a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRODUCT STRIP ── */}
      <section className="products-section">
        <FadeIn>
          <div className="section-label section-label--dark">Our Meats</div>
          <h2 className="section-title section-title--dark">Juliet's Organic Meats</h2>
          <GoldRule dark />
        </FadeIn>
        <div className="products-grid">
          {[
            { name: 'Organic Rabbit', desc: 'Tender, lean and delicately flavored. Ideal for stews, ragùs and gourmet preparations at home or on your menu.', cuts: ['Whole or portioned', 'Special cuts for restaurants'], link: 'View rabbit cuts', num: '01' },
            { name: 'Organic Duck', desc: 'Pasture-raised duck with high-quality fat and rich, intense meat. Perfect for confit, magret and chef-driven plates.', cuts: ['Breasts, legs and whole duck', 'Presentations for professional kitchens'], link: 'View duck cuts', num: '02' },
            { name: 'Pasture-Raised Chicken', desc: 'Naturally grown chicken — juicy and authentic in flavor thanks to our farms in San José and Río Claro.', cuts: ['Whole chicken and pieces', 'Family boxes & subscriptions'], link: 'View chicken cuts', num: '03' },
          ].map((p, i) => (
            <FadeIn key={p.name} delay={i * 150}>
              <div className="product-card">
                <div className="product-num">{p.num}</div>
                <div className="product-card-inner">
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-desc">{p.desc}</p>
                  <ul className="product-cuts">
                    {p.cuts.map(c => <li key={c}>{c}</li>)}
                  </ul>
                  <a href="#anatomy" className="product-link">{p.link} →</a>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── WHY JULIET'S ── */}
      <section className="why-section">
        <FadeIn>
          <div className="section-label">Why Choose Us</div>
          <h2 className="section-title">Why the Best Kitchens<br /><em>Choose Juliet's</em></h2>
          <GoldRule />
        </FadeIn>
        <div className="why-grid">
          {[
            { icon: '◌', title: 'Organic & Natural', desc: 'Protein raised without preventive hormones or antibiotics, naturally fed on open pasture.' },
            { icon: '◉', title: 'Real Animal Welfare', desc: 'Space, fresh air and respectful management at our farms in San José and Río Claro.' },
            { icon: '◍', title: 'Fresh, Local & Traceable', desc: 'You know where your meat comes from. From our Costa Rican farms directly to your kitchen.' },
            { icon: '◎', title: 'Cold Chain Guaranteed', desc: 'We process, vacuum-pack and deliver refrigerated to preserve flavor and food safety.' },
          ].map((w, i) => (
            <FadeIn key={w.title} delay={i * 120}>
              <div className="why-block">
                <div className="why-icon">{w.icon}</div>
                <h3 className="why-title">{w.title}</h3>
                <p className="why-desc">{w.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── RESTAURANT BANNER ── */}
      <section className="restaurant-banner">
        <div className="restaurant-banner-bg" />
        <FadeIn>
          <div className="banner-eyebrow">For Chefs, Hotels & Catering</div>
          <h2 className="banner-h2">A Reliable Partner<br /><em>for Your Professional Kitchen</em></h2>
          <p className="banner-text">
            Juliet's Organic Meats supplies rabbit, duck and organic chicken to restaurants in San José, the GAM and the Southern Zone. Standardized cuts, consistent gram weights and punctual deliveries.
          </p>
          <a href="#contacto" className="btn btn--gold">Discover the Restaurant Program</a>
        </FadeIn>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section">
        <FadeIn>
          <div className="section-label section-label--dark">Process</div>
          <h2 className="section-title section-title--dark">How Juliet's Works</h2>
          <GoldRule dark />
        </FadeIn>
        <div className="steps-list">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 180}>
              <div className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-content">
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={400}>
          <div className="how-cta">
            <a href="https://wa.me/50660000000" className="btn btn--outline-dark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Chat on WhatsApp
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURED BOXES ── */}
      <section className="boxes-section" id="cajas">
        <FadeIn>
          <div className="section-label">Home Delivery</div>
          <h2 className="section-title">Juliet's Recommended Boxes</h2>
          <GoldRule />
        </FadeIn>
        <div className="boxes-grid">
          {[
            { name: 'Weekly Organic Birds Box', desc: '1 whole chicken + selected organic chicken pieces. Perfect for the week\'s lunches and dinners.', tag: 'For 3–4 people', price: 'From ₡18,500' },
            { name: 'Gourmet Rabbit & Duck Box', desc: '1 portioned organic rabbit + duck pieces (legs or whole), perfect for impressing your guests.', tag: 'For special occasions', price: 'From ₡24,900' },
            { name: 'Mixed Tasting Box', desc: 'A selection of chicken, duck and rabbit in ideal quantities to try each cut without fuss.', tag: 'Recommended for first order', price: 'From ₡21,500' },
          ].map((box, i) => (
            <FadeIn key={box.name} delay={i * 150}>
              <div className="box-card">
                <div className="box-tag">{box.tag}</div>
                <h3 className="box-name">{box.name}</h3>
                <p className="box-desc">{box.desc}</p>
                <div className="box-price">{box.price}</div>
                <a href="#contacto" className="btn btn--gold-sm btn--full">View Details</a>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── ANATOMY / CUT DIAGRAMS ── */}
      <section id="anatomy">
        <AnatomySection />
      </section>

      {/* ── FARM STORY ── */}
      <section className="farm-section" id="finca">
        <div className="farm-bg" />
        <div className="farm-content">
          <FadeIn>
            <div className="section-label">Our Origin</div>
            <h2 className="section-title">From Our Farms in<br /><em>San José & Río Claro</em><br />to Your Table</h2>
            <GoldRule />
            <p className="farm-text">
              Juliet's Organic Meats was born from a desire to offer more honest, more flavorful meat. Between San José and Río Claro we raise rabbit, duck and chicken on open pasture — caring for the land and the animals that live on it.
            </p>
            <ul className="farm-list">
              <li>Production in San José and Río Claro, Costa Rica</li>
              <li>Careful management of soil and water</li>
              <li>Hygienic processing and vacuum packaging</li>
            </ul>
            <a href="#contacto" className="btn btn--gold">Learn Our Story & Process</a>
          </FadeIn>
        </div>
      </section>

      {/* ── RECIPES ── */}
      <section className="recipes-section" id="recetas">
        <FadeIn>
          <div className="section-label section-label--dark">From the Kitchen</div>
          <h2 className="section-title section-title--dark">Cook with Juliet's</h2>
          <GoldRule dark />
        </FadeIn>
        <div className="recipes-grid">
          {[
            { title: 'White Wine Braised Rabbit', tag: 'Home Recipe', desc: 'Slow-cooked rabbit with garlic, thyme and a half-bottle of dry white wine. Pure comfort.' },
            { title: 'Duck Magret with Orange Sauce', tag: 'For Chefs', desc: 'Scored, rendered, and seared to medium-rare. Classic French preparation with Juliet\'s duck.' },
            { title: 'How to Roast a Juicy Organic Chicken', tag: 'Basic Guide', desc: 'High heat, dry brine, butter baste. The definitive guide to the perfect Sunday roast.' },
          ].map((r, i) => (
            <FadeIn key={r.title} delay={i * 150}>
              <div className="recipe-card">
                <div className="recipe-img-placeholder" />
                <div className="recipe-body">
                  <div className="recipe-tag">{r.tag}</div>
                  <h3 className="recipe-title">{r.title}</h3>
                  <p className="recipe-desc">{r.desc}</p>
                  <a href="#" className="recipe-link">View Recipe →</a>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={300}>
          <div className="recipes-all">
            <a href="#" className="section-more-link">View all recipes →</a>
          </div>
        </FadeIn>
      </section>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── EMAIL CAPTURE ── */}
      <section className="email-section" id="contacto">
        <FadeIn>
          <div className="section-label">Stay in Touch</div>
          <h2 className="section-title">Get 10% Off<br /><em>Your First Order</em></h2>
          <p className="email-sub">Subscribe to receive offers, recipes featuring rabbit, duck and chicken, and news from our farms in San José and Río Claro.</p>
        </FadeIn>
        <FadeIn delay={200}>
          <form className="email-form" onSubmit={e => e.preventDefault()}>
            <div className="email-row">
              <input
                type="text"
                placeholder="Your name"
                className="email-input"
                value={emailForm.name}
                onChange={e => setEmailForm({ ...emailForm, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email address"
                className="email-input"
                value={emailForm.email}
                onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
              />
            </div>
            <label className="email-checkbox">
              <input
                type="checkbox"
                checked={emailForm.restaurant}
                onChange={e => setEmailForm({ ...emailForm, restaurant: e.target.checked })}
              />
              <span>I am a restaurant / hotel</span>
            </label>
            <button type="submit" className="btn btn--gold btn--full-sm">Subscribe & Claim 10%</button>
          </form>
        </FadeIn>
      </section>

      {/* ── STICKY WHATSAPP ── */}
      <a
        href="https://wa.me/50660000000?text=Hola%2C%20quisiera%20hacer%20un%20pedido%20de%20Juliet%27s%20Organic%20Meats"
        className="whatsapp-sticky"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="whatsapp-sticky-label">Order Now</span>
      </a>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col footer-brand">
            <div className="footer-logo">
              <span className="nav-logo-j">J</span>
              <span className="nav-logo-text">Juliet's<br /><span className="nav-logo-sub">Organic Meats</span></span>
            </div>
            <p className="footer-brand-desc">Producers of organic rabbit, duck and chicken in San José and Río Claro — connecting the farm to your table.</p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Navigation</div>
            <ul className="footer-links">
              {['Home', 'For Restaurants', 'For Home', 'Our Farm', 'Our Cuts', 'Recipes', 'FAQ', 'Contact'].map(l => (
                <li key={l}><a href="#" className="footer-link">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Contact</div>
            <ul className="footer-contact">
              <li>+506 6000-0000</li>
              <li>WhatsApp: +506 6000-0000</li>
              <li>info@julietsorganicmeats.com</li>
              <li className="footer-locations">
                <span>San José, Costa Rica</span>
                <span>Río Claro, Southern Zone</span>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Follow Us</div>
            <div className="footer-socials">
              <a href="#" className="social-link">Instagram</a>
              <a href="#" className="social-link">Facebook</a>
              <a href="#" className="social-link">YouTube</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Juliet's Organic Meats. All rights reserved.</span>
          <div className="footer-bottom-links">
            <a href="#">Terms & Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Shipping & Returns</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
