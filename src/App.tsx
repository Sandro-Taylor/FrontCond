// ---------------------------------------------------------
// APLICAÇÃO PRINCIPAL
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
