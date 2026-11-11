import { demoDoctors } from '../../shared/demoData'

type SpecialistsPanelProps = {
  onViewAll: () => void
}

export default function SpecialistsPanel({ onViewAll }: SpecialistsPanelProps) {
  const featuredDoctor = demoDoctors[0]
  const otherDoctors = demoDoctors.filter((doctor) => doctor.name !== featuredDoctor.name)

  return (
    <section className="dashboard-card specialists-card">
      <div className="widget-heading">
        <div className="widget-title"><span className="widget-icon">✚</span><div><h2>Echipa medicală</h2><p>{demoDoctors.length} medici · {demoDoctors.filter((doctor) => doctor.status === 'Disponibil').length} disponibili</p></div></div>
        <button className="round-arrow" type="button" onClick={onViewAll} aria-label="Vezi toți medicii">↗</button>
      </div>
      <article className="featured-specialist">
        <div className="doctor-illustration" aria-hidden="true">
          <div className="doctor-halo" />
          <div className="doctor-head"><span className="doctor-hair" /><span className="doctor-face" /><span className="doctor-neck" /><span className="doctor-coat" /><span className="doctor-stethoscope" /></div>
        </div>
        <span className="specialty-tag">{featuredDoctor.specialty.toLocaleUpperCase('ro')}</span>
        <div className="featured-caption"><strong>{featuredDoctor.name}</strong><span>Medic specialist · {featuredDoctor.experience} ani experiență</span><small>{featuredDoctor.status} astăzi · {featuredDoctor.schedule}</small></div>
      </article>
      <div className="specialist-list">
        {otherDoctors.map((doctor) => (
          <article className="specialist-row" key={doctor.initials}>
            <span className={`doctor-avatar avatar-${doctor.tone}`}>{doctor.initials}</span>
            <span className="specialist-info"><strong>{doctor.name}</strong><small>{doctor.specialty}</small></span>
            <span className={`availability${doctor.status === 'În consultație' ? ' availability-blue' : doctor.status === 'Indisponibil' ? ' availability-rose' : ''}`}><i />{doctor.status}</span>
          </article>
        ))}
      </div>
      <button className="all-specialists" type="button" onClick={onViewAll}>Vezi toți specialiștii <span>→</span></button>
    </section>
  )
}
