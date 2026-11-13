import { useEffect, useState, type FormEvent } from 'react'
import type { AuthUser } from '../../../../services/auth'
import {
  changePassword,
  getSettings,
  saveSettings,
  updateAccount,
  type ClinicSettings,
} from '../../../../services/settings'

type SettingsDirectoryProps = {
  query: string
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
  onClinicNameChange: (name: string) => void
  onThemeChange: (theme: 'light' | 'dark') => void
  onDateFormatChange: (format: ClinicSettings['preferences']['dateFormat']) => void
}

type SettingsSection = 'clinic' | 'hours' | 'notifications' | 'preferences' | 'account'
type Feedback = { type: 'success' | 'error'; message: string }

const settingsSections: Array<{ id: SettingsSection; title: string; description: string }> = [
  { id: 'clinic', title: 'Profilul clinicii', description: 'Datele de identificare și contact' },
  { id: 'hours', title: 'Programul clinicii', description: 'Zilele și orele de funcționare' },
  { id: 'notifications', title: 'Notificări', description: 'Preferințe pentru alerte' },
  { id: 'preferences', title: 'Aspect și preferințe', description: 'Temă și formatul datei' },
  { id: 'account', title: 'Contul meu', description: 'Date personale și parolă' },
]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Solicitarea nu a putut fi finalizată.'
}

export default function SettingsDirectory({
  query,
  user,
  onUserUpdated,
  onClinicNameChange,
  onThemeChange,
  onDateFormatChange,
}: SettingsDirectoryProps) {
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [activeSection, setActiveSection] = useState<SettingsSection>('clinic')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [savingSection, setSavingSection] = useState<SettingsSection | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [accountName, setAccountName] = useState(user.name)
  const [accountEmail, setAccountEmail] = useState(user.email)
  const [accountPassword, setAccountPassword] = useState('')
  const [passwordCurrent, setPasswordCurrent] = useState('')
  const [passwordNew, setPasswordNew] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('ro')
  const visibleSections = settingsSections.filter((section) =>
    !normalizedQuery
    || `${section.title} ${section.description}`.toLocaleLowerCase('ro').includes(normalizedQuery))

  useEffect(() => {
    let isCurrent = true
    getSettings()
      .then((loadedSettings) => {
        if (!isCurrent) return
        setSettings(loadedSettings)
        onClinicNameChange(loadedSettings.clinicProfile.name)
        onThemeChange(loadedSettings.preferences.theme)
        onDateFormatChange(loadedSettings.preferences.dateFormat)
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [onClinicNameChange, onDateFormatChange, onThemeChange])

  function updateClinicProfile(field: keyof ClinicSettings['clinicProfile'], value: string) {
    setSettings((current) => current
      ? { ...current, clinicProfile: { ...current.clinicProfile, [field]: value } }
      : current)
    setFeedback(null)
  }

  function updateWorkingHour(
    index: number,
    field: 'isOpen' | 'start' | 'end',
    value: boolean | string,
  ) {
    setSettings((current) => current
      ? {
          ...current,
          workingHours: current.workingHours.map((hours, currentIndex) =>
            currentIndex === index ? { ...hours, [field]: value } : hours),
        }
      : current)
    setFeedback(null)
  }

  function updateNotification(field: keyof ClinicSettings['notifications'], value: boolean) {
    setSettings((current) => current
      ? { ...current, notifications: { ...current.notifications, [field]: value } }
      : current)
    setFeedback(null)
  }

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!settings) return
    setSavingSection(activeSection)
    setFeedback(null)
    try {
      const savedSettings = await saveSettings(settings)
      setSettings(savedSettings)
      onClinicNameChange(savedSettings.clinicProfile.name)
      onThemeChange(savedSettings.preferences.theme)
      onDateFormatChange(savedSettings.preferences.dateFormat)
      setFeedback({ type: 'success', message: 'Setările au fost salvate în baza de date.' })
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSavingSection(null)
    }
  }

  async function handleSaveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    setSavingSection('account')
    try {
      const updatedUser = await updateAccount({
        name: accountName.trim(),
        email: accountEmail.trim(),
        currentPassword: accountPassword,
      })
      onUserUpdated(updatedUser)
      setAccountPassword('')
      setFeedback({ type: 'success', message: 'Datele contului au fost actualizate.' })
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSavingSection(null)
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    if (passwordNew !== passwordConfirmation) {
      setFeedback({ type: 'error', message: 'Parolele noi nu coincid.' })
      return
    }

    setSavingSection('account')
    try {
      await changePassword({ currentPassword: passwordCurrent, newPassword: passwordNew })
      setPasswordCurrent('')
      setPasswordNew('')
      setPasswordConfirmation('')
      setFeedback({ type: 'success', message: 'Parola a fost schimbată și salvată în baza de date.' })
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setSavingSection(null)
    }
  }

  function renderSettingsForm() {
    if (!settings) return null

    if (activeSection === 'clinic') {
      return (
        <form className="settings-form" onSubmit={(event) => void handleSaveSettings(event)}>
          <div className="settings-form-heading">
            <div>
              <h2>Datele clinicii</h2>
              <p>Adaugă informațiile afișate pentru clinica ta. Aceste date sunt private contului tău.</p>
            </div>
          </div>
          <div className="settings-fields-grid">
            <label className="settings-field">
              <span>Numele clinicii</span>
              <input maxLength={120} value={settings.clinicProfile.name} onChange={(event) => updateClinicProfile('name', event.target.value)} placeholder="Numele clinicii" />
            </label>
            <label className="settings-field">
              <span>Telefon</span>
              <input maxLength={30} type="tel" value={settings.clinicProfile.phone} onChange={(event) => updateClinicProfile('phone', event.target.value)} placeholder="Număr de telefon" />
            </label>
            <label className="settings-field settings-field-wide">
              <span>Adresă</span>
              <input maxLength={200} value={settings.clinicProfile.address} onChange={(event) => updateClinicProfile('address', event.target.value)} placeholder="Stradă, număr, localitate" />
            </label>
            <label className="settings-field">
              <span>E-mailul clinicii</span>
              <input maxLength={254} type="email" value={settings.clinicProfile.email} onChange={(event) => updateClinicProfile('email', event.target.value)} placeholder="contact@clinica.ro" />
            </label>
            <label className="settings-field">
              <span>Link către logo</span>
              <input maxLength={500} type="url" value={settings.clinicProfile.logoUrl} onChange={(event) => updateClinicProfile('logoUrl', event.target.value)} placeholder="https://..." />
            </label>
          </div>
          {settings.clinicProfile.logoUrl && (
            <div className="settings-logo-preview">
              <img src={settings.clinicProfile.logoUrl} alt="Previzualizare logo clinică" />
              <span>Previzualizare logo</span>
            </div>
          )}
          <SaveButton isSaving={savingSection === 'clinic'} />
        </form>
      )
    }

    if (activeSection === 'hours') {
      return (
        <form className="settings-form" onSubmit={(event) => void handleSaveSettings(event)}>
          <div className="settings-form-heading">
            <div>
              <h2>Programul de funcționare</h2>
              <p>Configurează intervalul pentru fiecare zi. Zilele marcate ca închise nu au interval orar.</p>
            </div>
          </div>
          <div className="settings-hours-list">
            {settings.workingHours.map((hours, index) => (
              <div className="settings-hours-row" key={hours.day}>
                <strong>{hours.day}</strong>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={hours.isOpen}
                    onChange={(event) => updateWorkingHour(index, 'isOpen', event.target.checked)}
                  />
                  <span>{hours.isOpen ? 'Deschis' : 'Închis'}</span>
                </label>
                <label className="settings-time-field">
                  <span className="visually-hidden">Deschidere {hours.day}</span>
                  <input
                    type="time"
                    value={hours.start}
                    disabled={!hours.isOpen}
                    required={hours.isOpen}
                    onChange={(event) => updateWorkingHour(index, 'start', event.target.value)}
                  />
                </label>
                <span className="settings-hours-separator">până la</span>
                <label className="settings-time-field">
                  <span className="visually-hidden">Închidere {hours.day}</span>
                  <input
                    type="time"
                    value={hours.end}
                    disabled={!hours.isOpen}
                    required={hours.isOpen}
                    min={hours.start || undefined}
                    onChange={(event) => updateWorkingHour(index, 'end', event.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
          <SaveButton isSaving={savingSection === 'hours'} />
        </form>
      )
    }

    if (activeSection === 'notifications') {
      const notificationOptions: Array<{
        key: keyof ClinicSettings['notifications']
        title: string
        description: string
      }> = [
        { key: 'appointments', title: 'Programări', description: 'Preferință pentru actualizări și remindere de programări.' },
        { key: 'pharmacy', title: 'Farmacie', description: 'Preferință pentru alerte privind stocurile și expirările.' },
        { key: 'emergencies', title: 'Urgențe și internări', description: 'Preferință pentru actualizări despre cazuri și internări.' },
      ]

      return (
        <form className="settings-form" onSubmit={(event) => void handleSaveSettings(event)}>
          <div className="settings-form-heading">
            <div>
              <h2>Preferințe pentru notificări</h2>
              <p>Aceste opțiuni se salvează în cont. Trimiterea efectivă a notificărilor nu este activată încă.</p>
            </div>
          </div>
          <div className="settings-notification-list">
            {notificationOptions.map((option) => (
              <label className="settings-notification-row" key={option.key}>
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifications[option.key]}
                  onChange={(event) => updateNotification(option.key, event.target.checked)}
                  aria-label={`Activează preferința pentru ${option.title}`}
                />
              </label>
            ))}
          </div>
          <SaveButton isSaving={savingSection === 'notifications'} />
        </form>
      )
    }

    if (activeSection === 'preferences') {
      return (
        <form className="settings-form" onSubmit={(event) => void handleSaveSettings(event)}>
          <div className="settings-form-heading">
            <div>
              <h2>Aspect și preferințe</h2>
              <p>Alege aspectul aplicației și modul de afișare a datei.</p>
            </div>
          </div>
          <div className="settings-fields-grid">
            <label className="settings-field">
              <span>Temă</span>
              <select
                value={settings.preferences.theme}
                onChange={(event) => {
                  const theme = event.target.value as ClinicSettings['preferences']['theme']
                  setSettings((current) => current
                    ? { ...current, preferences: { ...current.preferences, theme } }
                    : current)
                  setFeedback(null)
                }}
              >
                <option value="light">Deschisă</option>
                <option value="dark">Întunecată</option>
              </select>
            </label>
            <label className="settings-field">
              <span>Formatul datei</span>
              <select
                value={settings.preferences.dateFormat}
                onChange={(event) => {
                  const dateFormat = event.target.value as ClinicSettings['preferences']['dateFormat']
                  setSettings((current) => current
                    ? { ...current, preferences: { ...current.preferences, dateFormat } }
                    : current)
                  setFeedback(null)
                }}
              >
                <option value="long">Lung (ex. 13 noiembrie 2026)</option>
                <option value="dd.MM.yyyy">ZZ.LL.AAAA</option>
                <option value="dd/MM/yyyy">ZZ/LL/AAAA</option>
              </select>
            </label>
            <div className="settings-language-choice">
              <span>Limba interfeței</span>
              <strong>Română</strong>
              <small>Interfața este disponibilă momentan doar în limba română.</small>
            </div>
          </div>
          <SaveButton isSaving={savingSection === 'preferences'} />
        </form>
      )
    }

    return (
      <div className="settings-account-sections">
        <form className="settings-form" onSubmit={(event) => void handleSaveAccount(event)}>
          <div className="settings-form-heading">
            <div>
              <h2>Datele contului</h2>
              <p>Confirmă parola curentă pentru a modifica numele sau adresa de e-mail.</p>
            </div>
          </div>
          <div className="settings-fields-grid">
            <label className="settings-field">
              <span>Nume</span>
              <input minLength={2} maxLength={80} required value={accountName} onChange={(event) => setAccountName(event.target.value)} />
            </label>
            <label className="settings-field">
              <span>E-mail</span>
              <input type="email" required value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} />
            </label>
            <label className="settings-field settings-field-wide">
              <span>Parola curentă</span>
              <input type="password" autoComplete="current-password" required value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} />
            </label>
          </div>
          <SaveButton isSaving={savingSection === 'account'} label="Salvează datele contului" />
        </form>

        <form className="settings-form settings-password-form" onSubmit={(event) => void handleChangePassword(event)}>
          <div className="settings-form-heading">
            <div>
              <h2>Schimbarea parolei</h2>
              <p>Parola nouă va fi criptată și salvată în baza de date.</p>
            </div>
          </div>
          <div className="settings-fields-grid">
            <label className="settings-field settings-field-wide">
              <span>Parola actuală</span>
              <input type="password" autoComplete="current-password" minLength={1} required value={passwordCurrent} onChange={(event) => setPasswordCurrent(event.target.value)} />
            </label>
            <label className="settings-field">
              <span>Parola nouă</span>
              <input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={passwordNew} onChange={(event) => setPasswordNew(event.target.value)} />
            </label>
            <label className="settings-field">
              <span>Confirmă parola nouă</span>
              <input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
            </label>
          </div>
          <SaveButton isSaving={savingSection === 'account'} label="Schimbă parola" />
        </form>
      </div>
    )
  }

  return (
    <section className="settings-directory" aria-label="Setări">
      {isLoading ? (
        <div className="settings-state" role="status">Se încarcă setările…</div>
      ) : loadError ? (
        <div className="settings-state settings-state-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="secondary-action" onClick={() => {
            setIsLoading(true)
            setLoadError('')
            getSettings()
              .then((loadedSettings) => {
                setSettings(loadedSettings)
                onClinicNameChange(loadedSettings.clinicProfile.name)
                onThemeChange(loadedSettings.preferences.theme)
                onDateFormatChange(loadedSettings.preferences.dateFormat)
              })
              .catch((error: unknown) => setLoadError(getErrorMessage(error)))
              .finally(() => setIsLoading(false))
          }}>
            Reîncearcă
          </button>
        </div>
      ) : settings ? (
        <>
          <div className="settings-workspace">
            <nav className="settings-navigation" aria-label="Categorii de setări">
              {visibleSections.length > 0 ? visibleSections.map((section) => (
                <button
                  className={`settings-navigation-item${activeSection === section.id ? ' is-active' : ''}`}
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id)
                    setFeedback(null)
                  }}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                >
                  <strong>{section.title}</strong>
                  <small>{section.description}</small>
                </button>
              )) : <p className="settings-navigation-empty">Nicio categorie nu corespunde căutării.</p>}
            </nav>
            <div className="settings-panel">
              {feedback && (
                <p className={`settings-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
                  {feedback.message}
                </p>
              )}
              {renderSettingsForm()}
            </div>
          </div>
        </>
      ) : (
        <div className="settings-state" role="status">Nu există setări disponibile.</div>
      )}
    </section>
  )
}

function SaveButton({ isSaving, label = 'Salvează modificările' }: { isSaving: boolean; label?: string }) {
  return (
    <div className="settings-actions">
      <button className="primary-action" type="submit" disabled={isSaving}>
        {isSaving ? 'Se salvează…' : label}
      </button>
    </div>
  )
}
