'use client';

import { useEffect, useState } from 'react';
import { useUserState } from '../contexts/UserStateContext';

interface UserStateNotificationProps {
  userId: number;
  userName: string;
  isSuspended: boolean;
  isCourseSuspension?: boolean;
  courseId?: number;
}

export function UserStateNotification({ userId, userName, isSuspended, isCourseSuspension, courseId }: UserStateNotificationProps) {
  const { getUserState } = useUserState();
  const [showNotification, setShowNotification] = useState(false);
  const [lastState, setLastState] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const contextState = getUserState(userId);
    
    // Si el estado del contexto es diferente al estado local, mostrar notificación
    if (contextState !== undefined && contextState !== lastState && contextState !== isSuspended) {
      setShowNotification(true);
      setLastState(contextState);
      
      // Ocultar notificación después de 3 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [userId, isSuspended, getUserState, lastState]);

  if (!showNotification) return null;

  const contextState = getUserState(userId);
  const isNowSuspended = contextState !== undefined ? contextState : isSuspended;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-lg">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            Estado actualizado: {userName} ahora está {isNowSuspended ? 'suspendido' : 'activo'}
            {isCourseSuspension && courseId && ` en el curso ${courseId}`}
            {!isCourseSuspension && ' globalmente'}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setShowNotification(false)}
            className="text-blue-500 hover:text-blue-700"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 