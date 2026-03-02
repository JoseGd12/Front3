import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  telefono?: string;
  ultimaVisita?: string;
  fechaRegistro?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  isCliente: () => boolean;
  getAllUsers: () => User[];
  getAllClientes: () => User[];
  updateUser: (userId: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  getUserById: (userId: string) => User | null;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  telefono?: string;
  role?: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios de ejemplo (ahora en un array mutable)
let mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Miguel Rodriguez',
    email: 'admin@elitebarbershop.com',
    password: 'admin123',
    role: 'admin',
    fechaRegistro: '2024-01-15'
  },
  {
    id: '2',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    password: 'cliente123',
    role: 'cliente',
    telefono: '+57 300 1234567',
    ultimaVisita: '01-08-2025',
    fechaRegistro: '2024-03-20'
  },
  {
    id: '3',
    name: 'María Gómez',
    email: 'maria.gomez@email.com',
    password: 'cliente123',
    role: 'cliente',
    telefono: '+57 310 9876543',
    ultimaVisita: '25-07-2025',
    fechaRegistro: '2024-05-10'
  },
  {
    id: '4',
    name: 'Sofia Martinez',
    email: 'sofia@elitebarbershop.com',
    password: 'admin123',
    role: 'admin',
    fechaRegistro: '2024-02-01'
  },
  {
    id: '5',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@email.com',
    password: 'cliente123',
    role: 'cliente',
    telefono: '+57 320 1122334',
    ultimaVisita: '10-07-2025',
    fechaRegistro: '2024-06-15'
  },
  {
    id: '6',
    name: 'Laura Zapata',
    email: 'laura.zapata@email.com',
    password: 'cliente123',
    role: 'cliente',
    telefono: '+57 305 5566778',
    ultimaVisita: '15-06-2025',
    fechaRegistro: '2024-04-22'
  },
  {
    id: '7',
    name: 'Pedro López',
    email: 'pedro.lopez@email.com',
    password: 'cliente123',
    role: 'cliente',
    telefono: '+57 311 2233445',
    ultimaVisita: '03-05-2025',
    fechaRegistro: '2024-07-08'
  },
  {
    id: '8',
    name: 'Ana Fernández',
    email: 'ana.fernandez@email.com',
    password: 'cliente123',
    role: 'cliente',
    telefono: '+57 304 9988776',
    ultimaVisita: '20-04-2025',
    fechaRegistro: '2024-08-12'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('barbershop_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular verificación de credenciales
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        telefono: foundUser.telefono,
        ultimaVisita: foundUser.ultimaVisita,
        fechaRegistro: foundUser.fechaRegistro
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('barbershop_user', JSON.stringify(userData));
      return true;
    }
    
    return false;
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Verificar si el email ya existe
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'Este email ya está registrado' };
    }

    // Validaciones básicas
    if (!userData.name || !userData.email || !userData.password) {
      return { success: false, error: 'Todos los campos son obligatorios' };
    }

    if (userData.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    // Crear nuevo usuario
    const newUser = {
      id: String(mockUsers.length + 1),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'cliente' as UserRole,
      telefono: userData.telefono,
      ultimaVisita: undefined,
      fechaRegistro: new Date().toLocaleDateString('es-ES')
    };

    // Agregar a la lista de usuarios
    mockUsers.push(newUser);

    // Auto-login después del registro
    const userToLogin: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      telefono: newUser.telefono,
      ultimaVisita: newUser.ultimaVisita,
      fechaRegistro: newUser.fechaRegistro
    };

    setUser(userToLogin);
    setIsAuthenticated(true);
    localStorage.setItem('barbershop_user', JSON.stringify(userToLogin));

    return { success: true };
  };

  const getAllUsers = (): User[] => {
    return mockUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      telefono: u.telefono,
      ultimaVisita: u.ultimaVisita,
      fechaRegistro: u.fechaRegistro
    }));
  };

  const getAllClientes = (): User[] => {
    return mockUsers
      .filter(u => u.role === 'cliente')
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        telefono: u.telefono,
        ultimaVisita: u.ultimaVisita,
        fechaRegistro: u.fechaRegistro
      }));
  };

  const getUserById = (userId: string): User | null => {
    const foundUser = mockUsers.find(u => u.id === userId);
    if (!foundUser) return null;
    
    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      telefono: foundUser.telefono,
      ultimaVisita: foundUser.ultimaVisita,
      fechaRegistro: foundUser.fechaRegistro
    };
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Verificar si el email ya existe en otro usuario
    if (userData.email && userData.email !== mockUsers[userIndex].email) {
      const existingUser = mockUsers.find(u => u.email === userData.email && u.id !== userId);
      if (existingUser) {
        return { success: false, error: 'Este email ya está registrado por otro usuario' };
      }
    }

    // Actualizar usuario
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };

    // Si el usuario actualizado es el usuario actual logueado, actualizar el estado
    if (user && user.id === userId) {
      const updatedUser = {
        id: mockUsers[userIndex].id,
        name: mockUsers[userIndex].name,
        email: mockUsers[userIndex].email,
        role: mockUsers[userIndex].role,
        telefono: mockUsers[userIndex].telefono,
        ultimaVisita: mockUsers[userIndex].ultimaVisita,
        fechaRegistro: mockUsers[userIndex].fechaRegistro
      };
      setUser(updatedUser);
      localStorage.setItem('barbershop_user', JSON.stringify(updatedUser));
    }

    return { success: true };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // No permitir eliminar el propio usuario
    if (user && user.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta' };
    }

    // Eliminar usuario
    mockUsers.splice(userIndex, 1);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('barbershop_user');
  };

  const isAdmin = () => user?.role === 'admin';
  const isCliente = () => user?.role === 'cliente';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
      isAdmin,
      isCliente,
      getAllUsers,
      getAllClientes,
      updateUser,
      deleteUser,
      getUserById
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
