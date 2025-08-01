import mongoose, { Document } from 'mongoose';

export interface IDashboardStats extends Document {
  // Usuarios suspendidos globalmente
  globallySuspendedUsers: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    suspendedAt: Date;
    suspendedBy?: string;
    reason?: string;
  }[];
  
  // Usuarios con múltiples cursos
  usersWithMultipleCourses: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    courseCount: number;
    courses: {
      courseId: number;
      courseName: string;
      courseShortName: string;
    }[];
  }[];
  
  // Usuarios que nunca ingresaron
  neverAccessedUsers: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
    lastAccess?: number;
  }[];
  
  // Usuarios suspendidos por curso
  courseSuspendedUsers: {
    courseId: number;
    courseName: string;
    courseShortName: string;
    suspendedUsers: {
      userId: number;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      suspendedAt: Date;
      suspendedBy?: string;
      reason?: string;
    }[];
  }[];
  
  // Metadatos
  lastSync: Date;
  totalUsers: number;
  totalCourses: number;
  syncStatus: 'pending' | 'in_progress' | 'completed' | 'error';
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dashboardStatsSchema = new mongoose.Schema<IDashboardStats>({
  globallySuspendedUsers: [{
    userId: { type: Number, required: true },
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    suspendedAt: { type: Date, required: true },
    suspendedBy: { type: String },
    reason: { type: String }
  }],
  
  usersWithMultipleCourses: [{
    userId: { type: Number, required: true },
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    courseCount: { type: Number, required: true },
    courses: [{
      courseId: { type: Number, required: true },
      courseName: { type: String, required: true },
      courseShortName: { type: String, required: true }
    }]
  }],
  
  neverAccessedUsers: [{
    userId: { type: Number, required: true },
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, required: true },
    lastAccess: { type: Number }
  }],
  
  courseSuspendedUsers: [{
    courseId: { type: Number, required: true },
    courseName: { type: String, required: true },
    courseShortName: { type: String, required: true },
    suspendedUsers: [{
      userId: { type: Number, required: true },
      username: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      suspendedAt: { type: Date, required: true },
      suspendedBy: { type: String },
      reason: { type: String }
    }]
  }],
  
  lastSync: { type: Date, default: Date.now },
  totalUsers: { type: Number, default: 0 },
  totalCourses: { type: Number, default: 0 },
  syncStatus: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'error'],
    default: 'pending'
  },
  syncError: { type: String }
}, {
  timestamps: true,
});

// Índices para optimizar consultas
dashboardStatsSchema.index({ lastSync: -1 });
dashboardStatsSchema.index({ syncStatus: 1 });
dashboardStatsSchema.index({ 'globallySuspendedUsers.userId': 1 });
dashboardStatsSchema.index({ 'usersWithMultipleCourses.userId': 1 });
dashboardStatsSchema.index({ 'neverAccessedUsers.userId': 1 });
dashboardStatsSchema.index({ 'courseSuspendedUsers.courseId': 1 });

export default mongoose.models.DashboardStats || mongoose.model<IDashboardStats>('DashboardStats', dashboardStatsSchema); 