import { supabase } from '../config/supabase';
import {
    CrearReservaInput,
    EspacioRow,
    ReservaRow,
    SolicitanteRow,
} from '../types/reserva.types';
import { AppError } from '../errors/AppError';

export class ReservasRepository {
    async obtenerEspacioPorId(idEspacio: string): Promise<EspacioRow | null> {
        const { data, error } = await supabase
            .from('espacios')
            .select('*')
            .eq('id_espacio', idEspacio)
            .maybeSingle();

        if (error) {
            throw new AppError(`Error en base de datos al consultar espacio: ${error.message}`, 500);
        }
        return data;
    }

    async obtenerSolicitantePorId(idSolicitante: string): Promise<SolicitanteRow | null> {
        const { data, error } = await supabase
            .from('solicitantes')
            .select('*')
            .eq('id_solicitante', idSolicitante)
            .maybeSingle();

        if (error) {
            throw new AppError(`Error en base de datos al consultar solicitante: ${error.message}`, 500);
        }
        return data;
    }

    /**
     * RN-04: Busca reservas ACTIVAS en el mismo espacio y fecha que se crucen con el bloque solicitado.
     * Condición de cruce: hora_inicio_existente < horaFin_nueva AND hora_fin_existente > horaInicio_nueva
     */
    async buscarReservasActivasSolapadas(
        idEspacio: string,
        fecha: string,
        horaInicioNueva: string,
        horaFinNueva: string
    ): Promise<ReservaRow[]> {
        const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .eq('id_espacio', idEspacio)
            .eq('fecha', fecha)
            .eq('estado', 'ACTIVA')
            .lt('hora_inicio', `${horaFinNueva}:00`)
            .gt('hora_fin', `${horaInicioNueva}:00`);

        if (error) {
            throw new AppError(`Error en base de datos al verificar cruces: ${error.message}`, 500);
        }
        return data || [];
    }

    async insertarReserva(input: CrearReservaInput): Promise<ReservaRow> {
        const { data, error } = await supabase
            .from('reservas')
            .insert({
                id_espacio: input.idEspacio,
                id_solicitante: input.idSolicitante,
                fecha: input.fecha,
                hora_inicio: input.horaInicio,
                hora_fin: input.horaFin,
                motivo: input.motivo.trim(),
                estado: 'ACTIVA',
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new AppError(
                `Error en base de datos al crear la reserva: ${error?.message || 'Sin respuesta'}`,
                500
            );
        }
        return data;
    }

    async obtenerReservaPorId(idReserva: string): Promise<ReservaRow | null> {
        const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .eq('id_reserva', idReserva)
            .maybeSingle();

        if (error) {
            throw new AppError(`Error en base de datos al consultar reserva: ${error.message}`, 500);
        }
        return data;
    }

    async listarReservasPorEspacio(
        idEspacio: string,
        fecha?: string
    ): Promise<ReservaRow[]> {
        let query = supabase
            .from('reservas')
            .select('*')
            .eq('id_espacio', idEspacio);

        if (fecha) {
            query = query.eq('fecha', fecha);
        }

        const { data, error } = await query
            .order('fecha', { ascending: true })
            .order('hora_inicio', { ascending: true });

        if (error) {
            throw new AppError(`Error en base de datos al listar reservas: ${error.message}`, 500);
        }
        return data || [];
    }

    async cancelarReservaPorId(idReserva: string): Promise<ReservaRow> {
        const fechaCancelacion = new Date().toISOString();

        const { data, error } = await supabase
            .from('reservas')
            .update({
                estado: 'CANCELADA',
                fecha_cancelacion: fechaCancelacion,
            })
            .eq('id_reserva', idReserva)
            .select('*')
            .single();

        if (error || !data) {
            throw new AppError(
                `Error en base de datos al cancelar la reserva: ${error?.message || 'Sin respuesta'}`,
                500
            );
        }
        return data;
    }
}