// ---------------------------------------------------------
// MOVIMENTAÇÕES – ABA INVESTIMENTOS (CDB do fundo de reserva)
// ---------------------------------------------------------
// A conta corrente vem do extrato (.xlsx); o CDB é digitado aqui,
// copiando do app do banco:
//   Posição (saldo líquido) · Aplicação · Resgate · Rendimento
// Um card por CONTA de investimento (agência + conta); os produtos (CDBs)
// da conta são somados. O nome do produto fica no lançamento.
// COMPARATIVO: cada "APLICACAO CDB DI" / "RESGATE CDB" do extrato tem
// que ter o mesmo valor lançado aqui; o que falta aparece pendente,
// com botão para lançar.
// ---------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Input, InputGroup, InputLeftAddon, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Table, TableContainer,
  Tbody, Td, Text, Th, Thead, Tr, useToast,
} from "@chakra-ui/react";

import { usePermissoes } from "../../Components/permissoes";
import { formatarDataIso } from "../../Components/config";
import { formatarMoeda, lerValor } from "../Financeiro/ConfigFinanceiro";
import {
  TIPOS_INVESTIMENTO, apiMovimentacoes, numero,
  type ItemComparativo, type Investimentos as DadosInvestimentos, type LancamentoInvestimento, type TipoInvestimento,
} from "./ConfigMovimentacoes";
import { BlocoConta, SeletorAno } from "./Resumos";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };
const rotuloTipo = (t: string) => TIPOS_INVESTIMENTO.find((x) => x.valor === t);
const NOVO = "__novo__";

// produto = conta + nome (opção do formulário); id = chave da conta + nome
type Investimento = { id: string; chave: string; agencia: string; conta: string; nome: string };
type Preenchido = { investimento?: string; agencia?: string; conta?: string; tipo?: TipoInvestimento; data?: string; valor?: string; observacao?: string };

// ---------------------------------------------------------
// MODAL: NOVO LANÇAMENTO
// ---------------------------------------------------------
const ModalLancamento = ({ aberto, aoFechar, aoSalvo, investimentos, inicial }: {
  aberto: boolean; aoFechar: () => void; aoSalvo: () => void; investimentos: Investimento[]; inicial: Preenchido;
}) => {
  const toast = useToast();
  const hoje = new Date().toISOString().slice(0, 10);
  const vazio = { investimento: NOVO, agencia: "", conta: "", nome: "CDB", tipo: "SALDO" as TipoInvestimento, data: hoje, valor: "", bruto: "", imposto: "", observacao: "" };
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm({
      ...vazio,
      investimento: inicial.investimento ?? investimentos[0]?.id ?? NOVO,
      agencia: inicial.agencia ?? "", conta: inicial.conta ?? "",
      tipo: inicial.tipo ?? "SALDO", data: inicial.data ?? hoje, valor: inicial.valor ?? "", observacao: inicial.observacao ?? "",
    });
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  const novo = form.investimento === NOVO;
  const saldo = form.tipo === "SALDO";

  async function salvar() {
    const escolhido = investimentos.find((i) => i.id === form.investimento);
    const agencia = novo ? form.agencia.trim() : escolhido?.agencia ?? "";
    const conta = novo ? form.conta.trim() : escolhido?.conta ?? "";
    const nome = novo ? form.nome.trim() || "CDB" : escolhido?.nome ?? "CDB";
    const valor = lerValor(form.valor);
    const bruto = form.bruto.trim() ? lerValor(form.bruto) : null;
    const imposto = form.imposto.trim() ? lerValor(form.imposto) : null;
    if (!agencia || !conta) { toast({ title: "Informe agência e conta do investimento", status: "warning" }); return; }
    if (!Number.isFinite(valor) || valor < 0 || (!saldo && valor === 0)) { toast({ title: "Informe o valor", status: "warning" }); return; }
    if ((bruto != null && !Number.isFinite(bruto)) || (imposto != null && !Number.isFinite(imposto))) { toast({ title: "Valor bruto ou imposto inválido", status: "warning" }); return; }
    setSalvando(true);
    try {
      await apiMovimentacoes.lancarInvestimento({
        agencia, conta, nome, data: form.data, tipo: form.tipo, valor,
        valor_bruto: saldo ? bruto : null, imposto: saldo ? imposto : null, observacao: form.observacao.trim() || null,
      });
      toast({ title: "Lançamento salvo", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} isCentered size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>
          Lançamento no investimento
          <Text fontSize="sm" fontWeight="normal" color="gray.500">Copie do app do banco (Investimentos → CDB → extrato / posição detalhada).</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl gridColumn={{ sm: "span 2" }}>
              <FormLabel fontSize="sm">Investimento</FormLabel>
              <Select value={form.investimento} onChange={(e) => setForm({ ...form, investimento: e.target.value })}>
                {investimentos.map((i) => <option key={i.id} value={i.id}>{i.nome} · Ag. {i.agencia} · Conta {i.conta}</option>)}
                <option value={NOVO}>+ Novo produto / conta</option>
              </Select>
            </FormControl>
            {novo && (
              <>
                <FormControl isRequired><FormLabel fontSize="sm">Agência</FormLabel><Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} placeholder="0428" /></FormControl>
                <FormControl isRequired><FormLabel fontSize="sm">Conta</FormLabel><Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} placeholder="04645-2" /></FormControl>
                <FormControl gridColumn={{ sm: "span 2" }}><FormLabel fontSize="sm">Nome</FormLabel><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="CDB DI" /></FormControl>
              </>
            )}
            <FormControl isRequired>
              <FormLabel fontSize="sm">Tipo</FormLabel>
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoInvestimento })}>
                {TIPOS_INVESTIMENTO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
              </Select>
            </FormControl>
            <FormControl isRequired><FormLabel fontSize="sm">Data</FormLabel><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></FormControl>
            <FormControl isRequired gridColumn={saldo ? undefined : { sm: "span 2" }}>
              <FormLabel fontSize="sm">{saldo ? "Saldo líquido" : "Valor"}</FormLabel>
              <InputGroup><InputLeftAddon>R$</InputLeftAddon><Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} inputMode="decimal" placeholder="0,00" autoFocus /></InputGroup>
            </FormControl>
            {saldo && (
              <>
                <FormControl><FormLabel fontSize="sm">Saldo bruto (opcional)</FormLabel><InputGroup><InputLeftAddon>R$</InputLeftAddon><Input value={form.bruto} onChange={(e) => setForm({ ...form, bruto: e.target.value })} inputMode="decimal" /></InputGroup></FormControl>
                <FormControl><FormLabel fontSize="sm">IR + IOF (opcional)</FormLabel><InputGroup><InputLeftAddon>R$</InputLeftAddon><Input value={form.imposto} onChange={(e) => setForm({ ...form, imposto: e.target.value })} inputMode="decimal" /></InputGroup></FormControl>
              </>
            )}
            <FormControl gridColumn={{ sm: "span 2" }}><FormLabel fontSize="sm">Observação</FormLabel><Input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></FormControl>
          </SimpleGrid>
          <Text fontSize="xs" color="gray.500" marginTop={3}>
            Posição = saldo líquido que o banco mostra na data (confere o cálculo). Aplicação/Resgate = mesmo valor que saiu/entrou na conta corrente.
            Rendimento = juro do período (opcional: ao digitar a posição, a diferença já vira rendimento).
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="teal" onClick={salvar} isLoading={salvando}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ---------------------------------------------------------
// ABA
// ---------------------------------------------------------
export const Investimentos = ({ versao, aoMudar }: { versao: number; aoMudar: () => void }) => {
  const toast = useToast();
  const { editaTudo } = usePermissoes();
  const [ano, setAno] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosInvestimentos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<Preenchido | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { const d = await apiMovimentacoes.investimentos(ano); setDados(d); if (ano == null) setAno(d.ano); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar", status: "error" }); }
    finally { setCarregando(false); }
  }, [ano, toast]);
  useEffect(() => { carregar(); }, [carregar, versao]);

  const investimentos = useMemo<Investimento[]>(() => {
    const vistos = new Map<string, Investimento>();
    [...(dados?.lancamentos ?? [])].reverse().forEach((l) => {
      const id = `${l.chave}|${l.nome.trim().toUpperCase()}`;
      if (!vistos.has(id)) vistos.set(id, { id, chave: l.chave, agencia: l.agencia, conta: l.conta, nome: l.nome });
    });
    return [...vistos.values()].sort((a, b) => a.chave.localeCompare(b.chave) || a.nome.localeCompare(b.nome));
  }, [dados]);
  const porId = useMemo(() => new Map((dados?.lancamentos ?? []).map((l) => [l.id, l])), [dados]);

  const salvo = () => { carregar(); aoMudar(); };

  async function excluir(l: LancamentoInvestimento) {
    if (!window.confirm(`Excluir ${rotuloTipo(l.tipo)?.rotulo ?? l.tipo} de ${formatarDataIso(l.data)} (${formatarMoeda(numero(l.valor))})?`)) return;
    try { await apiMovimentacoes.excluirLancamentoInvestimento(l.id); salvo(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao excluir", status: "error" }); }
  }

  // lançar no CDB o que veio do extrato: mesmo valor, data e tipo; investimento da mesma conta, se houver
  function lancarDoExtrato(e: ItemComparativo) {
    const digitos = (v: string | null) => (v ?? "").replace(/\D/g, "").replace(/^0+/, "");
    const mesmaConta = investimentos.find((i) => digitos(i.conta) === digitos(e.conta) && digitos(i.agencia) === digitos(e.agencia));
    setModal({
      investimento: mesmaConta?.id ?? investimentos[0]?.id, agencia: e.agencia ?? "", conta: e.conta ?? "",
      tipo: e.tipo, data: e.data, valor: numero(e.valor).toFixed(2).replace(".", ","), observacao: e.lancamento,
    });
  }

  if (carregando && !dados) return <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>;
  if (!dados) return null;

  const doAno = (d: string) => ano == null || d.startsWith(String(ano));
  const extratoAno = dados.comparativo.extrato.filter((e) => doAno(e.data));
  const pendentes = extratoAno.filter((e) => !e.lancamento_id);
  const semExtrato = dados.comparativo.sem_extrato.map((id) => porId.get(id)).filter((l): l is LancamentoInvestimento => Boolean(l) && doAno(l!.data));
  const lancamentosAno = dados.lancamentos.filter((l) => doAno(l.data));

  return (
    <Box opacity={carregando ? 0.6 : 1}>
      <Flex justify="space-between" align="center" marginBottom={3} gap={3} wrap="wrap">
        <Box>
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">{dados.ano} – Investimentos (fundo de reserva)</Text>
          <Text fontSize="xs" color="gray.500">Digite aqui o que o app do banco mostra do CDB. O extrato da conta corrente serve para conferir.</Text>
        </Box>
        <Flex gap={2} align="center">
          <SeletorAno ano={ano} anos={dados.anos} aoMudar={setAno} />
          {editaTudo && <Button size="sm" colorScheme="teal" onClick={() => setModal({})}>+ Lançamento</Button>}
        </Flex>
      </Flex>

      {/* CARDS: total + um por investimento */}
      {dados.investimentos.length === 0 && (
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={8} textAlign="center" marginBottom={4}>
          <Text color="gray.500" fontSize="sm">Nenhum investimento lançado. Comece pela posição de cada CDB em 31/12 do ano anterior (saldo inicial).</Text>
        </Box>
      )}
      {dados.investimentos.length > 1 && dados.total && <BlocoConta conta={dados.total} fundo destaque />}
      {dados.investimentos.map((c) => {
        const inv = investimentos.find((i) => i.chave === c.chave.replace(/^CDB\|/, ""));
        return <BlocoConta key={c.chave} conta={c} fundo aoEditar={editaTudo ? () => setModal({ investimento: inv?.id, tipo: "SALDO" }) : undefined} />;
      })}

      {/* COMPARATIVO COM O EXTRATO */}
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4} marginTop={4}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.800">Comparativo com o extrato da conta</Text>
        <Text fontSize="xs" color="gray.500" marginBottom={3}>Cada aplicação/resgate da conta corrente precisa do mesmo valor lançado no CDB.</Text>
        {pendentes.length === 0 && semExtrato.length === 0
          ? <Alert status="success" borderRadius="lg" fontSize="sm"><AlertIcon />Tudo conferido{extratoAno.length ? ` (${extratoAno.length} movimentos do extrato)` : ""}.</Alert>
          : (
            <Alert status="warning" borderRadius="lg" fontSize="sm" marginBottom={3}><AlertIcon />
              {pendentes.length > 0 && `${pendentes.length} movimento(s) do extrato sem lançamento no CDB. `}
              {semExtrato.length > 0 && `${semExtrato.length} lançamento(s) no CDB sem aplicação/resgate no extrato.`}
            </Alert>
          )}
        {extratoAno.length > 0 && (
          <TableContainer marginTop={3}>
            <Table size="sm">
              <Thead><Tr><Th {...estiloTh}>Data</Th><Th {...estiloTh}>Extrato da conta</Th><Th {...estiloTh} isNumeric>Valor</Th><Th {...estiloTh}>No CDB</Th></Tr></Thead>
              <Tbody>
                {extratoAno.map((e) => {
                  const par = e.lancamento_id ? porId.get(e.lancamento_id) : null;
                  return (
                    <Tr key={e.id} bg={par ? undefined : "orange.50"}>
                      <Td fontSize="sm">{formatarDataIso(e.data)}</Td>
                      <Td fontSize="sm">
                        <Badge colorScheme={e.tipo === "APLICACAO" ? "blue" : "orange"} variant="subtle" textTransform="none" marginRight={2}>{e.tipo === "APLICACAO" ? "Aplicação" : "Resgate"}</Badge>
                        {e.lancamento}<Text as="span" color="gray.400" fontSize="xs"> · Conta {e.conta}</Text>
                      </Td>
                      <Td fontSize="sm" isNumeric>{formatarMoeda(numero(e.valor))}</Td>
                      <Td fontSize="sm">
                        {par
                          ? <Text color="green.700">✓ {par.nome} ({formatarDataIso(par.data)})</Text>
                          : editaTudo ? <Button size="xs" colorScheme="orange" onClick={() => lancarDoExtrato(e)}>Lançar no CDB</Button> : <Text color="orange.600">Falta lançar</Text>}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
        {semExtrato.length > 0 && (
          <Box marginTop={3}>
            <Text fontSize="xs" fontWeight="semibold" color="orange.700" marginBottom={1}>Lançados no CDB sem movimento no extrato (confira valor e data):</Text>
            {semExtrato.map((l) => <Text key={l.id} fontSize="sm">{formatarDataIso(l.data)} · {rotuloTipo(l.tipo)?.rotulo} · {l.nome} · {formatarMoeda(numero(l.valor))}</Text>)}
          </Box>
        )}
      </Box>

      {/* LANÇAMENTOS DIGITADOS */}
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4} marginTop={4}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.800" marginBottom={2}>Lançamentos digitados ({dados.ano})</Text>
        {lancamentosAno.length === 0 ? <Text fontSize="sm" color="gray.500">Nenhum lançamento neste ano.</Text> : (
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th {...estiloTh}>Data</Th><Th {...estiloTh}>Investimento</Th><Th {...estiloTh}>Tipo</Th><Th {...estiloTh} isNumeric>Valor</Th><Th {...estiloTh}>Obs.</Th>{editaTudo && <Th />}</Tr></Thead>
              <Tbody>
                {lancamentosAno.map((l) => {
                  const t = rotuloTipo(l.tipo);
                  return (
                    <Tr key={l.id}>
                      <Td fontSize="sm">{formatarDataIso(l.data)}</Td>
                      <Td fontSize="sm">{l.nome}<Text as="span" color="gray.400" fontSize="xs"> · Ag. {l.agencia} · Conta {l.conta}</Text></Td>
                      <Td><Badge colorScheme={t?.cor} variant="subtle" textTransform="none">{t?.rotulo ?? l.tipo}</Badge></Td>
                      <Td fontSize="sm" isNumeric fontWeight="semibold">
                        {formatarMoeda(numero(l.valor))}
                        {l.tipo === "SALDO" && (l.valor_bruto || l.imposto) && (
                          <Text fontSize="2xs" color="gray.500" fontWeight="normal">
                            {l.valor_bruto && `bruto ${formatarMoeda(numero(l.valor_bruto))}`}{l.valor_bruto && l.imposto && " · "}{l.imposto && `IR/IOF ${formatarMoeda(numero(l.imposto))}`}
                          </Text>
                        )}
                      </Td>
                      <Td fontSize="xs" color="gray.500" maxWidth="220px" whiteSpace="normal">{l.observacao}</Td>
                      {editaTudo && <Td><Button size="xs" variant="ghost" colorScheme="red" onClick={() => excluir(l)}>Excluir</Button></Td>}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Text fontSize="xs" color="gray.500" marginTop={3}>
        Um card por conta: a posição da conta numa data é a soma das posições dos CDBs dela digitadas nessa data (lance todos os produtos do print na mesma data).
        Saldo = última posição + aplicações + rendimentos − resgates depois dela. ✓ no saldo acumulado = mês com posição digitada (igual ao banco).
        Todo mês: lance a aplicação/resgate (ou use "Lançar no CDB" no comparativo) e a posição do fim do mês.
      </Text>

      <ModalLancamento aberto={Boolean(modal)} aoFechar={() => setModal(null)} aoSalvo={salvo} investimentos={investimentos} inicial={modal ?? {}} />
    </Box>
  );
};
