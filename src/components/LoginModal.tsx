import React, { useState } from 'react';
import { AppUser } from '../types';
import { ROLE_LABELS } from '../utils/permissions';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Control de Acceso & Permisos TextilIQ
              </h2>
              <p className="text-[11px] text-[#5F6B61]">
                Ingresa con tu usuario y contraseña única por área operativa
              </p>
            </div>
          </div>

          {canDismiss && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#8F9990] hover:text-[#1C211D] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-[#FDF2F0] border border-[#F8D4CF] rounded-xl flex items-center gap-2 text-xs text-[#B33927]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B33927]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#5F6B61]" />
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
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#5F6B61]" />
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
                    className="w-full px-3 py-2 pr-9 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F9990] hover:text-[#1C211D]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <Lock className="w-4 h-4" />
              Iniciar Sesión con Credenciales
            </button>
          </form>

          {/* Quick Role Switcher for Testing / Multi-Department Access */}
          <div className="space-y-2.5 pt-3 border-t border-[#E6E1D8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3A5A40]" />
                Acceso Rápido por Área / Rol Operativo:
              </span>
              <span className="text-[10px] text-[#5F6B61] hidden sm:inline">
                Cambia de rol en 1 clic
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((user) => {
                const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.Personalizado;
                const isCurrent = currentUser?.id === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group active:scale-95 ${
                      isCurrent
                        ? 'bg-[#EBF2EC] border-[#3A5A40] ring-1 ring-[#3A5A40]'
                        : 'bg-[#FAF8F5] border-[#E6E1D8] hover:border-[#D5CEC2] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-2xs"
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
                          <p className="text-xs font-bold text-[#1C211D] truncate">
                            {user.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[9px] bg-[#3A5A40] text-white px-1.5 py-0.2 rounded font-bold">
                              Activo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-[#5F6B61] truncate mt-0.5">
                          <span
                            className={`font-semibold px-1.5 py-0.2 rounded border text-[9px] ${roleMeta.badgeBg}`}
                          >
                            {roleMeta.title}
                          </span>
                          <span className="truncate">| Clave: {user.password}</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-[#8F9990] group-hover:text-[#3A5A40] shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#FCFBF9] border-t border-[#E6E1D8] flex items-center justify-between text-xs text-[#5F6B61]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Building className="w-3.5 h-3.5 text-[#8F9990]" />
            TextilIQ Control de Acceso
          </span>
          <span className="text-[10px] font-mono">
            {users.filter((u) => u.isActive).length} usuarios activos
          </span>
        </div>
      </div>
    </div>
  );
};
