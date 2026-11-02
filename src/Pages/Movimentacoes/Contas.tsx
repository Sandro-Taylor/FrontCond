// ---------------------------------------------------------
// MOVIMENTAÇÕES – ABA CONTAS (contas correntes do condomínio)
// ---------------------------------------------------------
// Uma conta aparece aqui quando vem num extrato ou quando a gestão
// cadastra um saldo para ela (tabela saldos_informados).
// Saldo inicial (+ ajustes) -> soma com os lançamentos do extrato.
// CDB / investimentos: aba Investimentos (Investimentos.tsx).
// ---------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, SimpleGrid, Spinner, Text, useToast } from "@chakra-ui/react";

import { usePermissoes } from "../../Components/permissoes";
import { formatarDataIso } from "../../Components/config";
import { formatarMoeda } from "../Financeiro/ConfigFinanceiro";
import { apiMovimentacoes, numero, type ContaFluxo, type SaldoInformado } from "./ConfigMovimentacoes";
import { ModalSaldo } from "./Resumos";

const chave = (agencia: string | null, conta: string | null) =>
  `${(agencia ?? "").replace(/\D/g, "").replace(/^0+/, "")}|${(conta ?? "").replace(/\D/g, "").replace(/^0+/, "")}`;

type Conta = { chave: string; agencia: string; conta: string; extrato: ContaFluxo | null; saldos: SaldoInformado[] };

const Linha = ({ s, aoExcluir, rotulo }: { s: SaldoInformado; aoExcluir?: () => void; rotulo?: string }) => (
  <Flex justify="space-between" align="center" fontSize="sm" paddingY={1} gap={2}>
    <Text color="gray.600">{formatarDataIso(s.data)}{rotulo && <Text as="span" color="gray.400"> · {rotulo}</Text>}{s.descricao && <Text as="span" color="gray.400"> · {s.descricao}</Text>}</Text>
    <Flex align="center" gap={1}>
      <Text fontWeight="semibold">{formatarMoeda(numero(s.valor))}</Text>
      {aoExcluir && <Button size="xs" variant="ghost" colorScheme="red" onClick={aoExcluir}>Excluir</Button>}
    </Flex>
  </Flex>
);

export const Contas = ({ versao, aoMudar }: { versao: number; aoMudar: () => void }) => {
  const toast = useToast();
  const { editaTudo } = usePermissoes();
  const [informados, setInformados] = useState<SaldoInformado[]>([]);
  const [doExtrato, setDoExtrato] = useState<ContaFluxo[]>([]);
  const [fundoAtual, setFundoAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<{ conta?: Conta } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [r, f] = await Promise.all([apiMovimentacoes.saldosInformados(), apiMovimentacoes.fluxo(null).catch(() => null)]);
      setInformados(r.itens);
      setFundoAtual(numero(r.fundo_atual));
      setDoExtrato(f?.contas ?? []);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar as contas", status: "error" }); }
    finally { setCarregando(false); }
  }, [toast]);
  useEffect(() => { carregar(); }, [carregar, versao]);

  const contas = useMemo(() => {
    const mapa = new Map<string, Conta>();
    const pegar = (agencia: string, conta: string) => {
      const k = chave(agencia, conta);
      if (!mapa.has(k)) mapa.set(k, { chave: k, agencia, conta, extrato: null, saldos: [] });
      return mapa.get(k)!;
    };
    doExtrato.forEach((c) => { if (c.agencia && c.conta) pegar(c.agencia, c.conta).extrato = c; });
    // mais antigo primeiro: o primeiro saldo da conta é o saldo inicial
    [...informados].filter((s) => s.tipo === "CONTA").sort((a, b) => a.data.localeCompare(b.data)).forEach((s) => pegar(s.agencia, s.conta).saldos.push(s));
    return [...mapa.values()];
  }, [doExtrato, informados]);

  async function excluir(s: SaldoInformado) {
    if (!window.confirm(`Excluir o valor de ${formatarDataIso(s.data)} (${formatarMoeda(numero(s.valor))})?`)) return;
    try { await apiMovimentacoes.excluirSaldo(s.id); await carregar(); aoMudar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao excluir", status: "error" }); }
  }

  if (carregando && contas.length === 0) return <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>;

  return (
    <Box>
      <Flex justify="space-between" align="center" gap={3} wrap="wrap" marginBottom={4}>
        <Box>
          <Text fontSize="sm" color="gray.600">Contas correntes do condomínio. Fundo de reserva (CDB) hoje: <b>{formatarMoeda(fundoAtual)}</b> (aba Investimentos)</Text>
          <Text fontSize="xs" color="gray.500">O saldo inicial é lido no app do banco e digitado aqui; o resto vem dos extratos.</Text>
        </Box>
        {editaTudo && (
          <Flex gap={2}>
            <Button size="sm" colorScheme="blue" onClick={() => setModal({})}>+ Nova conta corrente</Button>
          </Flex>
        )}
      </Flex>

      {contas.length === 0 && <Text fontSize="sm" color="gray.500" padding={6}>Nenhuma conta ainda. Envie um extrato ou cadastre uma conta.</Text>}

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        {contas.map((c) => {
          const inicial = c.saldos[0];
          return (
            <Box key={c.chave} bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
              <Flex justify="space-between" align="flex-start" gap={2} marginBottom={2}>
                <Box>
                  <Text fontWeight="semibold" color="gray.800">Ag. {c.agencia} · Conta {c.conta}</Text>
                  {c.extrato?.titular && <Text fontSize="xs" color="gray.500">{c.extrato.titular}</Text>}
                </Box>
                <Badge colorScheme={c.extrato ? "blue" : "gray"} variant="subtle" textTransform="none">{c.extrato ? "Com extrato" : "Sem extrato"}</Badge>
              </Flex>
              <Box borderTop="1px solid" borderColor="gray.100" paddingTop={2}>
                {c.extrato?.saldo_atual != null && (
                  <Flex justify="space-between" fontSize="sm" marginBottom={1}>
                    <Text color="gray.500">Saldo atual{c.extrato.saldo_em && ` (${formatarDataIso(c.extrato.saldo_em)})`}</Text>
                    <Text fontWeight="bold">{formatarMoeda(numero(c.extrato.saldo_atual))}</Text>
                  </Flex>
                )}
                {inicial
                  ? c.saldos.map((s, i) => <Linha key={s.id} s={s} rotulo={i === 0 ? "Saldo inicial" : "Ajuste"} aoExcluir={editaTudo ? () => excluir(s) : undefined} />)
                  : <Text fontSize="xs" color="orange.600" paddingY={1}>Saldo inicial não informado: a conta começa em zero.</Text>}
                {editaTudo && <Button size="xs" variant="link" colorScheme="blue" onClick={() => setModal({ conta: c })}>{inicial ? "Informar outro saldo" : "Informar saldo inicial"}</Button>}
              </Box>
            </Box>
          );
        })}
      </SimpleGrid>

      <Text fontSize="xs" color="gray.500" marginTop={4}>
        Saldo da conta = saldo inicial + lançamentos do extrato depois da data. Um "Ajuste" (outro saldo numa data) passa a valer a partir dele.
      </Text>

      <ModalSaldo tipo="CONTA" aberto={Boolean(modal)} aoFechar={() => setModal(null)} aoSalvo={() => { carregar(); aoMudar(); }}
        sugestoes={modal?.conta ? [{ agencia: modal.conta.agencia, conta: modal.conta.conta }] : []} />
    </Box>
  );
};
