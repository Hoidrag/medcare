const stats = [
  { label: 'Pacienți activi', value: '1.248', change: '+12,8%', caption: 'față de săptămâna trecută', chart: '0,32 26,20 51,25 77,7 102,15 128,18 154,11 180,25 206,19 232,27 258,12 284,17 310,6' },
  { label: 'Programări astăzi', value: '96', change: '+8,4%', caption: 'față de săptămâna trecută', chart: '0,30 24,27 48,22 72,26 96,11 120,18 144,7 168,15 192,8 216,23 240,12 264,16 288,4 310,9' },
  { label: 'Rapoarte în așteptare', value: '18', change: '6 noi', caption: 'necesită verificare', chart: '0,27 25,25 50,22 75,28 100,15 125,22 150,13 175,17 200,7 225,14 250,8 275,11 310,3' },
  { label: 'Venituri luna aceasta', value: '54.240 lei', change: '+6,2%', caption: 'față de luna trecută', chart: '0,29 24,25 48,12 72,17 96,24 120,14 144,9 168,16 192,5 216,12 240,8 264,14 288,3 310,6' },
]

export default function OverviewStats() {
  return (
    <section className="overview-stats" aria-label="Indicatori principali">
      {stats.map((stat, index) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-card-heading">
            <span className="stat-icon" aria-hidden="true">{['♙', '▦', '▤', '↗'][index]}</span>
            <h2>{stat.label}</h2>
            <button type="button" className="card-menu" aria-label={`Mai multe opțiuni: ${stat.label}`}>···</button>
          </div>
          <div className="stat-value">{stat.value}</div>
          <p className="stat-change"><span>{stat.change}</span> {stat.caption}</p>
          <svg className="stat-chart" viewBox="0 0 310 38" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={stat.chart} />
          </svg>
          <div className="stat-chart-labels"><span>Lun</span><span>Mar</span><span>Mie</span><span>Joi</span><span>Vin</span></div>
        </article>
      ))}
    </section>
  )
}
