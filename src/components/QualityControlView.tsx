import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Factory,
  Scissors,
  Calendar,
  Percent,
} from 'lucide-react';
import { UnifiedDatabase } from '../services/unifiedDatabase';
import { TablaControlCalidad } from '../types/database';

export const QualityControlView: React.FC = () => {
  const [qcList, setQcList] = useState<TablaControlCalidad[]>(() => UnifiedDatabase.getControlCalidad());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form states
  const [orderId, setOrderId] = useState<string>('op-001');
  const [inspected, setInspected] = useState<number>(300);
  const [approved, setApproved] = useState<number>(294);
  const [rejected, setRejected] = useState<number>(6);
  const [reason, setReason] = useState<string>('Salto de puntada en dobladillo inferior');
  const [inspector, setInspector] = useState<string>('Control Calidad - Planta');

  const ops = UnifiedDatabase.getOrdenesProduccion();
  const selectedOP = ops.find((o) => o.id_orden_produccion === orderId);

  const totalInspected = qcList.reduce((s, q) => s + q.cantidad_inspeccionada, 0);
  const totalApproved = qcList.reduce((s, q) => s + q.cantidad_aprobada, 0);
  const totalRejected = qcList.reduce((s, q) => s + q.cantidad_rechazada, 0);
  const avgRejectionRate = totalInspected > 0 ? ((totalRejected / totalInspected) * 100).toFixed(2) : '0';

  const handleInspectedChange = (val: number) => {
    setInspected(val);
    setApproved(Math.max(0, val - rejected));
  };

  const handleRejectedChange = (val: number) => {
    setRejected(val);
    setApproved(Math.max(0, inspected - val));
  };

  const handleSaveQC = (e: React.FormEvent) => {
    e.preventDefault();
    const rejectionPct = inspected > 0 ? Number(((rejected / inspected) * 100).toFixed(2)) : 0;

    const newQC: TablaControlCalidad = {
      id_control: `qc-${Date.now()}`,
      id_orden_produccion: selectedOP?.id_orden_produccion || orderId,
      numero_orden: selectedOP?.numero_orden || 'OP-Manual',
      SKU_Prenda: selectedOP?.SKU_Prenda || 'BH01',
      cantidad_inspeccionada: inspected,
      cantidad_aprobada: approved,
      cantidad_rechazada: rejected,
      porcentaje_rechazo: rejectionPct,
      motivo_rechazo: rejected > 0 ? reason : 'Lote conforme sin defectos',
      responsable: inspector,
      fecha: new Date().toISOString().split('T')[0],
    };

    UnifiedDatabase.addControlCalidad(newQC);
    setQcList(UnifiedDatabase.getControlCalidad());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6E1D8] p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#1C211D]">
                Control de Calidad & Auditoría de Prendas
              </h2>
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                Tasa de Rechazo: {avgRejectionRate}%
              </span>
            </div>
            <p className="text-xs text-[#5F6B61]">
              Inspección de lotes de corte, confección y terminados con trazabilidad a la Orden de Producción.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Inspección
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs">
          <span className="text-xs font-bold text-[#5F6B61]">Total Inspeccionadas</span>
          <p className="text-xl font-black text-[#1C211D] mt-1">{totalInspected.toLocaleString()} prendas</p>
        </div>
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs">
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobadas (1ra Calidad)
          </span>
          <p className="text-xl font-black text-emerald-800 mt-1">{totalApproved.toLocaleString()} prendas</p>
        </div>
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs">
          <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rechazos / Segundas
          </span>
          <p className="text-xl font-black text-rose-800 mt-1">
            {totalRejected.toLocaleString()} prendas ({avgRejectionRate}%)
          </p>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white border border-[#E6E1D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6E1D8] text-[#5F6B61] font-bold">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">OP & Prenda</th>
                <th className="px-4 py-3 text-right">Inspeccionadas</th>
                <th className="px-4 py-3 text-right">Aprobadas</th>
                <th className="px-4 py-3 text-right">Rechazos</th>
                <th className="px-4 py-3 text-right">% Rechazo</th>
                <th className="px-4 py-3">Causa / Observaciones</th>
                <th className="px-4 py-3">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEE6]">
              {qcList.map((qc) => (
                <tr key={qc.id_control} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="px-4 py-3 font-mono text-[#5F6B61] whitespace-nowrap">{qc.fecha}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#1C211D]">{qc.numero_orden}</div>
                    <span className="font-mono text-[10px] text-[#3A5A40]">{qc.SKU_Prenda}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D]">
                    {qc.cantidad_inspeccionada.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">
                    {qc.cantidad_aprobada.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-700 font-bold">
                    {qc.cantidad_rechazada.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        qc.porcentaje_rechazo > 3.0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {qc.porcentaje_rechazo}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5F6B61] max-w-xs">{qc.motivo_rechazo}</td>
                  <td className="px-4 py-3 text-[#5F6B61] whitespace-nowrap">{qc.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add QC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211D]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1C211D]">Registrar Auditoría de Calidad</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#5F6B61] hover:text-[#1C211D] cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQC} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Orden de Producción *</label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden cursor-pointer"
                >
                  {ops.map((o) => (
                    <option key={o.id_orden_produccion} value={o.id_orden_produccion}>
                      {o.numero_orden} — {o.SKU_Prenda} ({o.Nombre_Prenda}) [Lote: {o.cantidad_planificada} unds]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Muestra</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inspected}
                    onChange={(e) => handleInspectedChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-emerald-700">Aprobadas</label>
                  <input
                    type="number"
                    min="0"
                    value={approved}
                    onChange={(e) => setApproved(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-rose-700">Rechazos</label>
                  <input
                    type="number"
                    min="0"
                    value={rejected}
                    onChange={(e) => handleRejectedChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Motivo de Defecto o Rechazo</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Medida de tiro fuera de tolerancia (+1.5cm)"
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Auditor Responsable</label>
                <input
                  type="text"
                  required
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E6E1D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D5CEC2] rounded-xl text-[#5F6B61] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3A5A40] text-white font-bold rounded-xl hover:bg-[#2D4632] cursor-pointer shadow-xs"
                >
                  Guardar Inspección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
