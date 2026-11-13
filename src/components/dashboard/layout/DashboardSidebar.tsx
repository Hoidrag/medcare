import { useState } from 'react'
import BrandLogo from '../../BrandLogo'

type DashboardSidebarProps = {
  activeItem: string
  userName: string
  onSelect: (item: string) => void
  onLogout: () => Promise<void>
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
  ['Farmacie', 'plus'],
  ['Urgențe și internări', 'pulse'],
  ['Setări', 'settings'],
  ['Administrare', 'shield'],
] as const

const iconPaths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  doctor: 'M8 3v3a4 4 0 0 0 8 0V3M6 3h4M14 3h4M12 10v3m-6 8a6 6 0 0 1 12 0M12 13a3 3 0 1 0 0 .01',
  patient: 'M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 8h4m-2-2v4',
  calendar: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16',
  building: 'M4 21V4h16v17M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2M10 21v-3h4v3',
  chart: 'M3 3v18h18M8 15l4-4 3 3 6-7',
  wallet: 'M3 6.5A2.5 2.5 0 0 1 5.5 4H20v16H5a2 2 0 0 1-2-2zM3 7h17m-4 6h4m-3 0h.01',
  plus: 'M12 3v18M3 12h18',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 2.8-.2-.1a1.7 1.7 0 0 0-1.8.2l-.2.1h-3.2l-.1-.2a1.7 1.7 0 0 0-1.6-1l-.2.1-2.8-1.6.1-.2a1.7 1.7 0 0 0-.2-1.8l-.1-.2v-3.2l.2-.1a1.7 1.7 0 0 0 1-1.6l-.1-.2 1.6-2.8.2.1a1.7 1.7 0 0 0 1.8-.2l.2-.1h3.2l.1.2a1.7 1.7 0 0 0 1.6 1l.2-.1 2.8 1.6-.1.2a1.7 1.7 0 0 0 .2 1.8l.1.2v3.2Z',
  shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4',
} as const

type SidebarIconName = keyof typeof iconPaths
type SidebarNavigationItemsProps = {
  items: ReadonlyArray<readonly [string, SidebarIconName]>
  activeItem: string
  onSelect: (item: string) => void
}

function SidebarIcon({ name }: { name: SidebarIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  )
}

function SidebarNavigationItems({ items, activeItem, onSelect }: SidebarNavigationItemsProps) {
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

export default function DashboardSidebar({ activeItem, userName, onSelect, onLogout }: DashboardSidebarProps) {
  const [menuQuery, setMenuQuery] = useState('')
  const initials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const normalizedMenuQuery = menuQuery.trim().toLocaleLowerCase('ro')
  const matchesMenuItem = ([label]: readonly [string, SidebarIconName]) =>
    label.toLocaleLowerCase('ro').includes(normalizedMenuQuery)
  const filteredPrimaryItems = primaryItems.filter(matchesMenuItem)
  const filteredManagementItems = managementItems.filter(matchesMenuItem)
  const hasMenuResults = filteredPrimaryItems.length > 0 || filteredManagementItems.length > 0

  function handleSelectMenuItem(item: string) {
    setMenuQuery('')
    onSelect(item)
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand"><BrandLogo /></div>
      <label className="sidebar-search">
        <SidebarIcon name="patient" />
        <input
          type="search"
          aria-label="Caută o secțiune din meniu"
          placeholder="Caută în meniu"
          value={menuQuery}
          onChange={(event) => setMenuQuery(event.target.value)}
        />
        {menuQuery && (
          <button
            type="button"
            className="sidebar-search-clear"
            aria-label="Șterge căutarea din meniu"
            onClick={() => setMenuQuery('')}
          >
            ×
          </button>
        )}
      </label>
      {filteredPrimaryItems.length > 0 && (
        <>
          <span className="sidebar-section-label">MENIU PRINCIPAL</span>
          <nav className="sidebar-nav" aria-label="Navigare principală">
            <SidebarNavigationItems items={filteredPrimaryItems} activeItem={activeItem} onSelect={handleSelectMenuItem} />
          </nav>
        </>
      )}
      {filteredManagementItems.length > 0 && (
        <>
          <span className="sidebar-section-label management-label">GESTIONARE</span>
          <nav className="sidebar-nav" aria-label="Navigare pentru gestionare">
            <SidebarNavigationItems items={filteredManagementItems} activeItem={activeItem} onSelect={handleSelectMenuItem} />
          </nav>
        </>
      )}
      {!hasMenuResults && (
        <p className="sidebar-search-empty" role="status">Nicio secțiune găsită.</p>
      )}
      <div className="sidebar-bottom">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-copy"><strong>{userName}</strong><span>Cont MedCare</span></div>
        <button className="sidebar-signout" type="button" onClick={onLogout} aria-label="Deconectare" title="Deconectare">↗</button>
      </div>
    </aside>
  )
}
