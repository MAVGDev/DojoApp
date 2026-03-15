import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import studentRoutes from './routes/students.js';
import paymentRoutes from './routes/payments.js';
import eventRoutes from './routes/events.js';
import dashboardRoutes from './routes/dashboard.js';
import chargeRoutes from './routes/chargeRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/charges', chargeRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'API del Gimnasio funcionando', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

app.use('*', (req, res) => {
  console.log(`⚠️  Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    suggestion: 'Visita GET /api/endpoints para ver todas las rutas disponibles',
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err.message);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Contacta al administrador',
  });
});

connectDB().then(() => {
  console.log('✅ MongoDB Conectado');
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });

  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT',  () => server.close(() => process.exit(0)));
}).catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
  process.exit(1);
});

export default app;