import { useAuth } from "../Login/useAuth";
import {Badge,Box,Button,Flex,Heading,Icon,Select,Text,VStack} from "@chakra-ui/react";
import {Link as RouterLink,useLocation,useNavigate} from "react-router-dom";
import {Building,Car,CarFront,DoorOpen,Home,LogOut,Users} from "lucide-react";

export const ROTAS = {
  INICIO: "/",
  LOGIN: "/login",
  APARTAMENTOS: "/Apartamentos",
  VAGAS: "/Vagas",
  VEICULOS: "/Veiculos",
  PESSOA: "/Pessoas",
  PROJETOS: "/Projetos",
  TAREFAS: "/Tarefas",
  CONDOMINIOS: "/Condominios",
} as const;

const DadosTitulos = {
  [ROTAS.INICIO]: {titulo: "Dashboard",descricao: "Visão geral do condomínio."},
  [ROTAS.APARTAMENTOS]: {titulo: "Apartamentos",descricao: "Unidades, moradores, vagas e veículos.",},
  [ROTAS.VAGAS]: {titulo: "Vagas",descricao: "Vagas fixas e rotativas.",},
  [ROTAS.VEICULOS]: {titulo: "Veículos",descricao: "Veículos, vagas e condutores.",},
  [ROTAS.PESSOA]: {titulo: "Pessoas",descricao: "Moradores, prestadores e equipe.",},
  [ROTAS.PROJETOS]: {titulo: "Projetos",descricao: "Projetos e obras do condomínio.",},
  [ROTAS.TAREFAS]: {titulo: "Tarefas",descricao: "Tarefas vinculadas aos projetos.",},
  [ROTAS.CONDOMINIOS]: {titulo: "Condomínios",descricao: "Cadastro dos condomínios do sistema.",},
};

export const Titulo = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, condominioAtual, trocarCondominio } = useAuth();
  // página exata ou subpágina (ex.: /Apartamentos/123 usa o título de /Apartamentos)
  const chave = (Object.keys(DadosTitulos) as (keyof typeof DadosTitulos)[])
    .filter((rota) => rota !== ROTAS.INICIO)
    .find((rota) => pathname.toLowerCase().startsWith(rota.toLowerCase()))
    ?? (pathname === ROTAS.INICIO ? ROTAS.INICIO : undefined);
  const pagina = chave ? DadosTitulos[chave] : undefined;
  if (!pagina) return null;
  function sair() {logout(); navigate(ROTAS.LOGIN)}

  return (
    <Flex as="aside"direction="column"width={{ base: "full", md: "260px" }}minWidth={{ md: "260px" }}height={{ md: "100vh" }}position={{ md: "sticky" }}top={{ md: 0 }}padding={5}gap={6}
      borderRadius={{ base: "2xl", md: 0 }}bg="white"border="1px solid"borderColor="gray.100"boxShadow="sm">
      <Box>
        <VStack>
          <Heading size="md" color="gray.800">{pagina.titulo}</Heading>
          <Text marginTop={1} color="gray.500" fontSize="sm">Olá, {user?.full_name}</Text>
          <Text color="gray.500" fontSize="sm">{pagina.descricao}</Text>
        </VStack>
      </Box>

      {/* CONDOMÍNIO ATUAL */}
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
          {condominioAtual && <Badge marginTop={2} colorScheme="blue">{condominioAtual.perfil}</Badge>}
        </Box>
      )}

      <VStack as="nav"align="stretch"spacing={1}flex={1}>
        <Button as={RouterLink}to={ROTAS.INICIO}variant="ghost"size="sm"justifyContent="flex-start"leftIcon={
          <Icon as={Home}boxSize={4}/>}>Início</Button>
        <Button as={RouterLink}to={ROTAS.APARTAMENTOS}variant="ghost"size="sm"justifyContent="flex-start"leftIcon={
          <Icon as={DoorOpen}boxSize={4}/>}>Apartamentos</Button>
        <Button as={RouterLink}to={ROTAS.VAGAS}variant="ghost"size="sm"justifyContent="flex-start"leftIcon={
          <Icon as={CarFront}boxSize={4}/>}>Vagas</Button>
        <Button as={RouterLink}to={ROTAS.VEICULOS}variant="ghost"size="sm"justifyContent="flex-start"leftIcon={
          <Icon as={Car}boxSize={4}/>}>Veículos</Button>
        <Button as={RouterLink}to={ROTAS.PESSOA}variant="ghost"size="sm"justifyContent="flex-start"leftIcon={
          <Icon as={Users}boxSize={4}/>}>Pessoas</Button>
        {user?.admin_sistema && (
          <Button as={RouterLink}to={ROTAS.CONDOMINIOS}variant="ghost"size="sm"justifyContent="flex-start"leftIcon={
            <Icon as={Building}boxSize={4}/>}>Condomínios</Button>
        )}
      </VStack>

      <Button variant="outline"size="sm"colorScheme="red"onClick={sair}justifyContent="flex-start"leftIcon={
      <Icon as={LogOut}boxSize={4}/>}>Sair</Button>
    </Flex>
  );
};
