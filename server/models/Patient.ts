import { model, Schema, Types } from 'mongoose'

export type PatientStatus = 'Activ' | 'Monitorizare' | 'Externat'

export type PatientAccount = {
  owner: Types.ObjectId
  name: string
  age: number
  phone: string
  email: string
  lastVisit: string
  status: PatientStatus
  createdAt: Date
  updatedAt: Date
}

const patientSchema = new Schema<PatientAccount>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 125,
      validate: Number.isInteger,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 150,
      default: '',
    },
    lastVisit: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['Activ', 'Monitorizare', 'Externat'],
      default: 'Activ',
    },
  },
  {
    timestamps: true,
  },
)

patientSchema.index({ owner: 1, name: 1 })

export const Patient = model<PatientAccount>('Patient', patientSchema)
