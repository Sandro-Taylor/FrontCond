// ---------------------------------------------------------
// APLICAÇÃO PRINCIPAL
// ---------------------------------------------------------
// Inicializa a autenticação e as rotas do frontend.
// ---------------------------------------------------------

import { AuthProvider } from "./Pages/Login/useAuth";
import { RoutesApp } from "./Routes";


export const App = () => {
  return (
    <AuthProvider>
      <RoutesApp />
    </AuthProvider>
  );
};
