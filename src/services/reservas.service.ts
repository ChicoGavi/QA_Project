import { ReservasRepository } from '../repositories/reservas.repository';
import {
    CrearReservaInput,
    ReservaResponseDTO,
    ReservaRow,
} from '../types/reserva.types';
import { AppError } from '../errors/AppError';
import {
    esFechaValida,
    esHoraValida,
    esIdReservaValido,
    validarAnticipacionCancelacion,
    validarFranjaYDuracion,
    validarVentanaAnticipacionCreacion,
} from '../utils/dateTimeValidator';

export class ReservasService {
    private readonly repository: ReservasRepository;

    constructor() {
        this.repository = new ReservasRepository();
    }

    /**
     * Transforma una fila de PostgreSQL al contrato JSON en camelCase (Sección 4.1)
     */
    private mapearReservaADTO(row: ReservaRow): ReservaResponseDTO {
        return {
            idReserva: row.id_reserva,
            idEspacio: row.id_espacio,
            idSolicitante: row.id_solicitante,
            fecha: row.fecha,
            horaInicio: row.hora_inicio.slice(0, 5), // HH:mm
            horaFin: row.hora_fin.slice(0, 5),       // HH:mm
            motivo: row.motivo,
            estado: row.estado,
            fechaCreacion: row.fecha_creacion,
            fechaCancelacion: row.fecha_cancelacion,
        };
    }

    /**
     * RF-01: Crear reserva (Cumple RN-01 a RN-06 y RN-10)
     */
    async crearReserva(input: Partial<CrearReservaInput>): Promise<ReservaResponseDTO> {
        const { idEspacio, idSolicitante, fecha, horaInicio, horaFin, motivo } = input;

        // Paso 2 del flujo: Validar presencia y formato de campos obligatorios
        if (
            !idEspacio?.trim() ||
            !idSolicitante?.trim() ||
            !fecha?.trim() ||
            !horaInicio?.trim() ||
            !horaFin?.trim() ||
            !motivo?.trim()
        ) {
            throw new AppError(
                'Todos los campos (idEspacio, idSolicitante, fecha, horaInicio, horaFin, motivo) son obligatorios.',
                400,
                'RN-10'
            );
        }

        if (!esFechaValida(fecha)) {
            throw new AppError('El campo fecha debe tener un formato válido YYYY-MM-DD.', 400, 'RN-10');
        }

        if (!esHoraValida(horaInicio) || !esHoraValida(horaFin)) {
            throw new AppError(
                'Los campos horaInicio y horaFin deben tener formato 24 horas HH:mm.',
                400,
                'RN-10'
            );
        }

        const motivoLimpio = motivo.trim();
        if (motivoLimpio.length < 5 || motivoLimpio.length > 200) {
            throw new AppError(
                'El motivo de la reserva debe tener entre 5 y 200 caracteres.',
                400,
                'RN-10'
            );
        }

        // Paso 3 del flujo: Comprobar existencia y disponibilidad del espacio (RN-05 y CA-04)
        const espacio = await this.repository.obtenerEspacioPorId(idEspacio.trim());
        if (!espacio) {
            throw new AppError(
                `El espacio '${idEspacio}' no existe en el catálogo institucional.`,
                404,
                'RN-05'
            );
        }

        if (espacio.estado !== 'DISPONIBLE') {
            throw new AppError(
                `El espacio '${idEspacio}' no se encuentra habilitado para reserva (estado actual: ${espacio.estado}).`,
                400,
                'RN-05'
            );
        }

        // Validar existencia y estado ACTIVO del solicitante (Sección 4.1, 4.2 y CA-01)
        const solicitante = await this.repository.obtenerSolicitantePorId(idSolicitante.trim());
        if (!solicitante) {
            throw new AppError(
                `El solicitante '${idSolicitante}' no existe en el catálogo de usuarios.`,
                404,
                'CA-01'
            );
        }

        if (solicitante.estado !== 'ACTIVO') {
            throw new AppError(
                `El solicitante '${idSolicitante}' no puede realizar reservas porque su estado es ${solicitante.estado}.`,
                400,
                'CA-01'
            );
        }

        // Paso 4 del flujo: Franja institucional (07:00 a 22:00) y duración (1 a 4 horas) (RN-01, RN-02, CA-03)
        validarFranjaYDuracion(horaInicio, horaFin);

        // Paso 5 del flujo: Ventana de anticipación (mínimo 2h, máximo 30 días) (RN-03)
        validarVentanaAnticipacionCreacion(fecha, horaInicio);

        // Paso 6 del flujo: Exclusión estricta de cruces y solapamientos (RN-04, CA-02)
        const cruces = await this.repository.buscarReservasActivasSolapadas(
            idEspacio.trim(),
            fecha,
            horaInicio,
            horaFin
        );

        if (cruces.length > 0) {
            const conflicto = cruces[0];
            throw new AppError(
                `Conflicto de horario: el espacio '${idEspacio}' ya cuenta con la reserva activa '${conflicto.id_reserva}' el ${fecha} de ${conflicto.hora_inicio.slice(0, 5)} a ${conflicto.hora_fin.slice(0, 5)}.`,
                409,
                'RN-04'
            );
        }

        // Paso 7 del flujo: Persistir con estado ACTIVA y generar RES-XXXX (RN-06)
        const reservaCreada = await this.repository.insertarReserva({
            idEspacio: idEspacio.trim(),
            idSolicitante: idSolicitante.trim(),
            fecha,
            horaInicio,
            horaFin,
            motivo: motivoLimpio,
        });

        return this.mapearReservaADTO(reservaCreada);
    }

    /**
     * RF-02: Consultar reserva por identificador único (CA-05, CA-06, CA-07)
     */
    async consultarReservaPorId(idReserva?: string): Promise<ReservaResponseDTO> {
        if (!idReserva || !idReserva.trim() || !esIdReservaValido(idReserva)) {
            throw new AppError(
                'El parámetro idReserva es obligatorio y debe tener un formato válido (ej. RES-1001).',
                400,
                'CA-07'
            );
        }

        const reserva = await this.repository.obtenerReservaPorId(idReserva.trim());
        if (!reserva) {
            throw new AppError(
                `La reserva con identificador '${idReserva}' no fue encontrada.`,
                404,
                'CA-06'
            );
        }

        return this.mapearReservaADTO(reserva);
    }

    /**
     * RF-03: Listar reservas por espacio (CA-08, CA-09, CA-10)
     */
    async listarReservasPorEspacio(
        idEspacio?: string,
        fecha?: string
    ): Promise<{ mensaje: string; total: number; reservas: ReservaResponseDTO[] }> {
        if (!idEspacio || !idEspacio.trim()) {
            throw new AppError('El parámetro idEspacio es obligatorio.', 400, 'RF-03');
        }

        if (fecha !== undefined && fecha !== '') {
            if (!esFechaValida(fecha)) {
                throw new AppError(
                    'El parámetro opcional fecha debe tener un formato válido YYYY-MM-DD.',
                    400,
                    'RF-03'
                );
            }
        }

        // Paso 2 del flujo: Validar que el espacio exista en el catálogo (CA-10)
        const espacio = await this.repository.obtenerEspacioPorId(idEspacio.trim());
        if (!espacio) {
            throw new AppError(
                `El espacio solicitado '${idEspacio}' no existe en el catálogo universitario.`,
                404,
                'CA-10'
            );
        }

        const filas = await this.repository.listarReservasPorEspacio(
            idEspacio.trim(),
            fecha || undefined
        );

        const reservas = filas.map((r) => this.mapearReservaADTO(r));

        // CA-09: Lista vacía con mensaje informativo si no hay reservas
        if (reservas.length === 0) {
            return {
                mensaje: `No existen reservas programadas para el espacio '${idEspacio}'${fecha ? ` en la fecha ${fecha}` : ''}.`,
                total: 0,
                reservas: [],
            };
        }

        return {
            mensaje: `Listado cronológico de reservas para el espacio '${idEspacio}'.`,
            total: reservas.length,
            reservas,
        };
    }

    /**
     * RF-04: Cancelar reserva activa oportunamente (RN-07, RN-08, RN-09, CA-11 a CA-14)
     */
    async cancelarReserva(idReserva?: string): Promise<ReservaResponseDTO> {
        if (!idReserva || !idReserva.trim() || !esIdReservaValido(idReserva)) {
            throw new AppError(
                'El parámetro idReserva es obligatorio y debe tener un formato válido (ej. RES-1001).',
                400,
                'RF-04'
            );
        }

        // Paso 2 del flujo: Buscar la reserva por idReserva (CA-14)
        const reserva = await this.repository.obtenerReservaPorId(idReserva.trim());
        if (!reserva) {
            throw new AppError(
                `La reserva con identificador '${idReserva}' no fue encontrada.`,
                404,
                'CA-14'
            );
        }

        // Paso 3 del flujo: Comprobar que el estado sea ACTIVA (RN-07 y CA-12)
        if (reserva.estado === 'CANCELADA') {
            throw new AppError(
                `La reserva '${idReserva}' ya se encuentra en estado CANCELADA.`,
                409,
                'RN-07'
            );
        }

        // Paso 4 del flujo: Comprobar anticipación mínima de 60 minutos (RN-08 y CA-13)
        validarAnticipacionCancelacion(reserva.fecha, reserva.hora_inicio.slice(0, 5));

        // Paso 5 del flujo: Actualizar estado a CANCELADA y registrar fechaCancelacion (RN-09 y CA-11)
        const reservaActualizada = await this.repository.cancelarReservaPorId(idReserva.trim());

        return this.mapearReservaADTO(reservaActualizada);
    }
}