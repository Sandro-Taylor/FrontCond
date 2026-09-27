// CONTROLE DE AUTENTICAÇÃO
// Controla login, logout, token, usuário autenticado e o
// condomínio que está sendo acessado.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ValuesInputType } from "./helper";
import { API_BASE_URL_USERS } from "../../config";
import { definirCondominioAtual, obterCondominioAtual } from "../../Components/config";

export type Perfil = "ADM" | "SINDICO" | "CONSELHEIRO" | "MORADOR" | "COLABORADOR" | "PRESTADOR";

export type CondominioDoUsuario = {
  id: string;
  nome: string;
  perfil: Perfil;
  pessoa_id: string | null;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  admin_sistema: boolean;
  created_at: string;
  condominios: CondominioDoUsuario[];
};

type AuthContextType = {
  logged: boolean;
  isLoading: boolean;
  isLoadingLogin: boolean;
  user: User | null;
  condominioAtual: CondominioDoUsuario | null;
  trocarCondominio: (id: string) => void;
  recarregarUsuario: () => Promise<void>;
  login: (values: ValuesInputType) => Promise<void>;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// usa o condomínio salvo, se o usuário ainda tiver acesso a ele; senão, o primeiro da lista
function escolherCondominio(lista: CondominioDoUsuario[], idSalvo: string | null) {
  return lista.find((condominio) => condominio.id === idSalvo) ?? lista[0] ?? null;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [condominioAtual, setCondominioAtual] = useState<CondominioDoUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  function aplicarCondominio(condominio: CondominioDoUsuario | null) {
    definirCondominioAtual(condominio?.id ?? null);
    setCondominioAtual(condominio);
  }

  async function loadUser(token: string) {
    const response = await fetch(`${API_BASE_URL_USERS}/eu/`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { throw new Error("Sessão inválida"); }
    const userData: User = await response.json();
    setUser(userData);
    aplicarCondominio(escolherCondominio(userData.condominios, obterCondominioAtual()));
  }

  // TOKEN EXPIRADO (item 17): qualquer resposta 401 da API desloga e volta para o login
  const logoutRef = useRef<() => void>(() => {});
  useEffect(() => {
    const fetchOriginal = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const resposta = await fetchOriginal(...args);
      const alvo = args[0];
      const url = typeof alvo === "string" ? alvo : alvo instanceof URL ? alvo.href : alvo.url;
      if (resposta.status === 401 && url.startsWith(API_BASE_URL_USERS) && !url.includes("/login")) {
        logoutRef.current();
      }
      return resposta;
    };
    return () => { window.fetch = fetchOriginal; };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setIsLoading(false); return; }
    loadUser(token)
      .catch(() => { localStorage.removeItem("access_token"); aplicarCondominio(null); setUser(null); })
      .finally(() => { setIsLoading(false); });
  }, []);

  async function login(values: ValuesInputType) {
    setIsLoadingLogin(true);
    try {
      const response = await fetch(`${API_BASE_URL_USERS}/login/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) {
        const erro = await response.json().catch(() => null);
        throw new Error(erro?.detail ?? "E-mail ou senha inválidos");
      }
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      await loadUser(data.access_token);
    } finally {
      setIsLoadingLogin(false);
    }
  }

  async function recarregarUsuario() {
    const token = localStorage.getItem("access_token");
    if (token) await loadUser(token);
  }

  function trocarCondominio(id: string) {
    const condominio = user?.condominios.find((item) => item.id === id);
    if (condominio) aplicarCondominio(condominio);
  }

  function logout() {
    localStorage.removeItem("access_token");
    aplicarCondominio(null);
    setUser(null);
  }
  logoutRef.current = logout;

  return (
    <AuthContext.Provider value={{ logged: Boolean(user), isLoading, isLoadingLogin, user, condominioAtual, trocarCondominio, recarregarUsuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) { throw new Error("useAuth deve ser usado dentro de AuthProvider"); }
  return context;
};
