import React, { useState } from 'react';
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Package,
  ShoppingCart,
  ExternalLink,
} from 'lucide-react';
import { UnifiedDatabase } from '../services/unifiedDatabase';
import { TablaProveedor } from '../types/database';

export const SuppliersManager: React.FC = () => {
  const [suppliers, setSuppliers] = useState<TablaProveedor[]>(() => UnifiedDatabase.getProveedores());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<TablaProveedor | null>(null);

  // Form states
  const [nombre, setNombre] = useState<string>('');
  const [contacto, setContacto] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('Medellín, Antioquia');
  const [tiempoEntrega, setTiempoEntrega] = useState<number>(10);
  const [observaciones, setObservaciones] = useState<string>('');

  const materials = UnifiedDatabase.getMateriasPrimas();
  const purchaseOrders = UnifiedDatabase.getOrdenesCompra();

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.nombre_proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contacto && s.contacto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.ciudad && s.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (supplier?: TablaProveedor) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setNombre(supplier.nombre_proveedor);
      setContacto(supplier.contacto || '');
      setTelefono(supplier.telefono || '');
      setEmail(supplier.email || '');
      setCiudad(supplier.ciudad || 'Medellín, Antioquia');
      setTiempoEntrega(supplier.tiempo_entrega_dias);
      setObservaciones(supplier.observaciones || '');
    } else {
      setEditingSupplier(null);
      setNombre('');
      setContacto('');
      setTelefono('');
      setEmail('');
      setCiudad('Medellín, Antioquia');
      setTiempoEntrega(10);
      setObservaciones('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const newSupplier: TablaProveedor = {
      id_proveedor: editingSupplier?.id_proveedor || `prov-${Date.now()}`,
      nombre_proveedor: nombre.trim(),
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      ciudad: ciudad.trim(),
      tiempo_entrega_dias: Number(tiempoEntrega),
      estado: 'Activo',
      observaciones: observaciones.trim(),
    };

    UnifiedDatabase.saveProveedor(newSupplier);
    setSuppliers(UnifiedDatabase.getProveedores());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6E1D8] p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#1C211D]">
                Directorio Maestro de Proveedores Textiles
              </h2>
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                {suppliers.length} Registrados
              </span>
            </div>
            <p className="text-xs text-[#5F6B61]">
              Gestione proveedores de telas, hilos, elásticos, avíos, estampación y empaques en Colombia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#8F9990] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por proveedor, contacto o ciudad..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((prov) => {
          const suppliedMaterials = materials.filter(
            (m) => m.Proveedor.toLowerCase() === prov.nombre_proveedor.toLowerCase()
          );
          const activeOrders = purchaseOrders.filter(
            (po) => po.nombre_proveedor.toLowerCase() === prov.nombre_proveedor.toLowerCase()
          );

          return (
            <div
              key={prov.id_proveedor}
              className="bg-white border border-[#E6E1D8] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#1C211D] leading-snug">
                      {prov.nombre_proveedor}
                    </h3>
                    <span className="inline-block px-2 py-0.5 bg-[#FAF8F5] border border-[#E6E1D8] text-[10px] text-[#5F6B61] rounded-md font-medium">
                      {prov.ciudad || 'Colombia'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenModal(prov)}
                    className="p-1.5 hover:bg-[#FAF8F5] rounded-lg text-[#5F6B61] hover:text-[#1C211D] transition-colors cursor-pointer"
                    title="Editar Proveedor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-[#5F6B61] pt-2 border-t border-[#F2EEE6]">
                  {prov.contacto && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#8F9990]">Contacto:</span>
                      <strong className="text-[#1C211D]">{prov.contacto}</strong>
                    </div>
                  )}
                  {prov.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#8F9990]" />
                      <span className="font-mono text-[#1C211D]">{prov.telefono}</span>
                    </div>
                  )}
                  {prov.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#8F9990]" />
                      <span className="truncate text-[#3A5A40]">{prov.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8F9990]" />
                    <span>Lead time entrega: <strong>{prov.tiempo_entrega_dias} días</strong></span>
                  </div>
                </div>

                {prov.observaciones && (
                  <p className="text-[11px] text-[#8F9990] italic bg-[#FAF8F5] p-2 rounded-lg border border-[#F2EEE6]">
                    "{prov.observaciones}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F2EEE6] flex items-center justify-between text-xs">
                <span className="text-[#5F6B61]">
                  Insumos suministrados: <strong>{suppliedMaterials.length}</strong>
                </span>
                <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full">
                  {activeOrders.length} OC emitidas
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal New / Edit Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211D]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1C211D]">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5F6B61] hover:text-[#1C211D] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Textiles Lafayette S.A.S."
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Persona de Contacto</label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Ej: Laura Ramírez"
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Ciudad / Región</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Medellín, Antioquia"
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +57 (4) 444-0000"
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ventas@proveedor.com"
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Tiempo de Entrega Estándar (Días Lead Time)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={tiempoEntrega}
                  onChange={(e) => setTiempoEntrega(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Observaciones / Catálogo de Productos</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre líneas de telas, acabados especiales o condiciones de pago..."
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
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
