// ---------------------------------------------------------
// PESSOAS
// ---------------------------------------------------------
// Consulta e edição dos dados das pessoas do condomínio.
// Funcionário (porteiro, zelador...) tem a ficha com cargo,
// vínculo, turno e admissão; a lista de cargos é gerida aqui.
// Os vínculos com apartamentos (proprietário, inquilino,
// residente), vagas e veículos são geridos em Apartamentos.
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import type { ElementType, KeyboardEvent, ReactNode } from "react";
import {
  Alert, AlertIcon, Badge, Box, Button, Divider, Flex, FormControl, FormLabel, Input, InputGroup, InputLeftElement,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner,
  Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack, createIcon, useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, CalendarIcon, CheckCircleIcon, ChevronRightIcon, CopyIcon, DeleteIcon, EmailIcon, InfoOutlineIcon, LockIcon, PhoneIcon, RepeatIcon, SearchIcon, TimeIcon, UnlockIcon } from "@chakra-ui/icons";
import { Titulo } from "../Titulos/Titulos";
import { CelulaEditavel } from "../../Components/CelulaEditavel";
import { FotoPessoa } from "../../Components/Arquivos";
import { formatarCpf, formatarData, formatarDataIso, formatarPlaca, formatarTelefone } from "../../Components/config";
import { CriarPessoa } from "./PessoasCriar";
import { SeletorResponsavel, useOpcoesResponsavel } from "./CampoResponsavel";
import { usePessoas } from "./Hooks/Pessoas";
import { darAcesso, gerarNovaSenha, removerAcesso, type AcessoResultado } from "./API/AcessoPessoa";
import { usePermissoes } from "../../Components/permissoes";
import { useAuth } from "../Login/useAuth";
import { CamposFuncionario, ModalCargos, fichaParaValores, paraFichaDados, useCargos, validarFicha, type ValoresFicha } from "./CamposFuncionario";
import { salvarFichaFuncionario } from "./API/FuncionarioPessoa";
import {
  PERFIS_SO_ADM, ROTULOS_CATEGORIA, ROTULOS_PERFIL, categoriaPessoa, descreverVinculo, rotuloApartamento, rotuloPerfilCompleto,
  type Categoria, type PerfilPessoa, type Pessoa, type PessoaEditarDados, type TipoRelacao,
} from "./ConfigPessoas";
import { IconeCarro, IconeCartao, IconeCasa, IconeChave, IconePredio, IconeUsuario } from "./IconesPessoas";

// ÍCONES
const traco = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconeGrade = createIcon({ displayName: "IconeGrade", viewBox: "0 0 24 24", defaultProps: traco, path: (
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>
) });
const IconeLista = createIcon({ displayName: "IconeLista", viewBox: "0 0 24 24", defaultProps: traco, path: (<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />) });

// TIPOS
type Visualizacao = "cards" | "lista";
type FiltroStatus = "todas" | "ativas" | "inativas";
const CHAVE_VISUALIZACAO = "pessoas:visualizacao";

// UTILITÁRIOS
function vinculoPrincipal(pessoa: Pessoa) {
  return pessoa.apartamentos.find((v) => v.principal) ?? pessoa.apartamentos[0];
}

const BadgeCategoria = ({ pessoa }: { pessoa: Pessoa }) => {
  const categoria = ROTULOS_CATEGORIA[categoriaPessoa(pessoa)];
  return <Badge borderRadius="full" paddingX={2.5} fontSize="xs" textTransform="none" variant="subtle" colorScheme={categoria.cor}>{categoria.rotulo}</Badge>;
};

const aoPressionarEnter = (acao: () => void) => (e: KeyboardEvent<HTMLElement>) => { if (e.key === "Enter") acao(); };

// ESTILOS
const estiloModal = { borderRadius: "2xl", boxShadow: "0 24px 64px rgba(16, 24, 40, 0.18)" };
const estiloBadge = { borderRadius: "full", paddingX: 2.5, paddingY: 0.5, fontSize: "xs", fontWeight: "medium", textTransform: "none" as const };
const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500", borderColor: "gray.100", paddingY: 3 };

// COMPONENTES AUXILIARES

function Segmentado<T extends string>({ opcoes, valor, aoMudar }: { opcoes: { valor: T; rotulo: string; icone?: ElementType }[]; valor: T; aoMudar: (novo: T) => void }) {
  return (
    <Flex bg="gray.100" borderRadius="lg" padding={1} gap={1}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        const Icone = opcao.icone;
        return (
          <Button key={opcao.valor} variant="unstyled" display="inline-flex" alignItems="center" gap={1.5} height="30px" paddingX={3} borderRadius="md" fontSize="sm" fontWeight="medium"
            bg={ativo ? "white" : "transparent"} color={ativo ? "gray.800" : "gray.500"} boxShadow={ativo ? "0 1px 2px rgba(16, 24, 40, 0.1)" : "none"}
            onClick={() => aoMudar(opcao.valor)}>
            {Icone && <Icone boxSize={4} />} {opcao.rotulo}
          </Button>
        );
      })}
    </Flex>
  );
}

const Indicador = ({ icone: Icone, rotulo, valor }: { icone: ElementType; rotulo: string; valor: number }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Flex align="center" gap={2} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>
    <Text marginTop={1} fontSize="2xl" fontWeight="semibold" color="gray.800">{valor}</Text>
  </Box>
);

const Dado = ({ icone: Icone, rotulo, children }: { icone: ElementType; rotulo: string; children: ReactNode }) => (
  <Box minWidth={0}>
    <Flex align="center" gap={1.5} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs">{rotulo}</Text>
    </Flex>
    <Box marginTop={1} fontSize="sm" fontWeight="medium" color="gray.800">{children}</Box>
  </Box>
);

const BadgeStatus = ({ ativo }: { ativo: boolean }) => (
  <Badge {...estiloBadge} display="inline-flex" alignItems="center" gap={1.5} variant="subtle" colorScheme={ativo ? "green" : "red"}>
    <Box boxSize={1.5} borderRadius="full" bg="currentColor" />{ativo ? "Ativo" : "Inativo"}
  </Badge>
);

const BadgeTipo = ({ tipo }: { tipo: TipoRelacao }) => {
  const cor = tipo === "PROPRIETARIO" ? "purple" : tipo === "INQUILINO" ? "blue" : "teal";
  const Icone = tipo === "PROPRIETARIO" ? IconeChave : IconeCasa;
  const rotulo = tipo === "PROPRIETARIO" ? "Proprietário" : tipo === "INQUILINO" ? "Inquilino" : "Residente";
  return (
    <Badge {...estiloBadge} display="inline-flex" alignItems="center" gap={1.5} variant="subtle" colorScheme={cor}>
      <Icone boxSize={3} />{rotulo}
    </Badge>
  );
};

const Campo = ({ icone: Icone, rotulo, children }: { icone: ElementType; rotulo: string; children: ReactNode }) => (
  <Box>
    <Flex align="center" gap={1.5} color="gray.500" marginBottom={1.5}>
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>
    {children}
  </Box>
);

const TituloSecao = ({ icone: Icone, contador, children }: { icone: ElementType; contador?: number; children: ReactNode }) => (
  <Flex align="center" gap={2} marginBottom={4}>
    <Icone boxSize={4} color="gray.400" />
    <Text fontSize="sm" fontWeight="semibold" color="gray.800">{children}</Text>
    {contador !== undefined && <Badge borderRadius="full" colorScheme="gray" fontSize="xs" paddingX={2}>{contador}</Badge>}
  </Flex>
);

// PÁGINA
export const Pessoas = () => {
  const modalAdicionar = useDisclosure();
  const modalDetalhes = useDisclosure();
  const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "TODAS">("TODAS");
  const [visualizacao, setVisualizacao] = useState<Visualizacao>(() => {
    try { return localStorage.getItem(CHAVE_VISUALIZACAO) === "lista" ? "lista" : "cards"; } catch { return "cards"; }
  });
  const { pessoas, carregando, criando, criar, editar, excluir, carregarPessoas } = usePessoas();
  const permissoes = usePermissoes();
  const toast = useToast();
  const { user } = useAuth();
  const ehAdm = Boolean(user?.admin_sistema);
  // síndico e conselheiros: perfil, situação, acesso e exclusão só pelo ADM do sistema
  const protegida = (pessoa: Pessoa) => !ehAdm && PERFIS_SO_ADM.includes(pessoa.perfil);

  // funcionários: cargos e ficha
  const { cargos, recarregar: recarregarCargos } = useCargos(permissoes.veTudo);
  const modalCargos = useDisclosure();
  const [filtroCargo, setFiltroCargo] = useState("");
  const [ficha, setFicha] = useState<ValoresFicha>(fichaParaValores(null));
  const [salvandoFicha, setSalvandoFicha] = useState(false);

  // acesso ao sistema
  const modalAcesso = useDisclosure();
  const [emailAcesso, setEmailAcesso] = useState("");
  const [resultadoAcesso, setResultadoAcesso] = useState<AcessoResultado | null>(null);
  const [processandoAcesso, setProcessandoAcesso] = useState(false);

  // mantém o modal com os dados mais recentes depois de salvar
  useEffect(() => {
    if (!pessoaSelecionada) return;
    const atualizada = pessoas.find((p) => p.id === pessoaSelecionada.id);
    if (atualizada) setPessoaSelecionada(atualizada);
  }, [pessoas]);

  // formulário da ficha acompanha a pessoa aberta
  useEffect(() => { setFicha(fichaParaValores(pessoaSelecionada?.funcionario ?? null)); }, [pessoaSelecionada]);

  async function salvarFicha() {
    if (!pessoaSelecionada) return;
    const erro = validarFicha(ficha);
    if (erro) { toast({ title: erro, status: "warning" }); return; }
    try {
      setSalvandoFicha(true);
      await salvarFichaFuncionario(pessoaSelecionada.id, paraFichaDados(ficha));
      await carregarPessoas();
      toast({ title: "Ficha do funcionário salva", status: "success", duration: 2000 });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro ao salvar a ficha", status: "error" });
    } finally {
      setSalvandoFicha(false);
    }
  }

  // FILTROS
  function mudarVisualizacao(nova: Visualizacao) {
    setVisualizacao(nova);
    try { localStorage.setItem(CHAVE_VISUALIZACAO, nova); } catch { /* sem localStorage */ }
  }
  function limparFiltros() { setBusca(""); setFiltroStatus("todas"); setFiltroCategoria("TODAS"); setFiltroCargo(""); }

  const termo = busca.trim().toLowerCase();
  const termoNumeros = termo.replace(/\D/g, "");
  const filtrando = termo !== "" || filtroStatus !== "todas" || filtroCategoria !== "TODAS" || filtroCargo !== "";
  const pessoasFiltradas = pessoas.filter((p) => {
    if (filtroStatus === "ativas" && !p.ativo) return false;
    if (filtroStatus === "inativas" && p.ativo) return false;
    if (filtroCategoria !== "TODAS" && categoriaPessoa(p) !== filtroCategoria) return false;
    if (filtroCargo && p.funcionario?.cargo_id !== filtroCargo) return false;
    if (!termo) return true;
    return (
      p.nome.toLowerCase().includes(termo) ||
      (p.funcionario?.cargo_nome ?? "").toLowerCase().includes(termo) ||
      (termoNumeros !== "" && (p.cpf ?? "").includes(termoNumeros)) ||
      (p.email ?? "").toLowerCase().includes(termo) ||
      p.apartamentos.some((v) => rotuloApartamento(v.apartamento).toLowerCase().includes(termo))
    );
  });

  const contar = (...categorias: Categoria[]) => pessoas.filter((p) => categorias.includes(categoriaPessoa(p))).length;

  const opcoesResponsavel = useOpcoesResponsavel(permissoes.veTudo);

  function abrirDetalhes(pessoa: Pessoa) { setPessoaSelecionada(pessoa); modalDetalhes.onOpen(); }

  async function editarCampo(pessoa: Pessoa, campo: keyof PessoaEditarDados, valor: string | boolean | null) {
    const dados: PessoaEditarDados = {
      nome: pessoa.nome, cpf: pessoa.cpf, email: pessoa.email, telefone: pessoa.telefone,
      data_nascimento: pessoa.data_nascimento, ativo: pessoa.ativo, perfil: pessoa.perfil, [campo]: valor,
    };
    await editar(pessoa.id, dados);
  }

  // ================= ACESSO AO SISTEMA =================
  function abrirDarAcesso() {
    setEmailAcesso(pessoaSelecionada?.email ?? "");
    setResultadoAcesso(null);
    modalAcesso.onOpen();
  }

  async function confirmarDarAcesso() {
    if (!pessoaSelecionada) return;
    if (!emailAcesso.trim()) {
      toast({ title: "Informe o e-mail: ele será o login da pessoa", status: "warning" });
      return;
    }
    try {
      setProcessandoAcesso(true);
      setResultadoAcesso(await darAcesso(pessoaSelecionada.id, emailAcesso.trim()));
      await carregarPessoas();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao dar acesso", status: "error" });
    } finally {
      setProcessandoAcesso(false);
    }
  }

  async function redefinirSenha() {
    if (!pessoaSelecionada) return;
    if (!window.confirm(`Gerar uma nova senha para ${pessoaSelecionada.nome}? A senha atual deixa de funcionar.`)) return;
    try {
      setResultadoAcesso(await gerarNovaSenha(pessoaSelecionada.id));
      modalAcesso.onOpen();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao gerar nova senha", status: "error" });
    }
  }

  async function tirarAcesso() {
    if (!pessoaSelecionada) return;
    if (!window.confirm(`Remover o acesso de ${pessoaSelecionada.nome} ao sistema neste condomínio? O cadastro da pessoa continua.`)) return;
    try {
      await removerAcesso(pessoaSelecionada.id);
      await carregarPessoas();
      toast({ title: "Acesso removido", status: "success", duration: 2000 });
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao remover acesso", status: "error" });
    }
  }

  async function copiarSenha(senha: string) {
    try {
      await navigator.clipboard.writeText(senha);
      toast({ title: "Senha copiada", status: "success", duration: 1500 });
    } catch {
      toast({ title: "Não foi possível copiar; anote a senha", status: "warning" });
    }
  }

  async function handleExcluir() {
    if (!pessoaSelecionada) return;
    if (await excluir(pessoaSelecionada.id)) { setPessoaSelecionada(null); modalDetalhes.onClose(); }
  }

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Pessoas</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>
              {filtrando
                ? `${pessoasFiltradas.length} de ${pessoas.length} pessoas`
                : `${pessoas.length} ${pessoas.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}`}
            </Text>
          </Box>
          {permissoes.editaTudo && (
            <Flex gap={2}>
              <Button variant="outline" borderRadius="lg" onClick={modalCargos.onOpen}>Cargos</Button>
              <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={modalAdicionar.onOpen}>Nova pessoa</Button>
            </Flex>
          )}
        </Flex>

        {/* INDICADORES */}
        {!carregando && pessoas.length > 0 && (
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
            <Indicador icone={IconeUsuario} rotulo="Total de pessoas" valor={pessoas.length} />
            <Indicador icone={IconeChave} rotulo="Proprietários" valor={contar("PROPRIETARIO")} />
            <Indicador icone={IconeCasa} rotulo="Inquilinos" valor={contar("INQUILINO")} />
            <Indicador icone={IconeUsuario} rotulo="Residentes" valor={contar("RESIDENTE")} />
            <Indicador icone={CheckCircleIcon} rotulo="Funcionários" valor={contar("FUNCIONARIO")} />
          </SimpleGrid>
        )}

        {/* FILTROS */}
        {!carregando && pessoas.length > 0 && (
          <Flex justify="space-between" align={{ base: "stretch", lg: "center" }} direction={{ base: "column", lg: "row" }} gap={3} marginBottom={5}>
            <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} flex={1}>
              <InputGroup maxWidth={{ base: "100%", md: "380px" }}>
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CPF, e-mail, apartamento ou cargo" bg="white" borderRadius="lg" />
              </InputGroup>
              <Select maxWidth={{ md: "220px" }} bg="white" borderRadius="lg" value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value as Categoria | "TODAS"); setFiltroCargo(""); }}>
                <option value="TODAS">Todas as categorias</option>
                {(Object.keys(ROTULOS_CATEGORIA) as Categoria[]).map((c) => <option key={c} value={c}>{ROTULOS_CATEGORIA[c].rotulo}</option>)}
              </Select>
              {filtroCategoria === "FUNCIONARIO" && cargos.length > 0 && (
                <Select maxWidth={{ md: "200px" }} bg="white" borderRadius="lg" value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)}>
                  <option value="">Todos os cargos</option>
                  {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              )}
              <Segmentado<FiltroStatus> valor={filtroStatus} aoMudar={setFiltroStatus} opcoes={[{ valor: "todas", rotulo: "Todas" }, { valor: "ativas", rotulo: "Ativas" }, { valor: "inativas", rotulo: "Inativas" }]} />
            </Flex>
            <Segmentado<Visualizacao> valor={visualizacao} aoMudar={mudarVisualizacao} opcoes={[{ valor: "cards", rotulo: "Cards", icone: IconeGrade }, { valor: "lista", rotulo: "Lista", icone: IconeLista }]} />
          </Flex>
        )}

        {/* LISTAGEM */}
        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : pessoas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <InfoOutlineIcon boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Nenhuma pessoa cadastrada</Text>
            <Text marginTop={1} fontSize="sm" color="gray.500">Moradores entram pelo cadastro do apartamento. Aqui você cadastra também síndico, conselho, funcionários e prestadores.</Text>
          </Flex>
        ) : pessoasFiltradas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <SearchIcon color="gray.300" boxSize={6} />
            <Text marginTop={3}>Nenhuma pessoa encontrada</Text>
            <Button marginTop={4} size="sm" onClick={limparFiltros}>Limpar filtros</Button>
          </Flex>
        ) : visualizacao === "cards" ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
            {pessoasFiltradas.map((pessoa) => {
              const principal = vinculoPrincipal(pessoa);
              const outros = Math.max(pessoa.apartamentos.length - 1, 0);
              return (
                <Flex key={pessoa.id} direction="column" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" cursor="pointer" tabIndex={0}
                  onClick={() => abrirDetalhes(pessoa)} onKeyDown={aoPressionarEnter(() => abrirDetalhes(pessoa))}
                  _hover={{ borderColor: "blue.200", boxShadow: "0 8px 24px rgba(16,24,40,.07)" }}>
                  <Flex align="center" justify="space-between" gap={3} padding={5}>
                    <Flex align="center" gap={3} minWidth={0}>
                      <FotoPessoa nome={pessoa.nome} fotoId={pessoa.foto_arquivo_id} tamanho="md" />
                      <Box minWidth={0}>
                        <Text fontWeight="semibold" color="gray.800" noOfLines={1}>{pessoa.nome}</Text>
                        <Text fontSize="sm" color="gray.500">{pessoa.cpf ? formatarCpf(pessoa.cpf) : "CPF não informado"}</Text>
                      </Box>
                    </Flex>
                    <BadgeStatus ativo={pessoa.ativo} />
                  </Flex>

                  <Divider />

                  <SimpleGrid columns={2} spacing={4} padding={5} flex={1}>
                    <Dado icone={IconePredio} rotulo="Unidade">{principal ? rotuloApartamento(principal.apartamento) : "Sem unidade"}</Dado>
                    <Dado icone={IconeUsuario} rotulo="Perfil">{rotuloPerfilCompleto(pessoa)}</Dado>
                    <Box gridColumn="span 2">
                      <Dado icone={IconeChave} rotulo="Vínculo">{principal ? descreverVinculo(principal) : "-"}</Dado>
                    </Box>
                  </SimpleGrid>

                  <Divider />

                  <Flex justify="space-between" align="center" paddingX={5} paddingY={3}>
                    <Flex align="center" gap={2}>
                      <BadgeCategoria pessoa={pessoa} />
                      {pessoa.user_id && <Badge borderRadius="full" paddingX={2} fontSize="xs" textTransform="none" colorScheme="green" variant="outline">Acesso</Badge>}
                      {outros > 0 && <Text fontSize="xs" color="gray.500">+{outros} unidade(s)</Text>}
                    </Flex>
                    <ChevronRightIcon color="blue.500" />
                  </Flex>
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th {...estiloTh}>Pessoa</Th>
                    <Th {...estiloTh}>Categoria</Th>
                    <Th {...estiloTh}>Unidade</Th>
                    <Th {...estiloTh}>Vínculo</Th>
                    <Th {...estiloTh}>Perfil</Th>
                    <Th {...estiloTh}>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pessoasFiltradas.map((pessoa) => {
                    const principal = vinculoPrincipal(pessoa);
                    return (
                      <Tr key={pessoa.id} cursor="pointer" onClick={() => abrirDetalhes(pessoa)} _hover={{ bg: "gray.50" }}>
                        <Td>
                          <Text fontWeight="medium">{pessoa.nome}</Text>
                          <Text fontSize="xs" color="gray.500">{pessoa.cpf ? formatarCpf(pessoa.cpf) : "CPF não informado"}</Text>
                        </Td>
                        <Td><BadgeCategoria pessoa={pessoa} /></Td>
                        <Td>{principal ? rotuloApartamento(principal.apartamento) : "-"}</Td>
                        <Td>{principal ? descreverVinculo(principal) : "-"}</Td>
                        <Td>{rotuloPerfilCompleto(pessoa)}</Td>
                        <Td><BadgeStatus ativo={pessoa.ativo} /></Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* MODAL CADASTRO */}
        <Modal isOpen={modalAdicionar.isOpen} onClose={modalAdicionar.onClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent {...estiloModal}>
            <ModalHeader>Nova pessoa</ModalHeader>
            <ModalCloseButton />
            <ModalBody paddingBottom={6}>
              <CriarPessoa aoCriar={modalAdicionar.onClose} criando={criando} criar={criar} cargos={cargos} />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* MODAL DETALHES */}
        <Modal isOpen={modalDetalhes.isOpen} onClose={modalDetalhes.onClose} size="2xl" isCentered scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent {...estiloModal}>
            <ModalCloseButton />
            {pessoaSelecionada && (
              <>
                <ModalHeader bg="gray.50" borderTopRadius="2xl" padding={6}>
                  <Flex align="center" gap={4}>
                    <FotoPessoa nome={pessoaSelecionada.nome} fotoId={pessoaSelecionada.foto_arquivo_id} tamanho="xl"
                      pessoaId={pessoaSelecionada.id} editavel={permissoes.editaUnidade}
                      aoMudar={(foto) => { setPessoaSelecionada({ ...pessoaSelecionada, foto_arquivo_id: foto }); carregarPessoas(); }} />
                    <Box>
                      <Text fontSize="xl" fontWeight="semibold">{pessoaSelecionada.nome}</Text>
                      <Flex gap={2} marginTop={2} wrap="wrap">
                        <BadgeStatus ativo={pessoaSelecionada.ativo} />
                        <BadgeCategoria pessoa={pessoaSelecionada} />
                      </Flex>
                    </Box>
                  </Flex>
                </ModalHeader>

                <ModalBody padding={6}>
                  {/* INFORMAÇÕES PESSOAIS */}
                  <TituloSecao icone={IconeUsuario}>Informações pessoais</TituloSecao>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    <Campo icone={IconeUsuario} rotulo="Nome">
                      <CelulaEditavel editavel={permissoes.editaUnidade} valor={pessoaSelecionada.nome} onSalvar={(valor) => editarCampo(pessoaSelecionada, "nome", valor)} />
                    </Campo>
                    <Campo icone={IconeCartao} rotulo="CPF">
                      <CelulaEditavel editavel={permissoes.editaUnidade} valor={pessoaSelecionada.cpf || ""} formatar={formatarCpf} placeholder="Adicionar CPF" onSalvar={(valor) => editarCampo(pessoaSelecionada, "cpf", valor || null)} />
                    </Campo>
                    <Campo icone={EmailIcon} rotulo="E-mail">
                      <CelulaEditavel editavel={permissoes.editaUnidade} valor={pessoaSelecionada.email || ""} placeholder="Adicionar e-mail" onSalvar={(valor) => editarCampo(pessoaSelecionada, "email", valor || null)} />
                    </Campo>
                    <Campo icone={PhoneIcon} rotulo="Telefone">
                      <CelulaEditavel editavel={permissoes.editaUnidade} valor={pessoaSelecionada.telefone || ""} formatar={formatarTelefone} placeholder="Adicionar telefone" onSalvar={(valor) => editarCampo(pessoaSelecionada, "telefone", valor || null)} />
                    </Campo>
                    <Campo icone={CalendarIcon} rotulo="Nascimento">
                      <CelulaEditavel editavel={permissoes.editaUnidade} valor={pessoaSelecionada.data_nascimento || ""} tipo="date" formatar={formatarDataIso} placeholder="Adicionar data" onSalvar={(valor) => editarCampo(pessoaSelecionada, "data_nascimento", valor || null)} />
                    </Campo>
                    <Campo icone={TimeIcon} rotulo="Cadastrado em">
                      <Text fontSize="sm">{formatarData(pessoaSelecionada.created_at)}</Text>
                    </Campo>
                    <Campo icone={IconeChave} rotulo="Perfil de acesso">
                      <Select size="sm" isDisabled={!permissoes.editaTudo || protegida(pessoaSelecionada)} value={pessoaSelecionada.perfil} onChange={(e) => editarCampo(pessoaSelecionada, "perfil", e.target.value as PerfilPessoa)}>
                        {(Object.keys(ROTULOS_PERFIL) as PerfilPessoa[]).map((perfil) => (
                          <option key={perfil} value={perfil} disabled={!ehAdm && PERFIS_SO_ADM.includes(perfil) && perfil !== pessoaSelecionada.perfil}>{ROTULOS_PERFIL[perfil]}</option>
                        ))}
                      </Select>
                      {!ehAdm && permissoes.editaTudo && <Text fontSize="2xs" color="gray.500" marginTop={1}>Síndico e conselheiros são designados pelo administrador do sistema.</Text>}
                    </Campo>
                    <Campo icone={PhoneIcon} rotulo="Responsável (WhatsApp)">
                      <SeletorResponsavel tamanho="sm" opcoes={opcoesResponsavel} desabilitado={!ehAdm}
                        valor={pessoaSelecionada.responsavel_user_id} nomeAtual={pessoaSelecionada.responsavel_nome}
                        aoMudar={(valor) => editarCampo(pessoaSelecionada, "responsavel_user_id", valor)} />
                    </Campo>
                    <Campo icone={CheckCircleIcon} rotulo="Situação">
                      <Select size="sm" isDisabled={!permissoes.editaTudo || protegida(pessoaSelecionada)} value={pessoaSelecionada.ativo ? "ativo" : "inativo"} onChange={(e) => editarCampo(pessoaSelecionada, "ativo", e.target.value === "ativo")}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </Select>
                    </Campo>
                  </SimpleGrid>

                  {/* FICHA DO FUNCIONÁRIO */}
                  {pessoaSelecionada.perfil === "FUNCIONARIO" && (
                    <>
                      <Divider marginY={7} />
                      <TituloSecao icone={IconeCartao}>Ficha do funcionário</TituloSecao>
                      {!pessoaSelecionada.funcionario && (
                        <Alert status="warning" borderRadius="md" fontSize="sm" marginBottom={4}>
                          <AlertIcon />Complete a ficha: escolha o cargo para o funcionário aparecer como responsável nas tarefas com o cargo certo.
                        </Alert>
                      )}
                      <CamposFuncionario valores={ficha} aoMudar={setFicha} cargos={cargos} editavel={permissoes.editaTudo} tamanho="sm" />
                      {permissoes.editaTudo && (
                        <Flex justify="flex-end" marginTop={3}>
                          <Button size="sm" colorScheme="blue" onClick={salvarFicha} isLoading={salvandoFicha}>Salvar ficha</Button>
                        </Flex>
                      )}
                    </>
                  )}

                  <Divider marginY={7} />

                  {/* UNIDADES */}
                  <TituloSecao icone={IconePredio} contador={pessoaSelecionada.apartamentos.length}>Unidades</TituloSecao>
                  <VStack align="stretch" spacing={2}>
                    {pessoaSelecionada.apartamentos.map((vinculo) => (
                      <Flex key={vinculo.id} justify="space-between" align="center" bg="gray.50" borderRadius="lg" paddingX={4} paddingY={3} opacity={vinculo.ativo ? 1 : 0.6}>
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold">{rotuloApartamento(vinculo.apartamento)}</Text>
                          <Text fontSize="xs" color="gray.500">{descreverVinculo(vinculo)}</Text>
                        </Box>
                        <Flex gap={2}>
                          {vinculo.principal && <Badge {...estiloBadge} colorScheme="gray">Principal</Badge>}
                          <BadgeTipo tipo={vinculo.tipo_relacao} />
                        </Flex>
                      </Flex>
                    ))}
                    {pessoaSelecionada.apartamentos.length === 0 && (
                      <Text fontSize="xs" color="gray.400">Não está ligada a nenhum apartamento.</Text>
                    )}
                    <Text fontSize="xs" color="gray.500">Para incluir, remover ou mudar o vínculo, abra o apartamento na tela Apartamentos.</Text>
                  </VStack>

                  <Divider marginY={7} />

                  {/* VEÍCULOS */}
                  <TituloSecao icone={IconeCarro} contador={pessoaSelecionada.veiculos.length}>Veículos em que é condutor</TituloSecao>
                  <VStack align="stretch" spacing={2}>
                    {pessoaSelecionada.veiculos.map((veiculo) => (
                      <Flex key={veiculo.id} align="center" gap={3} bg="gray.50" borderRadius="lg" paddingX={4} paddingY={3}>
                        <IconeCarro boxSize={4} color="gray.500" />
                        <Text fontSize="sm" fontWeight="semibold">{formatarPlaca(veiculo.placa) || "Sem placa"}</Text>
                        <Text fontSize="sm" color="gray.600">{[veiculo.marca, veiculo.modelo, veiculo.cor].filter(Boolean).join(" · ")}</Text>
                      </Flex>
                    ))}
                    {pessoaSelecionada.veiculos.length === 0 && <Text fontSize="xs" color="gray.400">Nenhum veículo.</Text>}
                  </VStack>

                  {/* ACESSO AO SISTEMA */}
                  {permissoes.editaTudo && (
                    <>
                      <Divider marginY={7} />
                      <TituloSecao icone={LockIcon}>Acesso ao sistema</TituloSecao>
                      {pessoaSelecionada.user_id ? (
                        <Flex justify="space-between" align="center" gap={3} wrap="wrap" bg="green.50" borderRadius="lg" paddingX={4} paddingY={3}>
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" color="green.700">Tem acesso ao sistema</Text>
                            <Text fontSize="xs" color="gray.600">Login: {pessoaSelecionada.email}</Text>
                          </Box>
                          <Flex gap={2}>
                            <Button size="xs" leftIcon={<RepeatIcon />} onClick={redefinirSenha}>Gerar nova senha</Button>
                            {!protegida(pessoaSelecionada) && <Button size="xs" variant="ghost" colorScheme="red" onClick={tirarAcesso}>Remover acesso</Button>}
                          </Flex>
                        </Flex>
                      ) : (
                        <Flex justify="space-between" align="center" gap={3} wrap="wrap" bg="gray.50" borderRadius="lg" paddingX={4} paddingY={3}>
                          <Text fontSize="sm" color="gray.600">Esta pessoa ainda não acessa o sistema.</Text>
                          <Button size="sm" colorScheme="green" leftIcon={<UnlockIcon />} onClick={abrirDarAcesso}>Dar acesso ao sistema</Button>
                        </Flex>
                      )}

                      {!protegida(pessoaSelecionada) && (
                        <>
                          <Divider marginY={6} />
                          <Flex justify="flex-end">
                            <Button leftIcon={<DeleteIcon />} variant="ghost" colorScheme="red" size="sm" onClick={handleExcluir}>Excluir pessoa</Button>
                          </Flex>
                        </>
                      )}
                    </>
                  )}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* MODAL CARGOS */}
        {permissoes.editaTudo && <ModalCargos aberto={modalCargos.isOpen} aoFechar={modalCargos.onClose} cargos={cargos} aoMudar={recarregarCargos} />}

        {/* MODAL ACESSO AO SISTEMA */}
        <Modal isOpen={modalAcesso.isOpen} onClose={modalAcesso.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>{resultadoAcesso ? "Acesso liberado" : "Dar acesso ao sistema"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {resultadoAcesso ? (
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">Login (e-mail)</Text>
                    <Text fontWeight="semibold">{resultadoAcesso.email}</Text>
                  </Box>
                  {resultadoAcesso.senha_temporaria ? (
                    <>
                      <Box>
                        <Text fontSize="xs" color="gray.500">Senha temporária</Text>
                        <Flex align="center" gap={2}>
                          <Text fontFamily="mono" fontSize="lg" fontWeight="bold" letterSpacing="wider">{resultadoAcesso.senha_temporaria}</Text>
                          <Button size="xs" leftIcon={<CopyIcon />} onClick={() => copiarSenha(resultadoAcesso.senha_temporaria!)}>Copiar</Button>
                        </Flex>
                      </Box>
                      <Alert status="warning" borderRadius="md" fontSize="sm">
                        <AlertIcon />Anote e repasse para a pessoa agora: a senha não será mostrada de novo.
                      </Alert>
                    </>
                  ) : (
                    <Alert status="info" borderRadius="md" fontSize="sm">
                      <AlertIcon />Este e-mail já tinha login no sistema. A pessoa entra com a senha que já usa e passa a ver este condomínio.
                    </Alert>
                  )}
                </VStack>
              ) : (
                <>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">E-mail (será o login)</FormLabel>
                    <Input type="email" value={emailAcesso} onChange={(e) => setEmailAcesso(e.target.value)} placeholder="nome@exemplo.com" autoFocus />
                  </FormControl>
                  <Text fontSize="xs" color="gray.500" marginTop={3}>
                    O sistema cria o login com uma senha temporária. Se o e-mail já tiver login (ex.: síndico de outro condomínio), só liga o login a esta pessoa.
                    O e-mail informado também fica salvo no cadastro.
                  </Text>
                </>
              )}
            </ModalBody>
            <ModalFooter gap={3}>
              {resultadoAcesso ? (
                <Button colorScheme="blue" onClick={modalAcesso.onClose}>Fechar</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={modalAcesso.onClose}>Cancelar</Button>
                  <Button colorScheme="green" onClick={confirmarDarAcesso} isLoading={processandoAcesso}>Dar acesso</Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
