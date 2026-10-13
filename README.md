# 🏙️ El Barrio Az - RPG Familiar Multijugador 2D

Juego RPG urbano cooperativo en tiempo real diseñado para la familia Az:
- 👨 **Diegoaz (Padre)**: Mentor & Arquitecto (Gestión de recursos y liderazgo).
- 👦 **Diegoaz Jr. (Hijo)**: Ingeniero & Tecnología (Gadgets, movilidad rápida y circuitos).
- 🌸 **Vicky Vicky (Hija)**: Diseñadora & Amante de Mascotas (Cuidado ecológico y creatividad).

---

## 🚀 Despliegue en Coolify (Hostinger VPS)

1. **Build Pack**: Seleccionar `Dockerfile`.
2. **Ports Exposes**: `3000`.
3. **Persistent Storage (Opcional si usas SQLite)**:
   - Volume path: `/app/data`
4. **Base de Datos (Opcional si usas PostgreSQL de Coolify)**:
   - En **Environment Variables**, añadir `DATABASE_URL=postgresql://usuario:password@host:5432/bd`.
   - *Si no defines `DATABASE_URL`, el juego usará automáticamente SQLite local persistente en `/app/data` sin requerir nada más.*

---

## 💻 Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
npm start

# 3. Abrir en el navegador
# http://localhost:3000
```
