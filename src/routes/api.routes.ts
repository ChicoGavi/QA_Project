import { Router } from 'express';
import { ReservasController } from '../controllers/reservas.controller';
import { AppError } from '../errors/AppError';

const router = Router();
const controller = new ReservasController();

// RF-01: Crear reserva
router.post('/reservas', controller.crearReserva);

// CA-07: Manejo explícito si llaman a GET /api/reservas sin idReserva
router.get('/reservas', (_req, _res, next) => {
    next(
        new AppError(
            'El identificador idReserva es obligatorio y debe tener un formato válido (ej. /api/reservas/RES-1001).',
            400,
            'CA-07'
        )
    );
});

// RF-02: Consultar detalles de una reserva por idReserva
router.get('/reservas/:idReserva', controller.consultarReserva);

// RF-03: Listar reservas asociadas a un espacio (con query ?fecha=YYYY-MM-DD opcional)
router.get('/espacios/:idEspacio/reservas', controller.listarPorEspacio);

// RF-04: Cancelar reserva activa
router.patch('/reservas/:idReserva/cancelar', controller.cancelarReserva);

export default router;