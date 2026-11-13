import 'dotenv/config'
import bcrypt from 'bcryptjs'
import MongoStore from 'connect-mongo'
import express, { type ErrorRequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import session from 'express-session'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { Appointment, type AppointmentStatus, type AppointmentType } from './models/Appointment.js'
import { Doctor, type DoctorAccount, type DoctorStatus } from './models/Doctor.js'
import { Patient, type PatientAccount, type PatientStatus } from './models/Patient.js'
import { User } from './models/User.js'

const sessionSecret = process.env.SESSION_SECRET
const mongoUri = process.env.MONGODB_URI
const port = Number(process.env.PORT ?? 3001)
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const isProduction = process.env.NODE_ENV === 'production'
const sessionLifetimeMs = 8 * 60 * 60 * 1000

if (!mongoUri) {
  throw new Error('Lipsește MONGODB_URI. Copiază .env.example în .env și configurează conexiunea MongoDB.')
}

const configuredMongoUri = mongoUri

if (!sessionSecret || sessionSecret.length < 32 || sessionSecret.includes('înlocuiește-cu-')) {
  throw new Error('SESSION_SECRET trebuie să fie un secret aleator de cel puțin 32 de caractere.')
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT trebuie să fie un număr valid între 1 și 65535.')
}

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', isProduction ? 1 : false)
app.use(helmet())
app.use(express.json({ limit: '10kb' }))
app.use((request, response, next) => {
  const origin = request.get('origin')

  if (origin && origin !== clientOrigin) {
    response.status(403).json({ message: 'Originea solicitării nu este permisă.' })
    return
  }

  next()
})

app.get('/api/health', (_request, response) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1
  response.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? 'ok' : 'unavailable',
    database: isDatabaseConnected ? 'connected' : 'disconnected',
  })
})

app.use('/api/auth', (_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'Baza de date nu este conectată. Verifică MongoDB Atlas și încearcă din nou.' })
    return
  }

  next()
})

app.use(
  session({
    name: 'medcare.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: configuredMongoUri,
      collectionName: 'sessions',
      ttl: sessionLifetimeMs / 1000,
    }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: sessionLifetimeMs,
    },
  }),
)

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Prea multe încercări. Încearcă din nou peste 15 minute.' },
})

function formatMongoError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Eroare necunoscută'
  }

  return error.name
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function publicUser(user: { _id: { toString: () => string }; name: string; email: string }) {
  return { id: user._id.toString(), name: user.name, email: user.email }
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isDuplicateKeyError(error: unknown): boolean {
  return isRecord(error) && error.code === 11000
}

function regenerateSession(request: express.Request) {
  return new Promise<void>((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

const authRouter = express.Router()
const appointmentsRouter = express.Router()
const doctorsRouter = express.Router()
const patientsRouter = express.Router()

type AppointmentInput = {
  patientId: string
  doctorId: string
  date: string
  time: string
  type: AppointmentType
  status: AppointmentStatus
}
type DoctorInput = Pick<DoctorAccount, 'name' | 'specialty' | 'department' | 'experience' | 'schedule' | 'status'>
type PatientInput = Pick<PatientAccount, 'name' | 'age' | 'phone' | 'email' | 'lastVisit' | 'status'>

function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return value === 'Confirmată' || value === 'În așteptare' || value === 'Anulată'
}

function isAppointmentType(value: unknown): value is AppointmentType {
  return value === 'Consultație' || value === 'Control' || value === 'Investigație'
}

function parseAppointmentInput(value: unknown): AppointmentInput | null {
  if (!isRecord(value)) return null

  const { patientId, doctorId, date, time, type, status } = value
  if (
    typeof patientId !== 'string'
    || !mongoose.isValidObjectId(patientId)
    || typeof doctorId !== 'string'
    || !mongoose.isValidObjectId(doctorId)
    || typeof date !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || typeof time !== 'string'
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    || !isAppointmentType(type)
    || !isAppointmentStatus(status)
  ) {
    return null
  }

  const parsedDate = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return null
  }

  return { patientId, doctorId, date, time, type, status }
}

function publicAppointment(appointment: {
  _id: { toString: () => string }
  patientId: { toString: () => string }
  patientName: string
  patientAge: number
  doctorId: { toString: () => string }
  doctorName: string
  specialty: string
  date: string
  time: string
  type: AppointmentType
  status: AppointmentStatus
}) {
  return {
    id: appointment._id.toString(),
    patientId: appointment.patientId.toString(),
    patient: appointment.patientName,
    age: appointment.patientAge,
    doctorId: appointment.doctorId.toString(),
    doctor: appointment.doctorName,
    specialty: appointment.specialty,
    date: appointment.date,
    time: appointment.time,
    type: appointment.type,
    status: appointment.status,
  }
}

async function resolveAppointmentReferences(ownerId: string, input: AppointmentInput) {
  const [patient, doctor] = await Promise.all([
    Patient.findOne({ _id: input.patientId, owner: ownerId }),
    Doctor.findOne({ _id: input.doctorId, owner: ownerId }),
  ])
  return { patient, doctor }
}

async function hasAppointmentConflict(
  ownerId: string,
  input: AppointmentInput,
  excludedAppointmentId?: string,
) {
  const conflictFilter = {
    owner: ownerId,
    doctorId: input.doctorId,
    date: input.date,
    time: input.time,
    status: { $ne: 'Anulată' },
    ...(excludedAppointmentId ? { _id: { $ne: excludedAppointmentId } } : {}),
  }
  return Appointment.exists(conflictFilter)
}

function isPatientStatus(value: unknown): value is PatientStatus {
  return value === 'Activ' || value === 'Monitorizare' || value === 'Externat'
}

function parsePatientInput(value: unknown): PatientInput | null {
  if (!isRecord(value)) return null

  const { name, age, phone, email, lastVisit, status } = value
  if (
    typeof name !== 'string'
    || typeof age !== 'number'
    || !Number.isInteger(age)
    || typeof phone !== 'string'
    || typeof email !== 'string'
    || typeof lastVisit !== 'string'
    || !isPatientStatus(status)
  ) {
    return null
  }

  const normalizedName = name.trim()
  const normalizedPhone = phone.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedLastVisit = lastVisit.trim()

  if (
    normalizedName.length < 2 || normalizedName.length > 100
    || age < 0 || age > 125
    || normalizedPhone.length > 30
    || normalizedEmail.length > 150
    || (normalizedEmail.length > 0 && !isValidEmail(normalizedEmail))
    || normalizedLastVisit.length > 30
  ) {
    return null
  }

  return {
    name: normalizedName,
    age,
    phone: normalizedPhone,
    email: normalizedEmail,
    lastVisit: normalizedLastVisit,
    status,
  }
}

function isDoctorStatus(value: unknown): value is DoctorStatus {
  return value === 'Disponibil' || value === 'În consultație' || value === 'Indisponibil'
}

function parseDoctorInput(value: unknown): DoctorInput | null {
  if (!isRecord(value)) return null

  const { name, specialty, department, experience, schedule, status } = value
  if (
    typeof name !== 'string'
    || typeof specialty !== 'string'
    || typeof department !== 'string'
    || typeof experience !== 'number'
    || !Number.isInteger(experience)
    || typeof schedule !== 'string'
    || !isDoctorStatus(status)
  ) {
    return null
  }

  const normalizedName = name.trim()
  const normalizedSpecialty = specialty.trim()
  const normalizedDepartment = department.trim()
  const normalizedSchedule = schedule.trim()

  if (
    normalizedName.length < 2 || normalizedName.length > 100
    || normalizedSpecialty.length < 2 || normalizedSpecialty.length > 80
    || normalizedDepartment.length < 2 || normalizedDepartment.length > 80
    || experience < 0 || experience > 60
    || normalizedSchedule.length < 2 || normalizedSchedule.length > 40
  ) {
    return null
  }

  return {
    name: normalizedName,
    specialty: normalizedSpecialty,
    department: normalizedDepartment,
    experience,
    schedule: normalizedSchedule,
    status,
  }
}

function publicDoctor(doctor: {
  _id: { toString: () => string }
  name: string
  specialty: string
  department: string
  experience: number
  schedule: string
  status: DoctorStatus
  appointments: number
}) {
  return {
    id: doctor._id.toString(),
    name: doctor.name,
    specialty: doctor.specialty,
    department: doctor.department,
    experience: doctor.experience,
    schedule: doctor.schedule,
    status: doctor.status,
    appointments: doctor.appointments,
  }
}

function publicPatient(patient: {
  _id: { toString: () => string }
  name: string
  age: number
  phone: string
  email: string
  lastVisit: string
  status: PatientStatus
}) {
  return {
    id: patient._id.toString(),
    name: patient.name,
    age: patient.age,
    phone: patient.phone,
    email: patient.email,
    lastVisit: patient.lastVisit,
    status: patient.status,
  }
}

function getRequestUserId(request: express.Request, response: express.Response): string | null {
  const userId = request.session.userId
  if (userId) return userId

  response.status(401).json({ message: 'Autentifică-te pentru a gestiona medicii.' })
  return null
}

appointmentsRouter.get('/', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const appointments = await Appointment.find({ owner: ownerId }).sort({ date: 1, time: 1 })
  response.json({ appointments: appointments.map(publicAppointment) })
})

appointmentsRouter.post('/', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const appointmentInput = parseAppointmentInput(request.body)
  if (!appointmentInput) {
    response.status(400).json({ message: 'Verifică pacientul, medicul, data, ora, tipul și statusul programării.' })
    return
  }

  const { patient, doctor } = await resolveAppointmentReferences(ownerId, appointmentInput)
  if (!patient || !doctor) {
    response.status(400).json({ message: 'Selectează un pacient și un medic existenți în contul tău.' })
    return
  }

  if (appointmentInput.status !== 'Anulată' && await hasAppointmentConflict(ownerId, appointmentInput)) {
    response.status(409).json({ message: 'Medicul selectat are deja o programare la această dată și oră.' })
    return
  }

  const appointment = await Appointment.create({
    ...appointmentInput,
    owner: ownerId,
    patientName: patient.name,
    patientAge: patient.age,
    doctorName: doctor.name,
    specialty: doctor.specialty,
  })
  response.status(201).json({ appointment: publicAppointment(appointment) })
})

appointmentsRouter.put('/:appointmentId', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const appointmentId = request.params.appointmentId
  if (!mongoose.isValidObjectId(appointmentId)) {
    response.status(400).json({ message: 'Identificatorul programării nu este valid.' })
    return
  }

  const appointmentInput = parseAppointmentInput(request.body)
  if (!appointmentInput) {
    response.status(400).json({ message: 'Verifică pacientul, medicul, data, ora, tipul și statusul programării.' })
    return
  }

  const { patient, doctor } = await resolveAppointmentReferences(ownerId, appointmentInput)
  if (!patient || !doctor) {
    response.status(400).json({ message: 'Selectează un pacient și un medic existenți în contul tău.' })
    return
  }

  if (
    appointmentInput.status !== 'Anulată'
    && await hasAppointmentConflict(ownerId, appointmentInput, appointmentId)
  ) {
    response.status(409).json({ message: 'Medicul selectat are deja o programare la această dată și oră.' })
    return
  }

  const appointment = await Appointment.findOneAndUpdate(
    { _id: appointmentId, owner: ownerId },
    {
      ...appointmentInput,
      patientName: patient.name,
      patientAge: patient.age,
      doctorName: doctor.name,
      specialty: doctor.specialty,
    },
    { new: true, runValidators: true },
  )
  if (!appointment) {
    response.status(404).json({ message: 'Programarea nu a fost găsită în lista ta.' })
    return
  }

  response.json({ appointment: publicAppointment(appointment) })
})

appointmentsRouter.delete('/:appointmentId', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const appointmentId = request.params.appointmentId
  if (!mongoose.isValidObjectId(appointmentId)) {
    response.status(400).json({ message: 'Identificatorul programării nu este valid.' })
    return
  }

  const appointment = await Appointment.findOneAndDelete({ _id: appointmentId, owner: ownerId })
  if (!appointment) {
    response.status(404).json({ message: 'Programarea nu a fost găsită în lista ta.' })
    return
  }

  response.status(204).end()
})

patientsRouter.get('/', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const patients = await Patient.find({ owner: ownerId }).sort({ name: 1 })
  response.json({ patients: patients.map(publicPatient) })
})

patientsRouter.post('/', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const patientInput = parsePatientInput(request.body)
  if (!patientInput) {
    response.status(400).json({ message: 'Verifică numele, vârsta, datele de contact, ultima vizită și statusul pacientului.' })
    return
  }

  const patient = await Patient.create({ ...patientInput, owner: ownerId })
  response.status(201).json({ patient: publicPatient(patient) })
})

patientsRouter.put('/:patientId', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const patientId = request.params.patientId
  if (!mongoose.isValidObjectId(patientId)) {
    response.status(400).json({ message: 'Identificatorul pacientului nu este valid.' })
    return
  }

  const patientInput = parsePatientInput(request.body)
  if (!patientInput) {
    response.status(400).json({ message: 'Verifică numele, vârsta, datele de contact, ultima vizită și statusul pacientului.' })
    return
  }

  const patient = await Patient.findOneAndUpdate(
    { _id: patientId, owner: ownerId },
    patientInput,
    { new: true, runValidators: true },
  )
  if (!patient) {
    response.status(404).json({ message: 'Pacientul nu a fost găsit în lista ta.' })
    return
  }

  response.json({ patient: publicPatient(patient) })
})

patientsRouter.delete('/:patientId', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const patientId = request.params.patientId
  if (!mongoose.isValidObjectId(patientId)) {
    response.status(400).json({ message: 'Identificatorul pacientului nu este valid.' })
    return
  }

  const patient = await Patient.findOneAndDelete({ _id: patientId, owner: ownerId })
  if (!patient) {
    response.status(404).json({ message: 'Pacientul nu a fost găsit în lista ta.' })
    return
  }

  response.status(204).end()
})

doctorsRouter.get('/', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const doctors = await Doctor.find({ owner: ownerId }).sort({ name: 1 })
  response.json({ doctors: doctors.map(publicDoctor) })
})

doctorsRouter.post('/', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const doctorInput = parseDoctorInput(request.body)
  if (!doctorInput) {
    response.status(400).json({ message: 'Verifică numele, specialitatea, departamentul, experiența, programul și disponibilitatea medicului.' })
    return
  }

  try {
    const doctor = await Doctor.create({
      ...doctorInput,
      owner: ownerId,
      normalizedName: doctorInput.name.normalize('NFKC').toLocaleLowerCase('ro'),
    })
    response.status(201).json({ doctor: publicDoctor(doctor) })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      response.status(409).json({ message: 'Există deja un medic cu acest nume în lista ta.' })
      return
    }

    throw error
  }
})

doctorsRouter.put('/:doctorId', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const doctorId = request.params.doctorId
  if (!mongoose.isValidObjectId(doctorId)) {
    response.status(400).json({ message: 'Identificatorul medicului nu este valid.' })
    return
  }

  const doctorInput = parseDoctorInput(request.body)
  if (!doctorInput) {
    response.status(400).json({ message: 'Verifică numele, specialitatea, departamentul, experiența, programul și disponibilitatea medicului.' })
    return
  }

  try {
    const doctor = await Doctor.findOneAndUpdate(
      { _id: doctorId, owner: ownerId },
      {
        ...doctorInput,
        normalizedName: doctorInput.name.normalize('NFKC').toLocaleLowerCase('ro'),
      },
      { new: true, runValidators: true },
    )
    if (!doctor) {
      response.status(404).json({ message: 'Medicul nu a fost găsit în lista ta.' })
      return
    }

    response.json({ doctor: publicDoctor(doctor) })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      response.status(409).json({ message: 'Există deja un medic cu acest nume în lista ta.' })
      return
    }

    throw error
  }
})

doctorsRouter.delete('/:doctorId', async (request, response) => {
  const ownerId = getRequestUserId(request, response)
  if (!ownerId) return

  const doctorId = request.params.doctorId
  if (!mongoose.isValidObjectId(doctorId)) {
    response.status(400).json({ message: 'Identificatorul medicului nu este valid.' })
    return
  }

  const doctor = await Doctor.findOneAndDelete({ _id: doctorId, owner: ownerId })
  if (!doctor) {
    response.status(404).json({ message: 'Medicul nu a fost găsit în lista ta.' })
    return
  }

  response.status(204).end()
})

authRouter.post('/register', authRateLimit, async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ message: 'Completează toate câmpurile obligatorii.' })
    return
  }

  const { name, email, password } = request.body

  if (
    typeof name !== 'string'
    || typeof email !== 'string'
    || typeof password !== 'string'
  ) {
    response.status(400).json({ message: 'Completează toate câmpurile obligatorii.' })
    return
  }

  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedName.length < 2 || normalizedName.length > 80) {
    response.status(400).json({ message: 'Numele trebuie să aibă între 2 și 80 de caractere.' })
    return
  }

  if (!isValidEmail(normalizedEmail)) {
    response.status(400).json({ message: 'Introdu o adresă de e-mail validă.' })
    return
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    response.status(400).json({ message: 'Parola trebuie să aibă cel puțin 8 caractere și maximum 72 de octeți.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  let user

  try {
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      response.status(409).json({ message: 'Există deja un cont asociat acestei adrese de e-mail.' })
      return
    }

    throw error
  }

  await regenerateSession(request)
  request.session.userId = user.id

  response.status(201).json({ user: publicUser(user) })
})

authRouter.post('/login', authRateLimit, async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ message: 'Introdu adresa de e-mail și parola.' })
    return
  }

  const { email, password } = request.body

  if (
    typeof email !== 'string'
    || typeof password !== 'string'
    || !isValidEmail(email.trim())
    || password.length === 0
    || Buffer.byteLength(password, 'utf8') > 72
  ) {
    response.status(400).json({ message: 'Introdu o adresă de e-mail și o parolă valide.' })
    return
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false

  if (!user || !passwordMatches) {
    response.status(401).json({ message: 'Adresa de e-mail sau parola este incorectă.' })
    return
  }

  await regenerateSession(request)
  request.session.userId = user.id

  response.json({ user: publicUser(user) })
})

authRouter.get('/me', async (request, response) => {
  if (!request.session.userId) {
    response.status(401).json({ message: 'Nu există o sesiune activă.' })
    return
  }

  const user = await User.findById(request.session.userId)
  if (!user) {
    request.session.destroy((error) => {
      if (error) {
        console.error('Nu s-a putut șterge sesiunea unui cont inexistent.', error)
      }
    })
    response.status(401).json({ message: 'Sesiunea nu mai este validă. Autentifică-te din nou.' })
    return
  }

  response.json({ user: publicUser(user) })
})

authRouter.post('/logout', (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      next(error)
      return
    }

    response.clearCookie('medcare.sid', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    })
    response.status(204).end()
  })
})

app.use('/api/auth', authRouter)

app.use('/api/doctors', (_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'Baza de date nu este conectată. Verifică MongoDB Atlas și încearcă din nou.' })
    return
  }

  next()
})
app.use('/api/doctors', doctorsRouter)

app.use('/api/patients', (_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'Baza de date nu este conectată. Verifică MongoDB Atlas și încearcă din nou.' })
    return
  }

  next()
})
app.use('/api/patients', patientsRouter)

app.use('/api/appointments', (_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'Baza de date nu este conectată. Verifică MongoDB Atlas și încearcă din nou.' })
    return
  }

  next()
})
app.use('/api/appointments', appointmentsRouter)

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  console.error('Eroare neașteptată în API.', error)

  if (response.headersSent) {
    return
  }

  response.status(500).json({ message: 'A apărut o eroare internă. Încearcă din nou.' })
}

app.use(errorHandler)

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(configuredMongoUri, { serverSelectionTimeoutMS: 10_000 })
    console.log('Conexiunea la MongoDB a fost stabilită.')
  } catch (error) {
    console.error(
      'Conexiunea la MongoDB a eșuat. Verifică Network Access, MONGODB_URI și utilizatorul bazei de date.',
      formatMongoError(error),
    )
    setTimeout(() => {
      void connectToDatabase()
    }, 10_000).unref()
  }
}

app.listen(port, isProduction ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`API MedCare rulează pe http://${isProduction ? '0.0.0.0' : '127.0.0.1'}:${port}`)
})

void connectToDatabase()
