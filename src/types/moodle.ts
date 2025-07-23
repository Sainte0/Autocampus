export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  summary: string;
  categoryid: number;
}

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  fullname?: string;
  suspended?: boolean;
  lastaccess?: number; // Timestamp del último acceso
  enrolments?: Array<{
    id: number;
    courseid: number;
    roleid: number;
    suspended: boolean;
    timestart: number;
    timeend: number;
  }>;
}

export interface CreateUserRequest {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface EnrollUserRequest {
  username: string;
  courseid: number;
  roleid?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 