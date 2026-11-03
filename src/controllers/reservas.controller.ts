import { Request, Response, NextFunction } from 'express';
import { ReservasService } from '../services/reservas.service';

export class ReservasController {
    private readonly service: ReservasService;

    constructor() {
        this.service = new ReservasService();
    }

    // Operación 1 — RF-01: Crear reserva
    crearReserva = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reservaCreada = await this.service.crearReserva(req.body);
            res.status(201).json({
                mensaje: 'Reserva creada exitosamente.',
                reserva: reservaCreada,
            });
        } catch (error) {
            next(error);
        }
    };

    // Operación 2 — RF-02: Consultar reserva por ID
    consultarReserva = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { idReserva } = req.params;
            const reserva = await this.service.consultarReservaPorId(idReserva);
            res.status(200).json(reserva);
        } catch (error) {
            next(error);
        }
    };

    // Operación 3 — RF-03: Listar reservas por espacio
    listarPorEspacio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { idEspacio } = req.params;
            const fecha = req.query.fecha as string | undefined;
            const resultado = await this.service.listarReservasPorEspacio(idEspacio, fecha);
            res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }
    };

    // Operación 4 — RF-04: Cancelar reserva
    cancelarReserva = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { idReserva } = req.params;
            const reservaCancelada = await this.service.cancelarReserva(idReserva);
            res.status(200).json({
                mensaje: 'Reserva cancelada exitosamente. El bloque horario ha sido liberado.',
                reserva: reservaCancelada,
            });
        } catch (error) {
            next(error);
        }
    };
}