import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de verificación de estado del servidor
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        proyecto: 'API Backend para Gestión y Reserva de Espacios Universitarios - Equipo 2',
    });
});

// Rutas principales de la API
app.use('/api', apiRoutes);

// Middleware de manejo centralizado de errores
app.use(errorHandler);

export default app;