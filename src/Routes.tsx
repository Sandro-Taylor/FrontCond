import { BrowserRouter, Link as RouterLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Button, Center, Spinner, Text, VStack } from "@chakra-ui/react";

import { useAuth } from "./Pages/Login/useAuth";
import { calcularPermissoes, type Permissoes } from "./Components/permissoes";
import { Dashboard } from "./Pages/Home/Inicio";
import { Login } from "./Pages/Login/Login";
import { Pessoas } from "./Pages/Pessoas/Pessoas";
import { Condominios } from "./Pages/Condominios/Condominios";
import { Apartamentos } from "./Pages/Apartamentos/Apartamentos";
import { ApartamentoPagina } from "./Pages/Apartamentos/ApartamentoPagina";
import { Vagas } from "./Pages/Vagas/Vagas";
import { TrocarSenha, TrocarSenhaObrigatoria } from "./Pages/Login/TrocarSenha";
import { Veiculos } from "./Pages/Veiculos/Veiculos";
import { Financeiro } from "./Pages/Financeiro/Financeiro";
import { Avisos } from "./Pages/Avisos/Avisos";
import { Atendimento } from "./Pages/Atendimento/Atendimento";
import { Tarefas } from "./Pages/Tarefas/Tarefas";
import { Usuarios } from "./Pages/Usuarios/Usuarios";
import { WhatsApp } from "./Pages/WhatsApp/WhatsApp";
import { Administracao } from "./Pages/Administracao/Administracao";
import { Drive } from "./Pages/Drive/Drive";
import { Movimentacoes } from "./Pages/Movimentacoes/Movimentacoes";
import { FracaoIdeal } from "./Pages/FracaoIdeal/FracaoIdeal";
import { Manutencoes } from "./Pages/Manutencoes/Manutencoes";
import { Prestadores } from "./Pages/Prestadores/Prestadores";
import { PlanoContas } from "./Pages/PlanoContas/PlanoContas";
import { PopupWhatsApp } from "./Pages/WhatsApp/PopupWhatsApp";

import { ROTAS } from "./Pages/Titulos/Dados";


interface ProtectedProps {
  Item: React.ComponentType<any>;
  exigeCondominio?: boolean; // páginas que só funcionam com um condomínio selecionado
  exige?: keyof Permissoes;  // permissão do perfil necessária para abrir a página
}

const Protected = ({ Item, exigeCondominio, exige }: ProtectedProps) => {
  const { logged, isLoading, user, condominioAtual, logout } = useAuth();
  const { pathname } = useLocation();

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

  // primeiro acesso com senha temporária: só libera depois da troca
  if (user?.trocar_senha) {
    return <TrocarSenhaObrigatoria />;
  }

  // RESPONSÁVEL sem condomínio: só usa o WhatsApp (e a troca de senha)
  if (!condominioAtual && !user?.admin_sistema && user?.responsavel) {
    const liberada = [ROTAS.WHATSAPP, ROTAS.TROCAR_SENHA].some((rota) => pathname.toLowerCase() === rota.toLowerCase());
    if (!liberada) return <Navigate to={ROTAS.WHATSAPP} replace />;
    return <Item key="sem-condominio" />;
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

  // perfil sem permissão para esta página
  const permissoes = calcularPermissoes(condominioAtual?.perfil ?? (user?.admin_sistema ? "ADM" : null));
  if (exige && !permissoes[exige]) {
    return (
      <Center minHeight="100vh">
        <VStack spacing={4}>
          <Text color="gray.600">Seu perfil não tem acesso a esta página.</Text>
          <Button as={RouterLink} to={ROTAS.INICIO} size="sm" colorScheme="blue">Voltar ao início</Button>
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
          element={<Protected Item={Apartamentos} exigeCondominio exige="acessaCadastros" />}
        />

        <Route
          path={`${ROTAS.APARTAMENTOS}/:id`}
          element={<Protected Item={ApartamentoPagina} exigeCondominio exige="acessaCadastros" />}
        />

        <Route
          path={ROTAS.VAGAS}
          element={<Protected Item={Vagas} exigeCondominio exige="veTudo" />}
        />

        <Route
          path={ROTAS.VEICULOS}
          element={<Protected Item={Veiculos} exigeCondominio exige="acessaCadastros" />}
        />

        <Route
          path={ROTAS.PESSOA}
          element={<Protected Item={Pessoas} exigeCondominio exige="acessaCadastros" />}
        />

        <Route
          path={ROTAS.FINANCEIRO}
          element={<Protected Item={Financeiro} exigeCondominio exige="acessaFinanceiro" />}
        />

        <Route
          path={ROTAS.AVISOS}
          element={<Protected Item={Avisos} exigeCondominio />}
        />

        <Route
          path={ROTAS.ATENDIMENTO}
          element={<Protected Item={Atendimento} exigeCondominio />}
        />

        <Route
          path={ROTAS.TAREFAS}
          element={<Protected Item={Tarefas} exigeCondominio exige="acessaTarefas" />}
        />

        <Route
          path={ROTAS.TROCAR_SENHA}
          element={<Protected Item={TrocarSenha} />}
        />

        <Route
          path={ROTAS.USUARIOS}
          element={<Protected Item={Usuarios} />}
        />

        <Route
          path={ROTAS.CONDOMINIOS}
          element={<Protected Item={Condominios} />}
        />

        <Route
          path={ROTAS.MOVIMENTACOES}
          element={<Protected Item={Movimentacoes} exigeCondominio exige="veFinanceiroTudo" />}
        />

        <Route
          path={ROTAS.FRACAO_IDEAL}
          element={<Protected Item={FracaoIdeal} exigeCondominio exige="veFinanceiroTudo" />}
        />

        <Route
          path={ROTAS.MANUTENCOES}
          element={<Protected Item={Manutencoes} exigeCondominio exige="veTudo" />}
        />

        <Route
          path={ROTAS.PLANO_CONTAS}
          element={<Protected Item={PlanoContas} exigeCondominio exige="veFinanceiroTudo" />}
        />

        <Route
          path={ROTAS.PRESTADORES}
          element={<Protected Item={Prestadores} exigeCondominio exige="veFinanceiroTudo" />}
        />

        <Route
          path={ROTAS.DRIVE}
          element={<Protected Item={Drive} />}
        />

        <Route
          path={ROTAS.ADMINISTRACAO}
          element={<Protected Item={Administracao} />}
        />

        <Route
          path={ROTAS.WHATSAPP}
          element={<Protected Item={WhatsApp} />}
        />

        <Route
          path="*"
          element={<Navigate to={ROTAS.INICIO} replace />}
        />

      </Routes>

      {/* mensagens novas do WhatsApp (só o RESPONSÁVEL) */}
      <PopupWhatsApp />
    </BrowserRouter>
  );
};
