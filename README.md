# AutoCampus - Sistema de Gestión de Moodle

Una aplicación web completa desarrollada con Next.js que integra con la API de Moodle para gestionar cursos, usuarios y inscripciones, con un sistema de autenticación y seguimiento de actividades.

## Características Principales

### 🔐 Sistema de Autenticación
- **Login de Usuarios**: Acceso para usuarios regulares que pueden crear alumnos e inscribirlos en cursos
- **Login de Administradores**: Panel especial para administradores con gestión completa del sistema
- **JWT Tokens**: Autenticación segura con tokens JWT
- **Roles de Usuario**: Sistema de roles (admin/user) con permisos diferenciados

### 👥 Gestión de Usuarios
- **Creación de Usuarios**: Los administradores pueden crear nuevos usuarios del sistema
- **Gestión de Roles**: Asignación de roles de administrador o usuario regular
- **Estado de Usuarios**: Control de usuarios activos/inactivos

### 🎓 Gestión de Alumnos
- **Creación de Estudiantes**: Crear nuevos estudiantes en Moodle con validación automática
- **Validación de Datos**: Verificación de formato de usuario, email y contraseña
- **Integración con Moodle**: Creación directa en la plataforma Moodle

### 📚 Gestión de Cursos
- **Visualización de Cursos**: Lista de todos los cursos disponibles en Moodle
- **Inscripción de Estudiantes**: Inscribir estudiantes en cursos específicos
- **Búsqueda de Usuarios**: Verificar si un estudiante ya existe en el sistema

### 📊 Registro de Actividades
- **Seguimiento Completo**: Registro de todas las acciones realizadas en el sistema
- **Filtros Avanzados**: Búsqueda por tipo de acción, usuario, fechas
- **Detalles de Actividad**: Información detallada de cada acción (IP, navegador, etc.)

## Tecnologías Utilizadas

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT, bcryptjs
- **Integración**: Moodle REST API

## API Endpoints de Moodle Utilizados

- `core_course_get_courses`: Obtener cursos disponibles
- `core_user_get_users_by_field`: Verificar usuarios existentes
- `core_user_create_users`: Crear nuevos estudiantes
- `enrol_manual_enrol_users`: Inscribir estudiantes en cursos

## Configuración Inicial

### Prerrequisitos

- Node.js 18.x o superior
- npm o yarn
- Cuenta de MongoDB Atlas
- Token de API de Moodle

### Instalación

1. **Clonar el repositorio**:
```bash
git clone [tu-repositorio]
cd autocampus
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
Crear un archivo `.env.local` en la raíz del proyecto:
```env
# Moodle API
NEXT_PUBLIC_MOODLE_API_URL=https://campus.asd.edu.ar/webservice/rest/server.php
NEXT_PUBLIC_MOODLE_TOKEN=tu_token_de_moodle

# MongoDB
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/autocampus

# JWT (opcional, se genera automáticamente)
JWT_SECRET=tu_clave_secreta_jwt
```

4. **Crear el usuario administrador inicial**:
```bash
node scripts/create-admin.js
```

5. **Ejecutar el servidor de desarrollo**:
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
autocampus/
├── src/
│   ├── app/
│   │   ├── admin/           # Panel de administración
│   │   │   ├── login/       # Login de administradores
│   │   │   ├── users/       # Gestión de usuarios
│   │   │   └── activities/  # Registro de actividades
│   │   ├── api/             # API Routes
│   │   │   ├── auth/        # Autenticación
│   │   │   ├── users/       # Gestión de usuarios
│   │   │   └── activities/  # Registro de actividades
│   │   ├── courses/         # Gestión de cursos
│   │   ├── students/        # Gestión de alumnos
│   │   └── login/           # Login de usuarios
│   ├── components/          # Componentes React
│   ├── contexts/            # Contextos (AuthContext)
│   ├── lib/                 # Utilidades y configuración
│   ├── models/              # Modelos de MongoDB
│   └── types/               # Tipos TypeScript
├── scripts/                 # Scripts de utilidad
└── public/                  # Archivos estáticos
```

## Uso del Sistema

### Acceso de Usuario Regular
1. Ir a `/login`
2. Iniciar sesión con credenciales de usuario
3. Acceder a gestión de alumnos y cursos
4. Crear estudiantes e inscribirlos en cursos

### Acceso de Administrador
1. Ir a `/admin/login`
2. Iniciar sesión con credenciales de administrador
3. Gestionar usuarios del sistema
4. Ver registro de actividades
5. Crear nuevos usuarios

### Credenciales por Defecto
- **Usuario**: admin
- **Contraseña**: Admin123!
- **Email**: admin@autocampus.com

## Seguridad

- **Contraseñas**: Hasheadas con bcrypt
- **Tokens JWT**: Para autenticación de sesiones
- **Validación**: Validación de datos en frontend y backend
- **Autorización**: Control de acceso basado en roles
- **Logs**: Registro completo de actividades para auditoría

## Características de Seguridad de Moodle

- **Contraseñas Complejas**: Requiere mínimo 8 caracteres con mayúscula, minúscula, número y símbolo
- **Formato de Usuario**: Debe incluir punto (ej: nombre.apellido)
- **Validación de Email**: Formato de email válido requerido
- **Integración Segura**: Comunicación segura con la API de Moodle

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Soporte

Para soporte técnico o preguntas sobre el sistema, contactar al equipo de desarrollo.

## Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/autocampus

# JWT Configuration (generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=tu_jwt_secret_super_seguro_de_al_menos_64_caracteres

# Moodle API Configuration
NEXT_PUBLIC_MOODLE_API_URL=https://campus.asd.edu.ar/webservice/rest/server.php
NEXT_PUBLIC_MOODLE_TOKEN=tu_token_de_moodle_webservice
```

### Generación del JWT_SECRET

Para generar un JWT_SECRET seguro, ejecuta este comando en tu terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Variables de Entorno para Vercel

Cuando despliegues en Vercel, asegúrate de configurar estas mismas variables en el dashboard de Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor correspondiente 