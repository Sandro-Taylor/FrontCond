// ---------------------------------------------------------
// FRAÇÃO IDEAL
// ---------------------------------------------------------
// Quanto (%) cada apartamento representa no condomínio (rateio),
// com o nome do relatório da administradora ("Relatório de Unidades -
// Conferência de Frações"). Os dados ficam no apartamento e aparecem
// também na página dele.
// Vê: ADM, síndico e conselheiro. Edita: ADM e síndico.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Alert, AlertIcon, Box, Button, Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, SimpleGrid, Spinner, Table, TableContainer, Tbody, Td, Text, Tfoot, Th, Thead, Tr, useToast,
} from "@chakra-ui/react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { chamarApi } from "../../Components/config";

type Campos = { fracao_ideal: string | null; fracao_garagem: string | null; fracao_extra: string | null; nome_cobranca: string | null };
type Unidade = Campos & { apartamento_id: string; bloco: string; numero: string; proprietarios: string[] };
type Dados = { itens: Unidade[]; total_fracao: string; total_garagem: string; total_extra: string; sem_fracao: number };

const api = {
  listar: () => chamarApi<Dados>("/fracoes", "GET", "Não foi possível carregar as frações."),
  salvar: (id: string, dados: Record<string, unknown>) => chamarApi<Unidade>(`/fracoes/${id}`, "PUT", "Não foi possível salvar.", dados),
};

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };

// fração com 6 casas, como no relatório (6,210000)
export const formatarFracao = (v: string | number | null | undefined) =>
  v == null || v === "" ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 6 });
const numeroTexto = (t: string) => { const limpo = t.trim().replace(",", "."); return limpo === "" ? null : Number(limpo); };
const unidadeRotulo = (u: Unidade) => `${u.bloco ? `Bloco ${u.bloco} · ` : ""}Apto ${u.numero}`;

const ModalEditar = ({ unidade, aoFechar, aoSalvo }: { unidade: Unidade | null; aoFechar: () => void; aoSalvo: () => void }) => {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!unidade) return;
    setForm({
      fracao_ideal: unidade.fracao_ideal ? formatarFracao(unidade.fracao_ideal).replace(/\./g, "") : "",
      fracao_garagem: unidade.fracao_garagem ? formatarFracao(unidade.fracao_garagem).replace(/\./g, "") : "",
      fracao_extra: unidade.fracao_extra ? formatarFracao(unidade.fracao_extra).replace(/\./g, "") : "",
      nome_cobranca: unidade.nome_cobranca ?? "",
    });
  }, [unidade]);

  async function salvar() {
    if (!unidade) return;
    const fracoes = ["fracao_ideal", "fracao_garagem", "fracao_extra"].map((c) => numeroTexto(form[c] ?? ""));
    if (fracoes.some((f) => f != null && (!Number.isFinite(f) || f < 0 || f > 100))) { toast({ title: "Fração: número entre 0 e 100 (ex.: 6,21)", status: "warning" }); return; }
    setSalvando(true);
    try {
      await api.salvar(unidade.apartamento_id, {
        nome_cobranca: form.nome_cobranca || null, fracao_ideal: fracoes[0], fracao_garagem: fracoes[1], fracao_extra: fracoes[2],
      });
      toast({ title: "Salvo", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  const campo = (nome: string, rotulo: string, extra?: { placeholder?: string; span?: boolean }) => (
    <FormControl gridColumn={extra?.span ? { sm: "span 3" } : undefined}>
      <FormLabel fontSize="sm">{rotulo}</FormLabel>
      <Input value={form[nome] ?? ""} onChange={(e) => setForm({ ...form, [nome]: e.target.value })} placeholder={extra?.placeholder} />
    </FormControl>
  );

  return (
    <Modal isOpen={Boolean(unidade)} onClose={aoFechar} isCentered size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Fração ideal · {unidade && unidadeRotulo(unidade)}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            {campo("fracao_ideal", "Fração da unidade (%)", { placeholder: "6,210000" })}
            {campo("fracao_garagem", "Fração garagem (%)")}
            {campo("fracao_extra", "Fração extra (%)")}
            {campo("nome_cobranca", "Nome (relatório da administradora)", { span: true })}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const FracaoIdeal = () => {
  const toast = useToast();
  const { editaTudo } = usePermissoes();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Unidade | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { setDados(await api.listar()); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar", status: "error" }); }
    finally { setCarregando(false); }
  }, [toast]);
  useEffect(() => { carregar(); }, [carregar]);

  const total = dados ? Number(dados.total_fracao) : 0;
  const fecha = Math.abs(total - 100) < 0.000001;

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Box marginBottom={5}>
          <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Fração ideal</Text>
          <Text fontSize="sm" color="gray.500" marginTop={1}>Participação de cada unidade no rateio das despesas.</Text>
        </Box>

        {carregando && !dados ? <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex> : dados && (
          <>
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} marginBottom={4}>
              <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
                <Text fontSize="xs" color="gray.500">Total das frações</Text>
                <Text fontSize="xl" fontWeight="semibold" color={fecha ? "green.700" : "orange.600"}>{formatarFracao(total)}%</Text>
              </Box>
              <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
                <Text fontSize="xs" color="gray.500">Unidades</Text>
                <Text fontSize="xl" fontWeight="semibold">{dados.itens.length}</Text>
              </Box>
              <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
                <Text fontSize="xs" color="gray.500">Sem fração informada</Text>
                <Text fontSize="xl" fontWeight="semibold" color={dados.sem_fracao ? "orange.600" : "gray.800"}>{dados.sem_fracao}</Text>
              </Box>
            </SimpleGrid>

            {!fecha && (
              <Alert status="warning" borderRadius="lg" marginBottom={4} fontSize="sm"><AlertIcon />A soma das frações deve dar 100%. Hoje dá {formatarFracao(total)}%.</Alert>
            )}

            <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
              <TableContainer>
                <Table size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th {...estiloTh}>Apartamento</Th><Th {...estiloTh}>Nome</Th>
                      <Th {...estiloTh} isNumeric>Fr. unidade</Th><Th {...estiloTh} isNumeric>Fr. garagem</Th><Th {...estiloTh} isNumeric>Fr. extra</Th>
                      {editaTudo && <Th />}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dados.itens.map((u) => (
                      <Tr key={u.apartamento_id}>
                        <Td fontSize="sm" fontWeight="semibold">{u.numero}{u.bloco && <Text as="span" fontSize="xs" color="gray.500"> · Bl. {u.bloco}</Text>}</Td>
                        <Td fontSize="sm" whiteSpace="normal" minWidth="200px">
                          {u.nome_cobranca ?? <Text as="span" color="gray.400">—</Text>}
                          {u.proprietarios.length > 0 && <Text fontSize="2xs" color="gray.500">Sistema: {u.proprietarios.join(", ")}</Text>}
                        </Td>
                        <Td fontSize="sm" isNumeric fontWeight="semibold" color={u.fracao_ideal ? "gray.800" : "orange.500"}>{formatarFracao(u.fracao_ideal)}</Td>
                        <Td fontSize="sm" isNumeric>{formatarFracao(u.fracao_garagem)}</Td>
                        <Td fontSize="sm" isNumeric>{formatarFracao(u.fracao_extra)}</Td>
                        {editaTudo && <Td><Button size="xs" variant="ghost" colorScheme="blue" onClick={() => setEditando(u)}>Editar</Button></Td>}
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot bg="gray.50">
                    <Tr>
                      <Td colSpan={2} fontSize="sm" fontWeight="semibold">Totais ({dados.itens.length} unidades)</Td>
                      <Td isNumeric fontSize="sm" fontWeight="bold" color={fecha ? "green.700" : "orange.600"}>{formatarFracao(dados.total_fracao)}</Td>
                      <Td isNumeric fontSize="sm">{formatarFracao(dados.total_garagem)}</Td>
                      <Td isNumeric fontSize="sm">{formatarFracao(dados.total_extra)}</Td>
                      {editaTudo && <Td />}
                    </Tr>
                  </Tfoot>
                </Table>
              </TableContainer>
            </Box>
            <Text fontSize="xs" color="gray.500" marginTop={3}>Nome = como está no relatório da administradora. "Sistema" = proprietário cadastrado no apartamento, para conferir.</Text>
          </>
        )}
      </Box>
      <ModalEditar unidade={editando} aoFechar={() => setEditando(null)} aoSalvo={carregar} />
    </Flex>
  );
};
