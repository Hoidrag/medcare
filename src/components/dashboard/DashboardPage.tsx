import { useState } from 'react'
import DashboardSidebar from './DashboardSidebar'
import AppointmentsTable from './widgets/AppointmentsTable'
import OverviewStats from './widgets/OverviewStats'
import PatientTrends from './widgets/PatientTrends'
import SpecialistsPanel from './widgets/SpecialistsPanel'

type DashboardPageProps = {
  onNavigate: (path: string) => void
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [activeItem, setActiveItem] = useState('Tablou de bord')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('Săptămâna aceasta')

  const heading = activeItem === 'Tablou de bord'
    ? 'Bun venit, Dr. Maria!'
    : activeItem

  function handleSelectItem(item: string) {
    setActiveItem(item)
    if (item !== 'Tablou de bord') {
      setNotice(`Secțiunea „${item}” va fi disponibilă după autentificare.`)
    } else {
      setNotice('')
    }
  }

  function handleExport() {
    setNotice('Exportul va fi disponibil după conectarea dashboardului la date reale.')
  }

  return (
    <main className="dashboard-page">
      <DashboardSidebar activeItem={activeItem} onSelect={handleSelectItem} onBack={() => onNavigate('/')} />
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <label className="dashboard-search">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
            <input id="dashboard-search" type="search" placeholder="Caută pacienți sau programări..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <span className="demo-badge"><span /> PREVIZUALIZARE</span>
            <button type="button" className="topbar-icon" aria-label="Mesaje">✉<i /></button>
            <button type="button" className="topbar-icon" aria-label="Notificări">♧<i /></button>
            <div className="topbar-profile"><span className="profile-avatar">MP</span><span><strong>Maria Popescu</strong><small>Administrator</small></span></div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <span className="dashboard-eyebrow">MARȚI, 10 NOIEMBRIE 2026</span>
              <h1>{heading}</h1>
              <p>O privire de ansamblu asupra activității clinicii tale.</p>
            </div>
            <div className="dashboard-actions">
              <button className="secondary-action" type="button" onClick={handleExport}>Exportă raportul <span aria-hidden="true">↓</span></button>
              <button className="primary-action" type="button" onClick={handleExport}>Generează raport <span aria-hidden="true">▤</span></button>
              <label className="period-select">
                <span className="visually-hidden">Perioada raportului</span>
                <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                  <option>Săptămâna aceasta</option>
                  <option>Luna aceasta</option>
                  <option>Anul acesta</option>
                </select>
              </label>
            </div>
          </div>

          {notice && <p className="dashboard-notice" role="status">{notice}</p>}
          <p className="dashboard-demo-note">Date demonstrative — nu reprezintă informații medicale reale.</p>

          <OverviewStats />
          <div className="dashboard-overview-grid">
            <PatientTrends period={period} />
            <SpecialistsPanel />
          </div>
          <AppointmentsTable query={query} />
        </div>
      </section>
      <button className="dashboard-back-link" type="button" onClick={() => onNavigate('/')}>
        <span aria-hidden="true">←</span> Înapoi la autentificare
      </button>
    </main>
  )
}
