import { useEffect, useState } from "react";
import type { ElementType, KeyboardEvent, ReactNode } from "react";
import {Avatar,Badge,Box,Button,Divider,Flex,IconButton,Input,InputGroup,InputLeftElement,Modal,ModalBody,ModalCloseButton,ModalContent,ModalHeader,ModalOverlay,Select,
  SimpleGrid,Spinner,Table,TableContainer,Tbody,Td,Text,Th,Thead,Tr,VStack,createIcon,useDisclosure} from "@chakra-ui/react";
import {AddIcon,CalendarIcon,CheckCircleIcon,ChevronRightIcon,DeleteIcon,EmailIcon,InfoOutlineIcon,PhoneIcon,SearchIcon,TimeIcon} from "@chakra-ui/icons";
import { Titulo } from "../Titulos/Titulos";
import { CelulaEditavel } from "../../Components/CelulaEditavel";
import { formatarCpf, formatarData, formatarDataIso, formatarPlaca, formatarTelefone } from "../../Components/config";
import { CriarPessoa } from "./PessoasCriar";
import { usePessoas } from "./Hooks/Pessoas";
import {ROTULOS_PERFIL,type Pessoa,type PessoaEditarDados,type PessoaApartamento,type PerfilPessoa} from "./ConfigPessoas";
import { IconeAndares,IconeCarro,IconeCartao,IconeCasa,IconeChave,IconePredio,IconeTile,IconeUsuario,IconeVaga} from "./IconesPessoas";
import { salvarVaga, salvarVeiculo, handleAdicionarVaga, handleAdicionarVeiculo, handleAdicionarVeiculoPessoa } from "./Veiculos"

// ÍCONES
const traco = {fill: "none",stroke: "currentColor",strokeWidth: "2",strokeLinecap: "round" as const,strokeLinejoin: "round" as const,};
const IconeGrade = createIcon({displayName: "IconeGrade",viewBox: "0 0 24 24",defaultProps: traco,path: (
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>
)});
const IconeLista = createIcon({displayName: "IconeLista",viewBox: "0 0 24 24",defaultProps: traco,path: (<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />)});

// TIPOS
type Visualizacao = "cards" | "lista";
type FiltroStatus = "todas" | "ativas" | "inativas";
const CHAVE_VISUALIZACAO = "pessoas:visualizacao";

// UTILITÁRIOS
function resumirPessoa(pessoa: Pessoa) {
  const vinculoPrincipal = pessoa.apartamentos.find((v) => v.principal) ?? pessoa.apartamentos[0];
  const apartamento = vinculoPrincipal?.apartamento;
  const totalVagas = apartamento?.vagas.length ?? 0;
  const totalVeiculos = pessoa.veiculos.length;
  const outros = Math.max(pessoa.apartamentos.length - 1, 0);

  return {
    vinculoPrincipal,
    apartamento,
    totalVagas,
    totalVeiculos,
    outros,
  };
}

const aoPressionarEnter = (acao: () => void) => (e: KeyboardEvent<HTMLElement>) => { if (e.key === "Enter") {acao()}};
const rotuloApartamentos = (n: number) => `${n} ${n === 1 ? "apartamento" : "apartamentos"}`;

// ESTILOS
const estiloModal = {borderRadius: "2xl", boxShadow: "0 24px 64px rgba(16, 24, 40, 0.18)"};
const estiloBadge = {borderRadius: "full", paddingX: 2.5, paddingY: 0.5, fontSize: "xs", fontWeight: "medium", textTransform: "none" as const};
const estiloTh = {textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500", borderColor: "gray.100", paddingY: 3};

// COMPONENTES AUXILIARES

function Segmentado<T extends string>({opcoes, valor, aoMudar}: {opcoes: {valor: T; rotulo: string; icone?: ElementType}[]; valor: T; aoMudar: (novo: T) => void }) {
  return (
    <Flex bg="gray.100" borderRadius="lg" padding={1} gap={1}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        const Icone = opcao.icone;
        return (
          <Button key={opcao.valor} variant="unstyled" display="inline-flex" alignItems="center" gap={1.5} height="30px" paddingX={3} borderRadius="md" fontSize="sm" fontWeight="medium"
            bg={ativo ? "white" : "transparent"} color={ativo ? "gray.800" : "gray.500"} boxShadow={ativo ? "0 1px 2px rgba(16, 24, 40, 0.1)" : "none"}
            onClick={() => aoMudar(opcao.valor)}>
            {Icone && ( <Icone boxSize={4} /> )} {opcao.rotulo}
          </Button>
        );
      })}
    </Flex>
  );
}

const Indicador = ({ icone: Icone, rotulo, valor}: { icone: ElementType; rotulo: string; valor: number}) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Flex align="center" gap={2} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>
    <Text marginTop={1} fontSize="2xl" fontWeight="semibold" color="gray.800">{valor}</Text>
  </Box>
);


const Dado = ({ icone: Icone, rotulo, children}: {icone: ElementType; rotulo: string; children: ReactNode}) => (
  <Box minWidth={0}>
    <Flex align="center" gap={1.5} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs">{rotulo}</Text>
    </Flex>
    <Box marginTop={1} fontSize="sm" fontWeight="medium" color="gray.800">{children}</Box>
  </Box>
);

const Chip = ({ icone: Icone, children}: { icone: ElementType; children: ReactNode}) => (
  <Flex align="center" gap={1.5} bg="white" border="1px solid" borderColor="gray.100" borderRadius="full" paddingX={2.5} paddingY={1} fontSize="xs" color="gray.600">
    <Icone boxSize={3.5} color="gray.400"/>
    <Text>{children}</Text>
</Flex>
);

const BadgeRelacao = ({ tipo }: {tipo: string;}) => {
const proprietario = tipo === "PROPRIETARIO";

const Icone = proprietario ? IconeChave : IconeCasa;
  return (
    <Badge {...estiloBadge} display="inline-flex" alignItems="center" gap={1.5} variant="subtle" colorScheme={proprietario ? "purple" : "blue"}>
      <Icone boxSize={3} />{proprietario ? "Proprietário" : "Morador"}
    </Badge>
  );
};

const BadgeStatus = ({ativo}: {ativo: boolean}) => (
  <Badge {...estiloBadge} display="inline-flex" alignItems="center" gap={1.5} variant="subtle" colorScheme={ativo ? "green" : "red"}>
    <Box boxSize={1.5} borderRadius="full" bg="currentColor"/>{ativo ? "Ativo" : "Inativo"}</Badge>
);

const Campo = ({icone: Icone, rotulo, children}: {icone: ElementType;rotulo: string;children: ReactNode;}) => (
  <Box>
    <Flex align="center" gap={1.5} color="gray.500" marginBottom={1.5}>
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>{children}
  </Box>
);

const TituloSecao = ({icone: Icone, contador, children}: {icone: ElementType; contador?: number; children: ReactNode}) => (
  <Flex align="center" gap={2} marginBottom={4}>
    <Icone boxSize={4}color="gray.400"/>
    <Text fontSize="sm" fontWeight="semibold" color="gray.800">{children}</Text>
    {contador !== undefined && (
      <Badge borderRadius="full" colorScheme="gray" fontSize="xs" paddingX={2}>{contador}</Badge>
    )}
  </Flex>
);

// PÁGINA
export const Pessoas = () => {const modalAdicionar = useDisclosure();
const modalDetalhes = useDisclosure();
const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | null>(null);
const [busca, setBusca] = useState("");
const [filtroStatus, setFiltroStatus,] = useState<FiltroStatus>( "todas" );
const [visualizacao, setVisualizacao,] = useState<Visualizacao>(() => {
  try {
    return localStorage.getItem( CHAVE_VISUALIZACAO ) === "lista"? "lista" : "cards"; } 
    catch { return "cards"}
});
const {pessoas, carregando, criando, criar, editar, editarApartamento, editarVinculo, excluir, excluirVinculo, excluirVaga, excluirVeiculo, editarVaga, editarVeiculo, adicionarVaga, adicionarVeiculo, adicionarVeiculoPessoa} = usePessoas();

// SINCRONIZAR MODAL COM A LISTA
  useEffect(() => {if (!pessoaSelecionada) {return}
    const atualizada = pessoas.find((p) => p.id === pessoaSelecionada.id);
    if (atualizada) {setPessoaSelecionada(atualizada)}
  }, [pessoas]);

//FILTROS
  function mudarVisualizacao(nova: Visualizacao) {setVisualizacao(nova);
    try {localStorage.setItem(CHAVE_VISUALIZACAO, nova)} catch {}
  }
  function limparFiltros() {setBusca("");setFiltroStatus("todas");}
  const termo = busca .trim() .toLowerCase();
  const filtrando = termo !== "" || filtroStatus !== "todas";
  const pessoasFiltradas = pessoas.filter((p) => {
    if (filtroStatus === "ativas" && !p.ativo) {return false}
    if (filtroStatus === "inativas" && p.ativo) {return false}
    if (!termo) {return true}
      return (
        p.nome .toLowerCase() .includes(termo) || (p.cpf ?? "") .toLowerCase().includes(termo) ||(
          p.email ?? "") .toLowerCase() .includes(termo) || p.apartamentos.some((v) => String(v.apartamento.numero) .toLowerCase().includes(termo)
        )
      );
    });
  const totalAtivas = pessoas.filter((p) => p.ativo).length;
  const totalProprietarios = pessoas.filter((p) => resumirPessoa(p) .vinculoPrincipal ?.tipo_relacao === "PROPRIETARIO" ).length;
  const totalMoradores = pessoas.filter((p) => resumirPessoa(p) .vinculoPrincipal ?.tipo_relacao === "MORADOR" ).length;

  // ABRIR DETALHES
  function abrirDetalhes(pessoa: Pessoa) {setPessoaSelecionada(pessoa);modalDetalhes.onOpen()}

// EDITAR PESSOA
  async function editarCampo(pessoa: Pessoa, campo: keyof PessoaEditarDados, valor: | string | boolean | null  ) {
    const dados: PessoaEditarDados = {nome: pessoa.nome, cpf: pessoa.cpf, email: pessoa.email, telefone: pessoa.telefone, data_nascimento: pessoa.data_nascimento, ativo: pessoa.ativo, perfil: pessoa.perfil, [campo]: valor};
    await editar(pessoa.id,dados);
  }

// EDITAR APARTAMENTO
  async function salvarApartamento(vinculo: PessoaApartamento,campo: | "numero" | "bloco" | "andar" | "observacao",valor: string  ) {
    const apartamento = vinculo.apartamento;
    await editarApartamento(
      apartamento.id,{numero:campo === "numero" ? valor.trim() : apartamento.numero,
        bloco: campo === "bloco" ? valor.trim() || null : apartamento.bloco,
        andar: campo === "andar" ? valor.trim() === "" ? null : Number(valor) : apartamento.andar,
        observacao: campo === "observacao" ? valor.trim() || null : apartamento.observacao,
        ativo: apartamento.ativo,
      }
    );
  }

  // EDITAR VÍNCULO
  async function salvarVinculo(vinculo: PessoaApartamento,tipo:| "PROPRIETARIO"| "MORADOR"  ) {
    await editarVinculo(vinculo.id,{tipo_relacao: tipo,principal: vinculo.principal,ativo:vinculo.ativo});
  }

  // EXCLUSÕES  
  const veiculosSemVaga = pessoaSelecionada?.veiculos.filter((veiculo) => !veiculo.vaga_id) ?? [];

  async function handleExcluir() {if (!pessoaSelecionada) {return;}const sucesso = await excluir(pessoaSelecionada.id); if (sucesso) {setPessoaSelecionada(null);modalDetalhes.onClose()}}
  async function handleExcluirVinculo(id: string) {await excluirVinculo(id)}
  async function handleExcluirVaga(id: string) {await excluirVaga(id)}
  async function handleExcluirVeiculo(id: string) {await excluirVeiculo(id)}

  return (
    <Flex align="flex-start"gap={6}direction={{base: "column",md: "row",}}>
      <Titulo />
      <Box flex={1}minWidth={0}>
        <Flex justify="space-between"align="flex-start"gap={4}wrap="wrap"marginBottom={6}>
          <Box>
            <Text fontSize="2xl"fontWeight="semibold"color="gray.800">Pessoas</Text>
            <Text fontSize="sm"color="gray.500"marginTop={1}>{filtrando ? `${pessoasFiltradas.length} de ${pessoas.length} pessoas` : `${pessoas.length} ${pessoas.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}`}
            </Text>
          </Box>
          <Button colorScheme="blue"borderRadius="lg"leftIcon={<AddIcon boxSize={2.5} />}onClick={modalAdicionar.onOpen}>Nova pessoa</Button>
        </Flex>

        {/* INDICADORES */}
        {!carregando && pessoas.length > 0 && (
          <SimpleGrid columns={{base: 2,md: 4,}} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
            <Indicador icone={ IconeUsuario } rotulo="Total de pessoas" valor={ pessoas.length }/>
            <Indicador icone={ CheckCircleIcon } rotulo="Ativas" valor={ totalAtivas }/>
            <Indicador icone={ IconeChave } rotulo="Proprietários" valor={ totalProprietarios }/>
            <Indicador icone={ IconeCasa } rotulo="Moradores" valor={totalMoradores }/>
          </SimpleGrid>
        )}

        {/* FILTROS */}
        {!carregando && pessoas.length > 0 && (
          <Flex justify="space-between" align={{ base: "stretch", lg: "center", }} direction={{ base: "column", lg: "row", }} gap={3} marginBottom={5}>
            <Flex align={{ base: "stretch", md: "center", }} direction={{ base: "column", md: "row", }} gap={3} flex={1}>
              <InputGroup maxWidth={{ base: "100%", md: "380px", }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" boxSize={3.5}/>
                </InputLeftElement>
                <Input value={busca}onChange={(e) => setBusca( e.target .value)}placeholder="Buscar por nome, CPF, e-mail ou apartamento" bg="white" borderRadius="lg"/>
              </InputGroup>
              <Segmentado<FiltroStatus>valor={filtroStatus}aoMudar={setFiltroStatus}opcoes={[{valor:"todas",rotulo:"Todas"},{valor:"ativas",rotulo:"Ativas"},{valor:"inativas",rotulo:"Inativas"}]}/>
            </Flex>
            <Segmentado<Visualizacao> valor={visualizacao}aoMudar={mudarVisualizacao}opcoes={[{valor:"cards",rotulo:"Cards",icone:IconeGrade},{valor:"lista",rotulo:"Lista",icone:IconeLista}]}/>
          </Flex>
        )}

        {/* LISTAGEM */}
        {carregando ? (
          <Flex justify="center"padding={16}><Spinner color="blue.500" size="lg"/></Flex> ) : pessoas.length === 0 ? (
          <Flex direction="column"align="center"padding={16}>
            <InfoOutlineIcon boxSize={6}color="gray.400"/>
            <Text marginTop={3}color="gray.700"fontWeight="medium"> Nenhuma pessoa cadastrada</Text>
            <Button marginTop={5}size="sm"colorScheme="blue"leftIcon={<AddIcon />}onClick={modalAdicionar.onOpen}>Nova pessoa</Button>
          </Flex>
        ) : pessoasFiltradas.length === 0 ? ( 
          <Flex direction="column"align="center"padding={16}>
            <SearchIcon color="gray.300"boxSize={6}/>
            <Text marginTop={3}>Nenhuma pessoa encontrada</Text>
            <Button marginTop={4}size="sm"onClick={limparFiltros}>Limpar filtros</Button>
          </Flex>
        ) : visualizacao === "cards" ? (
          <SimpleGrid columns={{base: 1,md: 2,xl: 3,}}spacing={5}>
            {pessoasFiltradas.map((pessoa) => {const {vinculoPrincipal,apartamento,totalVagas,totalVeiculos,outros} = resumirPessoa(pessoa);
              return (
                <Flex key={pessoa.id}direction="column"bg="white"borderRadius="xl"border="1px solid"borderColor="gray.100"cursor="pointer"tabIndex={0}onClick={() => abrirDetalhes(pessoa)}
                  onKeyDown={aoPressionarEnter(() => abrirDetalhes(pessoa))} _hover={{borderColor:"blue.200",boxShadow:"0 8px 24px rgba(16,24,40,.07)"}}>
                  <Flex align="center"justify="space-between"gap={3}padding={5}>
                    <Flex align="center"gap={3}minWidth={0}>
                      <Avatar name={pessoa.nome}size="md"bg="blue.500"color="white"/>
                        <Box minWidth={0}>
                          <Text fontWeight="semibold"color="gray.800"noOfLines={1}>{pessoa.nome}</Text>
                          <Text fontSize="sm"color="gray.500">{pessoa.cpf ? formatarCpf(pessoa.cpf) : "CPF não informado"}</Text>
                        </Box>
                      </Flex>
                      <BadgeStatus ativo={pessoa.ativo}/>
                    </Flex>

                    <Divider />

                    <SimpleGrid columns={2}spacing={4}padding={5}flex={1}>
                      <Dado icone={IconePredio}rotulo="Apartamento">{apartamento ? `${apartamento.numero}${apartamento.bloco ? ` - Bloco ${apartamento.bloco}`: "" }` : "Sem apartamento"}                      </Dado>
                      <Dado icone={IconeAndares}rotulo="Andar">{apartamento?.andar !== null && apartamento?.andar !== undefined ? `${apartamento.andar}º` : "Não informado"}</Dado>
                      <Dado icone={IconeVaga}rotulo="Vagas">{totalVagas}</Dado>
                      <Dado icone={IconeCarro}rotulo="Veículos">{totalVeiculos}</Dado>
                    </SimpleGrid>

                    <Divider />

                    <Flex justify="space-between"align="center"paddingX={5}paddingY={3}>
                      <Flex align="center"gap={2}>
                        {vinculoPrincipal && (<BadgeRelacao tipo={vinculoPrincipal.tipo_relacao}/>)}{outros >0 && (
                        <Text fontSize="xs" color="gray.500"> +{outros}{" "}apto</Text>)}
                      </Flex>
                      <ChevronRightIcon color="blue.500"/>
                    </Flex>
                  </Flex>
                );
              }
            )}
          </SimpleGrid>
        ) : (
          <Box bg="white"border="1px solid"borderColor="gray.100"borderRadius="xl"overflow="hidden">
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th{...estiloTh}>Pessoa</Th>
                    <Th{...estiloTh}>Apartamento</Th>
                    <Th{...estiloTh}>Vínculo</Th>
                    <Th{...estiloTh}>Status</Th>
                  </Tr>
                </Thead>
                <Tbody> {pessoasFiltradas.map((pessoa ) => { const { vinculoPrincipal,apartamento} = resumirPessoa(pessoa);
                  return (
                    <Tr key={pessoa.id}cursor="pointer"onClick={() => abrirDetalhes(pessoa)}>
                      <Td>
                        <Text fontWeight="medium">{pessoa.nome}</Text>
                        <Text fontSize="xs"color="gray.500">{pessoa.cpf ? formatarCpf(pessoa.cpf) : "CPF não informado"}</Text>
                      </Td>
                      <Td>{apartamento ? `Apto ${apartamento.numero}${apartamento.bloco ? ` - Bloco ${apartamento.bloco}` : ""}` : "-"}</Td>
                      <Td>{vinculoPrincipal && <BadgeRelacao tipo={vinculoPrincipal.tipo_relacao} />}</Td>
                      <Td><BadgeStatus ativo={pessoa.ativo}/></Td>
                    </Tr>
                  )})}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* MODAL CADASTRO */}
        <Modal isOpen={modalAdicionar.isOpen}onClose={modalAdicionar.onClose}size="xl"isCentered>
          <ModalOverlay />
          <ModalContent {...estiloModal}>
            <ModalHeader>Nova pessoa</ModalHeader>
            <ModalCloseButton />
            <ModalBody paddingBottom={6}>
              <CriarPessoa aoCriar={modalAdicionar.onClose} criando={ criando }criar={criar}/>
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
                <ModalHeader bg="gray.50"borderTopRadius="2xl"padding={6}>
                  <Flex align="center" gap={4}>
                    <Avatar name={pessoaSelecionada.nome}size="xl"bg="blue.500"color="white"/>
                    <Box>
                      <Text fontSize="xl"fontWeight="semibold">{pessoaSelecionada.nome}</Text>
                      <Flex gap={2}marginTop={2}>
                        <BadgeStatus ativo={pessoaSelecionada.ativo}/>
                        <Badge {...estiloBadge} variant="subtle" colorScheme="purple">{ROTULOS_PERFIL[pessoaSelecionada.perfil]}</Badge>
                        <Chip icone={IconePredio}>{rotuloApartamentos(pessoaSelecionada .apartamentos .length)}</Chip>
                      </Flex>
                    </Box>
                  </Flex>
                </ModalHeader>

                <ModalBody padding={6}>
                {/* INFORMAÇÕES PESSOAIS */}
                  <TituloSecao icone={IconeUsuario}>Informações pessoais</TituloSecao>
                  <SimpleGrid columns={{base: 1,md: 2,}}spacing={5}>
                    <Campo icone={IconeUsuario}rotulo="Nome">
                      <CelulaEditavel valor={ pessoaSelecionada.nome}onSalvar={(valor) => editarCampo(pessoaSelecionada,"nome",valor)}/>
                    </Campo>
                    <Campo icone={IconeCartao}rotulo="CPF">
                      <CelulaEditavel valor={pessoaSelecionada.cpf || ""} formatar={formatarCpf} placeholder="Adicionar CPF" onSalvar={(valor) => editarCampo(pessoaSelecionada,"cpf",valor || null)}/>
                    </Campo>

                    <Campo icone={EmailIcon}rotulo="E-mail">
                      <CelulaEditavel valor={pessoaSelecionada.email || ""}placeholder="Adicionar e-mail"onSalvar={(valor) => editarCampo(pessoaSelecionada, "email",valor || null)}/>
                    </Campo>
                    <Campo icone={PhoneIcon}rotulo="Telefone">
                      <CelulaEditavel valor={pessoaSelecionada.telefone || ""} formatar={formatarTelefone} placeholder="Adicionar telefone"onSalvar={(valor) => editarCampo(pessoaSelecionada,"telefone",valor || null)}/>
                    </Campo>
                    <Campo icone={CalendarIcon}rotulo="Nascimento">
                      <CelulaEditavel valor={pessoaSelecionada.data_nascimento || ""} tipo="date" formatar={formatarDataIso} placeholder="Adicionar data"onSalvar={(valor) => editarCampo(pessoaSelecionada,"data_nascimento",valor || null)}/>
                    </Campo>
                    <Campo icone={TimeIcon}rotulo="Cadastrado em">
                      <Text fontSize="sm">{formatarData(pessoaSelecionada.created_at)}</Text>
                    </Campo>
                    <Campo icone={IconeChave} rotulo="Perfil">
                      <Select size="sm" value={pessoaSelecionada.perfil} onChange={(e) => editarCampo(pessoaSelecionada, "perfil", e.target.value as PerfilPessoa)}>
                        {(Object.keys(ROTULOS_PERFIL) as PerfilPessoa[]).map((perfil) => (
                          <option key={perfil} value={perfil}>{ROTULOS_PERFIL[perfil]}</option>
                        ))}
                      </Select>
                    </Campo>
                  </SimpleGrid>

                  <Divider marginY={7}/>

                  {/* APARTAMENTOS */}

                  <TituloSecao icone={IconePredio} contador={pessoaSelecionada.apartamentos .length}>Apartamentos</TituloSecao>
                    <VStack align="stretch" spacing={5}>{pessoaSelecionada.apartamentos.map((vinculo) => (
                      <Box key={vinculo.id}border="1px solid"borderColor="gray.200"borderRadius="xl"padding={4}>

                          {/* APARTAMENTO */}

                          <Flex justify="space-between" align="center" gap={3}>
                            <Flex align="center"gap={3}>
                              <IconeTile icone={IconePredio}cor="blue"/>
                              <Text fontWeight="semibold">Apartamento</Text>
                            </Flex>
                            <IconButton aria-label="Remover vínculo" icon={<DeleteIcon />}size="xs" colorScheme="red" variant="ghost" onClick={() => handleExcluirVinculo(vinculo.id)}/>
                          </Flex>
                          <SimpleGrid columns={{base: 1, md: 2}}spacing={4}marginTop={4}>
                            <Campo icone={IconePredio}rotulo="Número">
                              <CelulaEditavel valor={vinculo .apartamento .numero} onSalvar={(valor) => salvarApartamento(vinculo,"numero",valor)}/>
                            </Campo>
                            <Campo icone={IconePredio} rotulo="Bloco">
                              <CelulaEditavel valor={vinculo.apartamento .bloco || ""}placeholder="Adicionar bloco" onSalvar={(valor) => salvarApartamento(vinculo, "bloco", valor)}/>
                            </Campo>
                            <Campo icone={IconeAndares}rotulo="Andar">
                              <CelulaEditavel valor={vinculo.apartamento.andar !== null ? String(vinculo .apartamento .andar): "" }placeholder="Adicionar andar" onSalvar={(valor) => salvarApartamento(vinculo,"andar",valor)}                              />
                            </Campo>
                            <Campo icone={InfoOutlineIcon}rotulo="Observação">
                              <CelulaEditavel valor={vinculo .apartamento .observacao || ""} placeholder="Adicionar observação" onSalvar={(valor) => salvarApartamento(vinculo, "observacao", valor)}/>
                            </Campo>
                          </SimpleGrid>

                          {/* VÍNCULO */}

                          <Box marginTop={4}>
                            <Text fontSize="xs" color="gray.500" marginBottom={1}>Vínculo</Text>
                            <Select size="sm" value={vinculo.tipo_relacao} onChange={(e) => salvarVinculo(vinculo, e.target.value as "PROPRIETARIO" | "MORADOR")}>
                              <option value="PROPRIETARIO">Proprietário</option>
                              <option value="MORADOR">Morador</option>
                            </Select>
                          </Box>


                          {/* ADICIONAR VAGA */}

                          <Flex justify="flex-end" marginTop={4}>
                            <Button size="xs" colorScheme="blue" variant="outline" leftIcon={<AddIcon />} onClick={() => handleAdicionarVaga(adicionarVaga, vinculo.apartamento.id)}>Adicionar vaga</Button>
                          </Flex>


                          {/* VAGAS */}

                          <VStack align="stretch" spacing={3} marginTop={4}>
                            {vinculo.apartamento.vagas.map((vaga) => (
                              <Box key={vaga.id} bg="gray.50" borderRadius="lg" padding={4}>
                                <Flex justify="space-between" align="center">
                                  <Flex align="center" gap={2}>
                                    <IconeVaga boxSize={4} color="gray.500" />
                                    <Text fontWeight="semibold" fontSize="sm">Vaga</Text>
                                  </Flex>
                                  <Flex gap={1}>
                                    <Button size="xs" variant="ghost" colorScheme="blue" leftIcon={<AddIcon />} onClick={() => handleAdicionarVeiculo(adicionarVeiculo, pessoaSelecionada, vaga.id)}>Veículo</Button>
                                    <IconButton aria-label="Excluir vaga" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleExcluirVaga(vaga.id)}/>
                                  </Flex>
                                </Flex>

                                <SimpleGrid columns={{base: 1, md: 2}} spacing={3} marginTop={3}>
                                  <Campo icone={IconeVaga} rotulo="Número">
                                    <CelulaEditavel valor={vaga.numero} onSalvar={(valor) => salvarVaga(editarVaga, vaga, "numero", valor)}/>
                                  </Campo>
                                  <Campo icone={IconeVaga} rotulo="Localização">
                                    <CelulaEditavel valor={vaga.localizacao || ""} placeholder="Adicionar localização" onSalvar={(valor) => salvarVaga(editarVaga, vaga, "localizacao", valor)}/>
                                  </Campo>
                                  <Campo icone={InfoOutlineIcon} rotulo="Observação">
                                    <CelulaEditavel valor={vaga.observacao || ""} placeholder="Adicionar observação" onSalvar={(valor) => salvarVaga(editarVaga, vaga, "observacao", valor)}/>
                                  </Campo>
                                </SimpleGrid>


                                {/* VEÍCULOS */}

                                <VStack align="stretch" spacing={3} marginTop={4}>
                                  {vaga.veiculos.map((veiculo) => (
                                    <Box key={veiculo.id} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" padding={3}>
                                      <Flex justify="space-between" align="center">
                                        <Flex align="center" gap={2}>
                                          <IconeCarro boxSize={4} color="gray.500" />
                                          <Text fontSize="sm" fontWeight="semibold">Veículo</Text>
                                        </Flex>
                                        <IconButton aria-label="Excluir veículo" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleExcluirVeiculo(veiculo.id)}/>
                                      </Flex>

                                      <SimpleGrid columns={{base: 1, md: 2}} spacing={3} marginTop={3}>
                                        <Campo icone={IconeCartao} rotulo="Placa">
                                          <CelulaEditavel valor={veiculo.placa || ""} formatar={formatarPlaca} placeholder="Adicionar placa" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, vaga.id, "placa", valor)}/>
                                        </Campo>
                                        <Campo icone={IconeCarro} rotulo="Marca">
                                          <CelulaEditavel valor={veiculo.marca || ""} placeholder="Adicionar marca" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, vaga.id, "marca", valor)}/>
                                        </Campo>
                                        <Campo icone={IconeCarro} rotulo="Modelo">
                                          <CelulaEditavel valor={veiculo.modelo || ""} placeholder="Adicionar modelo" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, vaga.id, "modelo", valor)}/>
                                        </Campo>
                                        <Campo icone={IconeCarro} rotulo="Cor">
                                          <CelulaEditavel valor={veiculo.cor || ""} placeholder="Adicionar cor" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, vaga.id, "cor", valor)}/>
                                        </Campo>
                                        <Campo icone={InfoOutlineIcon} rotulo="Descrição">
                                          <CelulaEditavel valor={veiculo.descricao || ""} placeholder="Adicionar descrição" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, vaga.id, "descricao", valor)}/>
                                        </Campo>
                                      </SimpleGrid>
                                    </Box>
                                  ))}

                                  {vaga.veiculos.length === 0 && (
                                    <Text fontSize="xs" color="gray.400">Nenhum veículo cadastrado nesta vaga.</Text>
                                  )}
                                </VStack>
                              </Box>
                            ))}

                            {vinculo.apartamento.vagas.length === 0 && (
                              <Text fontSize="xs" color="gray.400">Nenhuma vaga cadastrada.</Text>
                            )}
                          </VStack>
                        </Box>
                      )
                    )}
                  </VStack>


                  {/* VEÍCULOS SEM VAGA */}

                  <Divider marginY={7}/>

                  <TituloSecao icone={IconeCarro} contador={veiculosSemVaga.length}>Veículos sem vaga</TituloSecao>
                  <Flex justify="flex-end" marginBottom={3}>
                    <Button size="xs" colorScheme="blue" variant="outline" leftIcon={<AddIcon />} onClick={() => handleAdicionarVeiculoPessoa(adicionarVeiculoPessoa, pessoaSelecionada)}>Adicionar veículo</Button>
                  </Flex>

                  <VStack align="stretch" spacing={3}>
                    {veiculosSemVaga.map((veiculo) => (
                      <Box key={veiculo.id} bg="gray.50" borderRadius="lg" padding={4}>
                        <Flex justify="space-between" align="center">
                          <Flex align="center" gap={2}>
                            <IconeCarro boxSize={4} color="gray.500" />
                            <Text fontWeight="semibold" fontSize="sm">Veículo</Text>
                          </Flex>
                          <IconButton aria-label="Excluir veículo" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleExcluirVeiculo(veiculo.id)}/>
                        </Flex>

                        <SimpleGrid columns={{base: 1, md: 2}} spacing={3} marginTop={3}>
                          <Campo icone={IconeCartao} rotulo="Placa">
                            <CelulaEditavel valor={veiculo.placa || ""} formatar={formatarPlaca} placeholder="Adicionar placa" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, veiculo.vaga_id, "placa", valor)}/>
                          </Campo>
                          <Campo icone={IconeCarro} rotulo="Marca">
                            <CelulaEditavel valor={veiculo.marca || ""} placeholder="Adicionar marca" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, veiculo.vaga_id, "marca", valor)}/>
                          </Campo>
                          <Campo icone={IconeCarro} rotulo="Modelo">
                            <CelulaEditavel valor={veiculo.modelo || ""} placeholder="Adicionar modelo" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, veiculo.vaga_id, "modelo", valor)}/>
                          </Campo>
                          <Campo icone={IconeCarro} rotulo="Cor">
                            <CelulaEditavel valor={veiculo.cor || ""} placeholder="Adicionar cor" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, veiculo.vaga_id, "cor", valor)}/>
                          </Campo>
                          <Campo icone={InfoOutlineIcon} rotulo="Descrição">
                            <CelulaEditavel valor={veiculo.descricao || ""} placeholder="Adicionar descrição" onSalvar={(valor) => salvarVeiculo(editarVeiculo, veiculo, veiculo.vaga_id, "descricao", valor)}/>
                          </Campo>
                        </SimpleGrid>
                      </Box>
                    ))}

                    {veiculosSemVaga.length === 0 && (
                      <Text fontSize="xs" color="gray.400">Nenhum veículo sem vaga cadastrado.</Text>
                    )}
                  </VStack>


                  {/* EXCLUIR PESSOA */}

                  <Divider marginY={6}/>

                  <Flex justify="flex-end">
                    <Button leftIcon={<DeleteIcon />} variant="ghost" colorScheme="red" size="sm" onClick={handleExcluir}>Excluir pessoa</Button>
                  </Flex>

                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
