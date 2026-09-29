// ---------------------------------------------------------
// FINANCEIRO (cotas condominiais)
// ---------------------------------------------------------
// Síndico/ADM: configura, gera as cotas do mês, lança cotas
//              extras e dá baixa nos pagamentos.
// Conselheiro: vê tudo.
// Morador:     vê só as cotas das próprias unidades.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Flex, Icon, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Spinner, Text, useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, RepeatIcon, SearchIcon, SettingsIcon } from "@chakra-ui/icons";
import { Wallet } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { apiApartamentos } from "../Apartamentos/API";
import type { ApartamentoResumo } from "../Apartamentos/ConfigApartamentos";
import {
  apiFinanceiro, formatarCompetencia, formatarMoeda, mesAtual,
  type Configuracao, type Cota, type CotaCriar, type CotaEditar, type Pagamento, type SituacaoCota,
} from "./ConfigFinanceiro";
import { ModalConfiguracao, ModalCota, ModalGerarCotas, ModalPagamento } from "./ModaisFinanceiro";
import { TabelaCotas, type AcaoCota } from "./TabelaCotas";

type FiltroSituacao = "TODAS" | SituacaoCota;

const Indicador = ({ rotulo, valor, detalhe, cor }: { rotulo: string; valor: string; detalhe?: string; cor?: string }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Text fontSize="xs" fontWeight="medium" color="gray.500">{rotulo}</Text>
    <Text marginTop={1} fontSize="xl" fontWeight="semibold" color={cor ?? "gray.800"}>{valor}</Text>
    {detalhe && <Text fontSize="xs" color="gray.500">{detalhe}</Text>}
  </Box>
);

const soma = (lista: Cota[], campo: (cota: Cota) => number | null) => lista.reduce((total, cota) => total + (campo(cota) ?? 0), 0);

export const Financeiro = () => {
  const toast = useToast();
  const permissoes = usePermissoes();
  const modalConfig = useDisclosure();
  const modalGerar = useDisclosure();
  const modalCota = useDisclosure();
  const modalPagamento = useDisclosure();

  // quem vê tudo abre no mês atual; o morador vê todo o histórico da unidade
  const [competencia, setCompetencia] = useState(permissoes.veFinanceiroTudo ? mesAtual() : "");
  const [cotas, setCotas] = useState<Cota[]>([]);
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [apartamentos, setApartamentos] = useState<ApartamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<FiltroSituacao>("TODAS");
  const [cotaSelecionada, setCotaSelecionada] = useState<Cota | null>(null);

  const erro = useCallback((e: unknown, padrao: string) => {
    toast({ title: e instanceof Error ? e.message : padrao, status: "error" });
  }, [toast]);

  const carregarCotas = useCallback(async () => {
    try {
      setCotas(await apiFinanceiro.listar({ competencia: competencia || undefined }));
    } catch (e) {
      erro(e, "Erro ao carregar as cotas");
    } finally {
      setCarregando(false);
    }
  }, [competencia, erro]);

  useEffect(() => { carregarCotas(); }, [carregarCotas]);

  useEffect(() => {
    apiFinanceiro.configuracao().then(setConfiguracao).catch((e) => erro(e, "Erro ao carregar a configuração"));
    if (permissoes.editaTudo) apiApartamentos.listar().then(setApartamentos).catch((e) => erro(e, "Erro ao carregar os apartamentos"));
  }, [permissoes.editaTudo, erro]);

  // AÇÕES
  async function executar(acao: () => Promise<unknown>, sucesso: string, fechar?: () => void) {
    try {
      await acao();
      toast({ title: sucesso, status: "success", duration: 2000 });
      fechar?.();
      await carregarCotas();
    } catch (e) {
      erro(e, "Não foi possível concluir a ação");
    }
  }

  function aoAcao(acao: AcaoCota, cota: Cota) {
    const nome = `${cota.apartamento_rotulo} · ${formatarCompetencia(cota.competencia)}`;
    switch (acao) {
      case "PAGAR": setCotaSelecionada(cota); modalPagamento.onOpen(); break;
      case "EDITAR": setCotaSelecionada(cota); modalCota.onOpen(); break;
      case "CANCELAR": if (window.confirm(`Cancelar a cota ${nome}?`)) executar(() => apiFinanceiro.cancelar(cota.id), "Cota cancelada"); break;
      case "ESTORNAR": if (window.confirm(`Estornar o pagamento da cota ${nome}? Ela volta a ficar em aberto.`)) executar(() => apiFinanceiro.estornar(cota.id), "Pagamento estornado"); break;
      case "REABRIR": executar(() => apiFinanceiro.reabrir(cota.id), "Cota reaberta"); break;
      case "EXCLUIR": if (window.confirm(`Excluir a cota ${nome}?`)) executar(() => apiFinanceiro.excluir(cota.id), "Cota excluída"); break;
    }
  }

  function novaCota() {
    setCotaSelecionada(null);
    modalCota.onOpen();
  }

  const salvarConfiguracao = (dados: Configuracao) =>
    executar(async () => setConfiguracao(await apiFinanceiro.salvarConfiguracao(dados)), "Configuração salva", modalConfig.onClose);

  const gerarCotas = async (dados: { competencia: string; valor: number | null; dia_vencimento: number | null }) => {
    try {
      const resultado = await apiFinanceiro.gerar(dados);
      toast({
        title: `${resultado.criadas} cota(s) criada(s)`,
        description: resultado.ja_existiam ? `${resultado.ja_existiam} apartamento(s) já tinham a cota do mês.` : undefined,
        status: resultado.criadas ? "success" : "info",
      });
      modalGerar.onClose();
      if (dados.competencia !== competencia) setCompetencia(dados.competencia);
      else await carregarCotas();
    } catch (e) {
      erro(e, "Erro ao gerar as cotas");
    }
  };

  const criarCota = (dados: CotaCriar) => executar(() => apiFinanceiro.criar(dados), "Cota lançada", modalCota.onClose);
  const editarCota = (id: string, dados: CotaEditar) => executar(() => apiFinanceiro.editar(id, dados), "Cota atualizada", modalCota.onClose);
  const pagarCota = (id: string, dados: Pagamento) => executar(() => apiFinanceiro.pagar(id, dados), "Pagamento registrado", modalPagamento.onClose);

  // RESUMO (sem as canceladas)
  const validas = cotas.filter((c) => c.status !== "CANCELADA");
  const pagas = validas.filter((c) => c.status === "PAGA");
  const abertas = validas.filter((c) => c.status === "ABERTA");
  const atrasadas = validas.filter((c) => c.situacao === "ATRASADA");
  const inadimplencia = validas.length ? Math.round((atrasadas.length / validas.length) * 100) : 0;

  // FILTROS
  const termo = busca.trim().toLowerCase();
  const filtradas = cotas.filter((c) => {
    if (situacao !== "TODAS" && c.situacao !== situacao) return false;
    if (!termo) return true;
    return [c.apartamento_rotulo, c.responsavel, c.descricao].some((texto) => (texto ?? "").toLowerCase().includes(termo));
  });

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Financeiro</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>
              {permissoes.veFinanceiroTudo ? "Cotas condominiais de todas as unidades." : "Cotas condominiais da sua unidade."}
            </Text>
            {configuracao && (
              <Text fontSize="xs" color="gray.400" marginTop={1}>
                Cota padrão {configuracao.valor_cota ? formatarMoeda(configuracao.valor_cota) : "não definida"} · vence dia {configuracao.dia_vencimento}
                {" "}· multa {configuracao.multa_percentual}% · juros {configuracao.juros_mensal}% ao mês
              </Text>
            )}
          </Box>
          {permissoes.editaTudo && (
            <Flex gap={2} wrap="wrap">
              <Button variant="outline" borderRadius="lg" leftIcon={<SettingsIcon boxSize={3} />} onClick={modalConfig.onOpen}>Configurar</Button>
              <Button variant="outline" borderRadius="lg" leftIcon={<RepeatIcon boxSize={3} />} onClick={modalGerar.onOpen}>Gerar cotas do mês</Button>
              <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={novaCota}>Lançar cota</Button>
            </Flex>
          )}
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
          <Indicador rotulo="Previsto" valor={formatarMoeda(soma(validas, (c) => c.valor))} detalhe={`${validas.length} cota(s)`} />
          <Indicador rotulo="Recebido" valor={formatarMoeda(soma(pagas, (c) => c.valor_pago))} detalhe={`${pagas.length} paga(s)`} cor="green.600" />
          <Indicador rotulo="Em aberto" valor={formatarMoeda(soma(abertas, (c) => c.valor))} detalhe={`${abertas.length} cota(s)`} cor="yellow.600" />
          <Indicador rotulo="Atrasado (com encargos)" valor={formatarMoeda(soma(atrasadas, (c) => c.valor_atualizado))} detalhe={`${atrasadas.length} cota(s) · inadimplência ${inadimplencia}%`} cor="red.600" />
        </SimpleGrid>

        <Flex gap={3} marginBottom={5} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
          <Flex gap={2} align="center">
            <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} bg="white" borderRadius="lg" maxWidth="200px" />
            <Button size="sm" variant={competencia ? "ghost" : "solid"} colorScheme={competencia ? "gray" : "blue"} onClick={() => setCompetencia("")}>Todos os meses</Button>
          </Flex>
          <Select maxWidth={{ md: "200px" }} bg="white" borderRadius="lg" value={situacao} onChange={(e) => setSituacao(e.target.value as FiltroSituacao)}>
            <option value="TODAS">Todas as situações</option>
            <option value="ABERTA">Em aberto</option>
            <option value="ATRASADA">Atrasadas</option>
            <option value="PAGA">Pagas</option>
            <option value="CANCELADA">Canceladas</option>
          </Select>
          <InputGroup maxWidth={{ md: "320px" }}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por unidade, responsável ou descrição" bg="white" borderRadius="lg" />
          </InputGroup>
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : cotas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <Icon as={Wallet} boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">
              Nenhuma cota {competencia ? `em ${formatarCompetencia(competencia)}` : "lançada"}
            </Text>
            {permissoes.editaTudo && <Button marginTop={5} size="sm" colorScheme="blue" leftIcon={<RepeatIcon />} onClick={modalGerar.onOpen}>Gerar cotas do mês</Button>}
          </Flex>
        ) : filtradas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <SearchIcon color="gray.300" boxSize={6} />
            <Text marginTop={3}>Nenhuma cota encontrada</Text>
            <Button marginTop={4} size="sm" onClick={() => { setBusca(""); setSituacao("TODAS"); }}>Limpar filtros</Button>
          </Flex>
        ) : (
          <TabelaCotas cotas={filtradas} aoAcao={permissoes.editaTudo ? aoAcao : undefined} />
        )}

        {permissoes.editaTudo && (
          <>
            <ModalConfiguracao aberto={modalConfig.isOpen} aoFechar={modalConfig.onClose} configuracao={configuracao} aoSalvar={salvarConfiguracao} />
            <ModalGerarCotas aberto={modalGerar.isOpen} aoFechar={modalGerar.onClose} configuracao={configuracao} competenciaInicial={competencia} aoGerar={gerarCotas} />
            <ModalCota aberto={modalCota.isOpen} aoFechar={modalCota.onClose} cota={cotaSelecionada} apartamentos={apartamentos}
              configuracao={configuracao} competenciaInicial={competencia} aoCriar={criarCota} aoEditar={editarCota} />
            <ModalPagamento aberto={modalPagamento.isOpen} aoFechar={modalPagamento.onClose} cota={cotaSelecionada} aoPagar={pagarCota} />
          </>
        )}
      </Box>
    </Flex>
  );
};
