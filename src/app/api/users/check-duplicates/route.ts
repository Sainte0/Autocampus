import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/jwt';
import { checkDuplicateName, verifyUser, getUserByField } from '../../../../lib/moodle';
import { MoodleUser } from '../../../../types/moodle';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { username, email, firstname, lastname } = await request.json();

    const results: {
      usernameExists: boolean;
      emailExists: boolean;
      nameExists: boolean;
      existingUsers: MoodleUser[];
      errors: string[];
    } = {
      usernameExists: false,
      emailExists: false,
      nameExists: false,
      existingUsers: [],
      errors: []
    };

    // Verificar si el username ya existe
    if (username) {
      const usernameCheck = await verifyUser(username);
      if (usernameCheck.success && usernameCheck.data && usernameCheck.data.length > 0) {
        results.usernameExists = true;
        results.existingUsers.push(...usernameCheck.data);
        results.errors.push(`El usuario ${username} ya existe en Moodle`);
      }
    }

    // Verificar si el email ya existe
    if (email) {
      const emailCheck = await getUserByField('email', email);
      if (emailCheck.success && emailCheck.data && emailCheck.data.length > 0) {
        results.emailExists = true;
        results.existingUsers.push(...emailCheck.data);
        results.errors.push(`El email ${email} ya está registrado en Moodle`);
      }
    }

    // Verificar si existe un usuario con el mismo nombre completo
    if (firstname && lastname) {
      const nameCheck = await checkDuplicateName(firstname, lastname);
      if (nameCheck.success && nameCheck.data && nameCheck.data.length > 0) {
        results.nameExists = true;
        results.existingUsers.push(...nameCheck.data);
        results.errors.push(`Ya existe un usuario con el nombre ${firstname} ${lastname}`);
      }
    }

    // Eliminar duplicados de existingUsers basado en el ID
    const uniqueUsers = results.existingUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    return NextResponse.json({
      success: true,
      hasDuplicates: results.usernameExists || results.emailExists || results.nameExists,
      results: {
        ...results,
        existingUsers: uniqueUsers
      }
    });
  } catch (error) {
    console.error('Check duplicates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 