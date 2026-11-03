import { AppError } from '../errors/AppError';

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ID_RESERVA_REGEX = /^RES-\d{4,}$/;

export function esFechaValida(fechaStr: string): boolean {
    if (!FECHA_REGEX.test(fechaStr)) return false;
    const [year, month, day] = fechaStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    return (
        dateObj.getUTCFullYear() === year &&
        dateObj.getUTCMonth() === month - 1 &&
        dateObj.getUTCDate() === day
    );
}

export function esHoraValida(horaStr: string): boolean {
    return HORA_REGEX.test(horaStr);
}

export function esIdReservaValido(idReserva: string): boolean {
    return ID_RESERVA_REGEX.test(idReserva.trim());
}

export function horaAMinutos(horaStr: string): number {
    const [horas, minutos] = horaStr.split(':').map(Number);
    return horas * 60 + minutos;
}

/**
 * Convierte una fecha (YYYY-MM-DD) y hora (HH:mm) en un objeto Date
 * interpretado estrictamente en zona horaria local UTC-5 (Sección 10.1).
 */
export function construirFechaHoraUTC5(fechaStr: string, horaStr: string): Date {
    const horaNormalizada = horaStr.slice(0, 5);
    return new Date(`${fechaStr}T${horaNormalizada}:00-05:00`);
}

/**
 * Obtiene la fecha actual (YYYY-MM-DD) en zona horaria UTC-5.
 */
function obtenerFechaHoyUTC5(ahora: Date): string {
    const utc5Time = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
    return utc5Time.toISOString().slice(0, 10);
}

/**
 * RN-01: Franja horaria institucional permitida (07:00 a 22:00)
 * RN-02: Límites de duración de la reserva (mínimo 60 min, máximo 240 min)
 */
export function validarFranjaYDuracion(horaInicio: string, horaFin: string): void {
    const minInicio = horaAMinutos(horaInicio);
    const minFin = horaAMinutos(horaFin);

    const APERTURA_CAMPUS = 7 * 60;  // 07:00 (420 min)
    const CIERRE_INICIO_MAX = 21 * 60; // 21:00
    const CIERRE_CAMPUS = 22 * 60;   // 22:00 (1320 min)

    if (minInicio < APERTURA_CAMPUS || minInicio > CIERRE_INICIO_MAX) {
        throw new AppError(
            'La horaInicio está fuera de la franja institucional permitida (07:00 a 21:00).',
            400,
            'RN-01'
        );
    }

    if (minFin < 8 * 60 || minFin > CIERRE_CAMPUS) {
        throw new AppError(
            'La horaFin excede la franja institucional permitida (08:00 a 22:00).',
            400,
            'RN-01'
        );
    }

    if (minFin <= minInicio) {
        throw new AppError(
            'La horaFin debe ser estrictamente posterior a la horaInicio.',
            400,
            'RN-02'
        );
    }

    const duracionMinutos = minFin - minInicio;
    if (duracionMinutos < 60 || duracionMinutos > 240) {
        throw new AppError(
            `La duración de la reserva (${duracionMinutos} min) incumple los límites permitidos: mínimo 1 hora (60 min) y máximo 4 horas (240 min).`,
            400,
            'RN-02'
        );
    }
}

/**
 * RN-03: Ventana de anticipación para crear reserva
 * - Mínimo 2 horas (120 minutos) antes de horaInicio.
 * - Máximo 30 días calendario previos a la fecha.
 */
export function validarVentanaAnticipacionCreacion(fecha: string, horaInicio: string): void {
    const ahora = new Date();
    const inicioReserva = construirFechaHoraUTC5(fecha, horaInicio);

    const diferenciaMinutos = (inicioReserva.getTime() - ahora.getTime()) / (1000 * 60);

    if (diferenciaMinutos < 120) {
        throw new AppError(
            'Toda solicitud de reserva debe realizarse con un mínimo de 2 horas de anticipación respecto a la hora de inicio programada.',
            400,
            'RN-03'
        );
    }

    // Diferencia en días calendario respecto a la fecha actual en UTC-5
    const hoyStr = obtenerFechaHoyUTC5(ahora);
    const hoyDate = new Date(`${hoyStr}T00:00:00-05:00`);
    const fechaReservaDate = new Date(`${fecha}T00:00:00-05:00`);
    const diferenciaDias = Math.round(
        (fechaReservaDate.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias > 30) {
        throw new AppError(
            'La reserva excede el plazo máximo permitido de 30 días calendario de anticipación.',
            400,
            'RN-03'
        );
    }
}

/**
 * RN-08: Anticipación mínima requerida para cancelación (mínimo 60 minutos antes de horaInicio)
 */
export function validarAnticipacionCancelacion(fecha: string, horaInicio: string): void {
    const ahora = new Date();
    const inicioReserva = construirFechaHoraUTC5(fecha, horaInicio);

    const diferenciaMinutos = (inicioReserva.getTime() - ahora.getTime()) / (1000 * 60);

    if (diferenciaMinutos < 60) {
        throw new AppError(
            'Tiempo de anticipación vencido: la cancelación debe solicitarse con al menos 1 hora (60 minutos) de anticipación respecto a la hora de inicio.',
            400,
            'RN-08'
        );
    }
}