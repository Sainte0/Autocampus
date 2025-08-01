# Dashboard de Estadísticas - AutoCampus

## Descripción

El Dashboard de Estadísticas es una herramienta administrativa que proporciona información detallada sobre el estado de los usuarios en Moodle. Los datos se obtienen desde Moodle y se almacenan en la base de datos local para un acceso más rápido.

## Características

### 4 Secciones Principales

1. **Usuarios Suspendidos Globalmente** 🚫
   - Muestra todos los usuarios que están suspendidos a nivel global en Moodle
   - Incluye información: nombre, apellido, username, email y fecha de suspensión

2. **Usuarios con Múltiples Cursos** 📚
   - Lista usuarios que están inscritos en más de un curso
   - Muestra la cantidad de cursos y detalle de cada curso
   - Incluye: nombre, apellido, username, email y lista de cursos

3. **Usuarios que Nunca Ingresaron** ⏰
   - Identifica usuarios que nunca han accedido a Moodle
   - Muestra: nombre, apellido, username, email y fecha de creación de la cuenta

4. **Usuarios Suspendidos por Curso** 🎓
   - Organiza los usuarios suspendidos por curso específico
   - Muestra información detallada de cada curso y sus usuarios suspendidos

## Funcionalidades

### Sincronización de Datos
- **Botón "Sincronizar desde Moodle"**: Actualiza todos los datos desde Moodle
- **Estado de sincronización**: Muestra el progreso y estado de la última sincronización
- **Almacenamiento en BD**: Los datos se guardan localmente para acceso rápido

### Navegación
- **Pestañas**: Navegación fácil entre las diferentes secciones
- **Resumen**: Vista general con estadísticas principales
- **Tablas detalladas**: Información completa en cada sección

### Interfaz
- **Diseño responsivo**: Funciona en dispositivos móviles y desktop
- **Tema oscuro**: Soporte para modo oscuro
- **Indicadores visuales**: Iconos y colores para identificar cada sección

## Estructura Técnica

### Modelos de Datos
- `DashboardStats`: Modelo principal que almacena todas las estadísticas
- `SuspensionStatus`: Modelo para estados de suspensión (ya existente)

### APIs
- `POST /api/dashboard/sync`: Inicia la sincronización desde Moodle
- `GET /api/dashboard/stats`: Obtiene las estadísticas almacenadas
- `GET /api/dashboard/stats?type=<tipo>`: Obtiene estadísticas específicas por tipo

### Funciones de Sincronización
- `syncDashboardData()`: Función principal de sincronización
- `getGloballySuspendedUsers()`: Obtiene usuarios suspendidos globalmente
- `getUsersWithMultipleCourses()`: Identifica usuarios con múltiples cursos
- `getNeverAccessedUsers()`: Encuentra usuarios que nunca ingresaron
- `getCourseSuspendedUsers()`: Obtiene usuarios suspendidos por curso

## Uso

### Acceso al Dashboard
1. Iniciar sesión como administrador
2. Ir a `/admin/activities`
3. Hacer clic en "Dashboard" en la navegación superior

### Sincronización de Datos
1. Hacer clic en "🔄 Sincronizar desde Moodle"
2. Esperar a que se complete la sincronización
3. Los datos se actualizarán automáticamente

### Navegación
- **Resumen**: Vista general con estadísticas principales
- **Usuarios Suspendidos Globales**: Lista completa de usuarios suspendidos
- **Usuarios con Múltiples Cursos**: Usuarios inscritos en varios cursos
- **Usuarios que Nunca Ingresaron**: Usuarios sin actividad
- **Usuarios Suspendidos por Curso**: Organización por curso

## Configuración

### Variables de Entorno
Asegúrate de que las siguientes variables estén configuradas:
```env
NEXT_PUBLIC_MOODLE_API_URL=https://tu-moodle.com/webservice/rest/server.php
NEXT_PUBLIC_MOODLE_TOKEN=tu_token_de_moodle
MONGODB_URI=tu_uri_de_mongodb
```

### Permisos
- Solo usuarios con rol `admin` pueden acceder al dashboard
- Se requiere autenticación JWT válida

## Rendimiento

### Optimizaciones
- **Almacenamiento local**: Los datos se guardan en MongoDB para acceso rápido
- **Sincronización bajo demanda**: Los datos se actualizan solo cuando se solicita
- **Índices de base de datos**: Optimizados para consultas rápidas
- **Paginación**: Manejo eficiente de grandes volúmenes de datos

### Consideraciones
- La primera sincronización puede tomar tiempo dependiendo del volumen de datos en Moodle
- Se recomienda ejecutar la sincronización en horarios de bajo tráfico
- Los datos se mantienen actualizados hasta la próxima sincronización

## Mantenimiento

### Limpieza de Datos
- Los datos históricos se mantienen para análisis
- Se puede implementar limpieza automática de datos antiguos si es necesario

### Monitoreo
- Revisar regularmente el estado de sincronización
- Verificar que las APIs de Moodle estén funcionando correctamente
- Monitorear el rendimiento de las consultas a la base de datos

## Troubleshooting

### Problemas Comunes

1. **Error de sincronización**
   - Verificar conexión con Moodle
   - Comprobar que el token de API sea válido
   - Revisar logs del servidor

2. **Datos desactualizados**
   - Ejecutar sincronización manual
   - Verificar estado de la última sincronización
   - Comprobar errores en la sincronización

3. **Acceso denegado**
   - Verificar que el usuario tenga rol de administrador
   - Comprobar que el token JWT sea válido
   - Revisar configuración de autenticación

### Logs
Los logs importantes se pueden encontrar en:
- Consola del navegador (errores del frontend)
- Logs del servidor Next.js (errores del backend)
- Logs de MongoDB (errores de base de datos)

## Desarrollo

### Agregar Nuevas Estadísticas
1. Actualizar el modelo `DashboardStats`
2. Crear función de sincronización en `dashboard-sync.ts`
3. Actualizar la interfaz del dashboard
4. Agregar nueva pestaña si es necesario

### Personalización
- Los colores y estilos se pueden modificar en los componentes
- Se pueden agregar nuevos filtros y búsquedas
- Es posible exportar datos a diferentes formatos

## Contribución

Para contribuir al desarrollo del dashboard:
1. Seguir las convenciones de código existentes
2. Probar las nuevas funcionalidades
3. Documentar los cambios realizados
4. Verificar que no se rompan funcionalidades existentes 