// ---------------------------------------------------------
// ADMINISTRAÇÃO GERAL (só ADM do sistema)
// ---------------------------------------------------------
// Aba Condomínios: todos os condomínios; ao escolher um,
//   aparecem todos os apartamentos com as pessoas ligadas e
//   tudo o que o sistema tem sobre elas. O ADM edita os dados
//   direto na tela (clique no campo) e define o RESPONSÁVEL do
//   WhatsApp de cada pessoa (padrão: o síndico do prédio).
// Aba Responsáveis: cria quem atende o WhatsApp sem estar
//   ligado a condomínio ou apartamento (Responsaveis.tsx).
// ---------------------------------------------------------

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Badge, Box, Button, Checkbox, Flex, Input, InputGroup,
  InputLeftElement, Select, SimpleGrid, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

import { Titulo, ROTAS } from "../Titulos/Titulos";
import { useAuth } from "../Login/useAuth";
import { CelulaEditavel } from "../../Components/CelulaEditavel";
import { FotoPessoa } from "../../Components/Arquivos";
import { formatarCpf, formatarDataHora, formatarDataIso, formatarPlaca, formatarTelefone, somenteNumeros } from "../../Components/config";
import { ROTULOS_PERFIL, descreverVinculo } from "../Pessoas/ConfigPessoas";
import { rotuloSindicoPadrao } from "../Pessoas/CampoResponsavel";
import { formatarMoeda } from "../Financeiro/ConfigFinanceiro";
import { Responsaveis } from "./Responsaveis";
import {
  OCUPACAO_ADMIN, apiAdministracao,
  type ApartamentoAdmin, type CampoEditavel, type CondominioDetalhe, type CondominioVisao, type PessoaAdmin, type PessoaNaUnidade, type ResponsavelResumo,
} from "./ConfigAdministracao";

type Filtro = "TODOS" | "COM_SINDICO" | "ESCOLHIDO" | "ATRASADOS" | "CHAMADOS" | "WHATSAPP" | "VAZIOS";

// ---------------------------------------------------------
// PEÇAS
// ---------------------------------------------------------

const Secao = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <Box bg="gray.50" borderRadius="lg" padding={3}>
    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wide" marginBottom={2}>{titulo}</Text>
    {children}
  </Box>
);

const Vazio = ({ texto }: { texto: string }) => <Text fontSize="sm" color="gray.400">{texto}</Text>;

const Campo = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
  <Box minWidth={0}>
    <Text fontSize="2xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{rotulo}</Text>
    <Box fontSize="sm">{children}</Box>
  </Box>
);

// valor digitado -> formato da API (sem máscara; vazio = null)
function paraApi(campo: CampoEditavel, valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  if (campo === "cpf" || campo === "telefone") return somenteNumeros(limpo) || null;
  return limpo;
}

function pessoaCombina(p: PessoaAdmin, filtro: Filtro, termo: string) {
  if (filtro === "COM_SINDICO" && p.responsavel) return false;
  if (filtro === "ESCOLHIDO" && !p.responsavel) return false;
  if (filtro === "CHAMADOS" && p.chamados_abertos.length === 0) return false;
  if (filtro === "WHATSAPP" && !p.whatsapp) return false;
  if (!termo) return true;
  return [p.nome, p.cpf ?? "", p.telefone ?? "", p.email ?? "", p.responsavel?.nome ?? "", ...p.recebe_nomes].some((t) => t.toLowerCase().includes(termo));
}

// ---------------------------------------------------------
// CARTÃO DE UMA PESSOA (dados editáveis + responsável)
// ---------------------------------------------------------

type CartaoPessoaProps = {
  pessoa: PessoaAdmin;
  vinculo?: PessoaNaUnidade;
  responsaveis: ResponsavelResumo[];
  sindicos: { nome: string }[];
  aoEditar: (pessoa: PessoaAdmin, campo: CampoEditavel, valor: string | null) => Promise<void>;
};

const CartaoPessoa = ({ pessoa: p, vinculo, responsaveis, sindicos, aoEditar }: CartaoPessoaProps) => {
  const [salvandoResp, setSalvandoResp] = useState(false);
  const editar = (campo: CampoEditavel) => (valor: string) => aoEditar(p, campo, paraApi(campo, valor));
  const respNaLista = !p.responsavel || responsaveis.some((r) => r.id === p.responsavel?.id);

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" padding={3}>
      <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap" marginBottom={2}>
        <FotoPessoa nome={p.nome} fotoId={p.foto_arquivo_id} tamanho="md" />
        <Box minWidth={0} flex={1}>
          <Box fontWeight="semibold" color="gray.800" maxWidth="360px">
            <CelulaEditavel valor={p.nome} onSalvar={editar("nome")} />
          </Box>
          <Flex gap={2} wrap="wrap" marginTop={1}>
            {vinculo && <Badge colorScheme="blue" variant="subtle" textTransform="none">{descreverVinculo(vinculo)}</Badge>}
            {vinculo?.principal && <Badge variant="outline" textTransform="none">Unidade principal</Badge>}
            {p.perfil !== "MORADOR" && <Badge colorScheme="purple" textTransform="none">{ROTULOS_PERFIL[p.perfil] ?? p.perfil}</Badge>}
            <Badge colorScheme={p.tem_login ? (p.login_status === "ativo" ? "green" : "red") : "gray"} variant="subtle" textTransform="none">
              {p.tem_login ? (p.login_status === "ativo" ? "Tem login" : "Login bloqueado") : "Sem login"}
            </Badge>
          </Flex>
        </Box>

        {/* RESPONSÁVEL DO WHATSAPP (só o ADM altera) */}
        <Box width={{ base: "100%", md: "280px" }}>
          <Text fontSize="2xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">Responsável (WhatsApp)</Text>
          <Select size="sm" bg="white" isDisabled={salvandoResp} value={p.responsavel?.id ?? ""}
            onChange={async (e) => { setSalvandoResp(true); try { await aoEditar(p, "responsavel_user_id", e.target.value || null); } catch { /* aviso já mostrado */ } finally { setSalvandoResp(false); } }}>
            <option value="">{rotuloSindicoPadrao(sindicos)}</option>
            {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            {!respNaLista && p.responsavel && <option value={p.responsavel.id}>{p.responsavel.nome} (não é mais responsável)</option>}
          </Select>
          <Text fontSize="2xs" color={p.recebe_origem === "TODOS" ? "orange.600" : "gray.600"} marginTop={1}>
            Recebe: {p.recebe_nomes.join(", ")}{p.recebe_origem === "TODOS" && " (síndico sem acesso)"}
          </Text>
        </Box>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={3}>
        <Campo rotulo="CPF"><CelulaEditavel valor={p.cpf ?? ""} formatar={formatarCpf} placeholder="Adicionar" onSalvar={editar("cpf")} /></Campo>
        <Campo rotulo="Telefone / WhatsApp"><CelulaEditavel valor={p.telefone ?? ""} formatar={formatarTelefone} placeholder="Adicionar" onSalvar={editar("telefone")} /></Campo>
        <Campo rotulo="E-mail"><CelulaEditavel valor={p.email ?? ""} placeholder="Adicionar" onSalvar={editar("email")} /></Campo>
        <Campo rotulo="Nascimento"><CelulaEditavel valor={p.data_nascimento ?? ""} tipo="date" formatar={formatarDataIso} placeholder="Adicionar" onSalvar={editar("data_nascimento")} /></Campo>
        <Campo rotulo="Cadastrado em"><Text paddingY={1}>{formatarDataHora(p.created_at)}</Text></Campo>
      </SimpleGrid>

      {(p.chamados_abertos.length > 0 || p.whatsapp) && (
        <Flex gap={4} wrap="wrap" marginTop={2} paddingTop={2} borderTop="1px dashed" borderColor="gray.100">
          {p.chamados_abertos.length > 0 && (
            <Text fontSize="xs" color="orange.700">
              Chamados em andamento: {p.chamados_abertos.map((c) => `#${String(c.numero).padStart(4, "0")} ${c.assunto}`).join(" · ")}
            </Text>
          )}
          {p.whatsapp && (
            <Flex align="center" gap={2}>
              <Text fontSize="xs" color="gray.600" noOfLines={1} maxWidth="320px">
                WhatsApp: {p.whatsapp.ultima_mensagem}{p.whatsapp.nao_lidas > 0 && ` · ${p.whatsapp.nao_lidas} não lida(s)`}
              </Text>
              <Button as={RouterLink} to={`${ROTAS.WHATSAPP}?conversa=${p.whatsapp.conversa_id}`} size="xs" colorScheme="green" variant="outline">Abrir</Button>
            </Flex>
          )}
        </Flex>
      )}
    </Box>
  );
};

// ---------------------------------------------------------
// DADOS DA UNIDADE (vagas, veículos, financeiro)
// ---------------------------------------------------------

const DadosUnidade = ({ a }: { a: ApartamentoAdmin }) => (
  <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={3}>
    <Secao titulo="Vagas">
      {a.vagas.length === 0 ? <Vazio texto="Nenhuma vaga" /> : (
        <Stack spacing={1}>
          {a.vagas.map((v) => <Text key={v.numero} fontSize="sm">{v.numero}{v.localizacao && ` · ${v.localizacao}`}</Text>)}
        </Stack>
      )}
    </Secao>
    <Secao titulo="Veículos">
      {a.veiculos.length === 0 ? <Vazio texto="Nenhum veículo" /> : (
        <Stack spacing={1}>
          {a.veiculos.map((v, i) => (
            <Text key={i} fontSize="sm">
              {formatarPlaca(v.placa) || "Sem placa"} · {[v.marca, v.modelo, v.cor].filter(Boolean).join(" ") || "—"}
              {v.condutor && ` · ${v.condutor}`}{v.vaga && ` · vaga ${v.vaga}`}
            </Text>
          ))}
        </Stack>
      )}
    </Secao>
    <Secao titulo="Financeiro (cotas em aberto)">
      {a.financeiro.cotas_abertas === 0 ? <Text fontSize="sm" color="green.600">Em dia</Text> : (
        <Text fontSize="sm" color={a.financeiro.cotas_atrasadas ? "red.600" : "gray.700"}>
          {a.financeiro.cotas_abertas} em aberto{a.financeiro.cotas_atrasadas > 0 && ` (${a.financeiro.cotas_atrasadas} atrasada${a.financeiro.cotas_atrasadas > 1 ? "s" : ""})`} · {formatarMoeda(a.financeiro.valor_em_aberto)}
        </Text>
      )}
    </Secao>
  </SimpleGrid>
);

// ---------------------------------------------------------
// ABA CONDOMÍNIOS
// ---------------------------------------------------------

const AbaCondominios = ({ versao }: { versao: number }) => {
  const toast = useToast();
  const [condominios, setCondominios] = useState<CondominioVisao[]>([]);
  const [selecionado, setSelecionado] = useState("");
  const [detalhe, setDetalhe] = useState<CondominioDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [responsavelGeral, setResponsavelGeral] = useState("");
  const [somenteSem, setSomenteSem] = useState(true);
  const [aplicando, setAplicando] = useState(false);

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error" }), [toast]);

  const carregarVisao = useCallback(async () => {
    try { setCondominios(await apiAdministracao.visaoGeral()); }
    catch (e) { erro(e, "Erro ao carregar os condomínios"); }
    finally { setCarregando(false); }
  }, [erro]);

  const carregarDetalhe = useCallback(async (id: string, silencioso = false) => {
    if (!id) { setDetalhe(null); return; }
    if (!silencioso) setCarregandoDetalhe(true);
    try { setDetalhe(await apiAdministracao.condominio(id)); }
    catch (e) { erro(e, "Erro ao carregar o condomínio"); }
    finally { setCarregandoDetalhe(false); }
  }, [erro]);

  useEffect(() => { carregarVisao(); }, [carregarVisao, versao]);
  useEffect(() => { carregarDetalhe(selecionado); }, [carregarDetalhe, selecionado, versao]);

  // salva um campo; o responsável recarrega a tela (muda quem recebe)
  async function editar(pessoa: PessoaAdmin, campo: CampoEditavel, valor: string | null) {
    try {
      await apiAdministracao.editarPessoa(pessoa.id, campo, valor);
    } catch (e) {
      erro(e, "Não foi possível salvar");
      throw e; // a célula volta ao valor anterior
    }
    if (campo === "responsavel_user_id") {
      toast({ title: "Responsável atualizado", status: "success", duration: 1500 });
      await Promise.all([carregarDetalhe(selecionado, true), carregarVisao()]);
      return;
    }
    const atualizar = (p: PessoaAdmin) => (p.id === pessoa.id ? { ...p, [campo]: valor } : p);
    setDetalhe((d) => d && {
      ...d,
      apartamentos: d.apartamentos.map((a) => ({ ...a, pessoas: a.pessoas.map((v) => ({ ...v, pessoa: atualizar(v.pessoa) })) })),
      sem_unidade: d.sem_unidade.map(atualizar),
    });
    if (campo === "nome") carregarVisao();
  }

  async function aplicarATodos() {
    if (!detalhe || !responsavelGeral) return;
    setAplicando(true);
    try {
      const { atualizados } = await apiAdministracao.aplicarResponsavel(detalhe.id, responsavelGeral, somenteSem);
      toast({ title: `${atualizados} pessoa(s) atualizada(s)`, status: "success" });
      await Promise.all([carregarDetalhe(detalhe.id, true), carregarVisao()]);
    } catch (e) { erro(e, "Erro ao aplicar o responsável"); }
    finally { setAplicando(false); }
  }

  const termo = busca.trim().toLowerCase();
  const filtroPorPessoa = filtro !== "TODOS" && filtro !== "ATRASADOS" && filtro !== "VAZIOS";

  // apartamentos que aparecem (pela unidade ou por alguma pessoa dela)
  const apartamentos = useMemo(() => (detalhe?.apartamentos ?? []).filter((a) => {
    if (filtro === "VAZIOS" && a.pessoas.length > 0) return false;
    if (filtro === "ATRASADOS" && a.financeiro.cotas_atrasadas === 0) return false;
    const pessoasOk = a.pessoas.some((v) => pessoaCombina(v.pessoa, filtroPorPessoa ? filtro : "TODOS", termo));
    if (filtroPorPessoa) return pessoasOk;
    return !termo || a.rotulo.toLowerCase().includes(termo) || pessoasOk;
  }), [detalhe, filtro, filtroPorPessoa, termo]);

  const semUnidade = useMemo(() => (detalhe?.sem_unidade ?? []).filter((p) =>
    filtro === "TODOS" || filtroPorPessoa ? pessoaCombina(p, filtroPorPessoa ? filtro : "TODOS", termo) : false,
  ), [detalhe, filtro, filtroPorPessoa, termo]);

  return (
    <Box>
      {/* TODOS OS CONDOMÍNIOS */}
      {carregando ? (
        <Flex justify="center" padding={10}><Spinner color="blue.500" size="lg" /></Flex>
      ) : condominios.length === 0 ? (
        <Text color="gray.500" fontSize="sm">Nenhum condomínio cadastrado.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3} marginBottom={6}>
          {condominios.map((c) => {
            const ativo = c.id === selecionado;
            return (
              <Box key={c.id} as="button" textAlign="left" onClick={() => setSelecionado(ativo ? "" : c.id)} bg={ativo ? "blue.50" : "white"}
                border="1px solid" borderColor={ativo ? "blue.300" : "gray.100"} borderRadius="xl" padding={4} _hover={{ borderColor: "blue.200" }} opacity={c.ativo ? 1 : 0.6}>
                <Flex justify="space-between" align="center" gap={2}>
                  <Text fontWeight="semibold" color="gray.800" noOfLines={1}>{c.nome}</Text>
                  {!c.ativo && <Badge textTransform="none">Inativo</Badge>}
                </Flex>
                {(c.cidade || c.uf) && <Text fontSize="xs" color="gray.500">{[c.cidade, c.uf].filter(Boolean).join(" / ")}</Text>}
                <Text fontSize="sm" color="gray.700" marginTop={2}>
                  Síndico: {c.sindicos.length ? c.sindicos.map((s) => s.nome).join(", ") : <Text as="span" color="orange.500">não designado</Text>}
                </Text>
                <Flex gap={2} marginTop={2} wrap="wrap">
                  <Badge variant="subtle" textTransform="none">{c.total_apartamentos} apto(s)</Badge>
                  <Badge colorScheme="blue" variant="subtle" textTransform="none">{c.total_moradores} morador(es)</Badge>
                  {c.sem_responsavel > 0 && <Badge variant="subtle" textTransform="none">{c.sem_responsavel} com o síndico</Badge>}
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {/* CONDOMÍNIO SELECIONADO */}
      {!selecionado ? (
        !carregando && condominios.length > 0 && <Text color="gray.500" fontSize="sm">Clique num condomínio para ver os apartamentos e os moradores.</Text>
      ) : carregandoDetalhe && !detalhe ? (
        <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>
      ) : detalhe && (
        <Box>
          <Text fontSize="lg" fontWeight="semibold" color="gray.800" marginBottom={3}>{detalhe.nome}</Text>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3} marginBottom={4}>
            <Secao titulo="Síndico(s)">
              {detalhe.sindicos.length === 0 ? <Vazio texto="Nenhum síndico designado" /> : (
                <Stack spacing={1}>
                  {detalhe.sindicos.map((s) => (
                    <Text key={s.pessoa_id} fontSize="sm">
                      <b>{s.nome}</b>{s.telefone && ` · ${formatarTelefone(s.telefone)}`}{s.email && ` · ${s.email}`}
                      {!s.tem_login && <Badge marginLeft={2} colorScheme="orange" textTransform="none">sem acesso: não recebe o WhatsApp</Badge>}
                    </Text>
                  ))}
                </Stack>
              )}
            </Secao>
            <Secao titulo="Responsável para várias pessoas">
              {detalhe.responsaveis_disponiveis.length === 0 ? (
                <Text fontSize="sm" color="gray.500">Nenhum responsável criado ainda. Crie na aba Responsáveis.</Text>
              ) : (
                <Flex gap={2} align="center" wrap="wrap">
                  <Select size="sm" maxWidth="220px" bg="white" value={responsavelGeral} onChange={(e) => setResponsavelGeral(e.target.value)}>
                    <option value="">Escolha o responsável</option>
                    {detalhe.responsaveis_disponiveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </Select>
                  <Checkbox size="sm" isChecked={somenteSem} onChange={(e) => setSomenteSem(e.target.checked)}>Só quem está com o síndico</Checkbox>
                  <Button size="sm" colorScheme="blue" onClick={aplicarATodos} isLoading={aplicando} isDisabled={!responsavelGeral}>Aplicar</Button>
                </Flex>
              )}
            </Secao>
          </SimpleGrid>

          <Flex gap={3} marginBottom={3} direction={{ base: "column", md: "row" }}>
            <InputGroup size="sm" maxWidth={{ md: "380px" }}>
              <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3} /></InputLeftElement>
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por apartamento, nome, CPF, telefone ou responsável" bg="white" borderRadius="lg" />
            </InputGroup>
            <Select size="sm" maxWidth={{ md: "260px" }} bg="white" borderRadius="lg" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
              <option value="TODOS">Todos os apartamentos</option>
              <option value="COM_SINDICO">Pessoas com o síndico (padrão)</option>
              <option value="ESCOLHIDO">Pessoas com responsável escolhido</option>
              <option value="ATRASADOS">Apartamentos com cota atrasada</option>
              <option value="CHAMADOS">Pessoas com chamado em andamento</option>
              <option value="WHATSAPP">Pessoas com conversa no WhatsApp</option>
              <option value="VAZIOS">Apartamentos vazios</option>
            </Select>
            <Text fontSize="sm" color="gray.500" alignSelf="center">{apartamentos.length} de {detalhe.apartamentos.length} apartamento(s)</Text>
          </Flex>

          <Text fontSize="xs" color="gray.500" marginBottom={2}>Clique em um dado para editar; Enter salva, Esc cancela.</Text>

          {apartamentos.length === 0 && semUnidade.length === 0 ? <Text fontSize="sm" color="gray.500" padding={4}>Nada encontrado.</Text> : (
            <Accordion allowMultiple>
              {apartamentos.map((a) => {
                const ocup = OCUPACAO_ADMIN[a.ocupacao];
                const pessoas = filtroPorPessoa || (termo && !a.rotulo.toLowerCase().includes(termo))
                  ? a.pessoas.filter((v) => pessoaCombina(v.pessoa, filtroPorPessoa ? filtro : "TODOS", termo))
                  : a.pessoas;
                return (
                  <AccordionItem key={a.id} bg="white" border="1px solid" borderColor="gray.100" borderRadius="lg" marginBottom={2}>
                    <AccordionButton paddingY={3} _hover={{ bg: "gray.50" }} borderRadius="lg">
                      <Box flex={1} minWidth={0} textAlign="left">
                        <Flex align="center" gap={2} wrap="wrap">
                          <Text fontWeight="semibold" color="gray.800">{a.rotulo}</Text>
                          {a.andar != null && <Text fontSize="xs" color="gray.500">{a.andar}º andar</Text>}
                          <Badge colorScheme={ocup.cor} variant="subtle" textTransform="none">{ocup.rotulo}</Badge>
                          {a.financeiro.cotas_atrasadas > 0 && <Badge colorScheme="red" textTransform="none">{a.financeiro.cotas_atrasadas} cota(s) atrasada(s)</Badge>}
                          {a.veiculos.length > 0 && <Badge variant="outline" textTransform="none">{a.veiculos.length} veículo(s)</Badge>}
                        </Flex>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {a.pessoas.length ? a.pessoas.map((v) => v.pessoa.nome).join(", ") : "Sem moradores"}
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel paddingTop={0}>
                      <Stack spacing={2} marginBottom={3}>
                        {pessoas.length === 0 ? <Vazio texto="Nenhuma pessoa ligada a este apartamento" /> : pessoas.map((v) => (
                          <CartaoPessoa key={v.vinculo_id} pessoa={v.pessoa} vinculo={v} responsaveis={detalhe.responsaveis_disponiveis}
                            sindicos={detalhe.sindicos} aoEditar={editar} />
                        ))}
                      </Stack>
                      {a.observacao && <Text fontSize="xs" color="gray.500" marginBottom={2}>Observação: {a.observacao}</Text>}
                      <DadosUnidade a={a} />
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}

              {semUnidade.length > 0 && (
                <AccordionItem bg="white" border="1px solid" borderColor="orange.100" borderRadius="lg" marginBottom={2}>
                  <AccordionButton paddingY={3} _hover={{ bg: "gray.50" }} borderRadius="lg">
                    <Box flex={1} textAlign="left">
                      <Text fontWeight="semibold" color="gray.800">Sem apartamento</Text>
                      <Text fontSize="xs" color="gray.500">Síndicos, conselheiros e moradores ainda não ligados a uma unidade ({semUnidade.length})</Text>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel paddingTop={0}>
                    <Stack spacing={2}>
                      {semUnidade.map((p) => (
                        <CartaoPessoa key={p.id} pessoa={p} responsaveis={detalhe.responsaveis_disponiveis} sindicos={detalhe.sindicos} aoEditar={editar} />
                      ))}
                    </Stack>
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
};

// ---------------------------------------------------------
// PÁGINA
// ---------------------------------------------------------

export const Administracao = () => {
  const { user } = useAuth();
  const [versao, setVersao] = useState(0); // muda quando os responsáveis mudam: recarrega a aba Condomínios

  if (!user?.admin_sistema) {
    return (
      <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Apenas o administrador do sistema acessa a administração geral.</Text>
      </Flex>
    );
  }

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Box marginBottom={4}>
          <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Administração geral</Text>
          <Text fontSize="sm" color="gray.500" marginTop={1}>
            Todos os condomínios, apartamentos e moradores, com edição direta. Responsável do WhatsApp de cada pessoa: padrão é o síndico do prédio.
          </Text>
        </Box>

        <Tabs colorScheme="blue" isLazy>
          <TabList>
            <Tab>Condomínios</Tab>
            <Tab>Responsáveis</Tab>
          </TabList>
          <TabPanels>
            <TabPanel paddingX={0}><AbaCondominios versao={versao} /></TabPanel>
            <TabPanel paddingX={0}><Responsaveis aoMudar={() => setVersao((v) => v + 1)} /></TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Flex>
  );
};
