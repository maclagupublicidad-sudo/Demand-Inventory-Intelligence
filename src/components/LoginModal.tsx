import React, { useState } from 'react';
import { AppUser } from '../types';
import { ROLE_LABELS } from '../utils/permissions';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser | null;
  onLogin: (user: AppUser) => void;
  canDismiss?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onLogin,
  canDismiss = true,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const input = usernameOrEmail.trim().toLowerCase();
    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === input || u.email.toLowerCase() === input) &&
        u.isActive
    );

    if (!user) {
      setErrorMessage('Usuario o correo electrónico no encontrado o usuario inactivo.');
      return;
    }

    if (user.password && user.password !== password) {
      setErrorMessage('Contraseña incorrecta para este usuario.');
      return;
    }

    onLogin(user);
    onClose();
  };

  const handleQuickLogin = (user: AppUser) => {
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Control de Acceso & Permisos TextilIQ
              </h2>
              <p className="text-xs text-[#6B7280]">
                Ingresa con tu usuario y contraseña única por área operativa
              </p>
            </div>
          </div>

          {canDismiss && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#6B7280]" />
                  Usuario o Correo:
                </label>
                <input
                  type="text"
                  placeholder="ej: admin o ventas@textiliq.co"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#6B7280]" />
                  Contraseña Única:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3 py-2 pr-9 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#111827] focus:ring-2 focus:ring-[#4F46E5] focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Iniciar Sesión con Credenciales
            </button>
          </form>

          {/* Quick Role Switcher for Testing / Multi-Department Access */}
          <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                Acceso Rápido por Área / Rol Operativo:
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Cambia de rol en 1 clic para probar permisos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {users.map((user) => {
                const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.Personalizado;
                const isCurrent = currentUser?.id === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-indigo-50/70 border-[#4F46E5] ring-1 ring-[#4F46E5]'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#111827] truncate">
                            {user.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                              Activo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-[#6B7280] truncate mt-0.5">
                          <span
                            className={`font-semibold px-1.5 py-0.2 rounded border text-[9px] ${roleMeta.badgeBg}`}
                          >
                            {roleMeta.title}
                          </span>
                          <span className="truncate">| Clave: {user.password}</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#4F46E5] shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#9CA3AF]" />
            TextilIQ Security & Role-Based Access Control
          </span>
          <span className="text-[11px] font-mono">
            {users.filter((u) => u.isActive).length} usuarios activos
          </span>
        </div>
      </div>
    </div>
  );
};
