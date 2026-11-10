type PatientTrendsProps = {
  period: string
}

const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec']

export default function PatientTrends({ period }: PatientTrendsProps) {
  return (
    <section className="dashboard-card trends-card">
      <div className="widget-heading">
        <div className="widget-title"><span className="widget-icon">⌁</span><div><h2>Activitatea pacienților</h2><p>Sosiri și consultații în timp</p></div></div>
        <label className="chart-period"><span className="visually-hidden">Perioada graficului</span><select defaultValue="Luna aceasta"><option>Luna aceasta</option><option>Ultimele 6 luni</option><option>Anul acesta</option></select></label>
      </div>
      <div className="trend-summary"><strong>1.284</strong><span className="trend-positive">↗ 9,6%</span><small>pacienți în perioada selectată</small></div>
      <div className="trend-chart">
        <div className="chart-y-labels"><span>1.500</span><span>1.000</span><span>500</span><span>0</span></div>
        <svg viewBox="0 0 700 190" preserveAspectRatio="none" role="img" aria-label={`Graficul sosirilor de pacienți pentru ${period}`}>
          <defs>
            <pattern id="trend-stripes" width="8" height="8" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#bddfd1" strokeWidth="2" />
            </pattern>
            <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#9ccbb6" stopOpacity=".24" />
              <stop offset="100%" stopColor="#9ccbb6" stopOpacity=".02" />
            </linearGradient>
          </defs>
          <path className="chart-gridline" d="M0 25H700M0 72H700M0 119H700M0 166H700" />
          <path d="M0 142 62 119 124 126 186 91 248 105 310 55 372 70 434 39 496 66 558 31 620 47 700 20V166H0Z" fill="url(#trend-fill)" />
          <path d="M0 142 62 119 124 126 186 91 248 105 310 55 372 70 434 39 496 66 558 31 620 47 700 20V166H0Z" fill="url(#trend-stripes)" opacity=".72" />
          <polyline className="trend-line" points="0,142 62,119 124,126 186,91 248,105 310,55 372,70 434,39 496,66 558,31 620,47 700,20" />
          <polyline className="trend-line trend-line-secondary" points="0,157 62,146 124,151 186,130 248,144 310,117 372,140 434,120 496,136 558,108 620,116 700,104" />
          {[['62', '119'], ['186', '91'], ['310', '55'], ['434', '39'], ['558', '31'], ['700', '20']].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="3.5" />)}
        </svg>
        <div className="chart-x-labels">{months.map((month) => <span key={month}>{month}</span>)}</div>
      </div>
      <div className="chart-legend"><span><i className="legend-primary" />Pacienți consultați</span><span><i className="legend-secondary" />Programări noi</span></div>
    </section>
  )
}
