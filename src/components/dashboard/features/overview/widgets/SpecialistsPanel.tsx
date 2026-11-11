const specialists = [
  { initials: 'AP', name: 'Dr. Andrei Popa', specialty: 'Cardiologie', status: 'Disponibil', tone: 'green' },
  { initials: 'EM', name: 'Dr. Elena Marin', specialty: 'Neurologie', status: 'În consultație', tone: 'blue' },
  { initials: 'RC', name: 'Dr. Radu Cernat', specialty: 'Medicină internă', status: 'Disponibil', tone: 'green' },
  { initials: 'ID', name: 'Dr. Ioana Dumitru', specialty: 'Pediatrie', status: 'Pauză', tone: 'amber' },
]

export default function SpecialistsPanel() {
  return (
    <section className="dashboard-card specialists-card">
      <div className="widget-heading">
        <div className="widget-title"><span className="widget-icon">✚</span><div><h2>Echipa medicală</h2><p>Specialiștii clinicii</p></div></div>
        <button className="round-arrow" type="button" aria-label="Vezi echipa medicală">↗</button>
      </div>
      <article className="featured-specialist">
        <div className="doctor-illustration" aria-hidden="true">
          <div className="doctor-halo" />
          <div className="doctor-head"><span className="doctor-hair" /><span className="doctor-face" /><span className="doctor-neck" /><span className="doctor-coat" /><span className="doctor-stethoscope" /></div>
        </div>
        <span className="specialty-tag">CARDIOLOGIE</span>
        <div className="featured-caption"><strong>Dr. Andrei Popa</strong><span>Medic specialist · 12 ani experiență</span><small>Disponibil astăzi · 09:00–16:00</small></div>
      </article>
      <div className="specialist-list">
        {specialists.map((doctor) => (
          <article className="specialist-row" key={doctor.initials}>
            <span className={`doctor-avatar avatar-${doctor.tone}`}>{doctor.initials}</span>
            <span className="specialist-info"><strong>{doctor.name}</strong><small>{doctor.specialty}</small></span>
            <span className={`availability availability-${doctor.tone}`}><i />{doctor.status}</span>
          </article>
        ))}
      </div>
      <button className="all-specialists" type="button">Vezi toți specialiștii <span>→</span></button>
    </section>
  )
}
