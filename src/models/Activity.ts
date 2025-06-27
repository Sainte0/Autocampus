import mongoose from 'mongoose';

export interface IActivity extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userUsername: string;
  action: 'create_student' | 'enroll_student' | 'login' | 'logout';
  details: {
    studentUsername?: string;
    studentName?: string;
    courseId?: number;
    courseName?: string;
    moodleUserId?: number;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activitySchema = new mongoose.Schema<IActivity>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userUsername: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['create_student', 'enroll_student', 'login', 'logout'],
    required: true,
  },
  details: {
    studentUsername: String,
    studentName: String,
    courseId: Number,
    courseName: String,
    moodleUserId: Number,
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Index for better query performance
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', activitySchema); 