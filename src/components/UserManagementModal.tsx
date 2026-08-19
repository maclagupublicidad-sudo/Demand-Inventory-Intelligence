import React, { useState } from 'react';
import { AppUser, UserRole, PermissionKey } from '../types';
import {
  PERMISSION_DEFINITIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  ALL_PERMISSIONS,
} from '../utils/permissions';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Lock,
  Mail,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser | null;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onToggleUserStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('Personalizado');
  const [formDepartment, setFormDepartment] = useState<string>('Producción');
  const [formPosition, setFormPosition] = useState<string>('Analista');
  const [formPermissions, setFormPermissions] = useState<PermissionKey[]>([]);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormUsername('');
    setFormPassword('textil2026');
    setFormRole('Compras_MRP');
    setFormDepartment(ROLE_LABELS['Compras_MRP'].dept);
    setFormPosition('Coordinador de Área');
    setFormPermissions(ROLE_DEFAULT_PERMISSIONS['Compras_MRP']);
    setFormIsActive(true);
    setIsEditing(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormDepartment(user.department);
    setFormPosition(user.position);
    setFormPermissions([...user.permissions]);
    setFormIsActive(user.isActive);
    setIsEditing(true);
  };

  const handleRolePresetChange = (newRole: UserRole) => {
    setFormRole(newRole);
    if (newRole !== 'Personalizado') {
      setFormPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || []);
      setFormDepartment(ROLE_LABELS[newRole]?.dept || formDepartment);
    }
  };

  const handleTogglePermission = (key: PermissionKey) => {
    setFormPermissions((prev) => {
      const exists = prev.includes(key);
      const updated = exists ? prev.filter((p) => p !== key) : [...prev, key];
      return updated;
    });
  };

  const handleSelectAllPermissions = () => {
    setFormPermissions([...ALL_PERMISSIONS]);
  };

  const handleClearPermissions = () => {
    setFormPermissions([]);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) return;

    const roleMeta = ROLE_LABELS[formRole] || ROLE_LABELS.Personalizado;

    const userToSave: AppUser = {
      id: editingUserId || `USR-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword.trim() || 'textil2026',
      role: formRole,
      department: formDepartment.trim(),
      position: formPosition.trim(),
      avatarColor: roleMeta.color,
      permissions: formPermissions,
      isActive: formIsActive,
      lastLogin: editingUserId
        ? users.find((u) => u.id === editingUserId)?.lastLogin
        : undefined,
      createdAt: editingUserId
        ? users.find((u) => u.id === editingUserId)?.createdAt || '2026-08-19'
        : new Date().toISOString().split('T')[0],
    };

    onSaveUser(userToSave);
    setIsEditing(false);
    setEditingUserId(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      searchTerm === '' ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Gestión de Personal, Usuarios & Permisos
              </h2>
              <p className="text-xs text-[#6B7280]">
                Configura claves únicas y permisos por área para coordinar la operación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleOpenCreate}
                className="px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                id="btn-create-user"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Nuevo Usuario
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* View Mode: List of Users */}
          {!isEditing ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo, usuario o área..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                  <span className="text-xs font-bold text-[#6B7280]">Rol:</span>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] focus:outline-hidden"
                  >
                    <option value="ALL">Todos los Roles ({users.length})</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Ingenieria_BOM">Ingeniería & BOM</option>
                    <option value="Compras_MRP">Compras & Abastecimiento</option>
                    <option value="Produccion_Taller">Producción & Taller</option>
                    <option value="Calidad_QC">Calidad (QC)</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F9FAFB] text-[10px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-3">Personal / Usuario</th>
                      <th className="p-3">Área / Cargo</th>
                      <th className="p-3">Rol & Permisos</th>
                      <th className="p-3">Clave Única</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredUsers.map((user) => {
                      const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.Personalizado;
                      const isSelf = currentUser?.id === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-[#F9FAFB]">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                                style={{ backgroundColor: user.avatarColor || roleMeta.color }}
                              >
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <div>
                                <div className="font-bold text-[#111827] flex items-center gap-1.5">
                                  {user.name}
                                  {isSelf && (
                                    <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                                      Tú
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#6B7280] font-mono">
                                  @{user.username} • {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-medium text-[#111827]">{user.department}</div>
                            <div className="text-[10px] text-[#6B7280]">{user.position}</div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${roleMeta.badgeBg}`}
                            >
                              {roleMeta.title}
                            </span>
                            <div className="text-[10px] text-[#6B7280] mt-0.5">
                              {user.permissions.length} permisos activos
                            </div>
                          </td>

                          <td className="p-3 font-mono font-bold text-[#4F46E5]">
                            •••••••• ({user.password})
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => onToggleUserStatus(user.id)}
                              disabled={isSelf}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={isSelf ? 'No puedes desactivar tu propia cuenta' : 'Cambiar estado'}
                            >
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#F3F4F6] rounded-lg transition-colors"
                                title="Editar datos y permisos"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteUser(user.id)}
                                disabled={isSelf || user.role === 'Administrador'}
                                className="p-1.5 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Form Mode: Create / Edit User & Granular Permissions Matrix */
            <form onSubmit={handleSaveForm} className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    {editingUserId ? 'Editar Personal & Permisos' : 'Registrar Nuevo Usuario'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Define datos de identificación, clave única y matriz de permisos por módulo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] px-2.5 py-1 rounded-lg border border-[#D1D5DB]"
                >
                  Cancelar
                </button>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Nombre Completo:</label>
                  <input
                    type="text"
                    placeholder="ej: Diana Morales"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Nombre de Usuario (Login):</label>
                  <input
                    type="text"
                    placeholder="ej: diana.corte"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Contraseña Única:</label>
                  <input
                    type="text"
                    placeholder="Contraseña segura"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg font-mono font-bold text-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="diana@textiliq.co"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Departamento / Área:</label>
                  <input
                    type="text"
                    placeholder="ej: Planta de Confección"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#374151]">Cargo / Posición:</label>
                  <input
                    type="text"
                    placeholder="ej: Supervisora de Ensamble"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Role Preset Template Selector */}
              <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#111827] block">
                      Plantilla de Rol Operativo:
                    </label>
                    <span className="text-[11px] text-[#6B7280]">
                      Selecciona un rol para auto-cargar permisos o personalízalos individualmente
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[10px] font-bold text-[#4F46E5] hover:underline"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-[#D1D5DB]">|</span>
                    <button
                      type="button"
                      onClick={handleClearPermissions}
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      'Administrador',
                      'Comercial',
                      'Ingenieria_BOM',
                      'Compras_MRP',
                      'Produccion_Taller',
                      'Calidad_QC',
                      'Personalizado',
                    ] as UserRole[]
                  ).map((role) => {
                    const isSelected = formRole === role;
                    const meta = ROLE_LABELS[role];

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRolePresetChange(role)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5] ring-1 ring-[#4F46E5]'
                            : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{meta.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Matriz de Permisos Detallados ({formPermissions.length} de {ALL_PERMISSIONS.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.key);

                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-indigo-50/40 border-indigo-200 text-[#111827]'
                            : 'bg-white border-[#E5E7EB] hover:bg-gray-50 text-[#6B7280]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          className="mt-0.5 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#111827]">
                              {perm.label}
                            </span>
                            <span className="text-[9px] font-semibold bg-[#E5E7EB] text-[#4B5563] px-1.5 py-0.2 rounded">
                              {perm.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#374151] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  Cuenta de usuario activa y con acceso al sistema
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-[#D1D5DB] hover:bg-gray-50 text-[#374151] rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
          <span className="flex items-center gap-1.5 font-medium">
            <Building className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Control de Accesos Corporativo TextilIQ
          </span>
          <span className="text-[11px] font-mono">
            {users.length} usuarios registrados en la base de datos
          </span>
        </div>
      </div>
    </div>
  );
};
