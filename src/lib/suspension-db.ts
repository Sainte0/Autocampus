import connectDB from './mongodb';
import SuspensionStatusModel, { ISuspensionStatus } from '../models/SuspensionStatus';

// Función para guardar o actualizar el estado de suspensión en la base de datos
export async function saveSuspensionStatus(
  userId: number, 
  courseId: number, 
  suspended: boolean, 
  performedBy?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    console.log(`Guardando estado de suspensión en BD: Usuario ${userId}, Curso ${courseId}, Suspended: ${suspended}`);
    
    const updateData: Partial<ISuspensionStatus> = {
      userId,
      courseId,
      suspended,
      updatedAt: new Date()
    };

    if (suspended) {
      updateData.suspendedAt = new Date();
      updateData.suspendedBy = performedBy;
      updateData.reason = reason;
      // Limpiar campos de reactivación si existían
      updateData.reactivatedAt = undefined;
      updateData.reactivatedBy = undefined;
    } else {
      updateData.reactivatedAt = new Date();
      updateData.reactivatedBy = performedBy;
      // Limpiar campos de suspensión si existían
      updateData.suspendedAt = undefined;
      updateData.suspendedBy = undefined;
      updateData.reason = undefined;
    }

    const result = await SuspensionStatusModel.findOneAndUpdate(
      { userId, courseId },
      updateData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log(`Estado de suspensión guardado exitosamente en BD:`, result);
    return { success: true };

  } catch (error) {
    console.error('Error guardando estado de suspensión en BD:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al guardar en BD' 
    };
  }
}

// Función para obtener el estado de suspensión desde la base de datos
export async function getSuspensionStatusFromDB(
  userId: number, 
  courseId: number
): Promise<{ suspended: boolean; found: boolean; data?: ISuspensionStatus }> {
  try {
    await connectDB();
    
    console.log(`Consultando estado de suspensión en BD: Usuario ${userId}, Curso ${courseId}`);
    
    const suspensionStatus = await SuspensionStatusModel.findOne({ userId, courseId });
    
    if (suspensionStatus) {
      console.log(`Estado de suspensión encontrado en BD:`, suspensionStatus);
      return { 
        suspended: suspensionStatus.suspended, 
        found: true, 
        data: suspensionStatus 
      };
    } else {
      console.log(`No se encontró estado de suspensión en BD para Usuario ${userId}, Curso ${courseId}`);
      return { suspended: false, found: false };
    }

  } catch (error) {
    console.error('Error consultando estado de suspensión en BD:', error);
    return { suspended: false, found: false };
  }
}

// Función para obtener todos los usuarios suspendidos de un curso desde la base de datos
export async function getSuspendedUsersFromDB(courseId: number): Promise<number[]> {
  try {
    await connectDB();
    
    console.log(`Consultando usuarios suspendidos en BD para curso ${courseId}`);
    
    const suspendedUsers = await SuspensionStatusModel.find({ 
      courseId, 
      suspended: true 
    }).select('userId');
    
    const userIds = suspendedUsers.map(user => user.userId);
    console.log(`Usuarios suspendidos encontrados en BD para curso ${courseId}:`, userIds);
    
    return userIds;

  } catch (error) {
    console.error('Error consultando usuarios suspendidos en BD:', error);
    return [];
  }
}

// Función para obtener todos los estados de suspensión de un curso desde la base de datos
export async function getAllSuspensionStatusFromDB(courseId: number): Promise<ISuspensionStatus[]> {
  try {
    await connectDB();
    
    console.log(`Consultando todos los estados de suspensión en BD para curso ${courseId}`);
    
    const suspensionStatuses = await SuspensionStatusModel.find({ courseId })
      .sort({ updatedAt: -1 }); // Ordenar por fecha de actualización descendente
    
    console.log(`Estados de suspensión encontrados en BD para curso ${courseId}:`, suspensionStatuses.length);
    
    return suspensionStatuses;

  } catch (error) {
    console.error('Error consultando estados de suspensión en BD:', error);
    return [];
  }
}

// Función para eliminar el estado de suspensión de la base de datos
export async function removeSuspensionStatusFromDB(
  userId: number, 
  courseId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    console.log(`Eliminando estado de suspensión de BD: Usuario ${userId}, Curso ${courseId}`);
    
    const result = await SuspensionStatusModel.deleteOne({ userId, courseId });
    
    console.log(`Estado de suspensión eliminado de BD:`, result);
    return { success: true };

  } catch (error) {
    console.error('Error eliminando estado de suspensión de BD:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar de BD' 
    };
  }
} 