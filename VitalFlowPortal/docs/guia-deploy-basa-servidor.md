# Guía de deploy del portal en el servidor de BASA

## Objetivo

Documentar cómo desplegar este portal en el entorno real de BASA, con la base PostgreSQL correcta, las variables de entorno reales y la ejecución del servicio en producción.

---

## Principio base

Este portal no se despliega como una app que dependa de localhost ni de datos de prueba.

Debe quedar configurado con:
- PostgreSQL real del servidor de BASA
- secretos reales
- URLs reales del HIS
- build de producción
- servicio levantado en el host o contenedor de BASA

---

## Arquitectura de despliegue recomendada

### Opción recomendada para BASA
Usar Docker Compose en el servidor, porque ya existe una base y el proyecto cuenta con estructura compatible para contenedores.

```text
servidor BASA
 ├─ app portal
 ├─ PostgreSQL
 ├─ Redis (si aplica)
 └─ NGINX / reverse proxy
```

---

## Variables de entorno de producción

Debe existir un .env real en el servidor, con valores de producción.

Ejemplo:

```env
NODE_ENV=production
SKIP_ENV_VALIDATION=0
AUTH_SECRET=REEMPLAZAR_SECRET_REAL
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
DATABASE_URL=postgresql://usuario_basa:password_real@host_basa:5432/basa_portal
HIS_BASE_URL=https://api-his.basa.internal
HIS_API_KEY=REEMPLAZAR_API_KEY
WHATSAPP_TOKEN=REEMPLAZAR_TOKEN
WHATSAPP_PHONE_NUMBER_ID=REEMPLAZAR_PHONE_NUMBER_ID
```

> Importante: nunca usar localhost en producción ni una base de pruebas.

---

## 1) Preparar el servidor

### Si el servidor es Linux con Docker
1. Clonar el repo de la rama de despliegue.
2. Entrar al proyecto.
3. Confirmar que el archivo .env real existe.
4. Revisar la configuración de Docker Compose.

Ejemplo:

```bash
git clone <repo>
cd <repo>
cp .env.example .env
```

Luego editar el `.env` con los valores reales de BASA.

---

## 2) Build y levantado del servicio

### Opción Docker Compose

```bash
docker compose up --build -d
```

Luego verificar:

```bash
docker compose ps
docker compose logs -f
```

### Verificar contenedores
Debe quedar levantado:
- base de datos PostgreSQL
- portal app
- backend si aplica

---

## 3) Migraciones Prisma

Luego de levantar la base, ejecutar:

```bash
npx prisma db push
```

Si usan migraciones:

```bash
npx prisma migrate deploy
```

Esto asegura que el schema del portal quede sincronizado con la base real.

---

## 4) Build de producción del portal

Si la app se levanta con Node directo, ejecutar:

```bash
npm ci
npm run build
```

Luego correr la app en producción:

```bash
npm run start
```

O con PM2:

```bash
pm2 start npm --name basa-portal -- run start
```

---

## 5) Verificación final

### Healthcheck
Revisar:
- endpoint principal del portal responde
- login funciona
- registro funciona
- database conecta correctamente
- HIS service responde o falla con error manejado

Ejemplos de prueba:

```bash
curl -I https://portal.basa.com.ar
curl -X POST https://portal.basa.com.ar/api/auth/register
```

---

## 6) Seguridad del deploy

Antes del despliegue real, revisar:

- no quedan contraseñas de desarrollo
- no hay localhost en envs
- no hay tokens expuestos en git
- no se usa .env local en producción
- el usuario de DB tiene permisos mínimos
- el servicio usa HTTPS
- hay logs de errores y monitoreo enabled

---

## 7) Checklist de despliegue BASA

- [ ] repo en rama correcta
- [ ] .env con valores reales
- [ ] DATABASE_URL apunta al servidor de BASA
- [ ] AUTH_SECRET real
- [ ] HIS URL real
- [ ] WhatsApp API real
- [ ] base Postgres creada
- [ ] Prisma sincronizado
- [ ] build de producción correcto
- [ ] servicio corriendo
- [ ] dominio/SSL activo
- [ ] logs sin errores
- [ ] endpoint de registro responde

---

## 8) Comando recomendado para este proyecto

Si BASA usa Docker Compose, el flujo base es:

```bash
git pull origin portal_basa_v1_mtc
docker compose up --build -d
npx prisma db push
```

Si el entorno usa Node puro:

```bash
git pull origin portal_basa_v1_mtc
npm ci
npm run build
npx prisma db push
npm run start
```

---

## 9) Recomendación final

Para BASA, lo mejor es dejar puerta de salida por Docker Compose o servicio gestionado, con:
- app en un contenedor
- Postgres en otro contenedor o servicio externo
- reverse proxy para HTTPS
- variables reales cargadas por entorno

Eso mantiene el despliegue reproducible y más seguro.

---

## 10) Punto clave

El mayor error que vimos en este proyecto fue que la app estaba apuntando a una base local de prueba con credenciales no reales. Eso es exactamente lo que debe evitarse en despliegue a BASA.

La regla es simple:

- desarrollo = localhost / pruebas / secretos temporales
- producción = servidor real + base real + env real

---

## Conclusión

La base del deploy en BASA no es “subir la app y correrla”, sino:

1. preparar el entorno real,
2. poner la DB correcta,
3. poner los secretos reales,
4. correr Prisma,
5. levantar la app en producción,
6. verificar que el registro y la integración con HIS respondan correctamente.
