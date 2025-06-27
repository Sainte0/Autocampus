import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export async function GET() {
  try {
    console.log('Intentando conectar a MongoDB...');
    await connectDB();
    console.log('Conexión exitosa a MongoDB');
    
    // Contar usuarios
    const userCount = await User.countDocuments();
    console.log(`Número de usuarios en la base de datos: ${userCount}`);
    
    // Buscar usuarios admin
    const adminUsers = await User.find({ role: 'admin' }).select('username email role isActive');
    console.log('Usuarios admin encontrados:', adminUsers);
    
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa',
      userCount,
      adminUsers,
      mongoUri: process.env.MONGODB_URI ? 'Configurada' : 'No configurada',
      jwtSecret: process.env.JWT_SECRET ? 'Configurada' : 'No configurada'
    });
  } catch (error) {
    console.error('Error de conexión:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      mongoUri: process.env.MONGODB_URI ? 'Configurada' : 'No configurada',
      jwtSecret: process.env.JWT_SECRET ? 'Configurada' : 'No configurada'
    }, { status: 500 });
  }
} 