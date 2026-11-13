import { model, Schema } from 'mongoose'

export type ClinicDayName =
  | 'Luni'
  | 'Marți'
  | 'Miercuri'
  | 'Joi'
  | 'Vineri'
  | 'Sâmbătă'
  | 'Duminică'

export type UserSettings = {
  clinicProfile: {
    name: string
    address: string
    phone: string
    email: string
    logoUrl: string
  }
  workingHours: Array<{
    day: ClinicDayName
    isOpen: boolean
    start: string
    end: string
  }>
  notifications: {
    appointments: boolean
    pharmacy: boolean
    emergencies: boolean
  }
  preferences: {
    theme: 'light' | 'dark'
    language: 'ro'
    dateFormat: 'long' | 'dd.MM.yyyy' | 'dd/MM/yyyy'
  }
}

export type UserAccount = {
  name: string
  email: string
  passwordHash: string
  settings: UserSettings
  createdAt: Date
  updatedAt: Date
}

const clinicProfileSchema = new Schema<UserSettings['clinicProfile']>(
  {
    name: { type: String, default: '', maxlength: 120 },
    address: { type: String, default: '', maxlength: 200 },
    phone: { type: String, default: '', maxlength: 30 },
    email: { type: String, default: '', maxlength: 254 },
    logoUrl: { type: String, default: '', maxlength: 500 },
  },
  { _id: false },
)

const workingHourSchema = new Schema<UserSettings['workingHours'][number]>(
  {
    day: {
      type: String,
      enum: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'],
      required: true,
    },
    isOpen: { type: Boolean, required: true, default: false },
    start: { type: String, default: '' },
    end: { type: String, default: '' },
  },
  { _id: false },
)

const notificationSchema = new Schema<UserSettings['notifications']>(
  {
    appointments: { type: Boolean, default: true },
    pharmacy: { type: Boolean, default: true },
    emergencies: { type: Boolean, default: true },
  },
  { _id: false },
)

const preferencesSchema = new Schema<UserSettings['preferences']>(
  {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, enum: ['ro'], default: 'ro' },
    dateFormat: {
      type: String,
      enum: ['long', 'dd.MM.yyyy', 'dd/MM/yyyy'],
      default: 'long',
    },
  },
  { _id: false },
)

const userSettingsSchema = new Schema<UserSettings>(
  {
    clinicProfile: { type: clinicProfileSchema, default: () => ({}) },
    workingHours: { type: [workingHourSchema], default: [] },
    notifications: { type: notificationSchema, default: () => ({}) },
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { _id: false },
)

const userSchema = new Schema<UserAccount>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    settings: { type: userSettingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  },
)

export const User = model<UserAccount>('User', userSchema)
