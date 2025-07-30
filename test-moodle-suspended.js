// Test script para verificar el campo suspended de Moodle
require('dotenv').config({ path: '.env.local' });

const MOODLE_API_URL = process.env.NEXT_PUBLIC_MOODLE_API_URL;
const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN;

async function testMoodleSuspended() {
  console.log('\n🧪 TEST: Verificando campo suspended de Moodle\n');
  console.log('API URL:', MOODLE_API_URL);
  console.log('Token:', MOODLE_TOKEN ? '✓ Configurado' : '✗ No configurado');
  
  if (!MOODLE_API_URL || !MOODLE_TOKEN) {
    console.error('❌ Error: Falta configurar MOODLE_API_URL o MOODLE_TOKEN');
    return;
  }

  const courseId = 256; // El curso que estás probando
  const userId = 4949; // ID de Tuttolomondo

  try {
    // Test 1: core_enrol_get_enrolled_users
    console.log('\n📚 Test 1: core_enrol_get_enrolled_users');
    const queryParams = new URLSearchParams({
      wstoken: MOODLE_TOKEN,
      wsfunction: 'core_enrol_get_enrolled_users',
      moodlewsrestformat: 'json',
      courseid: courseId
    });

    const response = await fetch(`${MOODLE_API_URL}?${queryParams}`, {
      method: 'GET'
    });

    const data = await response.json();
    
    if (data.exception) {
      console.error('❌ Error de Moodle:', data.message);
      return;
    }

    console.log(`✅ Respuesta recibida: ${Array.isArray(data) ? data.length : 0} usuarios`);
    
    // Buscar a Tuttolomondo
    const tuttolomondo = data.find(user => 
      user.id === userId || 
      user.username === '33128569' ||
      (user.firstname === 'Aldo Adrian' && user.lastname === 'Tuttolomondo')
    );

    if (tuttolomondo) {
      console.log('\n🎯 TUTTOLOMONDO ENCONTRADO:');
      console.log('ID:', tuttolomondo.id);
      console.log('Username:', tuttolomondo.username);
      console.log('Nombre:', tuttolomondo.firstname, tuttolomondo.lastname);
      console.log('Email:', tuttolomondo.email);
      console.log('\n🔍 CAMPO SUSPENDED:');
      console.log('Valor:', tuttolomondo.suspended);
      console.log('Tipo:', typeof tuttolomondo.suspended);
      console.log('Es undefined?:', tuttolomondo.suspended === undefined);
      console.log('Es null?:', tuttolomondo.suspended === null);
      console.log('Es 0?:', tuttolomondo.suspended === 0);
      console.log('Es 1?:', tuttolomondo.suspended === 1);
      console.log('\n📋 TODAS LAS PROPIEDADES:');
      console.log(Object.keys(tuttolomondo));
      console.log('\n📄 OBJETO COMPLETO:');
      console.log(JSON.stringify(tuttolomondo, null, 2));
    } else {
      console.log('❌ Tuttolomondo NO encontrado en la respuesta');
    }

    // Mostrar estructura de algunos usuarios para comparar
    console.log('\n📊 ESTRUCTURA DE OTROS USUARIOS (primeros 3):');
    data.slice(0, 3).forEach((user, index) => {
      console.log(`\nUsuario ${index + 1}:`);
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      console.log('Suspended:', user.suspended, `(tipo: ${typeof user.suspended})`);
      console.log('Propiedades:', Object.keys(user).join(', '));
    });

    // Test 2: Verificar si hay algún usuario con suspended definido
    console.log('\n🔍 ANÁLISIS DE CAMPO SUSPENDED EN TODOS LOS USUARIOS:');
    let conSuspended = 0;
    let sinSuspended = 0;
    let suspended0 = 0;
    let suspended1 = 0;

    data.forEach(user => {
      if (user.suspended !== undefined) {
        conSuspended++;
        if (user.suspended === 0) suspended0++;
        if (user.suspended === 1) suspended1++;
      } else {
        sinSuspended++;
      }
    });

    console.log(`Usuarios con suspended definido: ${conSuspended}`);
    console.log(`Usuarios sin suspended (undefined): ${sinSuspended}`);
    console.log(`Usuarios con suspended = 0: ${suspended0}`);
    console.log(`Usuarios con suspended = 1: ${suspended1}`);

    // Mostrar algunos usuarios con suspended = 1 si existen
    const suspendedUsers = data.filter(user => user.suspended === 1);
    if (suspendedUsers.length > 0) {
      console.log('\n👥 USUARIOS SUSPENDIDOS (suspended = 1):');
      suspendedUsers.forEach(user => {
        console.log(`- ${user.firstname} ${user.lastname} (${user.username})`);
      });
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar el test
testMoodleSuspended();