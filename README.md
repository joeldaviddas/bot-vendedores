# JoelBot - Bot de Gestión de Vendedores de Streaming

Bot de WhatsApp diseñado específicamente para la gestión de grupos de ventas de streaming. Automatiza la gestión de vendedores, clientes y prevención de fraudes.

## 🚀 Características

- 🤖 Gestión completa de vendedores (registro, bloqueo/desbloqueo)
- 📝 Comandos personalizados con prefijo `/`
- 📸 Soporte para stickers y gestión de imágenes
- 📊 Base de datos local con logs
- 🛡️ Prevención de fraudes
- 🔄 Auto-reinicio en caso de fallos
- 🌐 Optimizado para GitHub Codespaces

## 📋 Comandos Disponibles

- `/verificar nombre número` - Registra un nuevo vendedor
- `/ban número` - Bloquea a un vendedor (solo admins)
- `/unban número` - Desbloquea un vendedor
- `/sticker` - Crea sticker de la última imagen
- `/lista` - Muestra lista de vendedores
- `/help` - Muestra esta ayuda

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPO]
cd bot-vendedores
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo `.env.example` a `.env` y configúralo según tus necesidades:
```bash
cp .env.example .env
```

4. Inicia el bot:
```bash
npm start
```

## 📱 Uso en GitHub Codespaces

El bot está optimizado para funcionar en GitHub Codespaces. Detecta automáticamente la ruta de Chrome/Chromium y maneja correctamente los directorios.

## 🔐 Seguridad

- Validación de números de teléfono
- Sistema de bloqueo/desbloqueo de vendedores
- Protección contra múltiples instancias
- Logs de todas las interacciones

## 📝 Contribución

¡Contribuciones son bienvenidas! Por favor, crea un issue o pull request para sugerir mejoras o reportar bugs.

## 📄 Licencia

MIT License - Joel David