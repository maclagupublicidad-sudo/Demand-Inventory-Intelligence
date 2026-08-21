import { AppUser } from '../types';
import { ROLE_DEFAULT_PERMISSIONS } from '../utils/permissions';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'USR-ADMIN',
    name: 'Administrador Principal',
    email: 'admin@textiliq.co',
    username: 'admin',
    password: 'admin123',
    role: 'Administrador',
    department: 'Dirección General & Operaciones',
    position: 'Gerente General / Director de Planta',
    avatarColor: '#3A5A40',
    permissions: ROLE_DEFAULT_PERMISSIONS['Administrador'],
    isActive: true,
    lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    createdAt: new Date().toISOString().split('T')[0],
  },
];
