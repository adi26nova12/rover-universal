import { Fragment, useMemo, useState } from 'react'
import { SHOES } from '../choreo/shoes'

/*
 * All copy on this page is the Rovar Universal website text, verbatim
 * (two typos corrected: "flexbible" → "flexible", "-from" → "— from").
 */

const LINKEDIN = 'https://www.linkedin.com/company/rovar-universal/'
const WHATSAPP = 'https://wa.me/447440495840'
const PRIVACY = 'https://rovaruniversal.com/index.php/privacy-policy/'
const TERMS = 'https://rovaruniversal.com/index.php/terms-and-conditions/'
const photo = (id) => SHOES.find((s) => s.id === id).photo

/* ─── Small building blocks ─────────────────────────────────────────────── */

/** Big display line. Lines reveal through a mask; `[img:id]` drops an inline photo. */
function Line({ text, className = '' }) {
  const parts = text.split(/(\[img:[a-z]+\])/)
  return (
    <span className={`line ${className}`}>
      <span className="line__inner">
        {parts.map((part, i) => {
          const m = part.match(/^\[img:([a-z]+)\]$/)
          return m ? <img key={i} className="inline-photo" src={photo(m[1])} alt="" /> : <Fragment key={i}>{part}</Fragment>
        })}
      </span>
    </span>
  )
}

/** Justified uppercase micro-copy column. */
const Micro = ({ children, className = '' }) => <p className={`micro ${className}`}>{children}</p>

function Barcode({ seed = 7 }) {
  const bars = useMemo(() => {
    let x = seed
    return Array.from({ length: 38 }, () => {
      x = (x * 9301 + 49297) % 233280
      return 1 + Math.floor((x / 233280) * 3)
    })
  }, [seed])
  return (
    <span className="barcode" aria-hidden="true">
      {bars.map((w, i) => (
        <i key={i} style={{ width: w, marginRight: i % 3 ? 1 : 2 }} />
      ))}
    </span>
  )
}

/** Product card the chapter shoe drops into, then collapses to a tiny box. */
function Card({ n, title, items }) {
  const num = `#${String(n).padStart(2, '0')}`
  return (
    <section className="card-pin" id={`card${n}`} aria-label={title}>
      <div className="card">
        <span className="card__num">{num}</span>
        <span className="card__vertical">{title}</span>
        <div className="card__slot" />
        <div className="card__spec">
          <Barcode seed={n * 13} />
          <ul className="card__list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card__mini">{num}</div>
    </section>
  )
}

function Subscribe() {
  const [sent, setSent] = useState(false)
  // No mailing-list backend yet — wire this to your provider (Mailchimp, Klaviyo…).
  if (sent) return null
  return (
    <form
      className="subscribe"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <label className="sr-only" htmlFor="sub-email">
        Email
      </label>
      <input id="sub-email" type="email" required placeholder="Email" autoComplete="email" />
      <button type="submit">Send</button>
    </form>
  )
}

/* ─── Fixed interface ───────────────────────────────────────────────────── */

export function Chrome() {
  return (
    <div className="chrome">
      <a className="skip" href="#about">
        Skip to content
      </a>
      <a className="chrome__mark" href="#hero">
        <span className="chrome__dot" aria-hidden="true" />
        ROVAR UNIVERSAL
      </a>
      <nav className="chrome__nav" aria-label="Primary">
        <a href="#hero">HOME</a>
        <a href="#ch1">PRODUCTS</a>
        <a href="#about">ABOUT</a>
        <a href="#contact">CONTACT</a>
      </nav>
    </div>
  )
}

/* ─── The page ───────────────────────────────────────────────────────────── */

export function Site() {
  return (
    <main className="site" id="main">
      {/* HERO — shoes fall in around the wordmark, then the title rises */}
      <section className="hero" id="hero" aria-label="Rovar Universal">
        <p className="hero__wordmark">
          <span className="loader-count" aria-live="polite">
            000%
          </span>
          <span className="hero__wordmark-text">ROVAR UNIVERSAL</span>
        </p>
        <h1 className="hero__title display">
          <Line text="ROVAR" />
          <Line text="UNIVERSAL" />
        </h1>
        <p className="hero__sub">
          <Line text="Private Label Manufacturing for Kids' Footwear" />
        </p>
        <Micro className="hero__para">From concept to production</Micro>
      </section>

      {/* ABOUT — justified caps, the boot tumbles behind it */}
      <section className="statement" id="about" aria-label="About">
        <p className="statement__text">
          Rovar Universal is a kids’ footwear manufacturing operation with production based in{' '}
          <img className="inline-photo" src={photo('boot')} alt="" /> India and commercial presence in the UK.
        </p>
        <div className="cols cols--3">
          <Micro>
            We support brands globally through the full product journey — from initial design and fast sampling to final
            production and global delivery.
          </Micro>
          <Micro>
            We specialise in premium leather children’s footwear, offering flexible production volumes and hands-on
            development support for both growing labels and established brands.
          </Micro>
          <Micro>
            Our focus is on quality craftsmanship, reliable production timelines, and long-term manufacturing
            partnerships.
          </Micro>
        </div>
      </section>

      {/* #01 — PRODUCTS: KIDS' FOOTWEAR (boot) */}
      <section className="chapter chapter--center" id="ch1" aria-label="Products">
        <p className="chapter__kicker">Products</p>
        <h2 className="display chapter__title">
          <Line text="KIDS' [img:boot]" />
          <Line text="FOOTWEAR" />
        </h2>
        <div className="cols cols--3 chapter__cols">
          <Micro>
            We manufacture a complete range of kids’ footwear across all development stages, including pre-walkers,
            first walkers, toddlers, and senior children’s ranges.
          </Micro>
          <Micro>
            Our core production capabilities cover everyday sneakers, classic boots, boat shoes, sandals, and custom
            school shoes. Every design in our existing portfolio can be fully customized across premium leathers, custom
            colors, specialized insoles, and custom outsole trims to perfectly match your brand’s DNA.
          </Micro>
          <Micro>
            We prioritize premium leather constructions while maintaining the capability to work with highly
            sustainable substrates and alternative materials to support specific price points or commercial briefs.
            Every design in our existing portfolio can be modified with custom branding, custom linings, and specialized
            hardware.
          </Micro>
        </div>
      </section>
      <Card n={1} title="Classic boots" items={['Pre-walkers', 'First walkers', 'Toddlers', 'Senior children']} />

      {/* #02 — WHY CHOOSE US (sneaker) */}
      <section className="chapter chapter--left" id="ch2" aria-label="Why choose us">
        <div className="tag">
          <strong>#02</strong>
        </div>
        <h2 className="display chapter__title">
          <Line text="WHY" />
          <Line text="[img:sneaker] CHOOSE" />
          <Line text="US" />
        </h2>
        <p className="shout">
          Backed by a massive factory ecosystem and an extensive leather inventory, we can source any material you need
          and deliver your custom samples in just one week.
        </p>
        <div className="cols cols--2 chapter__cols">
          <div>
            <h3 className="col-title">Design &amp; Development</h3>
            <Micro>
              Our in-house development team works closely with brands to bring concepts to life. From first sketches and
              material selection to sampling and technical refinement, we support both custom developments and
              adaptation of existing silhouettes.
            </Micro>
          </div>
          <div>
            <h3 className="col-title">Superior Quality</h3>
            <Micro>
              We manufacture premium kids' footwear for global brands including Kickers, Hugo Boss, and Vertbaudet. With
              production based in India and structured quality control systems, we deliver consistent craftsmanship
              across every order.
            </Micro>
          </div>
        </div>
      </section>
      <Card
        n={2}
        title="Everyday sneakers"
        items={['Everyday sneakers', 'Classic boots', 'Boat shoes', 'Sandals', 'Custom school shoes']}
      />

      {/* #03 — marquee (mary jane) */}
      <section className="chapter chapter--marquee" id="ch3" aria-label="Reliable production capacity and integrated supply network">
        <span className="chapter__num">#03</span>
        <h2 className="marquee">
          <span className="marquee__track display">
            {[0, 1].map((k) => (
              <span key={k} aria-hidden={k === 1}>
                RELIABLE PRODUCTION CAPACITY <img className="inline-photo" src={photo('maryjane')} alt="" /> INTEGRATED
                SUPPLY NETWORK
                <svg className="marquee__sep" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M1 1 9 9M9 1 1 9" />
                </svg>
              </span>
            ))}
          </span>
        </h2>
        <div className="cols cols--2 chapter__cols">
          <div>
            <h3 className="col-title">Reliable Production Capacity</h3>
            <Micro>
              With scalable manufacturing capacity and structured production planning, we support both small-batch
              developments and larger volume programs while maintaining strict quality and delivery timelines.
            </Micro>
          </div>
          <div>
            <h3 className="col-title">Integrated Supply Network</h3>
            <Micro>
              Through long-standing relationships with material suppliers, sole manufacturers, and government
              partnerships, we operate within a structured ecosystem that ensures material consistency, regulatory
              compliance, and efficient international shipping.
            </Micro>
          </div>
        </div>
      </section>
      <Card
        n={3}
        title="Custom colors"
        items={['Premium leathers', 'Custom colors', 'Specialized insoles', 'Custom outsole trims']}
      />

      {/* #04 — GLOBAL SHIPPING (sandal) */}
      <section className="chapter chapter--right" id="ch4" aria-label="Global shipping and customized packaging">
        <div className="tag">
          <strong>#04</strong>
        </div>
        <h2 className="display chapter__title">
          <Line text="GLOBAL [img:sandal]" />
          <Line text="SHIPPING" />
        </h2>
        <div className="cols cols--2 chapter__cols">
          <div>
            <h3 className="col-title">Global Shipping</h3>
            <Micro>
              With production based in India and commercial presence in the UK, we support brands globally with clear
              communication, structured development processes, and seamless order execution.
            </Micro>
          </div>
          <div>
            <h3 className="col-title">Customized Packaging</h3>
            <Micro>
              We offer private label packaging solutions tailored to each brand’s positioning including custom boxes,
              branding and labelling.
            </Micro>
          </div>
        </div>
      </section>
      <Card n={4} title="Customized packaging" items={['Custom boxes', 'Branding', 'Labelling']} />

      {/* THE ROVAR EXPERIENCE + footer — every shoe falls back in */}
      <section className="contact" id="contact" aria-label="The Rovar Experience">
        <h2 className="display contact__title">
          <Line text="THE ROVAR" />
          <Line text="EXPERIENCE" />
        </h2>
        <Micro className="contact__para">
          Rovar Universal is a dedicated kids’ footwear development and manufacturing partner. Backed by an established
          production ecosystem, we deliver premium leather craftsmanship, agile sampling timelines, and reliable long-term
          supply partnerships for global brands.
        </Micro>
        <footer className="footer">
          <div>
            <h3>Connect With Us</h3>
            <a href={LINKEDIN} target="_blank" rel="noreferrer">
              Linkedin
            </a>
            <a href={WHATSAPP} target="_blank" rel="noreferrer">
              Whatsapp
            </a>
          </div>
          <div>
            <h3>Quick Links</h3>
            <a href={PRIVACY}>Privacy Policy</a>
            <a href={TERMS}>Terms and Conditions</a>
          </div>
          <div>
            <h3>Subscribe</h3>
            <p className="micro">Sign up, you’ll love hearing from us. We promise!</p>
            <Subscribe />
          </div>
          <p className="footer__copy">
            Copyright © 2026 ROVAR UNIVERSAL | <a href={PRIVACY}>PRIVACY POLICY</a>
          </p>
        </footer>
      </section>
    </main>
  )
}
