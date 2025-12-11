import { User, PlanType } from "../types";

const USERS_KEY = 'emosense_users';
const CURRENT_USER_KEY = 'emosense_current_user';

// Helper to trigger system notifications
const sendSystemNotification = (title: string, msg: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('emosense-notification', {
            detail: {
                id: Date.now(),
                title,
                msg,
                type,
                time: 'Just now'
            }
        });
        window.dispatchEvent(event);
    }
};

export const authService = {
  getUsers: (): User[] => {
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    // If empty, populate with mock data for Admin Panel demo
    if (users.length === 0) {
      users = [
          {
            email: 'admin@emosense.io',
            fullName: 'System Administrator',
            passwordHash: '',
            plan: 'Enterprise',
            role: 'admin',
            isVerified: true,
            createdAt: new Date(Date.now() - 10000000).toISOString()
          },
          {
            email: 'sarah.connor@tech.com',
            fullName: 'Sarah Connor',
            passwordHash: '',
            plan: 'Pro',
            role: 'user',
            isVerified: true,
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
          },
          {
            email: 'john.doe@startup.io',
            fullName: 'John Doe',
            passwordHash: '',
            plan: 'Starter',
            role: 'user',
            isVerified: true,
            createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
          },
          {
            email: 'jane.smith@corp.net',
            fullName: 'Jane Smith',
            passwordHash: '',
            plan: 'Enterprise',
            role: 'user',
            isVerified: false,
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
          }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    
    return users;
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: async (email: string) => {
    const users = authService.getUsers().filter(u => u.email !== email);
    authService.saveUsers(users);
    return true;
  },

  // Updated auth methods with mock implementations to support UI flows
  
  register: async (email: string, fullName: string, passwordHash: string, plan: PlanType) => {
    const users = authService.getUsers();
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'User already exists.' };
    }
    
    const newUser: User = {
        email,
        fullName,
        passwordHash, // In a real app, this should be hashed
        plan,
        role: 'user',
        isVerified: false,
        verificationCode: '123456', // Mock code
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    authService.saveUsers(users);
    
    // Simulate sending code via system notification
    setTimeout(() => {
        sendSystemNotification('Verification Code', `Your code is: 123456`, 'info');
        console.log(`[EmoSense Auth] Verification Code for ${email}: 123456`);
    }, 1000);

    return { success: true, message: 'Registration successful. Please verify email.' };
  },

  verifyAccount: async (email: string, code: string) => {
    const users = authService.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) return { success: false, message: 'User not found.' };
    
    // Accept hardcoded '123456' for demo purposes if stored code matches or hasn't been set properly
    if (code !== '123456' && user.verificationCode !== code) {
        return { success: false, message: 'Invalid code.' };
    }
    
    user.isVerified = true;
    user.verificationCode = undefined;
    authService.saveUsers(users);
    
    return { success: true, message: 'Account verified successfully.' };
  },

  login: async (email: string, passwordHash: string) => {
    const users = authService.getUsers();
    const user = users.find(u => u.email === email);
    
    // In a real app, compare password hashes. Here we check existence and assume password is correct for demo.
    if (!user) {
        return { success: false, message: 'Invalid credentials.' };
    }
    
    if (!user.isVerified) {
        return { success: false, message: 'Account not verified. Please verify your email.' };
    }

    return { success: true, message: 'Login successful.', user };
  },

  logout: () => {
      // In a real app, clear session/token
  },
  
  getCurrentUser: () => null,

  requestPasswordReset: async (email: string) => {
    const users = authService.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) return { success: false, message: 'Email not found.' };

    user.resetToken = 'reset-123';
    authService.saveUsers(users);
    
    setTimeout(() => {
        sendSystemNotification('Password Reset', `Your reset token is: reset-123`, 'info');
    }, 1000);

    return { success: true, message: 'Reset link sent to email.' };
  },

  resetPassword: async (email: string, token: string, newPasswordHash: string) => {
    const users = authService.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || user.resetToken !== token) {
        return { success: false, message: 'Invalid or expired token.' };
    }

    user.passwordHash = newPasswordHash;
    user.resetToken = undefined;
    authService.saveUsers(users);
    
    return { success: true, message: 'Password updated successfully.' };
  }
};
