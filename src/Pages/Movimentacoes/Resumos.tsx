// ---------------------------------------------------------
// MOVIMENTAÇÕES – ABAS DE RESUMO
// ---------------------------------------------------------
// FluxoCaixa ..... por conta e mês: entrada, saída, saldo do mês
//                  e saldo acumulado (saldo do banco no fim do mês)
// Saldos ......... saldo em conta, fundo de reserva e total disponível;
//                  saldo no fim de cada mês (cadastro das contas: Contas.tsx)
// SALDOS INFORMADOS (tabela única): a gestão digita saldos lidos no banco.
//   CONTA: saldo da conta corrente -> + lançamentos do extrato depois da data
//   CDB:   saldo líquido do CDB (fundo de reserva) -> + aplicações - resgates
//          depois da data; a diferença entre dois saldos = Rendimento
// Favorecidos .... para quem o condomínio mais pagou (mês ou ano)
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Input, InputGroup, InputLeftAddon, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead,
  Tooltip, Tr, useToast,
} from "@chakra-ui/react";
import { usePermissoes } from "../../Components/permissoes";
import { lerValor } from "../Financeiro/ConfigFinanceiro";

import { formatarDataIso } from "../../Components/config";
import { formatarMoeda } from "../Financeiro/ConfigFinanceiro";
import {
  MESES_CURTOS, apiMovimentacoes, formatarDocumento, nomeConta, nomeMes, numero,
  type ContaFluxo, type Favorecido, type FluxoCaixa as DadosFluxo, type SaldoInformado, type TipoSaldo,
} from "./ConfigMovimentacoes";

// INFORMAR SALDO (conta corrente ou CDB), lido no app do banco
type ContaSugerida = { agencia: string; conta: string; descricao?: string | null };

export const ModalSaldo = ({ tipo, aberto, aoFechar, aoSalvo, sugestoes }: {
  tipo: TipoSaldo; aberto: boolean; aoFechar: () => void; aoSalvo: () => void; sugestoes: ContaSugerida[];
}) => {
  const toast = useToast();
  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ agencia: "", conta: "", descricao: "", data: hoje, valor: "" });
  const [salvando, setSalvando] = useState(false);
  const cdb = tipo === "CDB";

  useEffect(() => {
    if (!aberto) return;
    const primeira = sugestoes[0];
    setForm({ agencia: primeira?.agencia ?? "", conta: primeira?.conta ?? "", descricao: primeira?.descricao ?? (cdb ? "CDB" : ""), data: hoje, valor: "" });
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar() {
    const valor = lerValor(form.valor);
    if (!form.agencia.trim() || !form.conta.trim()) { toast({ title: "Informe agência e conta", status: "warning" }); return; }
    if (!Number.isFinite(valor)) { toast({ title: "Informe o saldo", status: "warning" }); return; }
    if (!form.data) { toast({ title: "Informe a data", status: "warning" }); return; }
    setSalvando(true);
    try {
      await apiMovimentacoes.informarSaldo({ tipo, agencia: form.agencia.trim(), conta: form.conta.trim(), descricao: form.descricao.trim() || null, data: form.data, valor });
      toast({ title: "Saldo salvo", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>
          {cdb ? "Atualizar posição do fundo (CDB)" : "Informar saldo da conta"}
          <Text fontSize="sm" fontWeight="normal" color="gray.500">
            {cdb ? "Copie o saldo LÍQUIDO do CDB no app do banco (Investimentos → Posição detalhada)." : "Copie o saldo da conta corrente no app do banco, no fim do dia escolhido."}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {sugestoes.length > 0 && (
            <Flex gap={2} wrap="wrap" marginBottom={3}>
              {sugestoes.map((c) => (
                <Button key={`${c.agencia}|${c.conta}`} size="xs" colorScheme={cdb ? "teal" : "blue"} variant={form.conta === c.conta && form.agencia === c.agencia ? "solid" : "outline"}
                  onClick={() => setForm({ ...form, agencia: c.agencia, conta: c.conta, descricao: c.descricao ?? form.descricao })}>
                  Ag. {c.agencia} · Conta {c.conta}
                </Button>
              ))}
            </Flex>
          )}
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl isRequired><FormLabel fontSize="sm">Agência</FormLabel><Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} placeholder="0428" /></FormControl>
            <FormControl isRequired><FormLabel fontSize="sm">Conta</FormLabel><Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} placeholder="04645-2" /></FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">{cdb ? "Saldo líquido" : "Saldo"}</FormLabel>
              <InputGroup><InputLeftAddon>R$</InputLeftAddon><Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} inputMode="decimal" placeholder="0,00" autoFocus /></InputGroup>
            </FormControl>
            <FormControl isRequired><FormLabel fontSize="sm">No fim do dia</FormLabel><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></FormControl>
            {cdb && <FormControl gridColumn={{ sm: "span 2" }}><FormLabel fontSize="sm">Descrição (opcional)</FormLabel><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="CDB-DI Itaú" /></FormControl>}
          </SimpleGrid>
          <Text fontSize="xs" color="gray.500" marginTop={3}>
            {cdb
              ? "O fundo passa a ser este valor + aplicações − resgates depois da data. A diferença para o saldo anterior aparece como Rendimento. Outra conta de investimento no futuro: é só digitar a agência e a conta dela."
              : "A conta passa a ser este valor + os lançamentos do extrato depois da data. Ex.: saldo de 31/12/2025 para começar em janeiro de 2026."}
            {" "}Mesma conta e mesma data: substitui o valor.
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme={cdb ? "teal" : "blue"} onClick={salvar} isLoading={salvando}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// contas sugeridas: as já informadas (do tipo) + as contas dos extratos
function sugestoes(fluxo: DadosFluxo | null, informados: SaldoInformado[], tipo: TipoSaldo, primeira?: ContaSugerida): ContaSugerida[] {
  const lista: ContaSugerida[] = [];
  const vistos = new Set<string>();
  const add = (agencia: string | null, conta: string | null, descricao?: string | null) => {
    if (!agencia || !conta) return;
    const chave = `${agencia.replace(/\D/g, "").replace(/^0+/, "")}|${conta.replace(/\D/g, "").replace(/^0+/, "")}`;
    if (vistos.has(chave)) return;
    vistos.add(chave);
    lista.push({ agencia, conta, descricao });
  };
  if (primeira) add(primeira.agencia, primeira.conta, primeira.descricao);
  informados.filter((s) => s.tipo === tipo).forEach((s) => add(s.agencia, s.conta, s.descricao));
  fluxo?.contas.forEach((c) => add(c.agencia, c.conta));
  return lista;
}

function useInformados(gatilho: unknown) {
  const [lista, setLista] = useState<SaldoInformado[]>([]);
  const [fundoAtual, setFundoAtual] = useState(0);
  const recarregar = useCallback(() => {
    apiMovimentacoes.saldosInformados().then((r) => { setLista(r.itens); setFundoAtual(numero(r.fundo_atual)); }).catch(() => setLista([]));
  }, []);
  useEffect(() => { recarregar(); }, [recarregar, gatilho]);
  return { lista, fundoAtual, recarregar };
}

// SALDO EM CONTA · FUNDO DE RESERVA · TOTAL DISPONÍVEL
export const ResumoDisponivel = ({ dados }: { dados: DadosFluxo }) => {
  const conta = numero(dados.total.saldo_atual);
  const fundoAtual = dados.fundo ? numero(dados.fundo.saldo_atual) : 0;
  return (
    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} marginBottom={4}>
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
        <Text fontSize="xs" color="gray.500">Saldo em conta{dados.total.saldo_em && ` (${formatarDataIso(dados.total.saldo_em)})`}</Text>
        <Text fontSize="xl" fontWeight="semibold" color={conta < 0 ? "red.600" : "gray.800"}>{formatarMoeda(conta)}</Text>
      </Box>
      <Box bg="white" border="1px solid" borderColor="teal.100" borderRadius="xl" padding={4}>
        <Text fontSize="xs" color="gray.500">Fundo de reserva{dados.fundo?.saldo_em && ` (${formatarDataIso(dados.fundo.saldo_em)})`}</Text>
        <Text fontSize="xl" fontWeight="semibold" color="teal.700">{formatarMoeda(fundoAtual)}</Text>
        {!dados.fundo_configurado && <Text fontSize="2xs" color="orange.600">Lance a posição do CDB na aba Investimentos</Text>}
      </Box>
      <Box bg="blue.700" color="white" borderRadius="xl" padding={4}>
        <Text fontSize="xs" opacity={0.9}>Total disponível (conta + fundo)</Text>
        <Text fontSize="2xl" fontWeight="bold">{formatarMoeda(conta + fundoAtual)}</Text>
      </Box>
    </SimpleGrid>
  );
};

const moeda = (v: string | null) => (v == null ? "—" : formatarMoeda(numero(v)));

function useFluxo(versao: number) {
  const toast = useToast();
  const [ano, setAno] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosFluxo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recarga, setRecarga] = useState(0);
  const carregar = useCallback(async () => {
    setCarregando(true);
    try { const d = await apiMovimentacoes.fluxo(ano); setDados(d); if (ano == null) setAno(d.ano); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar", status: "error" }); }
    finally { setCarregando(false); }
  }, [ano, toast]);
  useEffect(() => { carregar(); }, [carregar, versao, recarga]);
  return { ano, setAno, dados, carregando, recarregar: () => setRecarga((r) => r + 1) };
}

export const SeletorAno = ({ ano, anos, aoMudar }: { ano: number | null; anos: number[]; aoMudar: (a: number) => void }) => (
  <Select size="sm" width="120px" bg="white" borderRadius="lg" value={ano ?? ""} onChange={(e) => aoMudar(Number(e.target.value))}>
    {anos.map((a) => <option key={a} value={a}>{a}</option>)}
  </Select>
);

const Vazio = () => (
  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={10} textAlign="center">
    <Text color="gray.500" fontSize="sm">Nenhum extrato enviado ainda.</Text>
  </Box>
);

// ---------------------------------------------------------
// FLUXO DE CAIXA
// ---------------------------------------------------------

const LINHAS = [
  { chave: "entradas", rotulo: "Entrada", bg: "blue.50", cor: "blue.800" },
  { chave: "saidas", rotulo: "Saída", bg: "red.50", cor: "red.700" },
  { chave: "rendimento", rotulo: "Rendimento", bg: "green.50", cor: "green.700" },
  { chave: "resultado", rotulo: "Saldo", bg: "white", cor: "gray.800" },
  { chave: "saldo_acumulado", rotulo: "Saldo acumulado", bg: "yellow.50", cor: "gray.800" },
] as const;

export const BlocoConta = ({ conta, destaque, fundo, aoEditar }: { conta: ContaFluxo; destaque?: boolean; fundo?: boolean; aoEditar?: () => void }) => (
  <Flex border="1px solid" borderColor={fundo ? "teal.200" : destaque ? "blue.200" : "gray.200"} borderRadius="lg" overflow="hidden" bg="white" marginBottom={3}>
    {/* conta + saldo atual (fixo à esquerda) */}
    <Box width={{ base: "130px", md: "210px" }} flexShrink={0} bg={fundo ? (destaque ? "teal.800" : "teal.600") : destaque ? "blue.700" : "blue.800"} color="white" padding={3}
      display="flex" flexDirection="column" justifyContent="center" gap={1}>
      <Text fontSize="sm" fontWeight="semibold" noOfLines={2}>{destaque ? (fundo ? "Fundo de reserva (todos os CDBs)" : "Saldo em conta (todas)") : fundo ? "Fundo de reserva (CDB)" : (conta.titular ?? "Conta bancária")}</Text>
      {!destaque && conta.conta && <Text fontSize="2xs" opacity={0.85}>{nomeConta(conta)}</Text>}
      {fundo && !destaque && <Text fontSize="2xs" opacity={0.85}>Entrada = aplicações · Saída = resgates · Rendimento = juro</Text>}
      <Text fontSize="2xs" opacity={0.85} marginTop={1}>{fundo ? "Saldo" : "Saldo da conta"}{conta.saldo_em && ` em ${formatarDataIso(conta.saldo_em)}`}</Text>
      <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="bold">{moeda(conta.saldo_atual)}</Text>
      {!destaque && (
        <Box marginTop={1} paddingTop={1} borderTop="1px solid" borderColor="whiteAlpha.400">
          {conta.saldo_configurado && conta.saldo_inicial != null
            ? <Text fontSize="2xs" opacity={0.9}>{fundo ? "Última posição" : "Último saldo informado"} {moeda(conta.saldo_inicial)}{conta.data_saldo_inicial && ` em ${formatarDataIso(conta.data_saldo_inicial)}`}</Text>
            : <Text fontSize="2xs" color="yellow.200">{fundo ? "Posição do CDB não informada" : "Saldo da conta não informado"}</Text>}
          {aoEditar && <Button size="xs" variant="link" color="white" textDecoration="underline" onClick={aoEditar}>{fundo ? "Atualizar posição" : "Informar saldo"}</Button>}
        </Box>
      )}
    </Box>
    {/* meses (rola para o lado) */}
    <TableContainer flex={1} minWidth={0}>
      <Table size="sm" variant="unstyled">
        <Thead>
          <Tr>
            <Th position="sticky" left={0} bg="gray.50" zIndex={1} fontSize="2xs" textTransform="none" color="gray.500" minWidth="120px">Categoria</Th>
            {MESES_CURTOS.map((m) => <Th key={m} isNumeric bg="gray.50" fontSize="2xs" textTransform="uppercase" color="gray.600">{m}</Th>)}
          </Tr>
        </Thead>
        <Tbody>
          {LINHAS.filter((l) => (l.chave !== "rendimento" || fundo) && (!destaque || l.chave !== "saldo_acumulado" || conta.meses.some((m) => m.saldo_acumulado != null))).map((linha) => (
            <Tr key={linha.chave} borderTop="1px solid" borderColor="gray.100">
              <Td position="sticky" left={0} bg={linha.bg} zIndex={1} fontSize="xs" fontWeight="semibold" fontStyle="italic" color={linha.cor} paddingY={1.5}>{linha.rotulo}</Td>
              {conta.meses.map((m) => {
                const valor = m[linha.chave] ?? null;
                const negativo = valor != null && numero(valor) < 0;
                return (
                  <Td key={m.mes} isNumeric bg={linha.bg} fontSize="xs" paddingY={1.5} whiteSpace="nowrap"
                    color={linha.chave === "resultado" && negativo ? "red.600" : linha.cor} fontWeight={linha.chave === "saldo_acumulado" ? "semibold" : "normal"}>
                    {linha.chave === "saldo_acumulado" && valor != null && fundo
                      ? (m.conferido
                        ? <Tooltip label="Posição informada neste mês: valor do banco"><Text as="span" color="green.700">✓ {moeda(valor)}</Text></Tooltip>
                        : <Tooltip label="Sem posição digitada neste mês: calculado pelos lançamentos do CDB"><Text as="span" opacity={0.6}>{moeda(valor)}</Text></Tooltip>)
                      : linha.chave === "saldo_acumulado" && valor != null && !m.tem_extrato
                      ? <Tooltip label="Sem extrato deste mês: repete o último saldo"><Text as="span" opacity={0.6}>{moeda(valor)}</Text></Tooltip>
                      : moeda(valor)}
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Flex>
);

export const FluxoCaixa = ({ versao }: { versao: number }) => {
  const { ano, setAno, dados, carregando, recarregar } = useFluxo(versao);
  const { editaTudo } = usePermissoes();
  const [modal, setModal] = useState<{ tipo: TipoSaldo; conta?: ContaFluxo } | null>(null);
  const { lista } = useInformados(dados);
  // CDB: lançado na aba Investimentos; aqui só o saldo da conta corrente
  if (carregando && !dados) return <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>;
  if (!dados || dados.contas.length === 0) return <Vazio />;
  return (
    <Box opacity={carregando ? 0.6 : 1}>
      <Flex justify="space-between" align="center" marginBottom={3} gap={3} wrap="wrap">
        <Text fontSize="lg" fontWeight="semibold" color="gray.800">{dados.ano} – Fluxo de caixa</Text>
        <SeletorAno ano={ano} anos={dados.anos} aoMudar={setAno} />
      </Flex>
      <ResumoDisponivel dados={dados} />
      {dados.contas.length > 1 && <BlocoConta conta={dados.total} destaque />}
      {dados.contas.map((c) => <BlocoConta key={c.chave} conta={c} aoEditar={editaTudo ? () => setModal({ tipo: "CONTA", conta: c }) : undefined} />)}
      {dados.fundos.length > 1 && dados.fundo && <BlocoConta conta={dados.fundo} fundo destaque />}
      {dados.fundos.map((f) => <BlocoConta key={f.chave} conta={f} fundo />)}
      {dados.fundos.length === 0 && <Text fontSize="sm" color="teal.700" marginBottom={3}>Fundo de reserva (CDB): lance na aba Investimentos.</Text>}
      <ModalSaldo tipo={modal?.tipo ?? "CONTA"} aberto={Boolean(modal)} aoFechar={() => setModal(null)} aoSalvo={recarregar}
        sugestoes={modal?.tipo === "CDB" && !modal.conta ? [] : sugestoes(dados, lista, modal?.tipo ?? "CONTA", modal?.conta && modal.conta.agencia && modal.conta.conta ? { agencia: modal.conta.agencia, conta: modal.conta.conta, descricao: modal.tipo === "CDB" ? modal.conta.titular : undefined } : undefined)} />
      <Text fontSize="xs" color="gray.500">
        Saldo acumulado = último saldo informado (botão "Informar saldo") + lançamentos depois da data dele, até o mês. Meses sem extrato repetem o último saldo (mais claro).
        A aplicação no CDB aparece como saída da conta e como entrada no fundo de reserva.
        CDB (aba Investimentos): ✓ = mês com posição digitada (igual ao banco).
      </Text>
    </Box>
  );
};

// ---------------------------------------------------------
// SALDOS
// ---------------------------------------------------------

export const Saldos = ({ versao }: { versao: number }) => {
  const { ano, setAno, dados, carregando } = useFluxo(versao);
  if (carregando && !dados) return <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>;
  if (!dados || dados.contas.length === 0) return <Vazio />;
  const mesesComSaldo = dados.total.meses.filter((m) => m.saldo_acumulado != null);
  const fundoMes = (mes: number) => dados.fundo?.meses[mes - 1]?.saldo_acumulado ?? null;

  return (
    <Box opacity={carregando ? 0.6 : 1}>
      <ResumoDisponivel dados={dados} />

      {/* saldo de cada conta */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: Math.min(dados.contas.length, 4) }} spacing={3} marginBottom={5}>
        {dados.contas.map((c) => (
          <Box key={c.chave} bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>{c.titular ?? "Conta bancária"}</Text>
            <Text fontSize="2xs" color="gray.400">{nomeConta(c)}</Text>
            <Text fontSize="xl" fontWeight="semibold" color={numero(c.saldo_atual) < 0 ? "red.600" : "gray.800"} marginTop={1}>{moeda(c.saldo_atual)}</Text>
            {c.saldo_em && <Text fontSize="2xs" color="gray.500">último extrato até {formatarDataIso(c.saldo_em)}</Text>}
          </Box>
        ))}
      </SimpleGrid>

      {/* saldo no fim de cada mês */}
      <Flex justify="space-between" align="center" marginBottom={2} gap={3}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.700">Saldo no fim de cada mês</Text>
        <SeletorAno ano={ano} anos={dados.anos} aoMudar={setAno} />
      </Flex>
      {mesesComSaldo.length === 0 ? <Text fontSize="sm" color="gray.500">Sem saldos neste ano.</Text> : (
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th textTransform="none" fontSize="xs" color="gray.500">Mês</Th>
                  {dados.contas.map((c) => <Th key={c.chave} isNumeric textTransform="none" fontSize="xs" color="gray.500">{nomeConta(c)}</Th>)}
                  {dados.contas.length > 1 && <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Saldo em conta</Th>}
                  {dados.fundo && <Th isNumeric textTransform="none" fontSize="xs" color="teal.600">Fundo de reserva</Th>}
                  {dados.fundo && <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Total disponível</Th>}
                  <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Variação da conta no mês</Th>
                </Tr>
              </Thead>
              <Tbody>
                {mesesComSaldo.map((m) => (
                  <Tr key={m.mes}>
                    <Td fontSize="sm" textTransform="capitalize">{nomeMes(`${dados.ano}-${String(m.mes).padStart(2, "0")}`)}</Td>
                    {dados.contas.map((c) => {
                      const mc = c.meses[m.mes - 1];
                      return <Td key={c.chave} isNumeric fontSize="sm" opacity={mc.tem_extrato ? 1 : 0.6}>{moeda(mc.saldo_acumulado)}</Td>;
                    })}
                    {dados.contas.length > 1 && <Td isNumeric fontSize="sm" fontWeight="semibold">{moeda(m.saldo_acumulado)}</Td>}
                    {dados.fundo && <Td isNumeric fontSize="sm" color="teal.700">{moeda(fundoMes(m.mes))}</Td>}
                    {dados.fundo && <Td isNumeric fontSize="sm" fontWeight="semibold">{formatarMoeda(numero(m.saldo_acumulado) + numero(fundoMes(m.mes)))}</Td>}
                    <Td isNumeric fontSize="sm" color={numero(m.resultado) < 0 ? "red.600" : "green.600"}>{moeda(m.resultado)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
      <Text fontSize="xs" color="gray.500" marginTop={4}>Saldos iniciais e posições do CDB: aba Contas.</Text>
    </Box>
  );
};

// ---------------------------------------------------------
// DESPESAS POR FAVORECIDO
// ---------------------------------------------------------

export const Favorecidos = ({ versao, meses }: { versao: number; meses: { mes: string }[] }) => {
  const toast = useToast();
  const anos = Array.from(new Set(meses.map((m) => Number(m.mes.slice(0, 4))))).sort((a, b) => b - a);
  const [periodo, setPeriodo] = useState("");   // "" = tudo | "2026" | "2026-01"
  const [lista, setLista] = useState<Favorecido[] | null>(null);

  useEffect(() => {
    const filtro = periodo.length === 7 ? { mes: periodo } : periodo ? { ano: Number(periodo) } : {};
    apiMovimentacoes.favorecidos(filtro).then(setLista)
      .catch((e) => toast({ title: e instanceof Error ? e.message : "Erro ao carregar", status: "error" }));
  }, [periodo, versao, toast]);

  const total = (lista ?? []).reduce((s, f) => s + numero(f.total), 0);

  return (
    <Box>
      <Flex justify="space-between" align="center" marginBottom={3} gap={3} wrap="wrap">
        <Text fontSize="sm" color="gray.600">Saídas agrupadas por favorecido (sem razão social, pelo texto do lançamento).</Text>
        <Select size="sm" width={{ base: "100%", sm: "240px" }} bg="white" borderRadius="lg" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="">Todo o período</option>
          {anos.map((a) => <option key={a} value={a}>Ano de {a}</option>)}
          {meses.map((m) => <option key={m.mes} value={m.mes}>{nomeMes(m.mes)}</option>)}
        </Select>
      </Flex>
      {!lista ? <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex> : lista.length === 0 ? <Vazio /> : (
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th textTransform="none" fontSize="xs" color="gray.500" paddingLeft={5}>Favorecido</Th>
                  <Th textTransform="none" fontSize="xs" color="gray.500">CPF/CNPJ</Th>
                  <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Pagamentos</Th>
                  <Th textTransform="none" fontSize="xs" color="gray.500">Último</Th>
                  <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Total</Th>
                  <Th isNumeric textTransform="none" fontSize="xs" color="gray.500" paddingRight={5}>% das saídas</Th>
                </Tr>
              </Thead>
              <Tbody>
                {lista.map((f) => (
                  <Tr key={f.favorecido}>
                    <Td paddingLeft={5} fontSize="sm" whiteSpace="normal" maxWidth="360px">{f.favorecido}</Td>
                    <Td fontSize="xs" color="gray.600">{formatarDocumento(f.cpf_cnpj) || "—"}</Td>
                    <Td isNumeric fontSize="sm">{f.quantidade}</Td>
                    <Td fontSize="sm">{formatarDataIso(f.ultimo_pagamento)}</Td>
                    <Td isNumeric fontSize="sm" fontWeight="semibold" color="red.600">{moeda(f.total)}</Td>
                    <Td isNumeric paddingRight={5}><Badge variant="subtle" textTransform="none">{total ? ((numero(f.total) / total) * 100).toFixed(1) : "0"}%</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="flex-end" paddingX={5} paddingY={2} borderTop="1px solid" borderColor="gray.100">
            <Text fontSize="sm" fontWeight="semibold">Total de saídas: <Text as="span" color="red.600">{formatarMoeda(total)}</Text></Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
};
