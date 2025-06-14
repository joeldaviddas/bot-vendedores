#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuración de rutas
const TOKENS_DIR = path.join(__dirname, 'tokens');
const SESSION_DIR = path.join(TOKENS_DIR, 'bot-vendedor');
const LOGS_DIR = path.join(__dirname, 'logs');

// Crear directorios necesarios
[TOKENS_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// Limpiar sesión anterior
if (fs.existsSync(SESSION_DIR)) {
  console.log('🧹 Limpiando sesión anterior...');
  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    console.log('✅ Sesión anterior eliminada correctamente');
  } catch (error) {
    console.error('❌ Error al limpiar sesión anterior:', error.message);
  }
}

// Verificar dependencias
console.log('🔍 Verificando dependencias...');
try {
  const packageJson = require('./package.json');
  const requiredDeps = Object.keys(packageJson.dependencies || {});
  const missingDeps = [];

  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
    } catch (e) {
      missingDeps.push(dep);
    }
  }

  if (missingDeps.length > 0) {
    console.log('⚠️ Instalando dependencias faltantes...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('✅ Todas las dependencias están instaladas');
  }
} catch (error) {
  console.error('❌ Error al verificar dependencias:', error.message);
  process.exit(1);
}

// Iniciar el bot
console.log('🚀 Iniciando el bot de WhatsApp...');
try {
  // Usar nodemon para reinicio automático en desarrollo
  const isDev = process.env.NODE_ENV === 'development';
  const command = isDev ? 'npx nodemon' : 'node';
  const args = isDev ? ['--inspect', 'src/bot/bot.js'] : ['src/bot/bot.js'];
  
  const child = require('child_process').spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_PATH: __dirname,
      TOKENS_DIR,
      LOGS_DIR
    }
  });

  child.on('error', (error) => {
    console.error('❌ Error al iniciar el bot:', error.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ El bot se cerró con código de error ${code}`);
      console.log('🔄 Reiniciando en 5 segundos...');
      setTimeout(() => {
        require('child_process').spawn(process.argv[0], process.argv.slice(1), {
          stdio: 'inherit',
          shell: true
        });
      }, 5000);
    }
  });
} catch (error) {
  console.error('❌ Error crítico:', error.message);
  process.exit(1);
}
