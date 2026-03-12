
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
import chargeRoutes from './routes/Chargeroutes.js';
app.use('/api/charges', chargeRoutes)

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


app.get('/api', (req, res) => {
  res.json({ 
    message: 'API del Gimnasio funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Servidor funcionando correctamente'
  });
});


app.get('/api/endpoints', (req, res) => {
  res.json({
    message: '🎯 Endpoints disponibles del API del Gimnasio',
    server: `http://localhost:${PORT}`,
    total_endpoints: 40,
    endpoints: [
      
      { method: 'GET', path: '/api', description: 'Raíz del API - Verificar conexión' },
      { method: 'GET', path: '/api/health', description: 'Health check - Estado del servidor' },
      { method: 'GET', path: '/api/endpoints', description: 'Lista de endpoints (esta ruta)' },
      
      // Autenticación
      { method: 'POST', path: '/api/auth/register', description: 'Registrar nuevo usuario (estudiante o admin)' },
      { method: 'POST', path: '/api/auth/login', description: 'Iniciar sesión - Obtener token JWT' },
      
      // Rutas Protegidas
      { method: 'GET', path: '/api/protected/profile', description: 'Ver perfil del usuario actual (necesita token)' },
      { method: 'GET', path: '/api/protected/admin', description: 'Verificar acceso de administrador (necesita token admin)' },
      
      // Estudiantes
      { method: 'GET', path: '/api/students/me', description: 'Ver mi perfil de estudiante (necesita token)' },
      { method: 'PUT', path: '/api/students/me', description: 'Actualizar mi perfil (necesita token)' },
      { method: 'GET', path: '/api/students', description: 'Listar todos los estudiantes (solo admin)' },
      { method: 'GET', path: '/api/students/search', description: 'Buscar estudiantes (solo admin)' },
      { method: 'GET', path: '/api/students/:id', description: 'Ver estudiante por ID (solo admin)' },
      { method: 'PUT', path: '/api/students/:id', description: 'Actualizar estudiante (solo admin)' },
      { method: 'DELETE', path: '/api/students/:id', description: 'Desactivar estudiante (solo admin)' },
      
      // Fotos de Estudiantes
      { method: 'PUT', path: '/api/students/me/photo', description: 'Subir mi foto de perfil (necesita token)' },
      { method: 'DELETE', path: '/api/students/me/photo', description: 'Eliminar mi foto (necesita token)' },
      { method: 'PUT', path: '/api/students/:id/photo', description: 'Subir foto de estudiante (solo admin)' },
      { method: 'DELETE', path: '/api/students/:id/photo', description: 'Eliminar foto de estudiante (solo admin)' },
      
      // Pagos
      { method: 'GET', path: '/api/payments/me', description: 'Ver mis pagos (necesita token estudiante)' },
      { method: 'GET', path: '/api/payments/alerts', description: 'Ver alertas de pagos pendientes (solo admin)' },
      { method: 'GET', path: '/api/payments/report', description: 'Ver reporte mensual de pagos (solo admin)' },
      { method: 'GET', path: '/api/payments/student/:studentId', description: 'Ver pagos de un estudiante (admin ve todo, estudiante solo lo suyo)' },
      { method: 'POST', path: '/api/payments', description: 'Crear nuevo pago (solo admin)' },
      { method: 'PUT', path: '/api/payments/:paymentId/paid', description: 'Marcar pago como pagado (solo admin)' },
      
      // Eventos
      { method: 'GET', path: '/api/events', description: 'Ver todos los eventos (admin: todos, estudiante: solo visibles)' },
      { method: 'GET', path: '/api/events/today', description: 'Ver eventos de hoy' },
      { method: 'GET', path: '/api/events/upcoming', description: 'Ver eventos próximos (para calendario)' },
      { method: 'GET', path: '/api/events/:id', description: 'Ver evento específico' },
      { method: 'POST', path: '/api/events', description: 'Crear nuevo evento (solo admin)' },
      { method: 'PUT', path: '/api/events/:id', description: 'Actualizar evento (solo admin)' },
      { method: 'DELETE', path: '/api/events/:id', description: 'Eliminar evento (solo admin)' },
      
      // Dashboard
      { method: 'GET', path: '/api/dashboard/admin/stats', description: 'Estadísticas generales (solo admin)' },
      { method: 'GET', path: '/api/dashboard/admin/distribution', description: 'Distribución por artes marciales (solo admin)' },
      { method: 'GET', path: '/api/dashboard/admin/payments-status', description: 'Estado de pagos (solo admin)' },
      { method: 'GET', path: '/api/dashboard/admin/upcoming-events', description: 'Próximos eventos (solo admin)' },
      { method: 'GET', path: '/api/dashboard/admin/active-alerts', description: 'Alertas activas (solo admin)' },
      { method: 'GET', path: '/api/dashboard/admin/recent-students', description: 'Estudiantes recientes (solo admin)' },
      { method: 'GET', path: '/api/dashboard/student/:id', description: 'Dashboard individual de estudiante' }
    ],
    
    // Guía rápida de uso
    quick_start: {
      paso_1: '1. Probar servidor: GET /api/health',
      paso_2: '2. Registrar usuario: POST /api/auth/register con {email, password, name, role}',
      paso_3: '3. Login: POST /api/auth/login con {email, password} - Guarda el token',
      paso_4: '4. Usar rutas protegidas: Añadir header "Authorization: Bearer TU_TOKEN"',
      ejemplo_registro: {
        url: 'POST /api/auth/register',
        body: {
          email: 'alumno@ejemplo.com',
          password: 'password123',
          name: 'Juan Pérez',
          role: 'student'
        }
      },
      ejemplo_login: {
        url: 'POST /api/auth/login',
        body: {
          email: 'alumno@ejemplo.com',
          password: 'password123'
        }
      }
    }
  });
});


app.use('*', (req, res) => {
  console.log(`⚠️  Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    suggestion: 'Visita GET /api/endpoints para ver todas las rutas disponibles',
    quick_links: [
      { method: 'GET', url: '/api', description: 'Raíz del API' },
      { method: 'GET', url: '/api/health', description: 'Verificar estado' },
      { method: 'GET', url: '/api/endpoints', description: 'Lista completa de endpoints' }
    ]
  });
});


app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err.message);
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Contacta al administrador',
    timestamp: new Date().toISOString()
  });
});


connectDB().then(() => {
  console.log('✅ MongoDB Conectado');
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? '✅ Conectado' : '❌ Error'}`);
    
    console.log('\n🎯 ENDPOINTS PRINCIPALES:');
    console.log('='.repeat(50));
    console.log(`📊 GET  http://localhost:${PORT}/api           → Raíz del API`);
    console.log(`❤️  GET  http://localhost:${PORT}/api/health    → Health Check`);
    console.log(`📋 GET  http://localhost:${PORT}/api/endpoints → Lista de endpoints`);
    console.log('='.repeat(50));
    
    console.log('\n👤 AUTENTICACIÓN:');
    console.log(`📝 POST http://localhost:${PORT}/api/auth/register → Registrar usuario`);
    console.log(`🔑 POST http://localhost:${PORT}/api/auth/login    → Iniciar sesión`);
    
    console.log('\n🎓 ESTUDIANTES:');
    console.log(`👤 GET  http://localhost:${PORT}/api/students/me → Mi perfil (necesita token)`);
    
    console.log('\n💡 CONSEJO:');
    console.log('1. Primero prueba /api/health');
    console.log('2. Luego registra un usuario en /api/auth/register');
    console.log('3. Haz login en /api/auth/login y guarda el token');
    console.log('4. Usa el token para acceder a rutas protegidas');
    console.log('\n⚡ ¡Listo para probar!');
  });
  
 
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Ctrl+C recibido. Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  });
}).catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
  process.exit(1);
});

export default app;


