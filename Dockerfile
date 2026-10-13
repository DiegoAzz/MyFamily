FROM node:22-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias limpias para producción
RUN npm ci --omit=dev || npm install --omit=dev

# Copiar el resto del código
COPY . .

# Crear directorio para persistencia de datos (SQLite / estados)
RUN mkdir -p /app/data

# Exponer el puerto del juego
EXPOSE 3000

# Variables por defecto
ENV PORT=3000
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "server.js"]
