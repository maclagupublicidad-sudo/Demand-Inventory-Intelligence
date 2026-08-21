import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Tag,
  Factory,
  Save,
} from 'lucide-react';
import {
  ProductionOrder,
  ProductionStage,
  ScrapVarianceReason,
  Garment,
  RawMaterial,
  MaterialScrapLog,
  ProductionStageLog,
} from '../types';

interface RecordStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  productionOrders: ProductionOrder[];
  selectedOrderId?: string;
  garments: Garment[];
  rawMaterials: RawMaterial[];
  onSaveProgress: (
    orderId: string,
    stageLog: ProductionStageLog,
    scrapLog?: MaterialScrapLog,
    updatedCounts?: {
      unitsCut?: number;
      unitsSewn?: number;
      unitsFinished?: number;
      unitsDefective?: number;
    }
  ) => void;
  currentUser: { name: string; username: string };
}

export const RecordStageModal: React.FC<RecordStageModalProps> = ({
  isOpen,
  onClose,
  productionOrders,
  selectedOrderId,
  garments,
  rawMaterials,
  onSaveProgress,
  currentUser,
}) => {
  const [orderId, setOrderId] = useState<string>(
    selectedOrderId || (productionOrders.length > 0 ? productionOrders[0].id : '')
  );

  const selectedOrder = productionOrders.find((o) => o.id === orderId);
  const selectedGarment = garments.find((g) => g.id === selectedOrder?.garmentId || g.sku === selectedOrder?.garmentSku);

  const [stage, setStage] = useState<ProductionStage>('Corte');
  const [unitsProcessed, setUnitsProcessed] = useState<number>(selectedOrder?.unitsTarget || 100);
  const [unitsDefective, setUnitsDefective] = useState<number>(0);
  const [operatorOrWorkshop, setOperatorOrWorkshop] = useState<string>(
    selectedOrder?.assignedPlant || 'Taller Central - Corte'
  );
  const [notes, setNotes] = useState<string>('');

  // Scrap / Merma Real Fields
  const [recordScrap, setRecordScrap] = useState<boolean>(true);
  const fabricBOMItems = selectedGarment?.bom.filter((b) => b.category === 'Tela') || [];
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    fabricBOMItems.length > 0 ? fabricBOMItems[0].rawMaterialId : ''
  );

  const targetMaterial = rawMaterials.find((m) => m.id === selectedMaterialId);
  const targetBOM = selectedGarment?.bom.find((b) => b.rawMaterialId === selectedMaterialId);

  // Calculate standard theoretical meters
  const theoreticalQty = targetBOM
    ? Number((targetBOM.quantityPerGarment * unitsProcessed).toFixed(2))
    : 0;

  const [actualConsumedQty, setActualConsumedQty] = useState<number>(
    Number((theoreticalQty * (1 + (targetBOM?.wastePercent || 5) / 100)).toFixed(2))
  );

  const [scrapReason, setScrapReason] = useState<ScrapVarianceReason>('Consumo estándar exacto');

  if (!isOpen) return null;

  // Real-time calculation of scrap % and variance COP
  const theoreticalStandardScrapPercent = targetBOM?.wastePercent || 5.0;
  const actualScrapPercent =
    theoreticalQty > 0
      ? Number((((actualConsumedQty - theoreticalQty) / theoreticalQty) * 100).toFixed(2))
      : theoreticalStandardScrapPercent;

  const varianceQty = Number((actualConsumedQty - theoreticalQty * (1 + theoreticalStandardScrapPercent / 100)).toFixed(2));
  const unitCost = targetMaterial?.unitCost || 18500;
  const varianceCostCOP = Math.round(varianceQty * unitCost);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const newStageLog: ProductionStageLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage,
      unitsProcessed: Number(unitsProcessed),
      unitsDefective: Number(unitsDefective),
      operatorOrWorkshop: operatorOrWorkshop.trim(),
      notes: notes.trim(),
      recordedBy: currentUser.name || currentUser.username,
    };

    let newScrapLog: MaterialScrapLog | undefined = undefined;

    if (recordScrap && targetMaterial && targetBOM) {
      newScrapLog = {
        id: `scrap-${Date.now()}`,
        rawMaterialId: targetMaterial.id,
        rawMaterialSku: targetMaterial.sku,
        rawMaterialName: targetMaterial.name,
        category: targetMaterial.category,
        unit: targetMaterial.unit,
        unitsProduced: Number(unitsProcessed),
        theoreticalConsumption: theoreticalQty,
        actualConsumption: Number(actualConsumedQty),
        standardScrapPercent: theoreticalStandardScrapPercent,
        actualScrapPercent: actualScrapPercent,
        varianceQty,
        unitCostCOP: unitCost,
        varianceCostCOP,
        reason: scrapReason,
        recordedAt: new Date().toISOString(),
        lotNumber: selectedOrder.batchLotNumber,
      };
    }

    const updatedCounts: any = {};
    if (stage === 'Corte') {
      updatedCounts.unitsCut = Math.max(selectedOrder.unitsCut, Number(unitsProcessed));
    } else if (stage === 'Confección') {
      updatedCounts.unitsSewn = Math.max(selectedOrder.unitsSewn, Number(unitsProcessed));
    } else if (stage === 'Calidad' || stage === 'Empaque' || stage === 'Lavandería / Acabados') {
      updatedCounts.unitsFinished = Math.max(selectedOrder.unitsFinished, Number(unitsProcessed));
      if (unitsDefective > 0) {
        updatedCounts.unitsDefective = (selectedOrder.unitsDefective || 0) + Number(unitsDefective);
      }
    }

    onSaveProgress(selectedOrder.id, newStageLog, newScrapLog, updatedCounts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211D]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Registrar Avance en Planta & Consumo Real
              </h3>
              <p className="text-[11px] text-[#5F6B61]">
                Control de piso (MES), reporte de etapas y auditoría de mermas en tiempo real
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

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* 1. Seleccionar Orden de Producción */}
          <div>
            <label className="block text-xs font-bold text-[#1C211D] mb-1.5">
              Orden de Producción (OP) Activa
            </label>
            <select
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                const op = productionOrders.find((o) => o.id === e.target.value);
                if (op) {
                  setUnitsProcessed(op.unitsTarget);
                  setOperatorOrWorkshop(op.assignedPlant || 'Taller Central');
                }
              }}
              className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3.5 py-2.5 text-xs text-[#1C211D] font-medium focus:outline-hidden focus:border-[#3A5A40] focus:ring-1 focus:ring-[#3A5A40]"
              required
            >
              {productionOrders.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.orderNumber} • {op.garmentName} ({op.batchLotNumber}) — Meta: {op.unitsTarget} u [{op.status}]
                </option>
              ))}
            </select>
          </div>

          {/* 2. Grid de Etapa, Unidades y Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Etapa Operativa
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProductionStage)}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] font-medium focus:outline-hidden focus:border-[#3A5A40]"
              >
                <option value="Corte">1. Corte de Tela</option>
                <option value="Confección">2. Confección / Ensamble</option>
                <option value="Lavandería / Acabados">3. Acabados / Plancha</option>
                <option value="Calidad">4. Control Calidad (QC)</option>
                <option value="Empaque">5. Empaque & Bodega</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Unidades Procesadas
              </label>
              <input
                type="number"
                min="1"
                value={unitsProcessed}
                onChange={(e) => setUnitsProcessed(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs font-bold text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211D] mb-1">
                Segundas / Defectos
              </label>
              <input
                type="number"
                min="0"
                value={unitsDefective}
                onChange={(e) => setUnitsDefective(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs font-bold text-rose-700 focus:outline-hidden focus:border-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C211D] mb-1">
              Taller / Mesa / Operario Responsable
            </label>
            <input
              type="text"
              value={operatorOrWorkshop}
              onChange={(e) => setOperatorOrWorkshop(e.target.value)}
              placeholder="Ej: Mesa 2 - Corte Principal / Satélite Confecciones Belén"
              className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
              required
            />
          </div>

          {/* 3. Sección de Auditoría de Merma Real (BOM vs Real) */}
          <div className="bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#3A5A40]" />
                <span className="text-xs font-bold text-[#1C211D]">
                  Auditoría de Consumo Real de Tela & Mermas
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#5F6B61]">
                <input
                  type="checkbox"
                  checked={recordScrap}
                  onChange={(e) => setRecordScrap(e.target.checked)}
                  className="rounded text-[#3A5A40] focus:ring-[#3A5A40]"
                />
                Registrar consumo en este lote
              </label>
            </div>

            {recordScrap && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#5F6B61] mb-1">
                      Material / Tela a Auditar
                    </label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => {
                        setSelectedMaterialId(e.target.value);
                        const b = selectedGarment?.bom.find((item) => item.rawMaterialId === e.target.value);
                        if (b) {
                          const theo = Number((b.quantityPerGarment * unitsProcessed).toFixed(2));
                          setActualConsumedQty(Number((theo * (1 + (b.wastePercent || 5) / 100)).toFixed(2)));
                        }
                      }}
                      className="w-full bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-xs text-[#1C211D] font-medium focus:outline-hidden focus:border-[#3A5A40]"
                    >
                      {fabricBOMItems.map((bom) => (
                        <option key={bom.rawMaterialId} value={bom.rawMaterialId}>
                          {bom.rawMaterialName} ({bom.quantityPerGarment} {bom.unit}/prenda)
                        </option>
                      ))}
                      {fabricBOMItems.length === 0 && (
                        <option value="">No hay telas en la ficha técnica de esta prenda</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#5F6B61] mb-1">
                      Metros / Unidades Reales Consumidas en Mesa
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={actualConsumedQty}
                        onChange={(e) => setActualConsumedQty(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                      />
                      <span className="text-xs text-[#5F6B61] font-bold">{targetMaterial?.unit || 'm'}</span>
                    </div>
                  </div>
                </div>

                {/* Comparative Metric Bar */}
                <div className="p-3 bg-white rounded-lg border border-[#E6E1D8] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[#5F6B61]">Teórico Ficha (BOM)</div>
                    <div className="font-bold text-[#1C211D]">
                      {theoreticalQty} {targetMaterial?.unit || 'm'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5F6B61]">Merma Teórica</div>
                    <div className="font-bold text-[#5F6B61]">
                      {theoreticalStandardScrapPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5F6B61]">Merma Real Obtenida</div>
                    <div
                      className={`font-bold flex items-center justify-center gap-1 ${
                        actualScrapPercent > theoreticalStandardScrapPercent + 1
                          ? 'text-rose-600'
                          : actualScrapPercent < theoreticalStandardScrapPercent
                          ? 'text-emerald-700'
                          : 'text-[#1C211D]'
                      }`}
                    >
                      {actualScrapPercent > theoreticalStandardScrapPercent ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {actualScrapPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5F6B61]">Impacto Económico</div>
                    <div
                      className={`font-bold text-[11px] ${
                        varianceCostCOP > 0
                          ? 'text-rose-600'
                          : varianceCostCOP < 0
                          ? 'text-emerald-700'
                          : 'text-[#5F6B61]'
                      }`}
                    >
                      {varianceCostCOP > 0 ? '+' : ''}${varianceCostCOP.toLocaleString('es-CO')} COP
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5F6B61] mb-1">
                    Causa Raíz o Justificación de Consumo
                  </label>
                  <select
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value as ScrapVarianceReason)}
                    className="w-full bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-xs text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
                  >
                    <option value="Consumo estándar exacto">Consumo estándar exacto según ficha técnica</option>
                    <option value="Ahorro optimizado en tizada">Ahorro optimizado en tizada y corte computarizado</option>
                    <option value="Fallas en rollo / orillos">Fallas en rollo / orillos defectuosos de proveedor</option>
                    <option value="Merma de trazo / tendido">Merma de trazo / holguras adicionales en tendido manual</option>
                    <option value="Reprocesos costura">Piezas dañadas en confección / reposición de cortes</option>
                    <option value="Descalce de patrones">Descalce de patrones por revirado de tejido</option>
                    <option value="Otro">Otra causa (especificar en observaciones)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Notas adicionales */}
          <div>
            <label className="block text-xs font-bold text-[#1C211D] mb-1">
              Observaciones / Novedades de Turno
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Se completó el tendido de 4 capas sin novedades. Tela en buen estado."
              className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
            />
          </div>

          {/* Actions */}
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
              <Save className="w-4 h-4" />
              Guardar Avance & Consumos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
