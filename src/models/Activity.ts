import mongoose, { Document } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  userUsername: string;
  userFullName: string;
  action: 'create_student' | 'enroll_student' | 'update_student' | 'delete_student' | 'unenroll_student';
  details: Record<string, unknown>;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new mongoose.Schema<IActivity>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userUsername: {
    type: String,
    required: true
  },
  userFullName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create_student', 'enroll_student', 'update_student', 'delete_student', 'unenroll_student']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'pending'],
    default: 'success'
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true,
  strict: false,
});

// Index for better query performance
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ status: 1, createdAt: -1 });

// Add pre-save middleware for debugging
activitySchema.pre('save', function(next) {
  console.log('Pre-save middleware - Document data:', JSON.stringify(this.toObject(), null, 2));
  next();
});

// Force model recreation
const ActivityModel = mongoose.models.Activity || mongoose.model<IActivity>('Activity', activitySchema);

export default ActivityModel; 