export type EstadoEspacio = 'DISPONIBLE' | 'EN_MANTENIMIENTO';
export type TipoEspacio = 'LABORATORIO' | 'AULA' | 'AUDITORIO' | 'SALA_ESTUDIO';
export type EstadoSolicitante = 'ACTIVO' | 'SANCIONADO';
export type RolSolicitante = 'ESTUDIANTE' | 'DOCENTE' | 'ADMINISTRATIVO';
export type EstadoReserva = 'ACTIVA' | 'CANCELADA';

// Filas de PostgreSQL en Supabase
export interface EspacioRow {
    id_espacio: string;
    nombre: string;
    tipo: TipoEspacio;
    capacidad: number;
    estado: EstadoEspacio;
}

export interface SolicitanteRow {
    id_solicitante: string;
    nombre: string;
    rol: RolSolicitante;
    estado: EstadoSolicitante;
}

export interface ReservaRow {
    id_reserva: string;
    id_espacio: string;
    id_solicitante: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    motivo: string;
    estado: EstadoReserva;
    fecha_creacion: string;
    fecha_cancelacion: string | null;
}

// DTOs de entrada y salida (Sección 4.1 del documento de requisitos)
export interface CrearReservaInput {
    idEspacio: string;
    idSolicitante: string;
    fecha: string;       // YYYY-MM-DD
    horaInicio: string;  // HH:mm
    horaFin: string;     // HH:mm
    motivo: string;      // 5 a 200 caracteres
}

export interface ReservaResponseDTO {
    idReserva: string;
    idEspacio: string;
    idSolicitante: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    motivo: string;
    estado: EstadoReserva;
    fechaCreacion: string;
    fechaCancelacion: string | null;
}