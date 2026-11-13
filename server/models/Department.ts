import { model, Schema, Types } from 'mongoose'

export type DepartmentStatus = 'Activ' | 'Program limitat' | 'În amenajare'

export type DepartmentAccount = {
  owner: Types.ObjectId
  name: string
  normalizedName: string
  description: string
  location: string
  schedule: string
  doctorCount: number
  appointmentCount: number
  status: DepartmentStatus
  doctors: string[]
  createdAt: Date
  updatedAt: Date
}

const departmentSchema = new Schema<DepartmentAccount>(
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
      maxlength: 80,
    },
    normalizedName: {
      type: String,
      required: true,
      select: false,
      maxlength: 80,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    schedule: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    doctorCount: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
      validate: Number.isInteger,
    },
    appointmentCount: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
      validate: Number.isInteger,
    },
    status: {
      type: String,
      required: true,
      enum: ['Activ', 'Program limitat', 'În amenajare'],
      default: 'Activ',
    },
    doctors: {
      type: [String],
      default: [],
      validate: {
        validator: (doctors: string[]) => doctors.every((doctor) => doctor.length <= 100),
        message: 'Numele fiecărui medic poate avea cel mult 100 de caractere.',
      },
    },
  },
  {
    timestamps: true,
  },
)

departmentSchema.index({ owner: 1, normalizedName: 1 }, { unique: true })

export const Department = model<DepartmentAccount>('Department', departmentSchema)
