import { BrowserRouter, Link as RouterLink, Navigate, Route, Routes } from "react-router-dom";
import { Button, Center, Spinner, Text, VStack } from "@chakra-ui/react";

import { useAuth } from "./Pages/Login/useAuth";
import { Dashboard } from "./Pages/Home/Inicio";
import { Login } from "./Pages/Login/Login";
import { Pessoas } from "./Pages/Pessoas/Pessoas";
import { Condominios } from "./Pages/Condominios/Condominios";
import { Apartamentos } from "./Pages/Apartamentos/Apartamentos";
import { ApartamentoPagina } from "./Pages/Apartamentos/ApartamentoPagina";
import { Vagas } from "./Pages/Vagas/Vagas";
import { Veiculos } from "./Pages/Veiculos/Veiculos";

import { ROTAS } from "./Pages/Titulos/Titulos";


interface ProtectedProps {
  Item: React.ComponentType<any>;
  exigeCondominio?: boolean; // páginas que só funcionam com um condomínio selecionado
}

const Protected = ({ Item, exigeCondominio }: ProtectedProps) => {
  const { logged, isLoading, user, condominioAtual, logout } = useAuth();

  if (isLoading) {
    return (
      <Center minHeight="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!logged) {
    return <Navigate to={ROTAS.LOGIN} replace />;
  }

  // usuário sem nenhum condomínio liberado (o ADM do sistema continua entrando para cadastrar condomínios)
  if (!condominioAtual && !user?.admin_sistema) {
    return (
      <Center minHeight="100vh">
        <VStack spacing={4}>
          <Text color="gray.600">Seu usuário ainda não está vinculado a nenhum condomínio.</Text>
          <Button size="sm" variant="outline" onClick={logout}>Sair</Button>
        </VStack>
      </Center>
    );
  }

  // ADM do sistema ainda sem condomínio: orienta a cadastrar, em vez de chamar a API sem condomínio
  if (exigeCondominio && !condominioAtual) {
    return (
      <Center minHeight="100vh">
        <VStack spacing={4}>
          <Text color="gray.600">Cadastre ou selecione um condomínio para acessar esta página.</Text>
          <Button as={RouterLink} to={ROTAS.CONDOMINIOS} size="sm" colorScheme="blue">Ir para Condomínios</Button>
        </VStack>
      </Center>
    );
  }

  // a key recria a página ao trocar de condomínio, recarregando os dados do novo condomínio
  return <Item key={condominioAtual?.id ?? "sem-condominio"} />;
};


export const RoutesApp = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path={ROTAS.LOGIN}
          element={<Login />}
        />

        <Route
          path={ROTAS.INICIO}
          element={<Protected Item={Dashboard} />}
        />

        <Route
          path={ROTAS.APARTAMENTOS}
          element={<Protected Item={Apartamentos} exigeCondominio />}
        />

        <Route
          path={`${ROTAS.APARTAMENTOS}/:id`}
          element={<Protected Item={ApartamentoPagina} exigeCondominio />}
        />

        <Route
          path={ROTAS.VAGAS}
          element={<Protected Item={Vagas} exigeCondominio />}
        />

        <Route
          path={ROTAS.VEICULOS}
          element={<Protected Item={Veiculos} exigeCondominio />}
        />

        <Route
          path={ROTAS.PESSOA}
          element={<Protected Item={Pessoas} exigeCondominio />}
        />

        <Route
          path={ROTAS.CONDOMINIOS}
          element={<Protected Item={Condominios} />}
        />

        <Route
          path="*"
          element={<Navigate to={ROTAS.INICIO} replace />}
        />

      </Routes>
    </BrowserRouter>
  );
};
