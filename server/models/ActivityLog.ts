import { model, Schema, Types } from 'mongoose'

export type ActivityAction = 'create' | 'update' | 'delete'
export type ActivityEntity = 'patient' | 'doctor' | 'appointment' | 'department'

export type ActivityLogEntry = {
  owner: Types.ObjectId
  actor: Types.ObjectId
  action: ActivityAction
  entity: ActivityEntity
  entityId: string
  createdAt: Date
}

const activityLogSchema = new Schema<ActivityLogEntry>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
      immutable: true,
    },
    entity: {
      type: String,
      enum: ['patient', 'doctor', 'appointment', 'department'],
      required: true,
      immutable: true,
    },
    entityId: {
      type: String,
      required: true,
      maxlength: 24,
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

activityLogSchema.index({ owner: 1, createdAt: -1 })

export const ActivityLog = model<ActivityLogEntry>('ActivityLog', activityLogSchema)
