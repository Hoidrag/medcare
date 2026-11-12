import { model, Schema, Types } from 'mongoose'

export type DoctorStatus = 'Disponibil' | 'În consultație' | 'Indisponibil'

export type DoctorAccount = {
  owner: Types.ObjectId
  name: string
  normalizedName: string
  specialty: string
  department: string
  experience: number
  schedule: string
  status: DoctorStatus
  appointments: number
  createdAt: Date
  updatedAt: Date
}

const doctorSchema = new Schema<DoctorAccount>(
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
      maxlength: 100,
    },
    normalizedName: {
      type: String,
      required: true,
      select: false,
      maxlength: 100,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
      validate: Number.isInteger,
    },
    schedule: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    status: {
      type: String,
      required: true,
      enum: ['Disponibil', 'În consultație', 'Indisponibil'],
      default: 'Disponibil',
    },
    appointments: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

doctorSchema.index({ owner: 1, normalizedName: 1 }, { unique: true })

export const Doctor = model<DoctorAccount>('Doctor', doctorSchema)
