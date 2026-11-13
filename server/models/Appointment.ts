import { model, Schema, Types } from 'mongoose'

export type AppointmentStatus = 'Confirmată' | 'În așteptare' | 'Anulată'
export type AppointmentType = 'Consultație' | 'Control' | 'Investigație'

export type AppointmentAccount = {
  owner: Types.ObjectId
  patientId: Types.ObjectId
  patientName: string
  patientAge: number
  doctorId: Types.ObjectId
  doctorName: string
  specialty: string
  date: string
  time: string
  type: AppointmentType
  status: AppointmentStatus
  createdAt: Date
  updatedAt: Date
}

const appointmentSchema = new Schema<AppointmentAccount>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    patientAge: {
      type: Number,
      required: true,
      min: 0,
      max: 125,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    type: {
      type: String,
      required: true,
      enum: ['Consultație', 'Control', 'Investigație'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Confirmată', 'În așteptare', 'Anulată'],
    },
  },
  {
    timestamps: true,
  },
)

appointmentSchema.index({ owner: 1, date: 1, time: 1 })
appointmentSchema.index({ owner: 1, doctorId: 1, date: 1, time: 1 })

export const Appointment = model<AppointmentAccount>('Appointment', appointmentSchema)
