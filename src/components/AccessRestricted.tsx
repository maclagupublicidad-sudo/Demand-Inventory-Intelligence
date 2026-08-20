import React from 'react';
import { AppUser, PermissionKey } from '../types';
import { ROLE_LABELS, PERMISSION_DEFINITIONS } from '../utils/permissions';
import { ShieldAlert, Key, Users, ArrowRight, Lock } from 'lucide-react';

interface AccessRestrictedProps {
  moduleName: string;
  requiredPermission: PermissionKey;
  currentUser: AppUser | null;
  onOpenLoginModal: () => void;
  onOpenUserManagementModal?: () => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  moduleName,
  requiredPermission,
  currentUser,
  onOpenLoginModal,
  onOpenUserManagementModal,
}) => {
  const permDef = PERMISSION_DEFINITIONS.find((p) => p.key === requiredPermission);
  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] || ROLE_LABELS.Personalizado : null;

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-[#E6E1D8] shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-[#FDF2F0] border border-[#F0D5D0] text-[#B33927] flex items-center justify-center mx-auto shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-[#1C211D]">
          Acceso Restringido a «{moduleName}»
        </h3>
        <p className="text-xs text-[#5F6B61] max-w-md mx-auto">
          Tu cuenta actual no tiene asignado el permiso necesario para visualizar o editar este módulo operativo.
        </p>
      </div>

      {/* User Role Card */}
      {currentUser && (
        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] text-left space-y-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#5F6B61] block font-medium">Sesión Actual:</span>
              <span className="text-xs font-bold text-[#1C211D]">{currentUser.name} ({currentUser.position})</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta?.badgeBg}`}>
              {roleMeta?.title}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E6E1D8] text-xs">
            <span className="font-semibold text-[#1C211D] block mb-1">
              Permiso requerido:
            </span>
            <div className="flex items-center gap-2 text-[#962F20] bg-[#FDF2F0] p-2 rounded-lg border border-[#F0D5D0] text-xs font-bold">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{permDef?.label || requiredPermission}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onOpenLoginModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Key className="w-4 h-4" />
          Cambiar de Usuario / Iniciar Sesión
        </button>

        {currentUser?.role === 'Administrador' && onOpenUserManagementModal && (
          <button
            onClick={onOpenUserManagementModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#FAF8F5] border border-[#D5CEC2] text-[#1C211D] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-[#3A5A40]" />
            Ajustar Permisos de este Rol
          </button>
        )}
      </div>
    </div>
  );
};
