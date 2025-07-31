import mongoose, { Document } from 'mongoose';

export interface ISuspensionStatus extends Document {
  userId: number;
  courseId: number;
  suspended: boolean;
  suspendedAt?: Date;
  reactivatedAt?: Date;
  suspendedBy?: string; // Username of who performed the action
  reactivatedBy?: string; // Username of who performed the action
  reason?: string; // Optional reason for suspension
  createdAt: Date;
  updatedAt: Date;
}

const suspensionStatusSchema = new mongoose.Schema<ISuspensionStatus>({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  courseId: {
    type: Number,
    required: true,
    index: true
  },
  suspended: {
    type: Boolean,
    required: true,
    default: false
  },
  suspendedAt: {
    type: Date
  },
  reactivatedAt: {
    type: Date
  },
  suspendedBy: {
    type: String
  },
  reactivatedBy: {
    type: String
  },
  reason: {
    type: String
  }
}, {
  timestamps: true,
  strict: false,
});

// Compound index for efficient queries by userId and courseId
suspensionStatusSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Index for querying by course
suspensionStatusSchema.index({ courseId: 1, suspended: 1 });

// Index for querying by user
suspensionStatusSchema.index({ userId: 1, suspended: 1 });

// Index for recent suspensions
suspensionStatusSchema.index({ suspendedAt: -1 });

// Add pre-save middleware for debugging
suspensionStatusSchema.pre('save', function(next) {
  console.log('SuspensionStatus pre-save middleware - Document data:', JSON.stringify(this.toObject(), null, 2));
  next();
});

// Force model recreation
const SuspensionStatusModel = mongoose.models.SuspensionStatus || mongoose.model<ISuspensionStatus>('SuspensionStatus', suspensionStatusSchema);

export default SuspensionStatusModel; 