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