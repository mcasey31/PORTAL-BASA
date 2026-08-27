# PRM Platform - Dockerized Architecture

Este repositorio queda dividido en tres componentes desacoplados para ejecucion local y despliegue por contenedores:

- Frontend: React nativo (Vite + Nginx)
- Backend: Next.js (API, auth, tRPC, Prisma)
- Database: PostgreSQL 16

## Arquitectura

- Frontend expone `http://localhost:3000`
- Backend expone `http://localhost:3001`
- Base de datos expone `localhost:5432`
- El frontend proxya `/api/*` hacia el backend, por lo que el cliente React consume backend por mismo origen (`/api`).

## Requisitos

- Docker Desktop (o Docker Engine + Compose)

## Levantar con Docker

1. Configura variables de entorno sensibles en tu shell:

```bash
set AUTH_SECRET=tu_secret_fuerte
set AUTH_GOOGLE_ID=tu_google_client_id
set AUTH_GOOGLE_SECRET=tu_google_client_secret
```

2. Construye e inicia todo el stack:

```bash
docker compose up --build -d
```

3. Verifica contenedores:

```bash
docker compose ps
```

4. Ver logs (si hace falta):

```bash
docker compose logs -f frontend backend db
```

## Parar y limpiar

```bash
docker compose down
```

Para borrar tambien el volumen de datos:

```bash
docker compose down -v
```

## Estructura agregada

- `frontend/`: app React nativa (Vite)
- `frontend/Dockerfile`: build y serving del frontend con Nginx
- `Dockerfile.backend`: build y runtime del backend
- `docker/nginx/default.conf`: proxy `/api` al backend
- `docker-compose.yml`: orquestacion de frontend/backend/db

## Publicar en GitHub

1. Crea un repositorio vacio en GitHub.
2. En local:

```bash
git add .
git commit -m "feat: dockerize app with separated react frontend, backend and db"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

Si ya existe un remote `origin`, actualizalo:

```bash
git remote set-url origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```
