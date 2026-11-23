// ---------------------------------------------------------
// TAXAS EXTRAS (síndico/ADM)
// ---------------------------------------------------------
// Taxas cobradas junto com a cota do mês e rateadas pela fração
// ideal: ex. "Fundo de obras" em 12 parcelas, "13º salário"
// contínua. Na cota aparece "FUNDO DE OBRAS 10/12".
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Checkbox, Flex, FormControl, FormHelperText, FormLabel, Icon, IconButton, Input, InputGroup, InputLeftAddon,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, SimpleGrid, Spinner, Stack, Text, Tooltip, useToast,
} from "@chakra-ui/react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  ROTULOS_SITUACAO_TAXA, apiFinanceiro, formatarCompetencia, formatarMoeda, lerValor, mesAtual, valorParaTexto,
  type TaxaExtra,
} from "./ConfigFinanceiro";

type Form = { descricao: string; valor: string; parcelas: string; continua: boolean; inicio: string; ativo: boolean };
const VAZIO: Form = { descricao: "", valor: "", parcelas: "12", continua: false, inicio: mesAtual(), ativo: true };

export const ModalTaxasExtras = ({ aberto, aoFechar, podeEditar }: { aberto: boolean; aoFechar: () => void; podeEditar: boolean }) => {
  const toast = useToast();
  const [taxas, setTaxas] = useState<TaxaExtra[] | null>(null);
  const [editando, setEditando] = useState<TaxaExtra | "nova" | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error" }), [toast]);
  const carregar = useCallback(async () => {
    try { setTaxas(await apiFinanceiro.taxas()); } catch (e) { erro(e, "Erro ao carregar as taxas"); setTaxas([]); }
  }, [erro]);

  useEffect(() => { if (aberto) { setEditando(null); carregar(); } }, [aberto, carregar]);

  function abrir(t: TaxaExtra | "nova") {
    setEditando(t);
    setForm(t === "nova" ? VAZIO : {
      descricao: t.descricao, valor: valorParaTexto(Number(t.valor_mensal)), parcelas: t.parcelas ? String(t.parcelas) : "12",
      continua: !t.parcelas, inicio: t.inicio.slice(0, 7), ativo: t.ativo,
    });
  }

  async function salvar() {
    const valor = lerValor(form.valor);
    const parcelas = form.continua ? null : Number(form.parcelas);
    if (form.descricao.trim().length < 2) { toast({ title: "Informe a descrição", status: "warning" }); return; }
    if (!(valor > 0)) { toast({ title: "Informe o valor por mês", status: "warning" }); return; }
    if (parcelas !== null && !(Number.isInteger(parcelas) && parcelas > 0)) { toast({ title: "Número de parcelas inválido", status: "warning" }); return; }
    if (!form.inicio) { toast({ title: "Informe o mês da 1ª parcela", status: "warning" }); return; }
    const dados = { descricao: form.descricao.trim(), valor_mensal: valor, parcelas, inicio: form.inicio, ativo: form.ativo };
    setSalvando(true);
    try {
      if (editando && editando !== "nova") await apiFinanceiro.editarTaxa(editando.id, dados);
      else await apiFinanceiro.criarTaxa(dados);
      toast({ title: "Taxa salva", status: "success", duration: 2000 });
      setEditando(null);
      await carregar();
    } catch (e) { erro(e, "Erro ao salvar"); }
    finally { setSalvando(false); }
  }

  async function excluir(t: TaxaExtra) {
    if (!window.confirm(`Excluir a taxa "${t.descricao}"? As cotas já geradas não mudam.`)) return;
    try { await apiFinanceiro.excluirTaxa(t.id); await carregar(); } catch (e) { erro(e, "Erro ao excluir"); }
  }

  const ultimaParcela = (t: TaxaExtra) => {
    if (!t.parcelas) return null;
    const [ano, mes] = t.inicio.split("-").map(Number);
    const total = ano * 12 + (mes - 1) + t.parcelas - 1;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  };

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" marginX={4}>
        <ModalHeader>Taxas extras</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.500" marginBottom={4}>
            Cobradas junto com a cota do mês. Cada unidade paga o valor do mês x a sua fração ideal.
          </Text>

          {editando ? (
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Descrição (aparece no recibo)</FormLabel>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Fundo de obras" maxLength={100} />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Valor total por mês</FormLabel>
                  <InputGroup>
                    <InputLeftAddon>R$</InputLeftAddon>
                    <Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value.replace(/[^\d.,]/g, "") })} inputMode="decimal" placeholder="0,00" />
                  </InputGroup>
                  <FormHelperText fontSize="xs">Valor do condomínio todo; o sistema divide pela fração.</FormHelperText>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Mês da 1ª parcela</FormLabel>
                  <Input type="month" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Parcelas</FormLabel>
                  <Input type="number" min={1} value={form.parcelas} isDisabled={form.continua} onChange={(e) => setForm({ ...form, parcelas: e.target.value })} />
                  <Checkbox marginTop={2} size="sm" isChecked={form.continua} onChange={(e) => setForm({ ...form, continua: e.target.checked })}>Contínua (sem fim)</Checkbox>
                </FormControl>
                {editando !== "nova" && (
                  <FormControl>
                    <FormLabel fontSize="sm">Situação</FormLabel>
                    <Checkbox isChecked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })}>Ativa</Checkbox>
                  </FormControl>
                )}
              </SimpleGrid>
            </Stack>
          ) : !taxas ? (
            <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>
          ) : taxas.length === 0 ? (
            <Text color="gray.500" fontSize="sm" textAlign="center" paddingY={8}>Nenhuma taxa extra cadastrada.</Text>
          ) : (
            <Stack spacing={2}>
              {taxas.map((t) => {
                const sit = ROTULOS_SITUACAO_TAXA[t.situacao];
                const fim = ultimaParcela(t);
                return (
                  <Flex key={t.id} border="1px solid" borderColor="gray.100" borderRadius="lg" paddingX={4} paddingY={3} align="center" gap={3} wrap="wrap" opacity={t.ativo ? 1 : 0.6}>
                    <Box flex={1} minWidth="200px">
                      <Flex align="center" gap={2} wrap="wrap">
                        <Text fontWeight="semibold" fontSize="sm">{t.descricao}</Text>
                        <Badge colorScheme={sit.cor} variant="subtle" textTransform="none">{sit.rotulo}</Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">
                        {formatarMoeda(Number(t.valor_mensal))}/mês · {t.parcelas ? `${t.parcelas} parcelas` : "contínua"} · de {formatarCompetencia(t.inicio)}{fim ? ` a ${formatarCompetencia(fim)}` : ""}
                        {t.parcela_atual ? ` · este mês: ${t.parcelas ? `${t.parcela_atual}/${t.parcelas}` : "cobrada"}` : ""}
                      </Text>
                    </Box>
                    {podeEditar && (
                      <Flex>
                        <Tooltip label="Editar"><IconButton aria-label="Editar" size="xs" variant="ghost" colorScheme="blue" icon={<Icon as={Pencil} boxSize={4} />} onClick={() => abrir(t)} /></Tooltip>
                        <Tooltip label="Excluir"><IconButton aria-label="Excluir" size="xs" variant="ghost" colorScheme="red" icon={<Icon as={Trash2} boxSize={4} />} onClick={() => excluir(t)} /></Tooltip>
                      </Flex>
                    )}
                  </Flex>
                );
              })}
            </Stack>
          )}
        </ModalBody>
        <ModalFooter gap={2}>
          {editando ? (
            <>
              <Button variant="ghost" onClick={() => setEditando(null)}>Voltar</Button>
              <Button colorScheme="blue" isLoading={salvando} onClick={salvar}>Salvar</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={aoFechar}>Fechar</Button>
              {podeEditar && <Button colorScheme="blue" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={() => abrir("nova")}>Nova taxa</Button>}
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
