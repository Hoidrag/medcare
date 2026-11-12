import 'dotenv/config'
import bcrypt from 'bcryptjs'
import MongoStore from 'connect-mongo'
import express, { type ErrorRequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import session from 'express-session'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { Doctor, type DoctorAccount, type DoctorStatus } from './models/Doctor.js'
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
const doctorsRouter = express.Router()

type DoctorInput = Pick<DoctorAccount, 'name' | 'specialty' | 'department' | 'experience' | 'schedule' | 'status'>

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

function getRequestUserId(request: express.Request, response: express.Response): string | null {
  const userId = request.session.userId
  if (userId) return userId

  response.status(401).json({ message: 'Autentifică-te pentru a gestiona medicii.' })
  return null
}

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
