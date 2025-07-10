'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  fullname: string;
  suspended?: boolean;
}

interface UserStateContextType {
  userStates: Map<number, boolean>; // userId -> suspended state (global)
  courseUserStates: Map<string, boolean>; // "courseId:userId" -> suspended state (course)
  updateUserState: (userId: number, suspended: boolean) => void;
  updateCourseUserState: (courseId: number, userId: number, suspended: boolean) => void;
  getUserState: (userId: number) => boolean | undefined;
  getCourseUserState: (courseId: number, userId: number) => boolean | undefined;
  clearUserStates: () => void;
  clearCourseUserStates: () => void;
  // Nuevas funciones para sincronización automática
  syncUserStates: (users: User[]) => void;
  syncCourseUserStates: (courseId: number, users: User[]) => void;
  getSyncedUsers: (users: User[]) => User[];
  getSyncedCourseUsers: (courseId: number, users: User[]) => User[];
}

const UserStateContext = createContext<UserStateContextType | undefined>(undefined);

export function UserStateProvider({ children }: { children: React.ReactNode }) {
  const [userStates, setUserStates] = useState<Map<number, boolean>>(new Map());
  const [courseUserStates, setCourseUserStates] = useState<Map<string, boolean>>(new Map());

  const updateUserState = useCallback((userId: number, suspended: boolean) => {
    setUserStates(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, suspended);
      console.log(`Estado global de usuario ${userId} actualizado a: ${suspended ? 'suspendido' : 'activo'}`);
      return newMap;
    });
  }, []);

  const updateCourseUserState = useCallback((courseId: number, userId: number, suspended: boolean) => {
    setCourseUserStates(prev => {
      const newMap = new Map(prev);
      const key = `${courseId}:${userId}`;
      newMap.set(key, suspended);
      console.log(`Estado de usuario ${userId} en curso ${courseId} actualizado a: ${suspended ? 'suspendido' : 'activo'}`);
      return newMap;
    });
  }, []);

  const getUserState = useCallback((userId: number) => {
    return userStates.get(userId);
  }, [userStates]); // Remover lastUpdate para evitar recreaciones

  const getCourseUserState = useCallback((courseId: number, userId: number) => {
    const key = `${courseId}:${userId}`;
    return courseUserStates.get(key);
  }, [courseUserStates]); // Remover lastUpdate para evitar recreaciones

  const clearUserStates = useCallback(() => {
    setUserStates(new Map());
  }, []);

  const clearCourseUserStates = useCallback(() => {
    setCourseUserStates(new Map());
  }, []);

  // Función para sincronizar usuarios con el contexto (global)
  const syncUserStates = useCallback((users: User[]) => {
    setUserStates(prev => {
      const newMap = new Map(prev);
      users.forEach(user => {
        if (user.suspended !== undefined) {
          newMap.set(user.id, user.suspended);
        }
      });
      return newMap;
    });
  }, []);

  // Función para sincronizar usuarios del curso con el contexto
  const syncCourseUserStates = useCallback((courseId: number, users: User[]) => {
    setCourseUserStates(prev => {
      const newMap = new Map(prev);
      users.forEach(user => {
        if (user.suspended !== undefined) {
          const key = `${courseId}:${user.id}`;
          newMap.set(key, user.suspended);
        }
      });
      return newMap;
    });
  }, []);

  // Función para obtener usuarios con estado sincronizado (global)
  const getSyncedUsers = useCallback((users: User[]) => {
    return users.map(user => {
      const contextSuspended = userStates.get(user.id);
      const suspended = contextSuspended !== undefined ? contextSuspended : user.suspended;
      return { ...user, suspended };
    });
  }, [userStates]); // Remover lastUpdate para evitar recreaciones

  // Función para obtener usuarios del curso con estado sincronizado
  const getSyncedCourseUsers = useCallback((courseId: number, users: User[]) => {
    return users.map(user => {
      const contextSuspended = courseUserStates.get(`${courseId}:${user.id}`);
      const suspended = contextSuspended !== undefined ? contextSuspended : user.suspended;
      return { ...user, suspended };
    });
  }, [courseUserStates]); // Remover lastUpdate para evitar recreaciones

  return (
    <UserStateContext.Provider value={{
      userStates,
      courseUserStates,
      updateUserState,
      updateCourseUserState,
      getUserState,
      getCourseUserState,
      clearUserStates,
      clearCourseUserStates,
      syncUserStates,
      syncCourseUserStates,
      getSyncedUsers,
      getSyncedCourseUsers
    }}>
      {children}
    </UserStateContext.Provider>
  );
}

export function useUserState() {
  const context = useContext(UserStateContext);
  if (context === undefined) {
    throw new Error('useUserState must be used within a UserStateProvider');
  }
  return context;
} 