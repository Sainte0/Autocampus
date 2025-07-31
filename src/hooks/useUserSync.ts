import { useEffect, useCallback } from 'react';
import { useUserState } from '../contexts/UserStateContext';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  fullname: string;
  suspended?: boolean;
}

export function useUserSync(users: User[]) {
  const { updateUserState, syncUserStates, getSyncedUsers } = useUserState();
  const { token } = useAuth();

  // Función para actualizar el estado global de un usuario
  const updateUserSuspension = useCallback(async (userId: number, currentSuspended: boolean) => {
    try {
      const response = await fetch('/api/users/toggle-suspension', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: userId,
          suspend: !currentSuspended
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Actualizar el estado global inmediatamente
        updateUserState(userId, !currentSuspended);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Error al actualizar el usuario' };
      }
    } catch (err) {
      console.error('Error toggling user suspension:', err);
      return { success: false, error: 'Error al actualizar el usuario' };
    }
  }, [updateUserState, token]);

  // Sincronizar usuarios con el contexto cuando cambian
  useEffect(() => {
    if (users.length > 0) {
      syncUserStates(users);
    }
  }, [users, syncUserStates]);

  return {
    updateUserSuspension,
    getSyncedUsers: useCallback(() => getSyncedUsers(users), [getSyncedUsers, users])
  };
}

// Hook específico para sincronización de usuarios en cursos
export function useCourseUserSync(courseId: number, users: User[]) {
  const { updateCourseUserState, syncCourseUserStates, getSyncedCourseUsers } = useUserState();
  const { token } = useAuth();

  // Función para actualizar el estado de un usuario en el curso
  const updateCourseUserSuspension = useCallback(async (userId: number, currentSuspended: boolean) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/toggle-suspension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: userId,
          suspend: !currentSuspended
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Actualizar el estado del curso inmediatamente
        updateCourseUserState(courseId, userId, !currentSuspended);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Error al actualizar el usuario en el curso' };
      }
    } catch (err) {
      console.error('Error toggling course user suspension:', err);
      return { success: false, error: 'Error al actualizar el usuario en el curso' };
    }
  }, [courseId, updateCourseUserState, token]);

  // Sincronizar usuarios del curso con el contexto cuando cambian
  useEffect(() => {
    if (users.length > 0) {
      syncCourseUserStates(courseId, users);
    }
  }, [courseId, users, syncCourseUserStates]);

  // Función para eliminar un usuario del curso
  const removeUserFromCourse = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/remove-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: userId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Error al eliminar el usuario del curso' };
      }
    } catch (err) {
      console.error('Error removing user from course:', err);
      return { success: false, error: 'Error al eliminar el usuario del curso' };
    }
  }, [courseId, token]);

  return {
    updateCourseUserSuspension,
    removeUserFromCourse,
    getSyncedCourseUsers: useCallback(() => getSyncedCourseUsers(courseId, users), [getSyncedCourseUsers, courseId, users])
  };
} 