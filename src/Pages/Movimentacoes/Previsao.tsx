// ---------------------------------------------------------
// MOVIMENTAÇÕES – ABA PREVISÃO (próximos 6 meses)
// ---------------------------------------------------------
// Base: entradas e saídas FIXAS dos últimos 12 meses de extrato
// (as que se repetem na maioria dos meses; valor típico = mediana).
// Gastos EVENTUAIS ficam de fora por padrão (não se repetem); dá para
// incluir a média deles na tela, para uma previsão mais cautelosa.
// "Disponível para reformas" = quanto dá para gastar sem que o
// disponível previsto fique abaixo da reserva mínima em nenhum mês.
// Fundo de reserva: aplicação no CDB só muda o dinheiro de lugar; com o
// fundo contado como disponível ela não aparece (não muda o total).
// LANÇAMENTOS FUTUROS: parcelas combinadas que ainda não estão no extrato
// (ex.: 3x R$ 1.200 para a K1 via PIX); entram no mês da data.
// ---------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, AlertIcon, Badge, Box, Button, Checkbox, Flex, FormControl, FormHelperText, FormLabel, Input, InputGroup, InputLeftAddon, Select, SimpleGrid,
  Spinner, Switch, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast,
} from "@chakra-ui/react";
import { usePermissoes } from "../../Components/permissoes";

import { formatarDataIso } from "../../Components/config";
import { formatarMoeda, lerValor, valorParaTexto } from "../Financeiro/ConfigFinanceiro";
import {
  apiMovimentacoes, nomeConta, nomeMes, numero, type ContaFluxo, type Futuro, type Previsao as DadosPrevisao, type TipoMovimentacao,
} from "./ConfigMovimentacoes";

const CONFIANCA = {
  BAIXA: { rotulo: "Confiança baixa", cor: "orange", texto: "Pouco histórico (menos de 3 meses). Envie mais extratos para a previsão ficar confiável." },
  MEDIA: { rotulo: "Confiança média", cor: "yellow", texto: "Histórico de 3 a 5 meses." },
  ALTA: { rotulo: "Confiança alta", cor: "green", texto: "Histórico de 6 meses ou mais." },
};

const Cartao = ({ rotulo, valor, detalhe, destaque, cor }: { rotulo: string; valor: number; detalhe?: string; destaque?: boolean; cor?: string }) => (
  <Box bg={destaque ? "green.600" : "white"} color={destaque ? "white" : undefined} border="1px solid" borderColor={destaque ? "green.600" : "gray.100"} borderRadius="xl" padding={4}>
    <Text fontSize="xs" opacity={destaque ? 0.9 : 1} color={destaque ? undefined : "gray.500"}>{rotulo}</Text>
    <Text fontSize={destaque ? "2xl" : "xl"} fontWeight="bold" color={destaque ? undefined : cor ?? (valor < 0 ? "red.600" : "gray.800")}>{formatarMoeda(valor)}</Text>
    {detalhe && <Text fontSize="2xs" opacity={0.85} color={destaque ? undefined : "gray.500"}>{detalhe}</Text>}
  </Box>
);

// ---------------------------------------------------------
// LANÇAMENTOS FUTUROS (formulário + lista)
// ---------------------------------------------------------
const LancamentosFuturos = ({ aoMudar, versao }: { aoMudar: () => void; versao: number }) => {
  const toast = useToast();
  const { editaTudo } = usePermissoes();
  const hoje = new Date().toISOString().slice(0, 10);
  const vazio = { descricao: "", favorecido: "", tipo: "SAIDA" as TipoMovimentacao, valor: "", parcelas: "1", data: hoje };
  const [form, setForm] = useState(vazio);
  const [lista, setLista] = useState<Futuro[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => { apiMovimentacoes.futuros().then(setLista).catch(() => setLista([])); }, []);
  useEffect(() => { carregar(); }, [carregar, versao]);

  async function salvar() {
    const valor = lerValor(form.valor);
    const parcelas = Number(form.parcelas);
    if (!form.descricao.trim()) { toast({ title: "Informe a descrição", status: "warning" }); return; }
    if (!Number.isFinite(valor) || valor <= 0) { toast({ title: "Informe o valor da parcela", status: "warning" }); return; }
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 60) { toast({ title: "Parcelas: de 1 a 60", status: "warning" }); return; }
    setSalvando(true);
    try {
      await apiMovimentacoes.criarFuturo({ descricao: form.descricao.trim(), favorecido: form.favorecido.trim() || null, tipo: form.tipo, valor_parcela: valor, parcelas, primeira_data: form.data });
      toast({ title: parcelas > 1 ? `${parcelas} parcelas lançadas` : "Lançamento salvo", status: "success", duration: 2000 });
      setForm(vazio);
      carregar();
      aoMudar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  async function excluir(f: Futuro) {
    const todas = f.total_parcelas > 1 && window.confirm(`Excluir TODAS as ${f.total_parcelas} parcelas de "${f.descricao}"?\n\nOK = todas · Cancelar = escolher só esta`);
    if (!todas && !window.confirm(`Excluir só a parcela ${f.parcela}/${f.total_parcelas} de ${formatarDataIso(f.data)}?`)) return;
    try { await apiMovimentacoes.excluirFuturo(f.id, todas); carregar(); aoMudar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao excluir", status: "error" }); }
  }

  const valorParcela = lerValor(form.valor);
  const total = Number.isFinite(valorParcela) ? valorParcela * (Number(form.parcelas) || 0) : 0;

  return (
    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={4} marginBottom={5}>
      <Text fontSize="sm" fontWeight="semibold" color="gray.700">Lançamentos futuros</Text>
      <Text fontSize="xs" color="gray.500" marginBottom={3}>Pagamentos ou recebimentos já combinados que ainda não estão no extrato (ex.: parcelas via PIX). Entram na previsão no mês de cada parcela.</Text>
      {editaTudo && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 7 }} spacing={2} alignItems="end" marginBottom={3}>
          <FormControl gridColumn={{ lg: "span 2" }}><FormLabel fontSize="xs">Descrição</FormLabel><Input size="sm" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Reforma da fachada" /></FormControl>
          <FormControl><FormLabel fontSize="xs">Favorecido</FormLabel><Input size="sm" value={form.favorecido} onChange={(e) => setForm({ ...form, favorecido: e.target.value })} placeholder="Empresa K1" /></FormControl>
          <FormControl><FormLabel fontSize="xs">Tipo</FormLabel>
            <Select size="sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoMovimentacao })}><option value="SAIDA">Saída</option><option value="ENTRADA">Entrada</option></Select>
          </FormControl>
          <FormControl><FormLabel fontSize="xs">Valor da parcela</FormLabel><InputGroup size="sm"><InputLeftAddon>R$</InputLeftAddon><Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} inputMode="decimal" placeholder="1.200,00" /></InputGroup></FormControl>
          <FormControl><FormLabel fontSize="xs">Parcelas</FormLabel><Input size="sm" type="number" min={1} max={60} value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })} /></FormControl>
          <FormControl><FormLabel fontSize="xs">1ª parcela em</FormLabel><Input size="sm" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></FormControl>
          <Flex gridColumn={{ sm: "span 2", lg: "span 7" }} justify="space-between" align="center" gap={3}>
            <Text fontSize="xs" color="gray.500">{total > 0 && Number(form.parcelas) > 1 ? `Total: ${formatarMoeda(total)} (uma parcela por mês)` : ""}</Text>
            <Button size="sm" colorScheme="blue" onClick={salvar} isLoading={salvando}>Adicionar</Button>
          </Flex>
        </SimpleGrid>
      )}
      {lista.length === 0 ? <Text fontSize="sm" color="gray.400">Nenhum lançamento futuro.</Text> : (
        <TableContainer>
          <Table size="sm">
            <Thead><Tr>
              <Th textTransform="none" fontSize="xs" color="gray.500">Data</Th><Th textTransform="none" fontSize="xs" color="gray.500">Descrição</Th>
              <Th textTransform="none" fontSize="xs" color="gray.500">Parcela</Th><Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Valor</Th>
              <Th textTransform="none" fontSize="xs" color="gray.500">Situação</Th>{editaTudo && <Th />}
            </Tr></Thead>
            <Tbody>
              {lista.map((f) => (
                <Tr key={f.id} opacity={f.na_previsao ? 1 : 0.5}>
                  <Td fontSize="sm">{formatarDataIso(f.data)}</Td>
                  <Td fontSize="sm" whiteSpace="normal">{f.descricao}{f.favorecido && <Text as="span" fontSize="xs" color="gray.500"> · {f.favorecido}</Text>}</Td>
                  <Td fontSize="sm">{f.total_parcelas > 1 ? `${f.parcela}/${f.total_parcelas}` : "única"}</Td>
                  <Td isNumeric fontSize="sm" fontWeight="semibold" color={f.tipo === "SAIDA" ? "red.600" : "green.600"}>{formatarMoeda(numero(f.valor) * (f.tipo === "SAIDA" ? -1 : 1))}</Td>
                  <Td fontSize="xs">{f.na_previsao ? <Badge colorScheme="blue" variant="subtle" textTransform="none">Na previsão</Badge> : <Text color="gray.500">Já passou (deve estar no extrato)</Text>}</Td>
                  {editaTudo && <Td><Button size="xs" variant="ghost" colorScheme="red" onClick={() => excluir(f)}>Excluir</Button></Td>}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export const Previsao = ({ versao }: { versao: number }) => {
  const toast = useToast();
  const [contasDisponiveis, setContasDisponiveis] = useState<ContaFluxo[]>([]);
  const [contas, setContas] = useState<string[] | null>(null);   // null = ainda carregando a lista
  const [dados, setDados] = useState<DadosPrevisao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [comEventuais, setComEventuais] = useState(false); // padrão: só fixos (eventual não se repete)
  const [reservaTexto, setReservaTexto] = useState<string | null>(null);  // null = usar o padrão
  const [usarFundo, setUsarFundo] = useState(true); // o fundo de reserva conta como dinheiro disponível
  const [recarga, setRecarga] = useState(0);         // muda quando um lançamento futuro é salvo/excluído

  // contas disponíveis (do fluxo de caixa)
  useEffect(() => {
    apiMovimentacoes.fluxo(null).then((f) => {
      setContasDisponiveis(f.contas);
      setContas((atual) => atual ?? f.contas.map((c) => c.chave));
    }).catch(() => setContas([]));
  }, [versao]);

  useEffect(() => {
    if (contas == null) return;
    setCarregando(true);
    apiMovimentacoes.previsao(contas).then(setDados)
      .catch((e) => toast({ title: e instanceof Error ? e.message : "Erro ao calcular", status: "error" }))
      .finally(() => setCarregando(false));
  }, [contas, versao, recarga, toast]);

  const fixosSaida = useMemo(() => (dados?.fixos ?? []).filter((f) => f.tipo === "SAIDA"), [dados]);
  const fixosEntrada = useMemo(() => (dados?.fixos ?? []).filter((f) => f.tipo === "ENTRADA"), [dados]);

  if (carregando && !dados) return <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>;
  if (!dados || dados.meses.length === 0) {
    return <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={10} textAlign="center"><Text color="gray.500" fontSize="sm">Envie pelo menos um extrato para ver a previsão.</Text></Box>;
  }

  const primeiro = dados.meses[0];
  const saidasFixas = numero(primeiro.saidas_fixas);
  const entradasFixas = numero(primeiro.entradas_fixas);
  const eventuais = numero(primeiro.saidas_eventuais);
  const resultadoMensal = entradasFixas + saidasFixas + (comEventuais ? eventuais : 0); // aplicação no fundo não é gasto
  const reservaPadrao = Math.abs(saidasFixas + (comEventuais ? eventuais : 0)); // 1 mês de gastos
  const reservaDigitada = reservaTexto == null ? reservaPadrao : lerValor(reservaTexto);
  const reserva = Number.isFinite(reservaDigitada) ? reservaDigitada : 0;
  const fundoAtual = numero(dados.fundo_atual);
  const saldosConta = dados.meses.map((m) => numero(comEventuais ? m.saldo_previsto : m.saldo_sem_eventuais));
  const saldosFundo = dados.meses.map((m) => numero(m.saldo_fundo));
  // disponível = conta (+ fundo, se marcado)
  const saldos = saldosConta.map((s, i) => s + (usarFundo ? saldosFundo[i] : 0));
  const disponivelHoje = numero(dados.saldo_atual) + (usarFundo ? fundoAtual : 0);
  const saldoFinal = saldos[saldos.length - 1];
  const temFuturos = dados.meses.some((m) => numero(m.futuros_entradas) || numero(m.futuros_saidas));
  const menorSaldo = Math.min(disponivelHoje, ...saldos);
  const disponivel = Math.max(0, menorSaldo - reserva);
  const conf = CONFIANCA[dados.confianca];

  function alternarConta(chave: string) {
    setContas((atual) => {
      const lista = atual ?? [];
      const nova = lista.includes(chave) ? lista.filter((c) => c !== chave) : [...lista, chave];
      return nova.length ? nova : lista; // ao menos uma conta
    });
  }

  return (
    <Box opacity={carregando ? 0.6 : 1}>
      <Alert status={dados.confianca === "ALTA" ? "info" : "warning"} borderRadius="lg" marginBottom={4} fontSize="sm">
        <AlertIcon />
        <Box>
          <Text>
            Base: {dados.base_inicio && nomeMes(dados.base_inicio)}{dados.base_fim !== dados.base_inicio && dados.base_fim && ` a ${nomeMes(dados.base_fim)}`} ({dados.meses_analisados} mês(es) com extrato).
            {" "}<Badge colorScheme={conf.cor} textTransform="none">{conf.rotulo}</Badge>
          </Text>
          <Text fontSize="xs">{conf.texto}</Text>
        </Box>
      </Alert>

      {/* AJUSTES */}
      <Flex gap={6} wrap="wrap" align="flex-end" marginBottom={5} bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
        <FormControl maxWidth="240px">
          <FormLabel fontSize="sm">Reserva mínima no caixa</FormLabel>
          <InputGroup size="sm">
            <InputLeftAddon>R$</InputLeftAddon>
            <Input bg="white" value={reservaTexto ?? valorParaTexto(reservaPadrao)} onChange={(e) => setReservaTexto(e.target.value)} inputMode="decimal" />
          </InputGroup>
          <FormHelperText fontSize="2xs">Padrão: 1 mês de gastos. O saldo nunca deve ficar abaixo disso.</FormHelperText>
        </FormControl>
        <FormControl display="flex" alignItems="center" gap={2} width="auto">
          <Switch colorScheme="teal" isChecked={usarFundo} onChange={(e) => setUsarFundo(e.target.checked)} />
          <FormLabel fontSize="sm" margin={0}>Contar o fundo de reserva como disponível ({formatarMoeda(fundoAtual)})</FormLabel>
        </FormControl>
        <FormControl display="flex" alignItems="center" gap={2} width="auto">
          <Switch isChecked={comEventuais} onChange={(e) => setComEventuais(e.target.checked)} />
          <FormLabel fontSize="sm" margin={0}>Incluir média de gastos eventuais ({formatarMoeda(eventuais)}/mês) – previsão mais cautelosa</FormLabel>
        </FormControl>
        {contasDisponiveis.length > 1 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" marginBottom={1}>Contas consideradas</Text>
            <Flex gap={4} wrap="wrap">
              {contasDisponiveis.map((c) => (
                <Checkbox key={c.chave} size="sm" isChecked={contas?.includes(c.chave)} onChange={() => alternarConta(c.chave)}>
                  {c.titular ? `${c.titular} · ` : ""}{nomeConta(c)}
                </Checkbox>
              ))}
            </Flex>
            <Text fontSize="2xs" color="gray.500">Desmarque contas que não podem ser usadas (ex.: fundo de reserva).</Text>
          </Box>
        )}
      </Flex>

      {/* RESUMO */}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 5 }} spacing={3} marginBottom={5}>
        <Cartao rotulo={`Saldo em conta${dados.saldo_em ? ` (${formatarDataIso(dados.saldo_em)})` : ""}`} valor={numero(dados.saldo_atual)} />
        <Cartao rotulo="Fundo de reserva" valor={fundoAtual} cor="teal.700" detalhe={usarFundo ? "contado no disponível" : "fora do disponível"} />
        <Cartao rotulo="Resultado fixo por mês" valor={resultadoMensal} detalhe={`Entradas ${formatarMoeda(entradasFixas)} · Saídas ${formatarMoeda(saidasFixas + (comEventuais ? eventuais : 0))}${temFuturos ? " · sem os futuros" : ""}`} />
        <Cartao rotulo={`Disponível previsto em ${nomeMes(dados.meses[dados.meses.length - 1].mes)}`} valor={saldoFinal} detalhe={usarFundo ? "conta + fundo de reserva" : "só saldo em conta"} />
        <Cartao destaque rotulo="Disponível para reformas e gastos" valor={disponivel}
          detalhe={disponivel > 0 ? `Pode ser gasto já, mantendo a reserva de ${formatarMoeda(reserva)} em todos os meses` : "Sem folga: o saldo previsto não passa da reserva mínima"} />
      </SimpleGrid>

      {/* MÊS A MÊS */}
      <Text fontSize="sm" fontWeight="semibold" color="gray.700" marginBottom={2}>Próximos 6 meses</Text>
      <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden" marginBottom={5}>
        <TableContainer>
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th textTransform="none" fontSize="xs" color="gray.500">Mês</Th>
                <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Entradas fixas</Th>
                <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Saídas fixas</Th>
                {comEventuais && <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Eventuais (média)</Th>}
                {temFuturos && <Th isNumeric textTransform="none" fontSize="xs" color="purple.600">Lançamentos futuros</Th>}
                <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Resultado</Th>
                <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Disponível{usarFundo ? " (conta + fundo)" : " (conta)"}</Th>
                <Th isNumeric textTransform="none" fontSize="xs" color="gray.500">Folga sobre a reserva</Th>
              </Tr>
            </Thead>
            <Tbody>
              {dados.meses.map((m, i) => {
                const folga = saldos[i] - reserva;
                const futurosMes = numero(m.futuros_entradas) + numero(m.futuros_saidas);
                const resultado = saldos[i] - (i === 0 ? disponivelHoje : saldos[i - 1]); // variação do disponível no mês
                return (
                  <Tr key={m.mes}>
                    <Td fontSize="sm" textTransform="capitalize">{nomeMes(m.mes)}</Td>
                    <Td isNumeric fontSize="sm" color="green.600">{formatarMoeda(numero(m.entradas_fixas))}</Td>
                    <Td isNumeric fontSize="sm" color="red.600">{formatarMoeda(numero(m.saidas_fixas))}</Td>
                    {comEventuais && <Td isNumeric fontSize="sm" color="red.500">{formatarMoeda(numero(m.saidas_eventuais))}</Td>}
                    {temFuturos && <Td isNumeric fontSize="sm" color={futurosMes < 0 ? "purple.600" : futurosMes > 0 ? "green.600" : "gray.400"}>{formatarMoeda(futurosMes)}</Td>}
                    <Td isNumeric fontSize="sm" color={resultado < 0 ? "red.600" : "gray.800"}>{formatarMoeda(resultado)}</Td>
                    <Td isNumeric fontSize="sm" fontWeight="semibold">{formatarMoeda(saldos[i])}</Td>
                    <Td isNumeric fontSize="sm" color={folga < 0 ? "red.600" : "green.700"}>{formatarMoeda(folga)}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <LancamentosFuturos versao={versao} aoMudar={() => setRecarga((r) => r + 1)} />

      {/* O QUE ENTROU NA CONTA */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        {[{ titulo: "Saídas fixas consideradas", lista: fixosSaida, cor: "red.600" }, { titulo: "Entradas fixas consideradas", lista: fixosEntrada, cor: "green.600" }].map((bloco) => (
          <Box key={bloco.titulo} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
            <Text fontSize="sm" fontWeight="semibold" color="gray.700" paddingX={4} paddingY={3} borderBottom="1px solid" borderColor="gray.100">{bloco.titulo} ({bloco.lista.length})</Text>
            <TableContainer>
              <Table size="sm">
                <Tbody>
                  {bloco.lista.length === 0 && <Tr><Td fontSize="sm" color="gray.400">Nenhum</Td></Tr>}
                  {bloco.lista.map((f) => (
                    <Tr key={f.nome}>
                      <Td fontSize="sm" whiteSpace="normal">{f.nome}</Td>
                      <Td fontSize="xs" color="gray.500">{f.meses_presente} de {dados.meses_analisados} meses</Td>
                      <Td isNumeric fontSize="sm" color={bloco.cor} fontWeight="semibold">{formatarMoeda(numero(f.valor_mensal))}/mês</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </SimpleGrid>

      {dados.eventuais_maiores.length > 0 && (
        <Box marginTop={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={4}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" marginBottom={2}>Maiores gastos eventuais no período (não se repetem)</Text>
          {dados.eventuais_maiores.map((f) => (
            <Flex key={f.nome} justify="space-between" fontSize="sm" gap={3} paddingY={1}>
              <Text noOfLines={1}>{f.nome} <Text as="span" fontSize="xs" color="gray.500">· {formatarDataIso(f.ultima_data)}</Text></Text>
              <Text color="red.600" flexShrink={0}>{formatarMoeda(numero(f.ultimo_valor))}</Text>
            </Flex>
          ))}
        </Box>
      )}

      <Text fontSize="xs" color="gray.500" marginTop={4}>
        Fixo = aparece na maioria dos meses analisados (valor típico do mês). Aplicações no CDB não são gasto: só mudam o dinheiro de lugar (com o fundo contado, não alteram o disponível; sem ele, reduzem a conta). Gastos e entradas eventuais (que não se repetem) ficam fora da previsão;
        a reserva mínima serve de proteção para imprevistos.
        É uma estimativa: inadimplência, reajustes e despesas novas mudam o resultado.
      </Text>
    </Box>
  );
};
