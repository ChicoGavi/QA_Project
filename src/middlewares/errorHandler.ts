import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: true,
            regla: err.codigoRegla || 'VALIDACION',
            mensaje: err.message,
        });
        return;
    }

    // Error de JSON malformado en el body
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            error: true,
            regla: 'FORMATO_JSON',
            mensaje: 'El cuerpo de la solicitud no contiene un JSON válido.',
        });
        return;
    }

    console.error('[ERROR NO CONTROLADO]:', err);
    res.status(500).json({
        error: true,
        regla: 'ERROR_INTERNO',
        mensaje: 'Error interno del servidor.',
    });
}