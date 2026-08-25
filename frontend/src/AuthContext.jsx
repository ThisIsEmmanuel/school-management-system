import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('sms_auth');
    return saved ? JSON.parse(saved) : null;
  });

  function login(token, user) {
    const value = { token, user };
    localStorage.setItem('sms_auth', JSON.stringify(value));
    setAuth(value);
  }

  function logout() {
    localStorage.removeItem('sms_auth');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
