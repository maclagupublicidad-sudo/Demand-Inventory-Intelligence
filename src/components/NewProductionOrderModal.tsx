import React, { useState } from 'react';
import { X, Plus, Factory, Layers, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { Garment, ProductionOrder } from '../types';

interface NewProductionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  garments: Garment[];
  onSaveOrder: (newOrder: ProductionOrder) => void;
  nextOrderIndex: number;
}

export const NewProductionOrderModal: React.FC<NewProductionOrderModalProps> = ({
  isOpen,
  onClose,
  garments,
  onSaveOrder,
  nextOrderIndex,
}) => {
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(
    garments.length > 0 ? garments[0].id : ''
  );
  const selectedGarment = garments.find((g) => g.id === selectedGarmentId);

  const [orderNumber, setOrderNumber] = useState<string>(
    `OP-2026-${String(nextOrderIndex + 1).padStart(3, '0')}`
  );
  const [batchLotNumber, setBatchLotNumber] = useState<string>(
    `LOTE-${selectedGarment?.sku.slice(0, 4) || 'GEN'}-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [unitsTarget, setUnitsTarget] = useState<number>(
    selectedGarment?.targetSales || 150
  );
  const [assignedPlant, setAssignedPlant] = useState<string>('Taller Central - Confección');
  const [priority, setPriority] = useState<'Normal' | 'Alta' | 'Urgente'>('Normal');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 20);
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>(
    futureDate.toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGarment) return;

    const newOrder: ProductionOrder = {
      id: `op-${Date.now()}`,
      orderNumber: orderNumber.trim(),
      garmentId: selectedGarment.id,
      garmentSku: selectedGarment.sku,
      garmentName: selectedGarment.name,
      batchLotNumber: batchLotNumber.trim(),
      unitsTarget: Number(unitsTarget),
      unitsCut: 0,
      unitsSewn: 0,
      unitsFinished: 0,
      unitsDefective: 0,
      status: 'Programada',
      assignedPlant: assignedPlant.trim(),
      startDate,
      targetCompletionDate,
      priority,
      notes: notes.trim(),
      stageLogs: [
        {
          id: `log-init-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: 'Programación',
          unitsProcessed: Number(unitsTarget),
          operatorOrWorkshop: assignedPlant.trim(),
          notes: 'Orden de Producción programada y habilitada para corte.',
          recordedBy: 'Sistema MRP',
        },
      ],
      scrapLogs: [],
    };

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211D]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Lanzar Nueva Orden de Producción (OP)
              </h3>
              <p className="text-[11px] text-[#5F6B61]">
                Programar lote de confección en taller propio o satélite maquila
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#F2EEE6] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1C211D] mb-1.5">
              Prenda / Modelo a Fabricar
            </label>
            <select
              value={selectedGarmentId}
              onChange={(e) => {
                setSelectedGarmentId(e.target.value);
                const g = garments.find((item) => item.id === e.target.value);
                if (g) {
                  setUnitsTarget(g.targetSales || 150);
                  setBatchLotNumber(`LOTE-${g.sku.slice(0, 4)}-${String(Math.floor(Math.random() * 900) + 100)}`);
                }
              }}
              className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3.5 py-2.5 text-xs text-[#1C211D] font-semibold focus:outline-hidden focus:border-[#3A5A40]"
              required
            >
              {garments.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.sku} — {g.name} ({g.category}) • Meta: {g.targetSales} u
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Número de OP
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Lote de Trazabilidad
              </label>
              <input
                type="text"
                value={batchLotNumber}
                onChange={(e) => setBatchLotNumber(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs font-mono text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Unidades a Producir
              </label>
              <input
                type="number"
                min="1"
                value={unitsTarget}
                onChange={(e) => setUnitsTarget(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs font-bold text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] font-medium focus:outline-hidden focus:border-[#3A5A40]"
              >
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Taller Asignado
              </label>
              <select
                value={assignedPlant}
                onChange={(e) => setAssignedPlant(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] font-medium focus:outline-hidden focus:border-[#3A5A40]"
              >
                <option value="Taller Central - Confección">Taller Propio Central</option>
                <option value="Satélite Confecciones Belén">Satélite Belén</option>
                <option value="Satélite Confecciones Itagüí">Satélite Itagüí</option>
                <option value="Satélite Confecciones Bello">Satélite Bello</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Fecha de Inicio de Corte
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Fecha Meta de Entrega
              </label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C211D] mb-1">
              Instrucciones Especiales / Notas de Lote
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Revisar aplomo de manga y cuidar tensión en costura francesa."
              className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E6E1D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F2EEE6] hover:bg-[#E6E1D8] text-[#1C211D] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Lanzar Orden a Producción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
