import BrandLogo from './BrandLogo'

export default function WelcomePanel() {
  return (
    <section className="welcome-panel" aria-label="Despre MedCare">
      <div className="welcome-top">
        <BrandLogo />
        <span className="secure-label">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9z" />
          </svg>
          Spațiu securizat
        </span>
      </div>

      <div className="welcome-copy">
        <span className="eyebrow"><span /> SĂNĂTATE, CONECTATĂ</span>
        <h1>Medicina de mâine,<br />mai aproape de tine.</h1>
        <p>Un spațiu digital dedicat celor care transformă datele medicale în îngrijire mai bună.</p>
      </div>

      <div className="health-visual" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="visual-cross">+</div>
        <div className="pulse-card">
          <div className="pulse-card-top"><span><i /> Monitorizare</span><span className="live-dot" /></div>
          <div className="pulse-reading"><strong>72</strong><span>BPM</span><small>Ritm cardiac</small></div>
          <svg className="pulse-chart" viewBox="0 0 360 70" preserveAspectRatio="none">
            <path className="chart-fill" d="M0 52h71l14-1 14-7 12 4 16-2 12-29 12 43 14-17 13 9 18-1 11-2 13-1 13-1 13-1 13 1h113v30H0Z" />
            <path className="chart-line" d="M0 52h71l14-1 14-7 12 4 16-2 12-29 12 43 14-17 13 9 18-1 11-2 13-1 13-1 13-1 13 1h113" />
          </svg>
          <div className="pulse-card-bottom"><span>Activitate normală</span><span>Acum</span></div>
        </div>
        <div className="visual-note note-top"><span className="note-icon">✳</span><span><b>Informații</b><small>la un loc</small></span></div>
        <div className="visual-note note-bottom"><span className="note-check">✓</span><span><b>Grijă pentru</b><small>fiecare detaliu</small></span></div>
        <div className="visual-spark spark-one">✳</div>
        <div className="visual-spark spark-two">✦</div>
      </div>

      <div className="welcome-footer"><span>INOVAȚIE CU GRIJĂ</span><span>© 2025 MedCare</span></div>
    </section>
  )
}
