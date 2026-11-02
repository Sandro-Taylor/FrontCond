import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, FormControl, FormLabel, Icon, IconButton, Input, InputGroup, InputLeftAddon, Modal, ModalBody, ModalCloseButton, ModalContent,
          ModalFooter, ModalHeader, ModalOverlay, SimpleGrid, Spinner, Table, TableContainer, Tbody, Td, Text, Textarea, Tfoot, Th, Thead, Tooltip, Tr, 
          useToast,} from "@chakra-ui/react";
import { Pencil, Trash2 } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { formatarMoeda, lerValor } from "../Financeiro/ConfigFinanceiro";
import { apiPrestadores, type DadosPrestador, type ListaPrestadores, type Prestador } from "../Manutencoes/ConfigManutencoes";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };
type Form = Record<"empresa" | "setor" | "pessoa" | "cnpj" | "telefone" | "observacoes" | "custo", string>;
const VAZIO: Form = { empresa: "", setor: "", pessoa: "", cnpj: "", telefone: "", observacoes: "", custo: "" };

const ModalPrestador = ({ aberto, item, aoFechar, aoSalvo }: { aberto: boolean; item: Prestador | null; aoFechar: () => void; aoSalvo: () => void}) => {
  const toast = useToast();
  const [form, setForm] = useState<Form>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm(item ? {
      empresa: item.empresa, setor: item.setor ?? "", pessoa: item.pessoa ?? "", cnpj: item.cnpj ?? "", telefone: item.telefone ?? "",
      observacoes: item.observacoes ?? "",
      custo: item.custo != null ? Number(item.custo).toFixed(2).replace(".", ",") : "",
    } : VAZIO);
  }, [aberto, item]);

  async function salvar() {
    if (!form.empresa.trim()) { toast({ title: "Informe a empresa", status: "warning" }); return; }
    const custo = form.custo.trim() ? lerValor(form.custo) : null;
    if (custo != null && (!Number.isFinite(custo) || custo < 0)) { toast({ title: "Custo inválido", status: "warning" }); return; }
    const dados: DadosPrestador = {
      empresa: form.empresa.trim(), setor: form.setor || null, pessoa: form.pessoa || null, cnpj: form.cnpj || null, telefone: form.telefone || null,
      custo, observacoes: form.observacoes || null,
    };
    setSalvando(true);
    try {
      if (item) await apiPrestadores.editar(item.id, dados); else await apiPrestadores.criar(dados);
      toast({ title: "Salvo", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  const campo = (nome: keyof Form, rotulo: string, placeholder?: string) => (
    <FormControl isRequired={nome === "empresa"}>
      <FormLabel fontSize="sm">{rotulo}</FormLabel>
      <Input value={form[nome]} onChange={(e) => setForm({ ...form, [nome]: e.target.value })} placeholder={placeholder} />
    </FormControl>
  );

  return (
    <Modal isOpen={aberto} onClose={aoFechar} isCentered size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>{item ? "Editar prestador" : "Novo prestador"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            {campo("empresa", "Empresa", "RS Elevadores")}
            {campo("setor", "Setor", "Elevadores")}
            {campo("pessoa", "Pessoa (contato)")}
            {campo("cnpj", "CNPJ", "00.000.000/0000-00")}
            {campo("telefone", "Telefone", "11 99999-9999")}
            <FormControl>
              <FormLabel fontSize="sm">Custo mensal</FormLabel>
              <InputGroup><InputLeftAddon>R$</InputLeftAddon><Input value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} inputMode="decimal" placeholder="0,00" /></InputGroup>
            </FormControl>
            <FormControl gridColumn={{ sm: "span 2" }}><FormLabel fontSize="sm">Observações</FormLabel><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></FormControl>
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

export const Prestadores = () => {
  const toast = useToast();
  const { editaTudo } = usePermissoes();
  const [dados, setDados] = useState<ListaPrestadores | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<{ item: Prestador | null } | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { setDados(await apiPrestadores.listar()); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar", status: "error" }); }
    finally { setCarregando(false); }
  }, [toast]);
  useEffect(() => { carregar(); }, [carregar]);

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => (dados?.itens ?? []).filter((p) =>
    !termo || [p.empresa, p.setor, p.pessoa, p.cnpj, p.telefone, p.observacoes].some((t) => (t ?? "").toLowerCase().includes(termo))), [dados, termo]);
  const custoFiltrado = filtrados.reduce((s, p) => s + Number(p.custo ?? 0), 0);

  async function excluir(p: Prestador) {
    if (!window.confirm(`Excluir "${p.empresa}${p.pessoa ? ` – ${p.pessoa}` : ""}"?`)) return;
    try { await apiPrestadores.excluir(p.id); carregar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao excluir", status: "error" }); }
  }

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={5}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Prestadores</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Funcionários, fornecedores e prestadores de serviço do condomínio.</Text>
          </Box>
          {editaTudo && <Button colorScheme="blue" borderRadius="lg" onClick={() => setModal({ item: null })}>+ Novo prestador</Button>}
        </Flex>

        {carregando && !dados ? <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex> : dados && (
          <>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} marginBottom={4} maxWidth="560px">
              <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
                <Text fontSize="xs" color="gray.500">Cadastrados</Text>
                <Text fontSize="xl" fontWeight="semibold">{dados.itens.length}</Text>
              </Box>
              <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
                <Text fontSize="xs" color="gray.500">Custo mensal total</Text>
                <Text fontSize="xl" fontWeight="semibold" color="red.600">{formatarMoeda(Number(dados.custo_mensal))}</Text>
              </Box>
            </SimpleGrid>
            <Flex gap={3} wrap="wrap" marginBottom={3}>
              <Input bg="white" size="sm" maxWidth="300px" placeholder="Buscar empresa, setor, pessoa..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </Flex>
            <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
              <TableContainer>
                <Table size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th {...estiloTh}>Setor</Th><Th {...estiloTh}>Empresa</Th><Th {...estiloTh}>Pessoa</Th><Th {...estiloTh}>CNPJ</Th>
                      <Th {...estiloTh}>Telefone</Th><Th {...estiloTh} isNumeric>Custo</Th><Th {...estiloTh}>Observações</Th>
                      {editaTudo && <Th />}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filtrados.map((p) => (
                      <Tr key={p.id} _hover={{ bg: "gray.50" }} onDoubleClick={() => editaTudo && setModal({ item: p })} cursor={editaTudo ? "pointer" : undefined}>
                        <Td fontSize="sm" fontWeight="medium" whiteSpace="normal" minWidth="160px">{p.setor ?? "—"}</Td>
                        <Td fontSize="sm" whiteSpace="normal">{p.empresa ?? "—"}</Td>
                        <Td fontSize="sm" whiteSpace="normal" minWidth="160px">{p.pessoa ?? "—"}</Td>
                        <Td fontSize="sm">{p.cnpj ?? "—"}</Td>
                        <Td fontSize="sm">{p.telefone ?? "—"}</Td>
                        <Td fontSize="sm" isNumeric>{p.custo != null ? formatarMoeda(Number(p.custo)) : "—"}</Td>
                        <Td fontSize="xs" color="gray.600" whiteSpace="normal" minWidth="200px">{p.observacoes ?? ""}</Td>
                        {editaTudo && (
                          <Td>
                            <Flex gap={1}>
                              <Tooltip label="Editar"><IconButton aria-label="Editar" size="xs" variant="ghost" colorScheme="blue" icon={<Icon as={Pencil} boxSize={4} />} onClick={() => setModal({ item: p })} /></Tooltip>
                              <Tooltip label="Excluir"><IconButton aria-label="Excluir" size="xs" variant="ghost" colorScheme="red" icon={<Icon as={Trash2} boxSize={4} />} onClick={() => excluir(p)} /></Tooltip>
                            </Flex>
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot bg="gray.50">
                    <Tr>
                      <Td colSpan={5} fontSize="sm" fontWeight="semibold">Total ({filtrados.length})</Td>
                      <Td isNumeric fontSize="sm" fontWeight="bold">{formatarMoeda(custoFiltrado)}</Td>
                      <Td />
                      {editaTudo && <Td />}
                    </Tr>
                  </Tfoot>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Box>
      <ModalPrestador aberto={Boolean(modal)} item={modal?.item ?? null} aoFechar={() => setModal(null)} aoSalvo={carregar} />
    </Flex>
  );
};
