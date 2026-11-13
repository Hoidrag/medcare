import { useMemo, useState, type FormEvent } from 'react'
import { getLocalDateValue } from '../../../../utils/date'

type PharmacyItem = {
  id: string
  name: string
  activeIngredient: string
  form: string
  strength: string
  lotNumber: string
  expiryDate: string
  quantity: number
  unit: string
  minimumQuantity: number
  location: string
  supplier: string
}

type PharmacyForm = Omit<PharmacyItem, 'id' | 'quantity' | 'minimumQuantity'> & {
  quantity: string
  minimumQuantity: string
}

type StockFilter = 'Toate loturile' | 'Stoc redus' | 'Expiră în 90 zile' | 'Expirate'
type MovementType = 'Recepție' | 'Consum'

type StockMovement = {
  id: string
  itemName: string
  lotNumber: string
  type: MovementType
  quantity: number
  unit: string
  date: string
  note: string
}

function getDateOffset(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return getLocalDateValue(date)
}

const initialItems: PharmacyItem[] = [
  {
    id: 'lot-001',
    name: 'Paracetamol',
    activeIngredient: 'Paracetamol',
    form: 'Comprimate',
    strength: '500 mg',
    lotNumber: 'PAR-26-041',
    expiryDate: getDateOffset(210),
    quantity: 120,
    unit: 'cutii',
    minimumQuantity: 25,
    location: 'Raft A · 01',
    supplier: 'Mediplus Distribution',
  },
  {
    id: 'lot-002',
    name: 'Amoxicilină',
    activeIngredient: 'Amoxicilină trihidrat',
    form: 'Capsule',
    strength: '500 mg',
    lotNumber: 'AMX-26-118',
    expiryDate: getDateOffset(72),
    quantity: 18,
    unit: 'cutii',
    minimumQuantity: 20,
    location: 'Raft A · 03',
    supplier: 'Farmexim',
  },
  {
    id: 'lot-003',
    name: 'Ibuprofen',
    activeIngredient: 'Ibuprofen',
    form: 'Comprimate filmate',
    strength: '400 mg',
    lotNumber: 'IBU-25-772',
    expiryDate: getDateOffset(21),
    quantity: 8,
    unit: 'cutii',
    minimumQuantity: 15,
    location: 'Raft B · 02',
    supplier: 'Mediplus Distribution',
  },
  {
    id: 'lot-004',
    name: 'Ser fiziologic',
    activeIngredient: 'Clorură de sodiu',
    form: 'Soluție perfuzabilă',
    strength: '0,9% · 500 ml',
    lotNumber: 'SF-26-204',
    expiryDate: getDateOffset(340),
    quantity: 64,
    unit: 'flacoane',
    minimumQuantity: 20,
    location: 'Depozit · C 04',
    supplier: 'B. Braun',
  },
  {
    id: 'lot-005',
    name: 'Omeprazol',
    activeIngredient: 'Omeprazol',
    form: 'Capsule gastrorezistente',
    strength: '20 mg',
    lotNumber: 'OME-25-092',
    expiryDate: getDateOffset(-8),
    quantity: 12,
    unit: 'cutii',
    minimumQuantity: 10,
    location: 'Raft B · 01',
    supplier: 'Zentiva',
  },
  {
    id: 'lot-006',
    name: 'Metformin',
    activeIngredient: 'Clorhidrat de metformin',
    form: 'Comprimate filmate',
    strength: '850 mg',
    lotNumber: 'MET-26-551',
    expiryDate: getDateOffset(45),
    quantity: 44,
    unit: 'cutii',
    minimumQuantity: 18,
    location: 'Raft C · 02',
    supplier: 'Zentiva',
  },
  {
    id: 'lot-007',
    name: 'Vitamina D3',
    activeIngredient: 'Colecalciferol',
    form: 'Picături orale',
    strength: '10 ml',
    lotNumber: 'VD3-26-009',
    expiryDate: getDateOffset(155),
    quantity: 6,
    unit: 'flacoane',
    minimumQuantity: 12,
    location: 'Raft C · 05',
    supplier: 'Polisano',
  },
]

const initialMovements: StockMovement[] = [
  {
    id: 'movement-001',
    itemName: 'Ser fiziologic',
    lotNumber: 'SF-26-204',
    type: 'Recepție',
    quantity: 24,
    unit: 'flacoane',
    date: getDateOffset(-1),
    note: 'Recepție furnizor',
  },
  {
    id: 'movement-002',
    itemName: 'Paracetamol',
    lotNumber: 'PAR-26-041',
    type: 'Consum',
    quantity: 6,
    unit: 'cutii',
    date: getDateOffset(-2),
    note: 'Consum intern',
  },
  {
    id: 'movement-003',
    itemName: 'Ibuprofen',
    lotNumber: 'IBU-25-772',
    type: 'Consum',
    quantity: 3,
    unit: 'cutii',
    date: getDateOffset(-3),
    note: 'Consum intern',
  },
]

const emptyForm = (): PharmacyForm => ({
  name: '',
  activeIngredient: '',
  form: '',
  strength: '',
  lotNumber: '',
  expiryDate: '',
  quantity: '',
  unit: 'cutii',
  minimumQuantity: '',
  location: '',
  supplier: '',
})

function getDaysUntilExpiry(expiryDate: string, today: string) {
  const expiry = new Date(`${expiryDate}T12:00:00`).getTime()
  const current = new Date(`${today}T12:00:00`).getTime()
  return Math.ceil((expiry - current) / 86_400_000)
}

function getStockStatus(item: PharmacyItem, today: string) {
  const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate, today)
  if (daysUntilExpiry < 0) return 'Expirat'
  if (daysUntilExpiry <= 90) return 'Expiră curând'
  if (item.quantity <= item.minimumQuantity) return 'Stoc redus'
  return 'În stoc'
}

function getStockStatusClass(status: string) {
  if (status === 'Expirat') return 'expired'
  if (status === 'Expiră curând') return 'expiring'
  if (status === 'Stoc redus') return 'low'
  return 'available'
}

function formatExpiryDate(date: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatMovementDate(date: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))
}

function isStockFilter(value: string): value is StockFilter {
  return value === 'Toate loturile'
    || value === 'Stoc redus'
    || value === 'Expiră în 90 zile'
    || value === 'Expirate'
}

type PharmacyDirectoryProps = {
  query: string
}

export default function PharmacyDirectory({ query }: PharmacyDirectoryProps) {
  const [today] = useState(() => getLocalDateValue(new Date()))
  const [items, setItems] = useState(initialItems)
  const [movements, setMovements] = useState(initialMovements)
  const [stockFilter, setStockFilter] = useState<StockFilter>('Toate loturile')
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<PharmacyItem | null>(null)
  const [movementItem, setMovementItem] = useState<PharmacyItem | null>(null)
  const [form, setForm] = useState<PharmacyForm>(emptyForm)
  const [movementType, setMovementType] = useState<MovementType>('Recepție')
  const [movementQuantity, setMovementQuantity] = useState('')
  const [movementNote, setMovementNote] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [movementError, setMovementError] = useState('')

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return items
      .filter((item) => {
        const status = getStockStatus(item, today)
        if (stockFilter === 'Stoc redus') return item.quantity <= item.minimumQuantity
        if (stockFilter === 'Expiră în 90 zile') {
          const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate, today)
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 90
        }
        if (stockFilter === 'Expirate') return status === 'Expirat'
        return true
      })
      .filter((item) =>
        !normalizedQuery
        || `${item.name} ${item.activeIngredient} ${item.form} ${item.strength} ${item.lotNumber} ${item.location} ${item.supplier}`
          .toLocaleLowerCase('ro')
          .includes(normalizedQuery),
      )
      .sort((first, second) => first.expiryDate.localeCompare(second.expiryDate))
  }, [items, query, stockFilter, today])

  const lowStockCount = items.filter((item) => item.quantity <= item.minimumQuantity).length
  const expiringCount = items.filter((item) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate, today)
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 90
  }).length
  const expiredCount = items.filter((item) => getStockStatus(item, today) === 'Expirat').length
  const productCount = new Set(items.map((item) => item.name.toLocaleLowerCase('ro'))).size

  function openCreateForm() {
    setEditingItem(null)
    setForm(emptyForm())
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(item: PharmacyItem) {
    setEditingItem(item)
    setForm({
      name: item.name,
      activeIngredient: item.activeIngredient,
      form: item.form,
      strength: item.strength,
      lotNumber: item.lotNumber,
      expiryDate: item.expiryDate,
      quantity: String(item.quantity),
      unit: item.unit,
      minimumQuantity: String(item.minimumQuantity),
      location: item.location,
      supplier: item.supplier,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const quantity = Number(form.quantity)
    const minimumQuantity = Number(form.minimumQuantity)
    if (!Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(minimumQuantity) || minimumQuantity < 0) {
      setFormError('Cantitatea și pragul minim trebuie să fie numere întregi pozitive sau zero.')
      return
    }

    const lotNumber = form.lotNumber.trim()
    const lotAlreadyExists = items.some((item) =>
      item.lotNumber.toLocaleLowerCase('ro') === lotNumber.toLocaleLowerCase('ro')
      && item.id !== editingItem?.id,
    )
    if (lotAlreadyExists) {
      setFormError('Există deja un produs cu acest număr de lot.')
      return
    }

    const savedItem: PharmacyItem = {
      ...form,
      id: editingItem?.id ?? `lot-${crypto.randomUUID()}`,
      name: form.name.trim(),
      activeIngredient: form.activeIngredient.trim(),
      form: form.form.trim(),
      strength: form.strength.trim(),
      lotNumber,
      expiryDate: form.expiryDate,
      quantity,
      unit: form.unit.trim(),
      minimumQuantity,
      location: form.location.trim(),
      supplier: form.supplier.trim(),
    }

    setItems((currentItems) => editingItem
      ? currentItems.map((item) => item.id === savedItem.id ? savedItem : item)
      : [savedItem, ...currentItems])
    setIsFormOpen(false)
    setEditingItem(null)
  }

  function openMovementForm(item: PharmacyItem) {
    setMovementItem(item)
    setMovementType('Recepție')
    setMovementQuantity('')
    setMovementNote('')
    setMovementError('')
  }

  function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!movementItem) return

    const quantity = Number(movementQuantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMovementError('Introdu o cantitate întreagă mai mare decât zero.')
      return
    }
    if (movementType === 'Consum' && quantity > movementItem.quantity) {
      setMovementError('Cantitatea consumată nu poate depăși stocul disponibil.')
      return
    }

    const updatedQuantity = movementType === 'Recepție'
      ? movementItem.quantity + quantity
      : movementItem.quantity - quantity
    setItems((currentItems) => currentItems.map((item) =>
      item.id === movementItem.id ? { ...item, quantity: updatedQuantity } : item,
    ))
    setMovements((currentMovements) => [{
      id: `movement-${crypto.randomUUID()}`,
      itemName: movementItem.name,
      lotNumber: movementItem.lotNumber,
      type: movementType,
      quantity,
      unit: movementItem.unit,
      date: today,
      note: movementNote.trim() || (movementType === 'Recepție' ? 'Recepție stoc' : 'Consum intern'),
    }, ...currentMovements].slice(0, 6))
    setMovementItem(null)
  }

  function handleDelete() {
    if (!itemToDelete) return
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemToDelete.id))
    setItemToDelete(null)
  }

  return (
    <section className="pharmacy-directory" aria-label="Gestiunea farmaciei">
      <div className="pharmacy-demo-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>Prototip demonstrativ: modificările sunt temporare și nu se salvează în baza de date.</p>
      </div>

      <div className="pharmacy-summary">
        <article className="dashboard-card pharmacy-summary-card">
          <span className="pharmacy-summary-icon">▣</span>
          <span><strong>{productCount}</strong><small>Produse în catalog</small></span>
        </article>
        <article className="dashboard-card pharmacy-summary-card">
          <span className="pharmacy-summary-icon summary-amber">◷</span>
          <span><strong>{lowStockCount}</strong><small>Loturi cu stoc redus</small></span>
        </article>
        <article className="dashboard-card pharmacy-summary-card">
          <span className="pharmacy-summary-icon summary-blue">⌛</span>
          <span><strong>{expiringCount}</strong><small>Expiră în 90 de zile</small></span>
        </article>
        <article className="dashboard-card pharmacy-summary-card">
          <span className="pharmacy-summary-icon summary-rose">!</span>
          <span><strong>{expiredCount}</strong><small>Loturi expirate</small></span>
        </article>
      </div>

      <div className="dashboard-card pharmacy-inventory-card">
        <div className="pharmacy-list-heading">
          <div>
            <h2>Stoc farmaceutic</h2>
            <p>Urmărește produsele, loturile și datele de expirare.</p>
          </div>
          <button className="primary-action pharmacy-add-button" type="button" onClick={openCreateForm}>
            <span aria-hidden="true">＋</span> Adaugă medicament
          </button>
        </div>

        <div className="pharmacy-toolbar">
          <div className="pharmacy-result-count">{filteredItems.length} loturi afișate</div>
          <label className="pharmacy-filter">
            <span className="visually-hidden">Filtrează stocul</span>
            <select value={stockFilter} onChange={(event) => {
              if (isStockFilter(event.target.value)) setStockFilter(event.target.value)
            }}>
              <option>Toate loturile</option>
              <option>Stoc redus</option>
              <option>Expiră în 90 zile</option>
              <option>Expirate</option>
            </select>
          </label>
        </div>

        <div className="pharmacy-table-scroll">
          <table className="pharmacy-table">
            <thead>
              <tr>
                <th>MEDICAMENT</th>
                <th>LOT / EXPIRARE</th>
                <th>STOC</th>
                <th>LOCAȚIE</th>
                <th>STATUS</th>
                <th><span className="visually-hidden">Acțiuni</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item, today)
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="pharmacy-product-cell">
                        <span className="pharmacy-product-icon" aria-hidden="true">✚</span>
                        <span>
                          <strong>{item.name} <small>{item.strength}</small></strong>
                          <span>{item.activeIngredient} · {item.form}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="pharmacy-lot-cell">
                        <strong>{item.lotNumber}</strong>
                        <small>Expiră {formatExpiryDate(item.expiryDate)}</small>
                      </span>
                    </td>
                    <td>
                      <span className={`pharmacy-quantity${item.quantity <= item.minimumQuantity ? ' is-low' : ''}`}>
                        <strong>{item.quantity}</strong> {item.unit}
                      </span>
                      <small className="pharmacy-minimum">Minim: {item.minimumQuantity} {item.unit}</small>
                    </td>
                    <td>
                      <span className="pharmacy-location">{item.location}</span>
                      <small className="pharmacy-supplier">{item.supplier}</small>
                    </td>
                    <td><span className={`pharmacy-status pharmacy-status-${getStockStatusClass(status)}`}><i />{status}</span></td>
                    <td>
                      <span className="pharmacy-row-actions">
                        <button type="button" onClick={() => openMovementForm(item)}>Stoc</button>
                        <button type="button" onClick={() => openEditForm(item)} aria-label={`Editează ${item.name}, lot ${item.lotNumber}`}>Editează</button>
                        <button type="button" className="pharmacy-delete-action" onClick={() => setItemToDelete(item)} aria-label={`Șterge ${item.name}, lot ${item.lotNumber}`}>Șterge</button>
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filteredItems.length === 0 && (
                <tr><td className="pharmacy-empty-results" colSpan={6}>Nu există loturi pentru filtrele selectate.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="dashboard-card pharmacy-movements-card" aria-label="Ultimele mișcări de stoc">
        <div className="pharmacy-movements-heading">
          <div>
            <h2>Mișcări recente de stoc</h2>
            <p>Recepții și consumuri înregistrate în prototip.</p>
          </div>
          <span className="pharmacy-movement-count">{movements.length} operații</span>
        </div>
        <div className="pharmacy-movements-list">
          {movements.map((movement) => (
            <article className="pharmacy-movement-row" key={movement.id}>
              <span className={`pharmacy-movement-icon${movement.type === 'Recepție' ? ' is-incoming' : ' is-outgoing'}`} aria-hidden="true">
                {movement.type === 'Recepție' ? '↓' : '↑'}
              </span>
              <span className="pharmacy-movement-product">
                <strong>{movement.itemName}</strong>
                <small>Lot {movement.lotNumber} · {movement.note}</small>
              </span>
              <span className={`pharmacy-movement-quantity${movement.type === 'Recepție' ? ' is-incoming' : ' is-outgoing'}`}>
                {movement.type === 'Recepție' ? '+' : '−'}{movement.quantity} {movement.unit}
              </span>
              <time dateTime={movement.date}>{formatMovementDate(movement.date)}</time>
            </article>
          ))}
        </div>
      </section>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false)
        }}>
          <section className="patient-modal pharmacy-modal" role="dialog" aria-modal="true" aria-labelledby="pharmacy-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="pharmacy-form-title">{editingItem ? 'Editează lotul' : 'Adaugă medicament'}</h2>
                <p>Completează detaliile produsului și ale lotului.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pharmacy-form-grid">
                <label className="patient-form-field">
                  Denumire
                  <input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Substanță activă
                  <input required maxLength={120} value={form.activeIngredient} onChange={(event) => setForm({ ...form, activeIngredient: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Formă farmaceutică
                  <input required maxLength={80} placeholder="ex. Comprimate" value={form.form} onChange={(event) => setForm({ ...form, form: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Concentrație / prezentare
                  <input required maxLength={50} placeholder="ex. 500 mg" value={form.strength} onChange={(event) => setForm({ ...form, strength: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Număr lot
                  <input required maxLength={50} value={form.lotNumber} onChange={(event) => setForm({ ...form, lotNumber: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Data expirării
                  <input required type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Cantitate
                  <input required type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Unitate
                  <input required maxLength={30} placeholder="ex. cutii" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Prag minim
                  <input required type="number" min="0" step="1" value={form.minimumQuantity} onChange={(event) => setForm({ ...form, minimumQuantity: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Locație în depozit
                  <input required maxLength={80} placeholder="ex. Raft A · 01" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                </label>
                <label className="patient-form-field pharmacy-form-wide">
                  Furnizor
                  <input required maxLength={100} value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
                </label>
              </div>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingItem ? 'Salvează modificările' : 'Adaugă lotul'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {movementItem && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMovementItem(null)
        }}>
          <section className="patient-modal pharmacy-modal pharmacy-movement-modal" role="dialog" aria-modal="true" aria-labelledby="pharmacy-movement-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="pharmacy-movement-title">Mișcare de stoc</h2>
                <p>{movementItem.name} · Lot {movementItem.lotNumber} · disponibil: {movementItem.quantity} {movementItem.unit}</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setMovementItem(null)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleMovementSubmit}>
              <label className="patient-form-field">
                Tip operație
                <select value={movementType} onChange={(event) => {
                  if (event.target.value === 'Recepție' || event.target.value === 'Consum') {
                    setMovementType(event.target.value)
                    setMovementError('')
                  }
                }}>
                  <option value="Recepție">Recepție stoc</option>
                  <option value="Consum">Consum / ieșire</option>
                </select>
              </label>
              <label className="patient-form-field">
                Cantitate ({movementItem.unit})
                <input required type="number" min="1" step="1" value={movementQuantity} onChange={(event) => setMovementQuantity(event.target.value)} />
              </label>
              <label className="patient-form-field">
                Notă
                <input maxLength={100} placeholder={movementType === 'Recepție' ? 'ex. Recepție furnizor' : 'ex. Consum intern'} value={movementNote} onChange={(event) => setMovementNote(event.target.value)} />
              </label>
              {movementError && <p className="patient-form-error" role="alert">{movementError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setMovementItem(null)}>Anulează</button>
                <button className="primary-action" type="submit">Înregistrează {movementType.toLocaleLowerCase('ro')}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {itemToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setItemToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="pharmacy-delete-title">
            <h2 id="pharmacy-delete-title">Ștergi lotul?</h2>
            <p><strong>{itemToDelete.name}</strong>, lotul {itemToDelete.lotNumber}, va fi eliminat din lista demonstrativă.</p>
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setItemToDelete(null)}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={handleDelete}>Șterge lotul</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
