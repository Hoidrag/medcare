import BrandLogo from '../BrandLogo'

type DashboardSidebarProps = {
  activeItem: string
  onSelect: (item: string) => void
  onBack: () => void
}

const primaryItems = [
  ['Tablou de bord', 'grid'],
  ['Medici', 'doctor'],
  ['Pacienți', 'patient'],
  ['Programări', 'calendar'],
  ['Departamente', 'building'],
  ['Analize și rapoarte', 'chart'],
  ['Facturare și asigurări', 'wallet'],
] as const

const managementItems = [
  ['Personal', 'people'],
  ['Farmacie', 'plus'],
  ['Urgențe și internări', 'pulse'],
  ['Plăți', 'card'],
  ['Setări', 'settings'],
  ['Administrare', 'shield'],
] as const

const iconPaths: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  doctor: 'M8 3v3a4 4 0 0 0 8 0V3M6 3h4M14 3h4M12 10v3m-6 8a6 6 0 0 1 12 0M12 13a3 3 0 1 0 0 .01',
  patient: 'M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 8h4m-2-2v4',
  calendar: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16',
  building: 'M4 21V4h16v17M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2M10 21v-3h4v3',
  chart: 'M3 3v18h18M8 15l4-4 3 3 6-7',
  wallet: 'M3 6.5A2.5 2.5 0 0 1 5.5 4H20v16H5a2 2 0 0 1-2-2zM3 7h17m-4 6h4m-3 0h.01',
  people: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.5a4 4 0 0 1 0 7.8M20 15a4 4 0 0 1 2 3.5V21',
  plus: 'M12 3v18M3 12h18',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  card: 'M3 5h18v14H3zM3 10h18m-14 5h4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 2.8-.2-.1a1.7 1.7 0 0 0-1.8.2l-.2.1h-3.2l-.1-.2a1.7 1.7 0 0 0-1.6-1l-.2.1-2.8-1.6.1-.2a1.7 1.7 0 0 0-.2-1.8l-.1-.2v-3.2l.2-.1a1.7 1.7 0 0 0 1-1.6l-.1-.2 1.6-2.8.2.1a1.7 1.7 0 0 0 1.8-.2l.2-.1h3.2l.1.2a1.7 1.7 0 0 0 1.6 1l.2-.1 2.8 1.6-.1.2a1.7 1.7 0 0 0 .2 1.8l.1.2v3.2Z',
  shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4',
}

function SidebarIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  )
}

export default function DashboardSidebar({ activeItem, onSelect, onBack }: DashboardSidebarProps) {
  function renderItems(items: ReadonlyArray<readonly [string, string]>) {
    return items.map(([label, icon]) => (
      <button
        className={`sidebar-link${activeItem === label ? ' active' : ''}`}
        type="button"
        key={label}
        onClick={() => onSelect(label)}
        aria-current={activeItem === label ? 'page' : undefined}
      >
        <SidebarIcon name={icon} />
        <span>{label}</span>
        {activeItem === label && <span className="sidebar-chevron" aria-hidden="true">›</span>}
      </button>
    ))
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand"><BrandLogo /></div>
      <button className="sidebar-search" type="button" onClick={() => document.getElementById('dashboard-search')?.focus()}>
        <SidebarIcon name="patient" />
        <span>Caută în meniu</span>
        <kbd>⌘ K</kbd>
      </button>
      <span className="sidebar-section-label">MENIU PRINCIPAL</span>
      <nav className="sidebar-nav" aria-label="Navigare principală">
        {renderItems(primaryItems)}
      </nav>
      <span className="sidebar-section-label management-label">GESTIONARE</span>
      <nav className="sidebar-nav" aria-label="Navigare pentru gestionare">
        {renderItems(managementItems)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-user-avatar">MP</div>
        <div className="sidebar-user-copy"><strong>Dr. Maria Popescu</strong><span>Administrator</span></div>
        <button className="sidebar-signout" type="button" onClick={onBack} aria-label="Înapoi la autentificare" title="Înapoi la autentificare">↗</button>
      </div>
    </aside>
  )
}
