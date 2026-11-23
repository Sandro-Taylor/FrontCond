import { useAuth } from "../Login/useAuth";
import { ROTULOS_PERFIL, type PerfilPessoa } from "../Pessoas/ConfigPessoas";
import { usePermissoes } from "../../Components/permissoes";
import { Badge, Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Heading, Icon, IconButton,  Select, Text, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { useEffect } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Car, CarFront, ChartPie, ClipboardList, DoorOpen, Handshake, HardDrive, Home, KeyRound, Landmark, LayoutDashboard,ListChecks, ListTree, LogOut, Megaphone, Menu as MenuIcon, MessageCircle, MessageSquare, Receipt, Settings, UserCog, Users, Wallet, Wrench} from "lucide-react";
import { ROTAS, DadosTitulos } from "./Dados";
import { Grupo, ItemMenu } from "./OrganizaGrupo";

export const Titulo = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, condominioAtual, trocarCondominio } = useAuth();
  const permissoes = usePermissoes();
  const menuCelular = useDisclosure();
  useEffect(() => { menuCelular.onClose(); }, [pathname]);
  const chave = (Object.keys(DadosTitulos) as (keyof typeof DadosTitulos)[]).filter((rota) => rota !== ROTAS.INICIO).find((rota) => pathname.toLowerCase().startsWith(rota.toLowerCase()))?? (pathname === ROTAS.INICIO ? ROTAS.INICIO : undefined);
  const pagina = chave ? DadosTitulos[chave] : undefined; if (!pagina) return null;
  function sair() {logout(); navigate(ROTAS.LOGIN)}
  const ehAdm = Boolean(user?.admin_sistema);
  const veWhatsApp = ehAdm || Boolean(user?.responsavel) || Boolean(user?.condominios.some((c) => c.perfil === "SINDICO"));
  const veManutencoes = Boolean(condominioAtual) && permissoes.veTudo;
  const vePrestadores = Boolean(condominioAtual) && permissoes.veFinanceiroTudo;
  const veDrive = ehAdm || permissoes.editaTudo;
  const mostraComunicacao = Boolean(condominioAtual) || veWhatsApp;
  const mostraFinanceiro = permissoes.acessaFinanceiro || permissoes.veFinanceiroTudo;
  const mostraGestao = permissoes.acessaTarefas || veManutencoes || vePrestadores || veDrive;
  const icones = (
    <Flex gap={1} flexShrink={0}>
      <Tooltip label="Trocar senha">
        <IconButton as={RouterLink} to={ROTAS.TROCAR_SENHA} aria-label="Trocar senha" size="sm" variant="ghost" icon={<Icon as={KeyRound} boxSize={4} />} />
      </Tooltip>
      <Tooltip label="Sair">
        <IconButton aria-label="Sair" size="sm" variant="ghost" colorScheme="red" onClick={sair} icon={<Icon as={LogOut} boxSize={4} />} />
      </Tooltip>
    </Flex>
  );

  const conteudo = (
    <>
      {user && user.condominios.length > 0 && (
        <Box>
          <Text fontSize="xs" color="gray.500" marginBottom={1}>Condomínio</Text>
          {user.condominios.length > 1 ? (
            <Select size="sm" value={condominioAtual?.id ?? ""} onChange={(e) => trocarCondominio(e.target.value)}>
              {user.condominios.map((condominio) => (<option key={condominio.id} value={condominio.id}>{condominio.nome}</option>))}
            </Select> ) : ( <Text fontSize="sm" fontWeight="semibold" color="gray.800">{condominioAtual?.nome}</Text> )}
          {condominioAtual && <Badge marginTop={2} colorScheme="blue" textTransform="none">{condominioAtual.perfil === "ADM" ? "Administrador" : ROTULOS_PERFIL[condominioAtual.perfil as PerfilPessoa]}</Badge>}
        </Box>
      )}

      <VStack as="nav" align="stretch" spacing={1} flex={1}>
        {(condominioAtual || ehAdm) && <ItemMenu para={ROTAS.INICIO} icone={Home}>Início</ItemMenu>}

        {/* ADMINISTRAÇÃO DO SISTEMA (só ADM) */}
        {ehAdm && (
          <Grupo id="sistema" titulo="Sistema" icone={Settings} rotas={[ROTAS.CONDOMINIOS, ROTAS.ADMINISTRACAO, ROTAS.USUARIOS]}>
            <ItemMenu para={ROTAS.CONDOMINIOS} icone={LayoutDashboard}>Painel e condomínios</ItemMenu>
            <ItemMenu para={ROTAS.ADMINISTRACAO} icone={ClipboardList}>Administração geral</ItemMenu>
            <ItemMenu para={ROTAS.USUARIOS} icone={UserCog}>Usuários</ItemMenu>
          </Grupo>
        )}

        {/* COMUNICAÇÃO */}
        {mostraComunicacao && (
          <Grupo id="comunicacao" titulo="Comunicação" icone={Megaphone} rotas={[ROTAS.AVISOS, ROTAS.ATENDIMENTO, ROTAS.WHATSAPP]}>
            {condominioAtual && <ItemMenu para={ROTAS.AVISOS} icone={Megaphone}>Avisos</ItemMenu>}
            {condominioAtual && <ItemMenu para={ROTAS.ATENDIMENTO} icone={MessageSquare}>{permissoes.editaTudo ? "Atendimento" : "Fale com o síndico"}</ItemMenu>}
            {veWhatsApp && <ItemMenu para={ROTAS.WHATSAPP} icone={MessageCircle}>WhatsApp</ItemMenu>}
          </Grupo>
        )}

        {/* FINANCEIRO */}
        {mostraFinanceiro && (
          <Grupo id="financeiro" titulo="Financeiro" icone={Wallet} rotas={[ROTAS.FINANCEIRO, ROTAS.MOVIMENTACOES, ROTAS.PLANO_CONTAS, ROTAS.FRACAO_IDEAL]}>
            {permissoes.acessaFinanceiro && <ItemMenu para={ROTAS.FINANCEIRO} icone={Receipt}>Cotas condominiais</ItemMenu>}
            {permissoes.veFinanceiroTudo && <ItemMenu para={ROTAS.MOVIMENTACOES} icone={Landmark}>Conta bancária</ItemMenu>}
            {permissoes.veFinanceiroTudo && <ItemMenu para={ROTAS.PLANO_CONTAS} icone={ListTree}>Plano de contas</ItemMenu>}
            {permissoes.veFinanceiroTudo && <ItemMenu para={ROTAS.FRACAO_IDEAL} icone={ChartPie}>Fração ideal</ItemMenu>}
          </Grupo>
        )}

        {/* GESTÃO (rotina da administração) */}
        {mostraGestao && (
          <Grupo id="gestao" titulo="Gestão" icone={Briefcase} rotas={[ROTAS.TAREFAS, ROTAS.MANUTENCOES, ROTAS.PRESTADORES, ROTAS.DRIVE]}>
            {permissoes.acessaTarefas && <ItemMenu para={ROTAS.TAREFAS} icone={ListChecks}>Tarefas</ItemMenu>}
            {veManutencoes && <ItemMenu para={ROTAS.MANUTENCOES} icone={Wrench}>Manutenções</ItemMenu>}
            {vePrestadores && <ItemMenu para={ROTAS.PRESTADORES} icone={Handshake}>Prestadores</ItemMenu>}
            {veDrive && <ItemMenu para={ROTAS.DRIVE} icone={HardDrive}>Arquivos (Drive)</ItemMenu>}
          </Grupo>
        )}

        {/* UNIDADES E MORADORES */}
        {(permissoes.acessaCadastros || permissoes.veTudo) && (
          <Grupo id="moradores" titulo="Unidades e moradores" icone={Users} rotas={[ROTAS.APARTAMENTOS, ROTAS.PESSOA, ROTAS.VAGAS, ROTAS.VEICULOS]}>
            {permissoes.acessaCadastros && <ItemMenu para={ROTAS.APARTAMENTOS} icone={DoorOpen}>Apartamentos</ItemMenu>}
            {permissoes.acessaCadastros && <ItemMenu para={ROTAS.PESSOA} icone={Users}>Pessoas</ItemMenu>}
            {permissoes.veTudo && <ItemMenu para={ROTAS.VAGAS} icone={CarFront}>Vagas</ItemMenu>}
            {permissoes.acessaCadastros && <ItemMenu para={ROTAS.VEICULOS} icone={Car}>Veículos</ItemMenu>}
          </Grupo>
        )}
      </VStack>
    </>
  );

  return (
    <>
      {/* CELULAR: barra no topo + menu em gaveta */}
      <Flex display={{ base: "flex", md: "none" }} position="sticky" top={0} zIndex={20} width="100%" align="center" gap={2}bg="white" borderBottom="1px solid" borderColor="gray.100" boxShadow="sm" paddingX={3} paddingY={2}>
        <IconButton aria-label="Abrir menu" size="sm" variant="ghost" icon={<Icon as={MenuIcon} boxSize={5} />} onClick={menuCelular.onOpen} />
        <Box flex={1} minWidth={0}>
          <Text fontWeight="semibold" color="gray.800" noOfLines={1}>{pagina.titulo}</Text>
          {condominioAtual && <Text fontSize="2xs" color="gray.500" noOfLines={1}>{condominioAtual.nome}</Text>}
        </Box>
        {icones}
      </Flex>
      <Drawer isOpen={menuCelular.isOpen} onClose={menuCelular.onClose} placement="left" size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader paddingBottom={1}>
            <Text fontSize="md">Olá, {user?.full_name}</Text>
            <Text fontSize="xs" fontWeight="normal" color="gray.500">{pagina.descricao}</Text>
          </DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" gap={5} paddingBottom={6}>{conteudo}</DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* COMPUTADOR: menu lateral */}
      <Flex as="aside" display={{ base: "none", md: "flex" }} direction="column" width="260px" minWidth="260px" height="100vh" position="sticky" top={0}
        padding={5} gap={5} overflowY="auto" bg="white" borderRight="1px solid" borderColor="gray.100" boxShadow="sm">
        <Box>
          <Flex justify="space-between" align="center" gap={2}>
            <Heading size="md" color="gray.800" noOfLines={1}>{pagina.titulo}</Heading>
            {icones}
          </Flex>
          <Text marginTop={1} color="gray.500" fontSize="sm">Olá, {user?.full_name}</Text>
          <Text color="gray.500" fontSize="xs">{pagina.descricao}</Text>
        </Box>
        {conteudo}
      </Flex>

    </>
  );
};
