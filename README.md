# 🤖 Bot de Gestión de Vendedores para WhatsApp

Un bot de WhatsApp diseñado para la gestión de vendedores, registro de ventas y generación de reportes automáticos.

## 🚀 Características

- Registro de vendedores
- Gestión de ventas
- Generación de reportes
- Notificaciones automáticas
- Soporte para múltiples grupos
- Reinicio automático en caso de errores

## 📋 Requisitos

- Node.js >= 16.0.0
- npm >= 7.0.0
- Una cuenta de WhatsApp
- Acceso a WhatsApp Web

## 🛠 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp config/.env.example config/.env
   ```

4. Edita el archivo `.env` con tus configuraciones.

## ⚙️ Configuración

### Variables de entorno importantes

- `SESSION_NAME`: Nombre de la sesión del bot (por defecto: 'bot-vendedor')
- `ALLOWED_GROUPS`: Nombres de los grupos permitidos, separados por comas
- `CHROME_PATH`: Ruta al ejecutable de Chrome/Chromium (opcional)
- `NODE_ENV`: Entorno de ejecución ('development' o 'production')

### Configuración de grupos

Edita la variable `ALLOWED_GROUPS` en el archivo `.env` para especificar los grupos donde el bot estará activo.

## 🚦 Iniciar el bot

### Modo desarrollo (con reinicio automático):
```bash
npm run dev
```

### Modo producción:
```bash
npm run prod
```

### Inicio normal:
```bash
npm start
```

## 📝 Comandos disponibles

- `!ayuda` - Muestra la lista de comandos
- `!agregar [nombre] [teléfono]` - Registra un nuevo vendedor
- `!lista` - Muestra la lista de vendedores
- `!reporte` - Genera un reporte de ventas
- `!sticker` - Crea un sticker a partir de una imagen

## 🐛 Solución de problemas

### Problemas comunes

1. **Error de sesión**:
   - Elimina la carpeta `tokens` y vuelve a iniciar el bot

2. **Error al iniciar Chrome**:
   - Asegúrate de tener Chrome/Chromium instalado
   - Especifica la ruta correcta en `CHROME_PATH`

3. **El bot no responde en el grupo**:
   - Verifica que el nombre del grupo coincida exactamente con `ALLOWED_GROUPS`
   - Asegúrate de que el bot tenga permisos de administrador

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee las [pautas de contribución](CONTRIBUTING.md) antes de enviar cambios.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

Hecho con ❤️ por [Tu Nombre]-vendedores