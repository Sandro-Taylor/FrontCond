// ---------------------------------------------------------
// MOVIMENTAÇÕES BANCÁRIAS
// ---------------------------------------------------------
// Em cima: enviar o extrato do mês (.xlsx do banco).
// Embaixo: todas as movimentações gravadas no banco de dados,
// com filtro por mês e por tipo (entrada/saída).
// Valor negativo = saída; positivo = entrada.
// Envia: ADM e síndico. Vê: ADM, síndico e conselheiro.
// Abas: Movimentações | Contas | Investimentos | Fluxo de caixa | Saldos | Despesas por favorecido | Previsão
//       (contas em Contas.tsx; CDB em Investimentos.tsx; resumos em Resumos.tsx; previsão em Previsao.tsx)
// ---------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, AlertDescription, AlertIcon, Badge, Box, Button, CloseButton, Flex, Icon, Input, InputGroup, InputLeftElement, Select, SimpleGrid,
  Spinner, Stack, Tab, Table, TableContainer, TabList, TabPanel, TabPanels, Tabs, Tbody, Td, Text, Th, Thead, Tr, useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { CircleArrowDown, CircleArrowUp, FileSpreadsheet, Upload } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { formatarDataHora, formatarDataIso } from "../../Components/config";
import { formatarMoeda } from "../Financeiro/ConfigFinanceiro";
import {
  ExtratoJaEnviado, apiMovimentacoes, formatarDocumento, nomeMes, numero,
  type Extrato, type ListaMovimentacoes, type ResultadoImportacao,
} from "./ConfigMovimentacoes";
import { Favorecidos, FluxoCaixa, Saldos } from "./Resumos";
import { Previsao } from "./Previsao";
import { Contas } from "./Contas";
import { Investimentos } from "./Investimentos";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };

const Total = ({ rotulo, valor, cor, icone }: { rotulo: string; valor: number; cor: string; icone?: typeof CircleArrowUp }) => (
  <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
    <Flex align="center" gap={2}>
      {icone && <Icon as={icone} boxSize={4} color={cor} />}
      <Text fontSize="xs" color="gray.500">{rotulo}</Text>
    </Flex>
    <Text fontSize="xl" fontWeight="semibold" color={cor}>{formatarMoeda(valor)}</Text>
  </Box>
);

export const Movimentacoes = () => {
  const toast = useToast();
  const { editaTudo, veFinanceiroTudo } = usePermissoes();
  const entrada = useRef<HTMLInputElement>(null);

  const [meses, setMeses] = useState<{ mes: string; quantidade: number }[]>([]);
  const [mes, setMes] = useState("");          // "" = todas
  const [tipo, setTipo] = useState("");        // "" | ENTRADA | SAIDA
  const [busca, setBusca] = useState("");
  const [dados, setDados] = useState<ListaMovimentacoes | null>(null);
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [versao, setVersao] = useState(0); // muda a cada envio/exclusão: recarrega as abas de resumo

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error", duration: 7000 }), [toast]);

  const carregarAuxiliares = useCallback(async () => {
    try {
      const [listaMeses, listaExtratos] = await Promise.all([apiMovimentacoes.meses(), apiMovimentacoes.extratos()]);
      setMeses(listaMeses);
      setExtratos(listaExtratos);
    } catch (e) { erro(e, "Erro ao carregar os meses"); }
  }, [erro]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { setDados(await apiMovimentacoes.listar(mes, tipo)); }
    catch (e) { erro(e, "Erro ao carregar as movimentações"); }
    finally { setCarregando(false); }
  }, [mes, tipo, erro]);

  useEffect(() => { if (veFinanceiroTudo) carregarAuxiliares(); }, [carregarAuxiliares, veFinanceiroTudo]);
  useEffect(() => { if (veFinanceiroTudo) carregar(); }, [carregar, veFinanceiroTudo]);

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!arquivo.name.toLowerCase().endsWith(".xlsx")) { toast({ title: "Envie o extrato em .xlsx", status: "warning" }); return; }
    setEnviando(true);
    setResultado(null);
    try {
      let feito: ResultadoImportacao;
      try {
        feito = await apiMovimentacoes.importar(arquivo, false);
      } catch (e) {
        if (!(e instanceof ExtratoJaEnviado)) throw e;
        if (!window.confirm(`${e.message}\n\nAo substituir, as movimentações desse período serão trocadas pelas do arquivo novo.`)) return;
        feito = await apiMovimentacoes.importar(arquivo, true);
      }
      setResultado(feito);
      const periodo = `${formatarDataIso(feito.extrato.periodo_inicio)} a ${formatarDataIso(feito.extrato.periodo_fim)}`;
      toast({ title: `${feito.extrato.quantidade} movimentações importadas (${periodo})${feito.substituiu ? " · extrato substituído" : ""}`, status: "success" });
      setMes(feito.extrato.periodo_inicio.slice(0, 7));
      await carregarAuxiliares();
      await carregar();
      setVersao((v) => v + 1);
    } catch (e) { erro(e, "Erro ao importar o extrato"); }
    finally { setEnviando(false); if (entrada.current) entrada.current.value = ""; }
  }

  async function excluirExtrato(ex: Extrato) {
    if (!window.confirm(`Excluir o extrato de ${formatarDataIso(ex.periodo_inicio)} a ${formatarDataIso(ex.periodo_fim)} e as ${ex.quantidade} movimentações dele?`)) return;
    try { await apiMovimentacoes.excluirExtrato(ex.id); toast({ title: "Extrato excluído", status: "success", duration: 2000 }); await carregarAuxiliares(); await carregar(); setVersao((v) => v + 1); }
    catch (e) { erro(e, "Erro ao excluir"); }
  }

  const termo = busca.trim().toLowerCase();
  const itens = useMemo(() => (dados?.itens ?? []).filter((m) =>
    !termo || [m.lancamento, m.razao_social ?? "", m.cpf_cnpj ?? "", formatarDocumento(m.cpf_cnpj)].some((t) => t.toLowerCase().includes(termo)),
  ), [dados, termo]);


  if (!veFinanceiroTudo) {
    return (
      <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Seu perfil não tem acesso às movimentações bancárias.</Text>
      </Flex>
    );
  }

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>

        {/* TOPO: título + enviar extrato */}
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={5}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Conta bancária</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Extrato bancário do condomínio. Valores negativos são saídas; positivos, entradas.</Text>
          </Box>
          {editaTudo && (
            <>
              <Button colorScheme="blue" borderRadius="lg" leftIcon={<Icon as={Upload} boxSize={4} />} onClick={() => entrada.current?.click()} isLoading={enviando} loadingText="Importando...">
                Enviar extrato do mês
              </Button>
              <input ref={entrada} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => enviar(e.target.files?.[0])} />
            </>
          )}
        </Flex>

        {/* RESULTADO DO ÚLTIMO ENVIO */}
        {resultado && (
          <Alert status={resultado.avisos.length ? "warning" : "success"} borderRadius="lg" marginBottom={4} alignItems="flex-start">
            <AlertIcon />
            <AlertDescription fontSize="sm" flex={1}>
              <Text fontWeight="semibold">
                {resultado.extrato.nome_arquivo}: {resultado.extrato.quantidade} movimentações de {formatarDataIso(resultado.extrato.periodo_inicio)} a {formatarDataIso(resultado.extrato.periodo_fim)}
                {resultado.substituiu && " (substituiu o envio anterior)"}
              </Text>
              {resultado.avisos.length > 0 && (
                <Stack spacing={1} marginTop={1}>
                  {resultado.avisos.map((a, i) => <Text key={i}>• {a}</Text>)}
                </Stack>
              )}
            </AlertDescription>
            <CloseButton size="sm" onClick={() => setResultado(null)} />
          </Alert>
        )}

        <Tabs colorScheme="blue" isLazy>
          <TabList overflowX="auto" overflowY="hidden">
            <Tab whiteSpace="nowrap">Movimentações</Tab>
            <Tab whiteSpace="nowrap">Contas</Tab>
            <Tab whiteSpace="nowrap">Investimentos</Tab>
            <Tab whiteSpace="nowrap">Fluxo de caixa</Tab>
            <Tab whiteSpace="nowrap">Saldos</Tab>
            <Tab whiteSpace="nowrap">Despesas por favorecido</Tab>
            <Tab whiteSpace="nowrap">Previsão</Tab>
          </TabList>
          <TabPanels>
            <TabPanel paddingX={0}>

        {/* FILTROS */}
        <Flex gap={3} marginBottom={4} direction={{ base: "column", md: "row" }}>
          <Select maxWidth={{ md: "240px" }} bg="white" borderRadius="lg" value={mes} onChange={(e) => setMes(e.target.value)}>
            <option value="">Todos os meses</option>
            {meses.map((m) => <option key={m.mes} value={m.mes}>{nomeMes(m.mes)} ({m.quantidade})</option>)}
          </Select>
          <Select maxWidth={{ md: "200px" }} bg="white" borderRadius="lg" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Entradas e saídas</option>
            <option value="ENTRADA">Só entradas</option>
            <option value="SAIDA">Só saídas</option>
          </Select>
          <InputGroup maxWidth={{ md: "340px" }}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar lançamento, favorecido ou CPF/CNPJ" bg="white" borderRadius="lg" />
          </InputGroup>
        </Flex>

        {/* TOTAIS */}
        {dados && (
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} marginBottom={4}>
            <Total rotulo="Entradas" valor={numero(dados.total_entradas)} cor="green.600" icone={CircleArrowUp} />
            <Total rotulo="Saídas" valor={numero(dados.total_saidas)} cor="red.600" icone={CircleArrowDown} />
            <Total rotulo="Resultado" valor={numero(dados.resultado)} cor={numero(dados.resultado) >= 0 ? "gray.800" : "red.600"} />
          </SimpleGrid>
        )}

        {/* LISTA */}
        {carregando && !dados ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : !dados || dados.itens.length === 0 ? (
          <Flex direction="column" align="center" padding={16} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100">
            <Icon as={FileSpreadsheet} boxSize={7} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">{meses.length ? "Nenhuma movimentação neste filtro" : "Nenhum extrato enviado ainda"}</Text>
            {editaTudo && !meses.length && <Text fontSize="sm" color="gray.500">Clique em "Enviar extrato do mês" e escolha o .xlsx do banco.</Text>}
          </Flex>
        ) : (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden" opacity={carregando ? 0.6 : 1}>
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Data</Th>
                    <Th {...estiloTh}>Lançamento</Th>
                    <Th {...estiloTh}>Razão social</Th>
                    <Th {...estiloTh}>CPF/CNPJ</Th>
                    <Th {...estiloTh}>Tipo</Th>
                    <Th {...estiloTh} isNumeric paddingRight={5}>Valor</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {itens.map((m) => (
                    <Tr key={m.id}>
                      <Td paddingLeft={5} fontSize="sm">{formatarDataIso(m.data)}</Td>
                      <Td fontSize="sm" maxWidth="320px" whiteSpace="normal">{m.lancamento}</Td>
                      <Td fontSize="sm" maxWidth="280px" whiteSpace="normal" color={m.razao_social ? "gray.800" : "gray.400"}>{m.razao_social ?? "—"}</Td>
                      <Td fontSize="xs" color="gray.600">{formatarDocumento(m.cpf_cnpj) || "—"}</Td>
                      <Td><Badge colorScheme={m.tipo === "ENTRADA" ? "green" : "red"} variant="subtle" textTransform="none">{m.tipo === "ENTRADA" ? "Entrada" : "Saída"}</Badge></Td>
                      <Td isNumeric paddingRight={5} fontSize="sm" fontWeight="semibold" color={m.tipo === "ENTRADA" ? "green.600" : "red.600"}>{formatarMoeda(numero(m.valor))}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            {termo && <Text fontSize="xs" color="gray.500" paddingX={5} paddingY={2}>{itens.length} de {dados.itens.length} movimentações (os totais acima não consideram a busca)</Text>}
          </Box>
        )}

        {/* EXTRATOS ENVIADOS */}
        {extratos.length > 0 && (
          <Box marginTop={6}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700" marginBottom={2}>Extratos enviados</Text>
            <Stack spacing={2}>
              {extratos.map((ex) => (
                <Flex key={ex.id} bg="white" border="1px solid" borderColor="gray.100" borderRadius="lg" paddingX={4} paddingY={2} align="center" gap={3} wrap="wrap">
                  <Icon as={FileSpreadsheet} boxSize={4} color="green.600" />
                  <Box flex={1} minWidth="200px">
                    <Text fontSize="sm" fontWeight="medium">{formatarDataIso(ex.periodo_inicio)} a {formatarDataIso(ex.periodo_fim)} · {ex.quantidade} movimentações</Text>
                    <Text fontSize="xs" color="gray.500">
                      {ex.nome_arquivo}{ex.agencia && ` · Ag. ${ex.agencia}`}{ex.conta && ` · Conta ${ex.conta}`} · enviado em {formatarDataHora(ex.created_at)}
                    </Text>
                  </Box>
                  {editaTudo && <Button size="xs" variant="ghost" colorScheme="red" onClick={() => excluirExtrato(ex)}>Excluir</Button>}
                </Flex>
              ))}
            </Stack>
          </Box>
        )}

            </TabPanel>
            <TabPanel paddingX={0}><Contas versao={versao} aoMudar={() => setVersao((v) => v + 1)} /></TabPanel>
            <TabPanel paddingX={0}><Investimentos versao={versao} aoMudar={() => setVersao((v) => v + 1)} /></TabPanel>
            <TabPanel paddingX={0}><FluxoCaixa versao={versao} /></TabPanel>
            <TabPanel paddingX={0}><Saldos versao={versao} /></TabPanel>
            <TabPanel paddingX={0}><Favorecidos versao={versao} meses={meses} /></TabPanel>
            <TabPanel paddingX={0}><Previsao versao={versao} /></TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Flex>
  );
};
