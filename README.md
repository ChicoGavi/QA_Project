# API Backend para Gestión y Reserva de Espacios Universitarios

API RESTful desarrollada en **Node.js, Express y TypeScript** conectada a **PostgreSQL (Supabase)** para centralizar y automatizar el ciclo de vida de las reservas de espacios físicos universitarios (creación, consulta individual, listado por espacio y cancelación), garantizando el cumplimiento de las reglas horarias y la exclusión de solapamientos.

* **Documento de especificación base:** `Equipo_02_Fase_1_Documentacion_Inicial_API_v0.1.docx` .

---

## 1. Tecnologías y Arquitectura

* **Entorno y Lenguaje:** Node.js + TypeScript (`tsx` para desarrollo).
* **Framework Web:** Express.js.
* **Base de Datos:** PostgreSQL alojado en **Supabase** (`@supabase/supabase-js`).
* **Zona Horaria:** Estandarizada en `UTC-5` (formato de fecha `YYYY-MM-DD` y hora militar 24h `HH:mm`).

### Estructura del Proyecto (Arquitectura en Capas)
```text
reservas-espacios-api/
├── src/
│   ├── config/
│   │   └── supabase.ts               # Configuración y cliente de Supabase
│   ├── controllers/
│   │   └── reservas.controller.ts    # Manejo de peticiones y respuestas HTTP
│   ├── errors/
│   │   └── AppError.ts               # Excepción personalizada con código HTTP y regla
│   ├── middlewares/
│   │   └── errorHandler.ts           # Middleware centralizado de manejo de errores (RN-10)
│   ├── repositories/
│   │   └── reservas.repository.ts    # Capa de acceso a datos (consultas SQL a Supabase)
│   ├── routes/
│   │   └── api.routes.ts             # Definición de rutas de la API
│   ├── services/
│   │   └── reservas.service.ts       # Lógica de negocio y validaciones (RN-01 a RN-10)
│   ├── types/
│   │   └── reserva.types.ts          # Interfaces y DTOs en TypeScript
│   ├── utils/
│   │   └── dateTimeValidator.ts      # Validaciones horarias y de anticipación (UTC-5)
│   ├── app.ts                        # Configuración de la aplicación Express
│   └── server.ts                     # Punto de arranque del servidor
├── .env.example                      # Plantilla de variables de entorno (sin secretos)
├── .gitignore                        # Archivos ignorados en control de versiones
├── package.json                      # Dependencias y scripts
└── tsconfig.json                     # Configuración de TypeScript
```

## Requisitos e Instalación Local
### Prerrequisitos
- Node.js v18+ (probado en v24).
- Proyecto activo en Supabase con el esquema SQL y datos semilla ejecutados.

## Pasos de configuración

1. Clonar el repositorio e instalar dependencias:
``` bash
git clone <URL_DEL_REPOSITORIO>
cd reservas-espacios-api
npm install
```

2. **Configurar las variables de entorno:**
   Crea un archivo .env en la raíz del proyecto basándote en .env.example (nunca subas el archivo .env al repositorio):

```
PORT=3000
SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co)
SUPABASE_KEY=tu_anon_public_key
```

3. **Ejecutar el servidor en modo desarrollo:**
```
npm run dev
```

El servidor quedará disponible en https://qa-project-usdx.onrender.com. Puedes verificar su estado en GET https://qa-project-usdx.onrender.com/health

4. Compilar y ejecutar en producción (opcional):
```
npm run build
npm start
```

## 3. Modelo de Datos en Supabase (PostgreSQL)
El sistema utiliza 3 tablas principales en el esquema public con Row Level Security (RLS) habilitado:

```aiignore

1. espacios (Catálogo institucional):

id_espacio (VARCHAR, PK, ej. ESP-LAB-01)

nombre (VARCHAR)

tipo (LABORATORIO, AULA, AUDITORIO, SALA_ESTUDIO)

capacidad (INTEGER > 0)

estado (DISPONIBLE, EN_MANTENIMIENTO)



2. solicitantes (Catálogo de usuarios):

id_solicitante (VARCHAR, PK, ej. USR-201)

nombre (VARCHAR)

rol (ESTUDIANTE, DOCENTE, ADMINISTRATIVO)

estado (ACTIVO, SANCIONADO)



3. reservas (Entidad principal):

id_reserva (VARCHAR, PK autogenerada mediante secuencia RES-XXXX, iniciando en RES-1001)

id_espacio (VARCHAR, FK -> espacios.id_espacio)

id_solicitante (VARCHAR, FK -> solicitantes.id_solicitante)

fecha (DATE, YYYY-MM-DD)

hora_inicio (TIME, 07:00 a 21:00)

hora_fin (TIME, 08:00 a 22:00)

motivo (VARCHAR(200), 5 a 200 caracteres)

estado (ACTIVA, CANCELADA)

fecha_creacion (TIMESTAMPTZ)

fecha_cancelacion (TIMESTAMPTZ, nullable)
```

## 4. Contrato de la API y Trazabilidad de Requerimientos

| Operación | Requisito / HU | Reglas y Criterios | Método y Ruta | Estado |
| :--- | :---: | :--- | :--- | :---: |
| 1. Crear reserva | RF-01 / HU-01 | RN-01 a RN-06, RN-10 / CA-01 a CA-04 | POST /api/reservas | 100% Implementado |
| 2. Consultar reserva | RF-02 / HU-02 | RN-10 / CA-05 a CA-07 | GET /api/reservas/:idReserva | 100% Implementado |
| 3. Listar reservas por espacio | RF-03 / HU-03 | RN-10 / CA-08 a CA-10 | GET /api/espacios/:idEspacio/reservas | 100% Implementado |
| 4. Cancelar reserva | RF-04 / HU-04 | RN-07 a RN-10 / CA-11 a CA-14 | PATCH /api/reservas/:idReserva/cancelar | 100% Implementado |
