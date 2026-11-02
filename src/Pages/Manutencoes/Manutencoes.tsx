import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Input, InputGroup, InputRightAddon, Menu, MenuButton, MenuItem, MenuList,
        Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner,
        Tab, TabList, TabPanel, TabPanels, Table, TableContainer, Tabs, Tbody, Td, Text, Textarea, Th, Thead, Tr, useToast, IconButton, Icon,} from "@chakra-ui/react";
import { EllipsisVertical } from "lucide-react";
import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { formatarDataIso } from "../../Components/config";
import { STATUS, apiManutencoes, apiPrestadores, hojeIso, type DadosManutencao, type ListaManutencoes, type Manutencao, type Prestador} from "./ConfigManutencoes";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };
const data = (v: string | null) => (v ? formatarDataIso(v) : "—");
const dias = (n: number | null) => (n == null ? "—" : n < 0 ? `${-n} dia(s) atrasado` : n === 0 ? "hoje" : `${n} dia(s)`);
const PERIODICIDADES: [string, number][] = [["Mensal", 1], ["Trimestral", 3], ["Semestral", 6], ["Anual", 12], ["A cada 2 anos", 24], ["A cada 3 anos", 36], ["A cada 5 anos", 60],];
const QuemFaz = ({ m, vazio = "—" }: { m: Manutencao; vazio?: string }) => (
  m.empresa || m.responsavel ? (
    <Box fontSize="xs" lineHeight="short">
      {m.empresa && <Text><Text as="span" color="gray.500">Empresa:</Text> {m.empresa}</Text>}
      {m.responsavel && <Text><Text as="span" color="gray.500">Responsável:</Text> {m.responsavel}</Text>}
    </Box>
  ) : <Text fontSize="sm" color="gray.400">{vazio}</Text>
);

const SelecaoStatus = ({ m }: { m: Manutencao }) => <Badge colorScheme={STATUS[m.status].cor} variant="subtle" textTransform="none">{STATUS[m.status].rotulo}</Badge>;

// ---------------------------------------------------------
// MODAL: CRIAR / EDITAR (todos os campos da planilha)
// ---------------------------------------------------------
const VAZIO: DadosManutencao = {categoria: "", item: "", prestador_id: null, periodicidade: null, intervalo_meses: null, base_legal: null, ultima_execucao: null, observacoes: null};
const ModalManutencao = ({ aberto, item, categorias, prestadores, aoFechar, aoSalvo }: { aberto: boolean; item: Manutencao | null; categorias: string[]; prestadores: Prestador[]; aoFechar: () => void; aoSalvo: () => void}) => {
  const toast = useToast();
  const [form, setForm] = useState<DadosManutencao>(VAZIO);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    setForm(item ? {
      categoria: item.categoria, item: item.item, prestador_id: item.prestador_id, periodicidade: item.periodicidade, intervalo_meses: item.intervalo_meses,
      base_legal: item.base_legal, ultima_execucao: item.ultima_execucao, observacoes: item.observacoes,
    } : VAZIO);
  }, [aberto, item]);
  const set = (campo: keyof DadosManutencao, valor: string) => setForm({ ...form, [campo]: valor === "" ? null : valor } as DadosManutencao);
  async function salvar() {
    if (!form.categoria?.trim() || !form.item?.trim()) { toast({ title: "Informe a categoria e o item", status: "warning" }); return; }
    if (form.intervalo_meses != null && (!Number.isInteger(Number(form.intervalo_meses)) || Number(form.intervalo_meses) < 1)) {
      toast({ title: "Intervalo: número de meses (ex.: 12)", status: "warning" }); return;
    }
    setSalvando(true);
    try {
      const dados = { ...form, intervalo_meses: form.intervalo_meses == null ? null : Number(form.intervalo_meses) };
      if (item) await apiManutencoes.editar(item.id, dados); else await apiManutencoes.criar(dados);
      toast({ title: "Salvo", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} isCentered size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>{item ? "Editar manutenção" : "Nova manutenção"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Categoria</FormLabel>
              <Input list="categorias-manutencao" value={form.categoria ?? ""} onChange={(e) => set("categoria", e.target.value)} placeholder="Incêndio e segurança" />
              <datalist id="categorias-manutencao">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
            </FormControl>
            <FormControl isRequired><FormLabel fontSize="sm">Item / Serviço</FormLabel><Input value={form.item ?? ""} onChange={(e) => set("item", e.target.value)} /></FormControl>
            <FormControl gridColumn={{ sm: "span 2" }}>
              <FormLabel fontSize="sm">Empresa / responsável</FormLabel>
              <Select value={form.prestador_id ?? ""} onChange={(e) => set("prestador_id", e.target.value)}>
                <option value="">— Nenhum —</option>
                {prestadores.map((p) => <option key={p.id} value={p.id}>{p.empresa}{p.pessoa && p.pessoa.toUpperCase() !== p.empresa.toUpperCase() ? ` – ${p.pessoa}` : ""}{p.setor ? ` (${p.setor})` : ""}</option>)}
              </Select>
              <Text fontSize="2xs" color="gray.500" marginTop={1}>Lista do cadastro de Prestadores. Não está na lista? Cadastre em Prestadores.</Text>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Periodicidade</FormLabel>
              <Input list="periodicidades" value={form.periodicidade ?? ""} placeholder="Anual"
                onChange={(e) => {
                  const p = PERIODICIDADES.find(([nome]) => nome === e.target.value);
                  setForm({ ...form, periodicidade: e.target.value || null, intervalo_meses: p ? p[1] : form.intervalo_meses });
                }} />
              <datalist id="periodicidades">{PERIODICIDADES.map(([n]) => <option key={n} value={n} />)}</datalist>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Intervalo</FormLabel>
              <InputGroup><Input type="number" min={1} value={form.intervalo_meses ?? ""} onChange={(e) => set("intervalo_meses", e.target.value)} /><InputRightAddon>meses</InputRightAddon></InputGroup>
            </FormControl>
            <FormControl><FormLabel fontSize="sm">Última execução</FormLabel><Input type="date" value={form.ultima_execucao ?? ""} onChange={(e) => set("ultima_execucao", e.target.value)} /></FormControl>
            <FormControl><FormLabel fontSize="sm">Base legal / norma</FormLabel><Input value={form.base_legal ?? ""} onChange={(e) => set("base_legal", e.target.value)} /></FormControl>
            <FormControl gridColumn={{ sm: "span 2" }}><FormLabel fontSize="sm">Observações</FormLabel><Textarea rows={2} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} /></FormControl>
          </SimpleGrid>
          <Text fontSize="xs" color="gray.500" marginTop={3}>Próximo vencimento, dias restantes e status são calculados: última execução + intervalo.</Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ---------------------------------------------------------
// PÁGINA
// ---------------------------------------------------------
export const Manutencoes = () => {
  const toast = useToast();
  const { editaTudo } = usePermissoes();
  const [dados, setDados] = useState<ListaManutencoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<{ item: Manutencao | null } | null>(null);
  const [filtro, setFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [alertaTexto, setAlertaTexto] = useState("");
  const [aba, setAba] = useState(0);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const carregar = useCallback(async () => {
    setCarregando(true);
    try { const d = await apiManutencoes.listar(); setDados(d); setAlertaTexto(String(d.alerta_dias)); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar", status: "error" }); }
    finally { setCarregando(false); }
  },[toast]);
  useEffect(() => { carregar(); }, [carregar]);
  // lista para o formulário (só quem edita vê prestadores)
  useEffect(() => { if (editaTudo) apiPrestadores.listar().then((d) => setPrestadores(d.itens)).catch(() => setPrestadores([])); }, [editaTudo, modal]);
  const categorias = useMemo(() => [...new Set((dados?.itens ?? []).map((m) => m.categoria))], [dados]);
  const alertas = useMemo(() => (dados?.itens ?? []).filter((m) => m.status === "VENCIDO" || m.status === "EM_BREVE") .sort((a, b) => (a.dias_restantes ?? 0) - (b.dias_restantes ?? 0)), [dados]);
  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => (dados?.itens ?? []).filter((m) =>
    (!filtro || m.status === filtro) && (!termo || [m.categoria, m.item, m.empresa, m.responsavel, m.base_legal].some((t) => (t ?? "").toLowerCase().includes(termo)))), [dados, filtro, termo]);

  async function feitaHoje(m: Manutencao) {
    const dia = window.prompt(`"${m.item}" foi feita em (AAAA-MM-DD):`, hojeIso());
    if (!dia) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) { toast({ title: "Data no formato AAAA-MM-DD", status: "warning" }); return; }
    try { await apiManutencoes.executada(m.id, dia); toast({ title: "Execução registrada", status: "success", duration: 2000 }); carregar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro", status: "error" }); }
  }

  async function excluir(m: Manutencao) {
    if (!window.confirm(`Excluir "${m.item}"?`)) return;
    try { await apiManutencoes.excluir(m.id); carregar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao excluir", status: "error" }); }
  }

  async function salvarAlerta() {
    const n = Number(alertaTexto);
    if (!Number.isInteger(n) || n < 0 || n > 365) { toast({ title: "Alerta: de 0 a 365 dias", status: "warning" }); return; }
    try { await apiManutencoes.alerta(n); toast({ title: "Alerta salvo", status: "success", duration: 2000 }); carregar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro", status: "error" }); }
  }

  const acoes = (m: Manutencao) => editaTudo && (
    <Menu placement="bottom-end">
      <MenuButton as={IconButton} size="xs" variant="ghost" aria-label="Ações" icon={<Icon as={EllipsisVertical} boxSize={4} />} />
      <MenuList fontSize="sm">
        <MenuItem onClick={() => feitaHoje(m)}>Registrar execução</MenuItem>
        <MenuItem onClick={() => setModal({ item: m })}>Editar</MenuItem>
        <MenuItem color="red.600" onClick={() => excluir(m)}>Excluir</MenuItem>
      </MenuList>
    </Menu>
  );

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={5}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Manutenções</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Manutenções e renovações periódicas do condomínio.</Text>
          </Box>
          {editaTudo && <Button colorScheme="blue" borderRadius="lg" onClick={() => setModal({ item: null })}>+ Nova manutenção</Button>}
        </Flex>

        {carregando && !dados ? <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex> : dados && (
          <Tabs colorScheme="blue" isLazy index={aba} onChange={setAba}>
            <TabList overflowX="auto" overflowY="hidden">
              <Tab whiteSpace="nowrap">Dash</Tab>
              <Tab whiteSpace="nowrap">Controle</Tab>
            </TabList>
            <TabPanels>
              {/* DASH */}
              <TabPanel paddingX={0}>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} marginBottom={4}>
                  {(["VENCIDO", "EM_BREVE", "EM_DIA", "SEM_DATA"] as const).map((s) => (
                    <Box key={s} bg="white" border="1px solid" borderColor={`${STATUS[s].cor}.100`} borderRadius="xl" padding={4} cursor="pointer"
                      onClick={() => { setFiltro(s); setAba(1); }} title="Ver no Controle">
                      <Text fontSize="xs" color="gray.500">{STATUS[s].rotulo}</Text>
                      <Text fontSize="2xl" fontWeight="bold" color={`${STATUS[s].cor}.600`}>{dados.resumo[s] ?? 0}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
                <Flex justify="space-between" align="center" gap={3} wrap="wrap" marginBottom={2}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">Vencidos e a vencer (alerta: {dados.alerta_dias} dias de antecedência)</Text>
                  {editaTudo && (
                    <Flex gap={2} align="center">
                      <Text fontSize="xs" color="gray.500">Alerta</Text>
                      <InputGroup size="sm" width="130px"><Input bg="white" type="number" value={alertaTexto} onChange={(e) => setAlertaTexto(e.target.value)} /><InputRightAddon>dias</InputRightAddon></InputGroup>
                      <Button size="sm" variant="outline" onClick={salvarAlerta}>Salvar</Button>
                    </Flex>
                  )}
                </Flex>
                {alertas.length === 0 ? (<Alert status="success" borderRadius="lg"><AlertIcon />Nenhum item vencido ou a vencer. Tudo em dia!</Alert>) : (
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
                    <TableContainer>
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th {...estiloTh}>Item / Serviço</Th>
                            <Th {...estiloTh}>Próximo vencimento</Th>
                            <Th {...estiloTh}>Dias restantes</Th>
                            <Th {...estiloTh}>Status</Th>
                            {editaTudo && <Th/>}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {alertas.map((m) => (
                            <Tr key={m.id} bg={m.status === "VENCIDO" ? "red.50" : "orange.50"}>
                              <Td fontSize="sm" whiteSpace="normal">
                                <Text fontWeight="medium">{m.item}</Text>
                                <Text fontSize="xs" color="gray.500">{m.categoria}</Text>
                                <Box marginTop={1}>
                                  <QuemFaz m={m} vazio=""/>
                                </Box>
                              </Td>
                              <Td fontSize="sm">{data(m.proximo_vencimento)}</Td>
                              <Td fontSize="sm" fontWeight="semibold" color={m.status === "VENCIDO" ? "red.600" : "orange.600"}>{dias(m.dias_restantes)}</Td>
                              <Td><SelecaoStatus m={m}/></Td>
                              {editaTudo && <Td><Button size="xs" colorScheme="green" variant="outline" onClick={() => feitaHoje(m)}>Registrar execução</Button></Td>}
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                {dados.resumo.SEM_DATA > 0 && <Text fontSize="xs" color="gray.500" marginTop={3}>{dados.resumo.SEM_DATA} item(ns) sem data de última execução: preencha no Controle para entrarem no alerta.</Text>}
              </TabPanel>

              {/* CONTROLE */}
              <TabPanel paddingX={0}>
                <Flex gap={3} wrap="wrap" marginBottom={3}>
                  <Input bg="white" size="sm" maxWidth="300px" placeholder="Buscar item, empresa, norma..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                  <Select bg="white" size="sm" maxWidth="200px" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                    <option value="">Todos os status</option>
                    {Object.entries(STATUS).map(([s, v]) => <option key={s} value={s}>{v.rotulo}</option>)}
                  </Select>
                </Flex>
                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
                  <TableContainer>
                    <Table size="xs">
                      <Thead bg="gray.50">
                        <Tr>
                          {editaTudo && <Th/>}
                          <Th {...estiloTh}>Categoria</Th>
                          <Th {...estiloTh}>Item / Serviço</Th>
                          <Th {...estiloTh}>Empresa / responsável</Th>
                          <Th {...estiloTh}>Periodicidade</Th>
                          <Th {...estiloTh}>Base legal / norma</Th>
                          <Th {...estiloTh}>Última execução</Th>
                          <Th {...estiloTh}>Próximo vencimento</Th>
                          <Th {...estiloTh} isNumeric>Dias restantes</Th>
                          <Th {...estiloTh}>Status</Th>
                          <Th {...estiloTh}>Observações</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filtrados.map((m) => (
                          <Tr key={m.id} cursor={editaTudo ? "pointer" : undefined} _hover={{ bg: "gray.50" }} onDoubleClick={() => editaTudo && setModal({ item: m })}>
                            {editaTudo && <Td>{acoes(m)}</Td>}
                            <Td fontSize="xs" color="gray.600">{m.categoria}</Td>
                            <Td fontSize="xs" fontWeight="medium" whiteSpace="normal" minWidth="220px">{m.item}</Td>
                            <Td whiteSpace="normal" minWidth="180px"><QuemFaz m={m} /></Td>
                            <Td fontSize="xs">{m.periodicidade ?? "—"}</Td>
                            <Td fontSize="xs" whiteSpace="normal" minWidth="180px" color="gray.600">{m.base_legal ?? "—"}</Td>
                            <Td fontSize="xs">{data(m.ultima_execucao)}</Td>
                            <Td fontSize="xs">{data(m.proximo_vencimento)}</Td>
                            <Td fontSize="xs" isNumeric color={m.status === "VENCIDO" ? "red.600" : m.status === "EM_BREVE" ? "orange.600" : undefined}>{m.dias_restantes ?? "—"}</Td>
                            <Td><SelecaoStatus m={m} /></Td>
                            <Td fontSize="xs" whiteSpace="normal" minWidth="160px" color="gray.600">{m.observacoes ?? ""}</Td>
                            
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
                <Text fontSize="xs" color="gray.500" marginTop={3}>
                  {editaTudo && "Dois cliques na linha para editar. "}Prazos são referências usuais de leis e normas; confirme com as empresas contratadas e os laudos.
                </Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>
      <ModalManutencao aberto={Boolean(modal)} item={modal?.item ?? null} categorias={categorias} prestadores={prestadores} aoFechar={() => setModal(null)} aoSalvo={carregar} />
    </Flex>
  );
};
