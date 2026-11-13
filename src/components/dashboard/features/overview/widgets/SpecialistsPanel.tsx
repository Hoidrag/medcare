import type { Doctor } from '../../../../../services/doctors'

type SpecialistsPanelProps = {
  doctors: Doctor[]
  isLoading: boolean
  onViewAll: () => void
}

function getDoctorInitials(name: string) {
  return name.replace(/^Dr\.\s*/i, '').split(/\s+/).slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toLocaleUpperCase('ro')
}

function getDoctorTone(id: string) {
  const tones = ['green', 'blue', 'amber']
  const toneIndex = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)
    % tones.length
  return tones[toneIndex]
}

function getAvailabilityClass(status: Doctor['status']) {
  if (status === 'În consultație') return 'availability-blue'
  if (status === 'Indisponibil') return 'availability-rose'
  return ''
}

export default function SpecialistsPanel({ doctors, isLoading, onViewAll }: SpecialistsPanelProps) {
  const featuredDoctor = doctors[0]
  const availableDoctors = doctors.filter((doctor) => doctor.status === 'Disponibil').length

  return (
    <section className="dashboard-card specialists-card">
      <div className="widget-heading">
        <div className="widget-title">
          <span className="widget-icon">✚</span>
          <div>
            <h2>Echipa medicală</h2>
            <p>{isLoading ? 'Se încarcă medicii...' : `${doctors.length} medici · ${availableDoctors} disponibili`}</p>
          </div>
        </div>
        <button className="round-arrow" type="button" onClick={onViewAll} aria-label="Vezi toți medicii">↗</button>
      </div>
      {featuredDoctor ? (
        <article className="featured-specialist">
          <div className="doctor-illustration" aria-hidden="true">
            <div className="doctor-halo" />
            <div className="doctor-head"><span className="doctor-hair" /><span className="doctor-face" /><span className="doctor-neck" /><span className="doctor-coat" /><span className="doctor-stethoscope" /></div>
          </div>
          <span className="specialty-tag">{featuredDoctor.specialty.toLocaleUpperCase('ro')}</span>
          <div className="featured-caption">
            <strong>{featuredDoctor.name}</strong>
            <span>Medic specialist · {featuredDoctor.experience} ani experiență</span>
            <small>{featuredDoctor.status} · {featuredDoctor.schedule}</small>
          </div>
        </article>
      ) : (
        <p className="overview-widget-empty">
          {isLoading ? 'Se încarcă echipa medicală...' : 'Nu există medici salvați în baza de date.'}
        </p>
      )}
      <div className="specialist-list">
        {doctors.slice(1).map((doctor) => (
          <article className="specialist-row" key={doctor.id}>
            <span className={`doctor-avatar avatar-${getDoctorTone(doctor.id)}`}>{getDoctorInitials(doctor.name)}</span>
            <span className="specialist-info"><strong>{doctor.name}</strong><small>{doctor.specialty}</small></span>
            <span className={`availability ${getAvailabilityClass(doctor.status)}`}><i />{doctor.status}</span>
          </article>
        ))}
      </div>
      <button className="all-specialists" type="button" onClick={onViewAll}>Vezi toți specialiștii <span>→</span></button>
    </section>
  )
}
