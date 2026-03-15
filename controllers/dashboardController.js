import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Event from '../models/Event.js';
import Charge from '../models/Charge.js';

export const getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalEstudiantes = await Student.countDocuments({ activo: true });

    const [ingresosPayments, ingresosCharges] = await Promise.all([
      Payment.aggregate([
        { $match: { paid: true, paymentDate: { $gte: startOfMonth, $lte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Charge.aggregate([
        { $match: { paid: true, paymentDate: { $gte: startOfMonth, $lte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
    ]);

    // DEBUG TEMPORAL — borrar después de verificar
    console.log('💰 ingresosPayments:', ingresosPayments)
    console.log('💰 ingresosCharges:', ingresosCharges)

    // Si los cargos tienen paymentDate null, los sumamos igual
    const chargesSinFecha = await Charge.aggregate([
      { $match: { paid: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    console.log('💰 Charges pagados (sin filtro fecha):', chargesSinFecha)

    const ingresosMes = (ingresosPayments[0]?.total || 0) + (ingresosCharges[0]?.total || 0);

    const eventosMes = await Event.countDocuments({
      date: { $gte: startOfMonth, $lte: today }
    });

    const [alertasPagos, alertasCharges] = await Promise.all([
      Payment.countDocuments({ paid: false, dueDate: { $lt: today } }),
      Charge.countDocuments({ paid: false, dueDate: { $lt: today } }),
    ]);

    res.json({
      success: true,
      data: {
        totalEstudiantes,
        ingresosMes,
        eventosMes,
        alertasActivas: alertasPagos + alertasCharges
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

export const getMartialArtsDistribution = async (req, res) => {
  try {
    const totalActivos = await Student.countDocuments({ activo: true });

    const distribution = await Student.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$arteMarcial', count: { $sum: 1 } } },
      {
        $project: {
          arte_marcial: '$_id',
          cantidad: '$count',
          porcentaje: {
            $multiply: [{ $divide: ['$count', totalActivos || 1] }, 100]
          }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);

    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error('Error al obtener distribución:', error);
    res.status(500).json({ success: false, message: 'Error al obtener distribución' });
  }
};

export const getPaymentsStatus = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [pagadosMes, pendientesMes, vencidos] = await Promise.all([
      Payment.aggregate([
        { $match: { paid: true, paymentDate: { $gte: startOfMonth, $lte: today } } },
        { $group: { _id: null, cantidad: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { paid: false, dueDate: { $gte: startOfMonth, $lte: today } } },
        { $group: { _id: null, cantidad: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { paid: false, dueDate: { $lt: today } } },
        { $group: { _id: null, cantidad: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
    ]);

    const [chargesPagados, chargesPendientes, chargesVencidos] = await Promise.all([
      Charge.aggregate([
        { $match: { paid: true, paymentDate: { $gte: startOfMonth, $lte: today } } },
        { $group: { _id: null, cantidad: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Charge.aggregate([
        { $match: { paid: false, dueDate: { $gte: startOfMonth, $lte: today } } },
        { $group: { _id: null, cantidad: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Charge.aggregate([
        { $match: { paid: false, dueDate: { $lt: today } } },
        { $group: { _id: null, cantidad: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
    ]);

    res.json({
      success: true,
      data: {
        pagados: {
          cantidad: (pagadosMes[0]?.cantidad || 0) + (chargesPagados[0]?.cantidad || 0),
          total:    (pagadosMes[0]?.total    || 0) + (chargesPagados[0]?.total    || 0),
        },
        pendientes: {
          cantidad: (pendientesMes[0]?.cantidad || 0) + (chargesPendientes[0]?.cantidad || 0),
          total:    (pendientesMes[0]?.total    || 0) + (chargesPendientes[0]?.total    || 0),
        },
        vencidos: {
          cantidad: (vencidos[0]?.cantidad || 0) + (chargesVencidos[0]?.cantidad || 0),
          total:    (vencidos[0]?.total    || 0) + (chargesVencidos[0]?.total    || 0),
        },
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de pagos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estado de pagos' });
  }
};

export const getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const today = new Date();

    const events = await Event.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .select('title description date type location martialArt');

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener eventos' });
  }
};

export const getActiveAlerts = async (req, res) => {
  try {
    const today = new Date();

    const [pagosPendientes, cargosPendientes] = await Promise.all([
      Payment.find({ paid: false, dueDate: { $lt: today } })
        .populate('student', 'fullName')
        .sort({ dueDate: 1 })
        .limit(5),
      Charge.find({ paid: false, dueDate: { $lt: today } })
        .populate('student', 'fullName')
        .sort({ dueDate: 1 })
        .limit(5),
    ]);

    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    const eventosProximos = await Event.find({
      date: { $gte: today, $lte: weekFromNow }
    }).sort({ date: 1 }).limit(5);

    res.json({
      success: true,
      data: {
        pagosPendientes,
        cargosPendientes,
        eventosProximos,
        total: pagosPendientes.length + cargosPendientes.length + eventosProximos.length
      }
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener alertas' });
  }
};

export const getRecentStudents = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const students = await Student.find({ activo: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('fullName arteMarcial cinturonActual categoria telefono createdAt')
      .populate('user', 'email');

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate('user', 'email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    if (req.user.role !== 'admin' && student.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const currentYear = new Date().getFullYear();

    const [payments, charges, events] = await Promise.all([
      Payment.find({ student: id, year: currentYear }).sort({ month: -1 }),
      Charge.find({ student: id }).sort({ createdAt: -1 }),
      Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
    ]);

    res.json({
      success: true,
      data: {
        perfil: {
          nombre:           student.fullName,
          arteMarcial:      student.arteMarcial,
          cinturon:         student.cinturonActual,
          proximoExamen:    student.fechaProximoExamen,
          federado:         student.informacionFederacion?.federadoActual ?? false,
          numeroFederacion: student.informacionFederacion?.numeroLicencia
        },
        pagos:      payments,
        cargos:     charges,
        eventos:    events,
        progresion: student.historialCinturones || []
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard del estudiante:', error);
    res.status(500).json({ success: false, message: 'Error al obtener dashboard del estudiante' });
  }
};