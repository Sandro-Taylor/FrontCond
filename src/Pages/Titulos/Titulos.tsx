import { useAuth } from "../Login/useAuth";
import { ROTULOS_PERFIL, type PerfilPessoa } from "../Pessoas/ConfigPessoas";
import { usePermissoes } from "../../Components/permissoes";
import {Badge,Box,Button,Collapse,Drawer,DrawerBody,DrawerCloseButton,DrawerContent,DrawerHeader,DrawerOverlay,Flex,Heading,Icon,IconButton,Select,Text,Tooltip,VStack,useDisclosure} from "@chakra-ui/react";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import {Link as RouterLink,useLocation,useNavigate} from "react-router-dom";
import {Building2,Car,Landmark,ChartPie,Wrench,Handshake,ChevronDown,ClipboardList,Settings,HardDrive,LayoutDashboard,UserCog,CarFront,DoorOpen,Home,KeyRound,ListChecks,LogOut,Megaphone,Menu as MenuIcon,MessageCircle,MessageSquare,Users,Wallet} from "lucide-react";

export const ROTAS = {
  INICIO: "/",
  LOGIN: "/login",
  APARTAMENTOS: "/Apartamentos",
  VAGAS: "/Vagas",
  VEICULOS: "/Veiculos",
  PESSOA: "/Pessoas",
  CONDOMINIOS: "/Condominios",
  USUARIOS: "/Usuarios",
  FINANCEIRO: "/Financeiro",
  AVISOS: "/Avisos",
  ATENDIMENTO: "/Atendimento",
  TAREFAS: "/Tarefas",
  TROCAR_SENHA: "/TrocarSenha",
  WHATSAPP: "/WhatsApp",
  ADMINISTRACAO: "/Administracao",
  DRIVE: "/Drive",
  MOVIMENTACOES: "/Movimentacoes",
  FRACAO_IDEAL: "/FracaoIdeal",
  MANUTENCOES: "/Manutencoes",
  PRESTADORES: "/Prestadores",
} as const;

const DadosTitulos = {
  [ROTAS.INICIO]: {titulo: "Dashboard",descricao: "Visão geral do condomínio."},
  [ROTAS.APARTAMENTOS]: {titulo: "Apartamentos",descricao: "Unidades, moradores, vagas e veículos.",},
  [ROTAS.VAGAS]: {titulo: "Vagas",descricao: "Vagas fixas e rotativas.",},
  [ROTAS.VEICULOS]: {titulo: "Veículos",descricao: "Veículos, vagas e condutores.",},
  [ROTAS.PESSOA]: {titulo: "Pessoas",descricao: "Moradores, prestadores e equipe.",},
  [ROTAS.CONDOMINIOS]: {titulo: "Painel do sistema",descricao: "Todos os condomínios e seus síndicos.",},
  [ROTAS.USUARIOS]: {titulo: "Usuários",descricao: "Logins de todo o sistema.",},
  [ROTAS.FINANCEIRO]: {titulo: "Financeiro",descricao: "Cotas condominiais.",},
  [ROTAS.AVISOS]: {titulo: "Avisos",descricao: "Quadro de avisos do condomínio.",},
  [ROTAS.ATENDIMENTO]: {titulo: "Atendimento",descricao: "Conversas com a administração.",},
  [ROTAS.TAREFAS]: {titulo: "Tarefas",descricao: "Tarefas da administração e responsáveis.",},
  [ROTAS.TROCAR_SENHA]: {titulo: "Minha conta",descricao: "Troca de senha.",},
  [ROTAS.MOVIMENTACOES]: {titulo: "Conta bancária",descricao: "Extrato, investimentos, fluxo de caixa e previsão.",},
  [ROTAS.FRACAO_IDEAL]: {titulo: "Fração ideal",descricao: "Participação de cada unidade no rateio.",},
  [ROTAS.MANUTENCOES]: {titulo: "Manutenções",descricao: "Vencimentos de manutenções e renovações.",},
  [ROTAS.PRESTADORES]: {titulo: "Prestadores",descricao: "Funcionários, fornecedores e prestadores.",},
  [ROTAS.DRIVE]: {titulo: "Arquivos",descricao: "Arquivos do sistema no Google Drive.",},
  [ROTAS.ADMINISTRACAO]: {titulo: "Administração geral",descricao: "Síndicos, moradores e responsáveis.",},
  [ROTAS.WHATSAPP]: {titulo: "WhatsApp",descricao: "Mensagens recebidas no número do sistema.",},
};

// ITEM DO MENU (destaca a página atual)
const ItemMenu = ({ para, icone, children }: { para: string; icone: ElementType; children: ReactNode }) => {
  const { pathname } = useLocation();
  const ativo = para === ROTAS.INICIO ? pathname === para : pathname.toLowerCase().startsWith(para.toLowerCase());
  return (
    <Button as={RouterLink} to={para} variant={ativo ? "solid" : "ghost"} colorScheme={ativo ? "blue" : undefined} bg={ativo ? "blue.50" : undefined}
      color={ativo ? "blue.700" : undefined} size="sm" justifyContent="flex-start" leftIcon={<Icon as={icone} boxSize={4} />} fontWeight={ativo ? "semibold" : "medium"}>
      {children}
    </Button>
  );
};

// TÓPICO DO MENU: abre e fecha como leque; abre sozinho se a página atual está nele
const CHAVE_MENU = "menu_topicos_abertos";

function lerAbertos(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(CHAVE_MENU) ?? "{}"); } catch { return {}; }
}

const Grupo = ({ id, titulo, icone, rotas, children }: { id: string; titulo: string; icone: ElementType; rotas: string[]; children: ReactNode }) => {
  const { pathname } = useLocation();
  const contemAtual = rotas.some((r) => pathname.toLowerCase().startsWith(r.toLowerCase()));
  const [aberto, setAberto] = useState<boolean>(() => lerAbertos()[id] ?? contemAtual);

  useEffect(() => { if (contemAtual) setAberto(true); }, [contemAtual]);

  function alternar() {
    const novo = !aberto;
    setAberto(novo);
    try { localStorage.setItem(CHAVE_MENU, JSON.stringify({ ...lerAbertos(), [id]: novo })); } catch { /* sem localStorage */ }
  }

  return (
    <Box>
      <Button variant="ghost" size="sm" width="100%" justifyContent="space-between" onClick={alternar} aria-expanded={aberto}
        color={contemAtual ? "blue.700" : "gray.700"} fontWeight="semibold"
        leftIcon={<Icon as={icone} boxSize={4} />} rightIcon={<Icon as={ChevronDown} boxSize={4} transition="transform 0.2s" transform={aberto ? "rotate(180deg)" : undefined} />}>
        <Text as="span" flex={1} textAlign="left">{titulo}</Text>
      </Button>
      <Collapse in={aberto} animateOpacity>
        <VStack align="stretch" spacing={1} paddingLeft={4} marginLeft={3} marginTop={1} borderLeft="1px solid" borderColor="gray.100">
          {children}
        </VStack>
      </Collapse>
    </Box>
  );
};

export const Titulo = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, condominioAtual, trocarCondominio } = useAuth();
  const permissoes = usePermissoes();
  const menuCelular = useDisclosure();
  useEffect(() => { menuCelular.onClose(); }, [pathname]); // fecha a gaveta ao trocar de página
  // página exata ou subpágina (ex.: /Apartamentos/123 usa o título de /Apartamentos)
  const chave = (Object.keys(DadosTitulos) as (keyof typeof DadosTitulos)[])
    .filter((rota) => rota !== ROTAS.INICIO)
    .find((rota) => pathname.toLowerCase().startsWith(rota.toLowerCase()))
    ?? (pathname === ROTAS.INICIO ? ROTAS.INICIO : undefined);
  const pagina = chave ? DadosTitulos[chave] : undefined;
  if (!pagina) return null;
  function sair() {logout(); navigate(ROTAS.LOGIN)}

  const ehAdm = Boolean(user?.admin_sistema);
  const veWhatsApp = ehAdm || Boolean(user?.responsavel) || Boolean(user?.condominios.some((c) => c.perfil === "SINDICO"));

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

  // condomínio atual + as 3 seções do menu (usado no desktop e na gaveta do celular)
  const conteudo = (
    <>
      {user && user.condominios.length > 0 && (
        <Box>
          <Text fontSize="xs" color="gray.500" marginBottom={1}>Condomínio</Text>
          {user.condominios.length > 1 ? (
            <Select size="sm" value={condominioAtual?.id ?? ""} onChange={(e) => trocarCondominio(e.target.value)}>
              {user.condominios.map((condominio) => (
                <option key={condominio.id} value={condominio.id}>{condominio.nome}</option>
              ))}
            </Select>
          ) : (
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{condominioAtual?.nome}</Text>
          )}
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

        {/* ADMINISTRAÇÃO DO CONDOMÍNIO */}
        {(condominioAtual || veWhatsApp) && (
          <Grupo id="administracao" titulo={permissoes.editaTudo || veWhatsApp ? "Condomínio" : "Condomínio"} icone={Building2}
            rotas={[ROTAS.AVISOS, ROTAS.ATENDIMENTO, ROTAS.TAREFAS, ROTAS.FINANCEIRO, ROTAS.MOVIMENTACOES, ROTAS.FRACAO_IDEAL, ROTAS.WHATSAPP, ROTAS.MANUTENCOES, ROTAS.PRESTADORES, ROTAS.DRIVE]}>
            {condominioAtual && <ItemMenu para={ROTAS.AVISOS} icone={Megaphone}>Avisos</ItemMenu>}
            {condominioAtual && <ItemMenu para={ROTAS.ATENDIMENTO} icone={MessageSquare}>{permissoes.editaTudo ? "Atendimento" : "Fale com o síndico"}</ItemMenu>}
            {permissoes.acessaTarefas && <ItemMenu para={ROTAS.TAREFAS} icone={ListChecks}>Tarefas</ItemMenu>}
            {permissoes.acessaFinanceiro && <ItemMenu para={ROTAS.FINANCEIRO} icone={Wallet}>Financeiro</ItemMenu>}
            {permissoes.veFinanceiroTudo && <ItemMenu para={ROTAS.MOVIMENTACOES} icone={Landmark}>Conta bancária</ItemMenu>}
            {permissoes.veFinanceiroTudo && <ItemMenu para={ROTAS.FRACAO_IDEAL} icone={ChartPie}>Fração ideal</ItemMenu>}
            {veWhatsApp && <ItemMenu para={ROTAS.WHATSAPP} icone={MessageCircle}>WhatsApp</ItemMenu>}
            {condominioAtual && permissoes.veTudo && <ItemMenu para={ROTAS.MANUTENCOES} icone={Wrench}>Manutenções</ItemMenu>}
            {condominioAtual && permissoes.veFinanceiroTudo && <ItemMenu para={ROTAS.PRESTADORES} icone={Handshake}>Prestadores</ItemMenu>}
            {(ehAdm || permissoes.editaTudo) && <ItemMenu para={ROTAS.DRIVE} icone={HardDrive}>Arquivos (Drive)</ItemMenu>}
          </Grupo>
        )}

        {/* MORADORES */}
        {(permissoes.acessaCadastros || permissoes.veTudo) && (
          <Grupo id="moradores" titulo="Moradores" icone={Users} rotas={[ROTAS.APARTAMENTOS, ROTAS.PESSOA, ROTAS.VAGAS, ROTAS.VEICULOS]}>
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
      <Flex display={{ base: "flex", md: "none" }} position="sticky" top={0} zIndex={20} width="100%" align="center" gap={2}
        bg="white" borderBottom="1px solid" borderColor="gray.100" boxShadow="sm" paddingX={3} paddingY={2}>
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
