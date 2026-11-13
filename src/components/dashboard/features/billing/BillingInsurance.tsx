import { useMemo, useState, type FormEvent } from 'react'
import { formatDateForUser } from '../../../../utils/date'

type InvoiceStatus = 'Achitată' | 'Neachitată' | 'Restantă'
type PaymentMethod = 'Card' | 'Numerar' | 'Transfer bancar' | 'Asigurare'
type ClaimStatus = 'În pregătire' | 'Trimisă' | 'Aprobată' | 'Respinsă'
type BillingTab = 'facturi' | 'asigurări'

type Invoice = {
  id: string
  number: string
  patient: string
  service: string
  date: string
  dueDate: string
  amount: number
  status: InvoiceStatus
  paymentMethod: PaymentMethod
}

type InsuranceClaim = {
  id: string
  patient: string
  insurer: string
  caseNumber: string
  submitted: string
  amount: number
  status: ClaimStatus
}

type InvoiceForm = Omit<Invoice, 'id' | 'number' | 'amount'> & { number: string; amount: string }
type ClaimForm = Omit<InsuranceClaim, 'id' | 'amount'> & { amount: string }
type DeleteTarget = { type: BillingTab; id: string; label: string }

const demoPatients = ['Ana Ionescu', 'Mihai Georgescu', 'Ioana Stan', 'Vlad Dumitrescu', 'Maria Popescu']
const insurers = ['Casa Națională de Asigurări', 'Regina Maria', 'MedLife', 'Allianz-Țiriac']

function localDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function offsetDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return localDate(date)
}

function createDemoInvoices(): Invoice[] {
  return [
    { id: 'INV-001', number: 'MC-2026-001', patient: 'Ana Ionescu', service: 'Consultație cardiologie', date: offsetDate(-8), dueDate: offsetDate(7), amount: 250, status: 'Achitată', paymentMethod: 'Card' },
    { id: 'INV-002', number: 'MC-2026-002', patient: 'Mihai Georgescu', service: 'Consultație neurologie', date: offsetDate(-5), dueDate: offsetDate(10), amount: 320, status: 'Neachitată', paymentMethod: 'Transfer bancar' },
    { id: 'INV-003', number: 'MC-2026-003', patient: 'Ioana Stan', service: 'Analize de laborator', date: offsetDate(-18), dueDate: offsetDate(-4), amount: 185, status: 'Restantă', paymentMethod: 'Numerar' },
    { id: 'INV-004', number: 'MC-2026-004', patient: 'Vlad Dumitrescu', service: 'Control cardiologie', date: offsetDate(-2), dueDate: offsetDate(13), amount: 180, status: 'Achitată', paymentMethod: 'Asigurare' },
    { id: 'INV-005', number: 'MC-2026-005', patient: 'Maria Popescu', service: 'Consultație medicină internă', date: offsetDate(-1), dueDate: offsetDate(14), amount: 220, status: 'Neachitată', paymentMethod: 'Card' },
  ]
}

function createDemoClaims(): InsuranceClaim[] {
  return [
    { id: 'DOS-001', patient: 'Ana Ionescu', insurer: 'Casa Națională de Asigurări', caseNumber: 'CNAS-2601-0421', submitted: offsetDate(-6), amount: 250, status: 'Aprobată' },
    { id: 'DOS-002', patient: 'Mihai Georgescu', insurer: 'Regina Maria', caseNumber: 'RM-2601-0178', submitted: offsetDate(-3), amount: 320, status: 'Trimisă' },
    { id: 'DOS-003', patient: 'Ioana Stan', insurer: 'MedLife', caseNumber: 'ML-2601-0093', submitted: offsetDate(-1), amount: 185, status: 'În pregătire' },
    { id: 'DOS-004', patient: 'Vlad Dumitrescu', insurer: 'Allianz-Țiriac', caseNumber: 'AT-2601-0256', submitted: offsetDate(-10), amount: 180, status: 'Respinsă' },
  ]
}

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return value === 'Achitată' || value === 'Neachitată' || value === 'Restantă'
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === 'Card' || value === 'Numerar' || value === 'Transfer bancar' || value === 'Asigurare'
}

function isClaimStatus(value: string): value is ClaimStatus {
  return value === 'În pregătire' || value === 'Trimisă' || value === 'Aprobată' || value === 'Respinsă'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  return formatDateForUser(new Date(`${value}T12:00:00`), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = `\uFEFF${rows.map((row) =>
    row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
  ).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const emptyInvoiceForm = (): InvoiceForm => ({
  number: '',
  patient: '',
  service: '',
  date: localDate(new Date()),
  dueDate: offsetDate(14),
  amount: '',
  status: 'Neachitată',
  paymentMethod: 'Card',
})

const emptyClaimForm = (): ClaimForm => ({
  patient: '',
  insurer: insurers[0],
  caseNumber: '',
  submitted: localDate(new Date()),
  amount: '',
  status: 'În pregătire',
})

type BillingInsuranceProps = {
  query: string
}

export default function BillingInsurance({ query }: BillingInsuranceProps) {
  const [invoices, setInvoices] = useState(createDemoInvoices)
  const [claims, setClaims] = useState(createDemoClaims)
  const [activeTab, setActiveTab] = useState<BillingTab>('facturi')
  const [invoiceFilter, setInvoiceFilter] = useState('Toate statusurile')
  const [claimFilter, setClaimFilter] = useState('Toate statusurile')
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm)
  const [claimForm, setClaimForm] = useState<ClaimForm>(emptyClaimForm)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const normalizedQuery = query.trim().toLocaleLowerCase('ro')
  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const matchesStatus = invoiceFilter === 'Toate statusurile' || invoice.status === invoiceFilter
    const matchesQuery = !normalizedQuery
      || `${invoice.number} ${invoice.patient} ${invoice.service} ${invoice.paymentMethod}`
        .toLocaleLowerCase('ro')
        .includes(normalizedQuery)
    return matchesStatus && matchesQuery
  }), [invoices, invoiceFilter, normalizedQuery])
  const filteredClaims = useMemo(() => claims.filter((claim) => {
    const matchesStatus = claimFilter === 'Toate statusurile' || claim.status === claimFilter
    const matchesQuery = !normalizedQuery
      || `${claim.patient} ${claim.insurer} ${claim.caseNumber} ${claim.status}`
        .toLocaleLowerCase('ro')
        .includes(normalizedQuery)
    return matchesStatus && matchesQuery
  }), [claims, claimFilter, normalizedQuery])

  const paidTotal = invoices.filter((invoice) => invoice.status === 'Achitată')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const outstandingTotal = invoices.filter((invoice) => invoice.status !== 'Achitată')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingClaims = claims.filter((claim) => claim.status === 'În pregătire' || claim.status === 'Trimisă').length

  function openCreateInvoice() {
    setEditingInvoice(null)
    setEditingClaim(null)
    setInvoiceForm(emptyInvoiceForm())
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditInvoice(invoice: Invoice) {
    setEditingInvoice(invoice)
    setEditingClaim(null)
    setInvoiceForm({
      number: invoice.number,
      patient: invoice.patient,
      service: invoice.service,
      date: invoice.date,
      dueDate: invoice.dueDate,
      amount: String(invoice.amount),
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function openCreateClaim() {
    setEditingInvoice(null)
    setEditingClaim(null)
    setClaimForm(emptyClaimForm())
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditClaim(claim: InsuranceClaim) {
    setEditingInvoice(null)
    setEditingClaim(claim)
    setClaimForm({
      patient: claim.patient,
      insurer: claim.insurer,
      caseNumber: claim.caseNumber,
      submitted: claim.submitted,
      amount: String(claim.amount),
      status: claim.status,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(invoiceForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Introdu o sumă validă mai mare decât zero.')
      return
    }
    if (invoiceForm.dueDate < invoiceForm.date) {
      setFormError('Scadența nu poate fi anterioară datei facturii.')
      return
    }
    const duplicateNumber = invoices.some((invoice) =>
      invoice.number.toLocaleLowerCase('ro') === invoiceForm.number.trim().toLocaleLowerCase('ro')
      && invoice.id !== editingInvoice?.id,
    )
    if (invoiceForm.number.trim() && duplicateNumber) {
      setFormError('Există deja o factură cu acest număr.')
      return
    }

    const invoiceData = {
      ...invoiceForm,
      number: invoiceForm.number.trim() || `MC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      patient: invoiceForm.patient.trim(),
      service: invoiceForm.service.trim(),
      amount,
    }
    if (editingInvoice) {
      setInvoices((current) => current.map((invoice) =>
        invoice.id === editingInvoice.id ? { ...invoiceData, id: invoice.id } : invoice,
      ))
    } else {
      setInvoices((current) => [{ ...invoiceData, id: `INV-${crypto.randomUUID()}` }, ...current])
    }
    setIsFormOpen(false)
  }

  function handleClaimSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(claimForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Introdu o sumă solicitată validă mai mare decât zero.')
      return
    }
    const duplicateNumber = claims.some((claim) =>
      claim.caseNumber.toLocaleLowerCase('ro') === claimForm.caseNumber.trim().toLocaleLowerCase('ro')
      && claim.id !== editingClaim?.id,
    )
    if (duplicateNumber) {
      setFormError('Există deja un dosar cu acest număr.')
      return
    }

    const claimData = {
      ...claimForm,
      patient: claimForm.patient.trim(),
      caseNumber: claimForm.caseNumber.trim(),
      amount,
    }
    if (editingClaim) {
      setClaims((current) => current.map((claim) =>
        claim.id === editingClaim.id ? { ...claimData, id: claim.id } : claim,
      ))
    } else {
      setClaims((current) => [{ ...claimData, id: `DOS-${crypto.randomUUID()}` }, ...current])
    }
    setIsFormOpen(false)
  }

  function updateInvoiceStatus(invoice: Invoice, value: string) {
    if (!isInvoiceStatus(value)) return
    setInvoices((current) => current.map((item) =>
      item.id === invoice.id ? { ...item, status: value } : item,
    ))
  }

  function updateClaimStatus(claim: InsuranceClaim, value: string) {
    if (!isClaimStatus(value)) return
    setClaims((current) => current.map((item) =>
      item.id === claim.id ? { ...item, status: value } : item,
    ))
  }

  function handleDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'facturi') {
      setInvoices((current) => current.filter((invoice) => invoice.id !== deleteTarget.id))
    } else {
      setClaims((current) => current.filter((claim) => claim.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  function handleExport() {
    if (activeTab === 'facturi') {
      downloadCsv('medcare-facturi-demo.csv', [
        ['Număr factură', 'Pacient demonstrativ', 'Serviciu', 'Data', 'Scadență', 'Sumă RON', 'Status', 'Metodă plată'],
        ...filteredInvoices.map((invoice) => [
          invoice.number,
          invoice.patient,
          invoice.service,
          invoice.date,
          invoice.dueDate,
          String(invoice.amount),
          invoice.status,
          invoice.paymentMethod,
        ]),
      ])
    } else {
      downloadCsv('medcare-dosare-asigurari-demo.csv', [
        ['Număr dosar', 'Pacient demonstrativ', 'Asigurator', 'Data trimiterii', 'Sumă solicitată RON', 'Status'],
        ...filteredClaims.map((claim) => [
          claim.caseNumber,
          claim.patient,
          claim.insurer,
          claim.submitted,
          String(claim.amount),
          claim.status,
        ]),
      ])
    }
    setNotice('Exportul CSV demonstrativ a fost descărcat.')
  }

  return (
    <section className="billing-page" aria-label="Facturare și asigurări">
      <div className="billing-demo-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>Date demonstrative. Facturile și dosarele nu sunt conectate la servicii de plată sau la asiguratori reali.</p>
        <button type="button" className="analytics-export-button" onClick={handleExport}>Descarcă CSV <span aria-hidden="true">↓</span></button>
      </div>
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}

      <div className="billing-summary">
        <article className="dashboard-card billing-summary-card">
          <span className="billing-summary-icon">▤</span>
          <span><strong>{invoices.length}</strong><small>Facturi emise</small></span>
        </article>
        <article className="dashboard-card billing-summary-card">
          <span className="billing-summary-icon billing-icon-green">✓</span>
          <span><strong>{formatCurrency(paidTotal)}</strong><small>Încasări confirmate</small></span>
        </article>
        <article className="dashboard-card billing-summary-card">
          <span className="billing-summary-icon billing-icon-amber">◷</span>
          <span><strong>{formatCurrency(outstandingTotal)}</strong><small>De încasat</small></span>
        </article>
        <article className="dashboard-card billing-summary-card">
          <span className="billing-summary-icon billing-icon-blue">▦</span>
          <span><strong>{pendingClaims}</strong><small>Dosare în așteptare</small></span>
        </article>
      </div>

      <div className="dashboard-card billing-workspace">
        <div className="billing-workspace-heading">
          <div>
            <h2>Administrare financiară</h2>
            <p>Facturi și solicitări de decontare demonstrative.</p>
          </div>
          <button className="primary-action" type="button" onClick={activeTab === 'facturi' ? openCreateInvoice : openCreateClaim}>
            <span aria-hidden="true">＋</span> {activeTab === 'facturi' ? 'Emite factură' : 'Adaugă dosar'}
          </button>
        </div>
        <div className="billing-tabs" role="tablist" aria-label="Tipul evidenței financiare">
          <button type="button" role="tab" aria-selected={activeTab === 'facturi'} className={activeTab === 'facturi' ? 'active' : ''} onClick={() => { setActiveTab('facturi'); setNotice('') }}>
            Facturi <span>{invoices.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'asigurări'} className={activeTab === 'asigurări' ? 'active' : ''} onClick={() => { setActiveTab('asigurări'); setNotice('') }}>
            Asigurări <span>{claims.length}</span>
          </button>
        </div>
        <div className="billing-table-toolbar">
          <p>{activeTab === 'facturi' ? `${filteredInvoices.length} facturi afișate` : `${filteredClaims.length} dosare afișate`}</p>
          <label>
            <span className="visually-hidden">Filtrează după status</span>
            {activeTab === 'facturi' ? (
              <select value={invoiceFilter} onChange={(event) => setInvoiceFilter(event.target.value)}>
                <option>Toate statusurile</option><option>Achitată</option><option>Neachitată</option><option>Restantă</option>
              </select>
            ) : (
              <select value={claimFilter} onChange={(event) => setClaimFilter(event.target.value)}>
                <option>Toate statusurile</option><option>În pregătire</option><option>Trimisă</option><option>Aprobată</option><option>Respinsă</option>
              </select>
            )}
          </label>
        </div>

        {activeTab === 'facturi' ? (
          <div className="billing-table-scroll">
            <table className="billing-table">
              <thead><tr><th>FACTURĂ</th><th>PACIENT</th><th>SERVICIU</th><th>DATA / SCADENȚĂ</th><th>SUMĂ</th><th>PLATĂ</th><th>STATUS</th><th><span className="visually-hidden">Acțiuni</span></th></tr></thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong className="billing-primary-cell">{invoice.number}</strong></td>
                    <td>{invoice.patient}</td>
                    <td>{invoice.service}</td>
                    <td><span className="billing-date-cell"><strong>{formatDate(invoice.date)}</strong><small>Scadentă {formatDate(invoice.dueDate)}</small></span></td>
                    <td><strong className="billing-amount">{formatCurrency(invoice.amount)}</strong></td>
                    <td>{invoice.paymentMethod}</td>
                    <td>
                      <label className={`billing-status billing-status-${invoice.status === 'Achitată' ? 'paid' : invoice.status === 'Restantă' ? 'overdue' : 'unpaid'}`}>
                        <span className="visually-hidden">Status factură {invoice.number}</span>
                        <select value={invoice.status} onChange={(event) => updateInvoiceStatus(invoice, event.target.value)}>
                          <option>Achitată</option><option>Neachitată</option><option>Restantă</option>
                        </select>
                      </label>
                    </td>
                    <td><span className="billing-row-actions">
                      <button type="button" onClick={() => openEditInvoice(invoice)} aria-label={`Editează factura ${invoice.number}`}>Editează</button>
                      <button type="button" className="billing-delete-action" onClick={() => setDeleteTarget({ type: 'facturi', id: invoice.id, label: invoice.number })} aria-label={`Șterge factura ${invoice.number}`}>Șterge</button>
                    </span></td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && <tr><td className="empty-results" colSpan={8}>Nu există facturi pentru criteriile selectate.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="billing-table-scroll">
            <table className="billing-table">
              <thead><tr><th>DOSAR</th><th>PACIENT</th><th>ASIGURATOR</th><th>DATA TRIMITERII</th><th>SUMĂ SOLICITATĂ</th><th>STATUS</th><th><span className="visually-hidden">Acțiuni</span></th></tr></thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td><strong className="billing-primary-cell">{claim.caseNumber}</strong></td>
                    <td>{claim.patient}</td>
                    <td>{claim.insurer}</td>
                    <td>{formatDate(claim.submitted)}</td>
                    <td><strong className="billing-amount">{formatCurrency(claim.amount)}</strong></td>
                    <td>
                      <label className={`billing-status billing-status-${claim.status === 'Aprobată' ? 'paid' : claim.status === 'Respinsă' ? 'overdue' : 'unpaid'}`}>
                        <span className="visually-hidden">Status dosar {claim.caseNumber}</span>
                        <select value={claim.status} onChange={(event) => updateClaimStatus(claim, event.target.value)}>
                          <option>În pregătire</option><option>Trimisă</option><option>Aprobată</option><option>Respinsă</option>
                        </select>
                      </label>
                    </td>
                    <td><span className="billing-row-actions">
                      <button type="button" onClick={() => openEditClaim(claim)} aria-label={`Editează dosarul ${claim.caseNumber}`}>Editează</button>
                      <button type="button" className="billing-delete-action" onClick={() => setDeleteTarget({ type: 'asigurări', id: claim.id, label: claim.caseNumber })} aria-label={`Șterge dosarul ${claim.caseNumber}`}>Șterge</button>
                    </span></td>
                  </tr>
                ))}
                {filteredClaims.length === 0 && <tr><td className="empty-results" colSpan={7}>Nu există dosare pentru criteriile selectate.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <p className="billing-demo-note">Date și identități fictive. Modificările sunt temporare și nu se salvează în baza de date.</p>
      </div>

      {isFormOpen && activeTab === 'facturi' && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false) }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-form-title">
            <div className="patient-modal-heading">
              <div><h2 id="invoice-form-title">{editingInvoice ? 'Editează factura' : 'Emite factură'}</h2><p>Completează datele facturii demonstrative.</p></div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleInvoiceSubmit}>
              <label className="patient-form-field">Număr factură <input maxLength={40} placeholder="Generat automat dacă este lăsat liber" value={invoiceForm.number} onChange={(event) => setInvoiceForm({ ...invoiceForm, number: event.target.value })} /></label>
              <label className="patient-form-field">Pacient demonstrativ
                <select required value={invoiceForm.patient} onChange={(event) => setInvoiceForm({ ...invoiceForm, patient: event.target.value })}>
                  <option value="">Selectează pacientul</option>{demoPatients.map((patient) => <option key={patient}>{patient}</option>)}
                </select>
              </label>
              <label className="patient-form-field">Serviciu <input required maxLength={100} value={invoiceForm.service} onChange={(event) => setInvoiceForm({ ...invoiceForm, service: event.target.value })} /></label>
              <div className="patient-form-grid">
                <label className="patient-form-field">Data facturii <input required type="date" value={invoiceForm.date} onChange={(event) => setInvoiceForm({ ...invoiceForm, date: event.target.value })} /></label>
                <label className="patient-form-field">Scadență <input required type="date" value={invoiceForm.dueDate} onChange={(event) => setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })} /></label>
              </div>
              <div className="patient-form-grid">
                <label className="patient-form-field">Sumă (RON) <input required type="number" min="0.01" step="0.01" value={invoiceForm.amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, amount: event.target.value })} /></label>
                <label className="patient-form-field">Metodă de plată
                  <select value={invoiceForm.paymentMethod} onChange={(event) => { if (isPaymentMethod(event.target.value)) setInvoiceForm({ ...invoiceForm, paymentMethod: event.target.value }) }}>
                    <option>Card</option><option>Numerar</option><option>Transfer bancar</option><option>Asigurare</option>
                  </select>
                </label>
              </div>
              <label className="patient-form-field">Status
                <select value={invoiceForm.status} onChange={(event) => { if (isInvoiceStatus(event.target.value)) setInvoiceForm({ ...invoiceForm, status: event.target.value }) }}>
                  <option>Achitată</option><option>Neachitată</option><option>Restantă</option>
                </select>
              </label>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions"><button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button><button className="primary-action" type="submit">{editingInvoice ? 'Salvează modificările' : 'Emite factura'}</button></div>
            </form>
          </section>
        </div>
      )}

      {isFormOpen && activeTab === 'asigurări' && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false) }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="claim-form-title">
            <div className="patient-modal-heading">
              <div><h2 id="claim-form-title">{editingClaim ? 'Editează dosarul' : 'Adaugă dosar de asigurare'}</h2><p>Înregistrează o solicitare demonstrativă de decontare.</p></div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleClaimSubmit}>
              <label className="patient-form-field">Pacient demonstrativ
                <select required value={claimForm.patient} onChange={(event) => setClaimForm({ ...claimForm, patient: event.target.value })}>
                  <option value="">Selectează pacientul</option>{demoPatients.map((patient) => <option key={patient}>{patient}</option>)}
                </select>
              </label>
              <label className="patient-form-field">Asigurator
                <select value={claimForm.insurer} onChange={(event) => setClaimForm({ ...claimForm, insurer: event.target.value })}>
                  {insurers.map((insurer) => <option key={insurer}>{insurer}</option>)}
                </select>
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">Număr dosar <input required maxLength={50} value={claimForm.caseNumber} onChange={(event) => setClaimForm({ ...claimForm, caseNumber: event.target.value })} /></label>
                <label className="patient-form-field">Data trimiterii <input required type="date" value={claimForm.submitted} onChange={(event) => setClaimForm({ ...claimForm, submitted: event.target.value })} /></label>
              </div>
              <div className="patient-form-grid">
                <label className="patient-form-field">Sumă solicitată (RON) <input required type="number" min="0.01" step="0.01" value={claimForm.amount} onChange={(event) => setClaimForm({ ...claimForm, amount: event.target.value })} /></label>
                <label className="patient-form-field">Status
                  <select value={claimForm.status} onChange={(event) => { if (isClaimStatus(event.target.value)) setClaimForm({ ...claimForm, status: event.target.value }) }}>
                    <option>În pregătire</option><option>Trimisă</option><option>Aprobată</option><option>Respinsă</option>
                  </select>
                </label>
              </div>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions"><button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button><button className="primary-action" type="submit">{editingClaim ? 'Salvează modificările' : 'Adaugă dosarul'}</button></div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null) }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="billing-delete-title">
            <h2 id="billing-delete-title">Ștergi această înregistrare?</h2>
            <p><strong>{deleteTarget.label}</strong> va fi eliminată din lista demonstrativă.</p>
            <div className="patient-modal-actions"><button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)}>Păstrează</button><button className="patient-confirm-delete" type="button" onClick={handleDelete}>Șterge</button></div>
          </section>
        </div>
      )}
    </section>
  )
}
