import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  DollarSign,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  Scissors,
  Check,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { RawMaterial, Garment, MaterialCategory } from '../types';
import { formatCOP } from '../utils/formatters';
import { MaterialModal } from './MaterialModal';

interface RawMaterialsManagerProps {
  materials: RawMaterial[];
  garments: Garment[];
  onAddMaterial: (material: RawMaterial) => void;
  onUpdateMaterial: (material: RawMaterial) => void;
  onToggleMaterialActive: (materialId: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onOpenCSVModal?: () => void;
}

export const RawMaterialsManager: React.FC<RawMaterialsManagerProps> = ({
  materials,
  garments,
  onAddMaterial,
  onUpdateMaterial,
  onToggleMaterialActive,
  onDeleteMaterial,
  onOpenCSVModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedMaterialForUsage, setSelectedMaterialForUsage] = useState<RawMaterial | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Category counts
  const categoriesList: { key: string; label: string; count: number }[] = useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

    return [
      { key: 'ALL', label: 'Todas las Categorías', count: materials.length },
      { key: 'Tela', label: 'Telas / Tejidos', count: counts['Tela'] || 0 },
      { key: 'Hilo', label: 'Hilos / Hilados', count: counts['Hilo'] || 0 },
      { key: 'Empaque / Etiqueta', label: 'Empaque / Etiquetas', count: counts['Empaque / Etiqueta'] || 0 },
      { key: 'Avío / Fornitura', label: 'Avíos / Fornituras', count: counts['Avío / Fornitura'] || 0 },
      { key: 'Botón / Broche', label: 'Botones / Broches', count: counts['Botón / Broche'] || 0 },
      { key: 'Cremallera', label: 'Cremalleras / Cierres', count: counts['Cremallera'] || 0 },
      { key: 'Entretela', label: 'Entretelas', count: counts['Entretela'] || 0 },
    ];
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const isAct = m.isActive !== false;
      if (statusFilter === 'ACTIVE' && !isAct) return false;
      if (statusFilter === 'INACTIVE' && isAct) return false;

      if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchSku = m.sku.toLowerCase().includes(query);
        const matchName = m.name.toLowerCase().includes(query);
        const matchSup = m.supplierName?.toLowerCase().includes(query);
        const matchColor = m.color?.toLowerCase().includes(query);
        if (!matchSku && !matchName && !matchSup && !matchColor) return false;
      }

      return true;
    });
  }, [materials, searchTerm, categoryFilter, statusFilter]);

  // Statistics
  const totalValuation = useMemo(() => {
    return materials.reduce((acc, m) => acc + (m.currentStock * m.unitCost), 0);
  }, [materials]);

  const activeCount = useMemo(() => {
    return materials.filter((m) => m.isActive !== false).length;
  }, [materials]);

  const inactiveCount = materials.length - activeCount;

  // Garment usage map
  const getGarmentsUsingMaterial = (materialId: string) => {
    return garments.filter((g) => g.bom.some((b) => b.rawMaterialId === materialId || b.rawMaterialName.toLowerCase() === materials.find(m => m.id === materialId)?.name.toLowerCase()));
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: RawMaterial) => {
    setEditingMaterial(mat);
    setIsModalOpen(true);
  };

  const handleSave = (material: RawMaterial) => {
    if (editingMaterial) {
      onUpdateMaterial(material);
    } else {
      onAddMaterial(material);
    }
  };

  const exportCSV = () => {
    const headers = [
      'SKU',
      'Nombre',
      'Categoria',
      'Unidad',
      'Stock Actual',
      'En Transito',
      'Costo Unitario COP',
      'MOQ Lote Minimo',
      'Lead Time Dias',
      'Proveedor',
      'Color',
      'Estado',
    ];

    const rows = materials.map((m) => [
      `"${m.sku}"`,
      `"${m.name}"`,
      `"${m.category}"`,
      `"${m.unit}"`,
      m.currentStock,
      m.inTransitStock || 0,
      m.unitCost,
      m.minOrderQuantity,
      m.leadTimeDays,
      `"${m.supplierName}"`,
      `"${m.color || ''}"`,
      m.isActive !== false ? 'Activo' : 'Desactivado',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maestro_Materias_Primas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>Total Insumos</span>
            <Package className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {materials.length}
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5 flex items-center gap-1.5">
            <span className="text-emerald-700 font-bold">{activeCount} activos</span>
            {inactiveCount > 0 && <span className="text-stone-500">• {inactiveCount} inactivos</span>}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>Valoración Inventario</span>
            <DollarSign className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D] truncate font-mono">
            {formatCOP(totalValuation, false)}
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5">
            Costo total en bodega COP
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>Telas & Tejidos</span>
            <Scissors className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {materials.filter((m) => m.category === 'Tela').length}
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5">
            Tejido plano y circular
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>Avíos, Hilos & Empaques</span>
            <Tag className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {materials.filter((m) => m.category !== 'Tela').length}
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5">
            Botones, cremalleras, hilos y bolsas
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FCFBF9]">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3A5A40]" />
              <h3 className="text-base font-bold text-[#1C211D]">
                Gestión Integral de Materias Primas & Insumos
              </h3>
            </div>
            <p className="text-xs text-[#5F6B61] mt-0.5">
              Registre, edite, consulte y active/desactive telas, hilos, etiquetas, empaques, botones y demás materiales textiles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {onOpenCSVModal && (
              <button
                onClick={onOpenCSVModal}
                className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C211D] border border-[#D5CEC2] rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                id="btn-materials-import-csv"
                title="Importar catálogo desde archivo CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#3A5A40]" />
                <span>Importar CSV</span>
              </button>
            )}

            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C211D] border border-[#D5CEC2] rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Descargar listado completo de materias primas en CSV"
            >
              <Download className="w-4 h-4 text-[#5F6B61]" />
              <span>Exportar</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              id="btn-add-raw-material-action"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Materia Prima</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8F9990] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre, proveedor o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
            >
              {categoriesList.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Solo Insumos Activos</option>
              <option value="INACTIVE">Solo Desactivados</option>
            </select>
          </div>
        </div>

        {/* Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#5F6B61] font-bold border-b border-[#E6E1D8] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">SKU / Insumo</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5 text-right">Stock Actual</th>
                <th className="p-3.5 text-right">En Tránsito</th>
                <th className="p-3.5 text-right">Costo Unitario</th>
                <th className="p-3.5 text-right">MOQ</th>
                <th className="p-3.5">Proveedor & Lead Time</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center">Dónde se usa</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEE6]">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center">
                    <div className="space-y-2.5 max-w-sm mx-auto">
                      <Package className="w-10 h-10 text-[#D5CEC2] mx-auto" />
                      <div className="text-sm font-bold text-[#1C211D]">
                        No se encontraron materias primas
                      </div>
                      <p className="text-xs text-[#5F6B61]">
                        {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'Pruebe ajustando los filtros de búsqueda o categoría.'
                          : 'Comience registrando telas, hilos, etiquetas y botones para su producción.'}
                      </p>
                      <button
                        onClick={handleOpenCreate}
                        className="px-3.5 py-1.5 bg-[#3A5A40] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Registrar Insumo
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isActive = mat.isActive !== false;
                  const usingGarments = getGarmentsUsingMaterial(mat.id);

                  return (
                    <tr
                      key={mat.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        !isActive ? 'bg-stone-50/60 opacity-75' : ''
                      }`}
                    >
                      {/* SKU & Name */}
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-[#3A5A40] uppercase">
                          {mat.sku}
                        </div>
                        <div className="font-bold text-[#1C211D] text-xs mt-0.5">
                          {mat.name}
                        </div>
                        {mat.color && (
                          <div className="text-[10px] text-[#5F6B61] flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#8F9990]"></span>
                            Color/Tono: {mat.color}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-[#F2EEE6] text-[#5F6B61] rounded text-[10px] font-semibold">
                          {mat.category}
                        </span>
                        {mat.widthMeters && (
                          <div className="text-[10px] text-[#8F9990] mt-0.5">
                            Ancho: {mat.widthMeters}m
                          </div>
                        )}
                      </td>

                      {/* Stock Actual */}
                      <td className="p-3.5 text-right font-bold text-[#1C211D]">
                        <div className="text-xs">
                          {mat.currentStock.toLocaleString()} <span className="text-[10px] font-normal text-[#5F6B61]">{mat.unit}</span>
                        </div>
                        <div className="text-[10px] text-[#8F9990] font-normal">
                          {formatCOP(mat.currentStock * mat.unitCost, false)}
                        </div>
                      </td>

                      {/* In Transit */}
                      <td className="p-3.5 text-right font-medium">
                        {mat.inTransitStock > 0 ? (
                          <span className="text-[#3A5A40] font-bold">
                            +{mat.inTransitStock.toLocaleString()} {mat.unit}
                          </span>
                        ) : (
                          <span className="text-[#8F9990]">-</span>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="p-3.5 text-right font-bold text-[#1C211D]">
                        <div>{formatCOP(mat.unitCost, false)}</div>
                        <div className="text-[10px] font-normal text-[#8F9990]">/ {mat.unit}</div>
                      </td>

                      {/* MOQ */}
                      <td className="p-3.5 text-right text-[#5F6B61]">
                        <span className="font-semibold">{mat.minOrderQuantity}</span> {mat.unit}
                      </td>

                      {/* Supplier & Lead Time */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[#1C211D] truncate max-w-[150px]">
                          {mat.supplierName || 'Sin asignar'}
                        </div>
                        <div className="text-[10px] text-[#5F6B61] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#8F9990]" />
                          <span>{mat.leadTimeDays} días de entrega</span>
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onToggleMaterialActive(mat.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                          title={isActive ? 'Haga clic para desactivar insumo' : 'Haga clic para reactivar insumo'}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-stone-500" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Where Used Button */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedMaterialForUsage(mat)}
                          className={`px-2 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors ${
                            usingGarments.length > 0
                              ? 'bg-[#EBF2EC] text-[#233829] hover:bg-[#D4E3D7]'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                          title="Ver en qué prendas se consume este insumo"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>{usingGarments.length} {usingGarments.length === 1 ? 'prenda' : 'prendas'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(mat)}
                            className="p-1.5 text-[#5F6B61] hover:text-[#3A5A40] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                            title="Editar materia prima"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Desea eliminar la materia prima "${mat.name}" [${mat.sku}]?`)) {
                                onDeleteMaterial(mat.id);
                              }
                            }}
                            className="p-1.5 text-[#8F9990] hover:text-[#B33927] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Where-Used / Dónde se usa */}
      {selectedMaterialForUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-xl font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1C211D]">
                    Prendas que utilizan este Insumo
                  </h4>
                  <p className="text-xs text-[#5F6B61] font-mono">
                    {selectedMaterialForUsage.sku} - {selectedMaterialForUsage.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMaterialForUsage(null)}
                className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              {getGarmentsUsingMaterial(selectedMaterialForUsage.id).length === 0 ? (
                <div className="p-6 text-center text-[#5F6B61]">
                  Este insumo no está vinculado en la Ficha Técnica (BOM) de ninguna prenda actualmente.
                </div>
              ) : (
                getGarmentsUsingMaterial(selectedMaterialForUsage.id).map((g) => {
                  const bomItem = g.bom.find(
                    (b) =>
                      b.rawMaterialId === selectedMaterialForUsage.id ||
                      b.rawMaterialName.toLowerCase() === selectedMaterialForUsage.name.toLowerCase()
                  );
                  const netConsumption = bomItem?.quantityPerGarment || 0;
                  const waste = bomItem?.wastePercent || 0;
                  const grossConsumption = netConsumption * (1 + waste / 100);
                  const totalDemandForCycle = grossConsumption * g.targetSales;

                  return (
                    <div
                      key={g.id}
                      className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C211D] text-xs">{g.name}</span>
                        <span className="px-2 py-0.5 bg-[#EAE6DF] text-[#5F6B61] rounded text-[10px] font-mono font-bold">
                          {g.sku}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#EAE6DF]">
                        <div>
                          <span className="text-[#5F6B61] block">Consumo Unitario:</span>
                          <span className="font-bold text-[#1C211D]">
                            {netConsumption} {selectedMaterialForUsage.unit}/prenda
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5F6B61] block">Merma (%):</span>
                          <span className="font-bold text-[#1C211D]">{waste}%</span>
                        </div>
                        <div>
                          <span className="text-[#5F6B61] block">Demanda Ciclo:</span>
                          <span className="font-bold text-[#3A5A40]">
                            {totalDemandForCycle.toFixed(1)} {selectedMaterialForUsage.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-[#E6E1D8] bg-[#FCFBF9] text-right">
              <button
                onClick={() => setSelectedMaterialForUsage(null)}
                className="px-4 py-1.5 bg-[#3A5A40] text-white rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Modal for Create / Edit */}
      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMaterial(null);
        }}
        onSaveMaterial={handleSave}
        materialToEdit={editingMaterial}
      />
    </div>
  );
};
