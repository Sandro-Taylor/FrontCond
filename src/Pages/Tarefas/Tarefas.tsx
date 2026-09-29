// ---------------------------------------------------------
// TAREFAS (quadro Kanban)
// ---------------------------------------------------------
// ADM/SINDICO: criam, designam (síndico, conselheiro ou
//              funcionário), editam, cancelam e excluem.
// CONSELHEIRO: vê todas; atua nas designadas a ele.
// FUNCIONARIO: vê e atua só nas designadas a ele.
// Colunas: Pendente -> Em andamento -> Concluída.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Checkbox, Flex, Icon, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Spinner, Stack, Text,
  useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";
import { CalendarDays, ListChecks, MapPin, MessageSquare } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { formatarDataIso } from "../../Components/config";
import {
  ROTULOS_PRIORIDADE, ROTULOS_STATUS, apiTarefas, numeroTarefa,
  type PrioridadeTarefa, type Responsavel, type StatusTarefa, type Tarefa, type TarefaDados, type TarefaDetalhe,
} from "./ConfigTarefas";
import { ModalTarefa, PainelTarefa } from "./ModaisTarefas";

const ORDEM_PRIORIDADE: Record<PrioridadeTarefa, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };

const Indicador = ({ rotulo, valor, cor }: { rotulo: string; valor: number; cor?: string }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Text fontSize="xs" fontWeight="medium" color="gray.500">{rotulo}</Text>
    <Text marginTop={1} fontSize="2xl" fontWeight="semibold" color={cor ?? "gray.800"}>{valor}</Text>
  </Box>
);

const CartaoTarefa = ({ tarefa, aoAbrir, aoAvancar }: { tarefa: Tarefa; aoAbrir: () => void; aoAvancar?: (status: StatusTarefa) => void }) => {
  const prioridade = ROTULOS_PRIORIDADE[tarefa.prioridade];
  return (
    <Box bg="white" borderRadius="lg" border="1px solid" borderColor={tarefa.atrasada ? "red.200" : "gray.100"} padding={3}
      cursor="pointer" onClick={aoAbrir} _hover={{ borderColor: "blue.200", boxShadow: "sm" }}>
      <Flex justify="space-between" align="center" gap={2}>
        <Text fontSize="xs" color="gray.500">{numeroTarefa(tarefa.numero)}</Text>
        <Badge colorScheme={prioridade.cor} variant={tarefa.prioridade === "URGENTE" ? "solid" : "subtle"} textTransform="none" fontSize="2xs">{prioridade.rotulo}</Badge>
      </Flex>
      <Text fontSize="sm" fontWeight="semibold" color="gray.800" marginTop={1} noOfLines={2}>{tarefa.titulo}</Text>
      {tarefa.local && (
        <Flex align="center" gap={1} marginTop={1} color="gray.500"><Icon as={MapPin} boxSize={3} /><Text fontSize="xs" noOfLines={1}>{tarefa.local}</Text></Flex>
      )}
      <Flex justify="space-between" align="center" marginTop={2} gap={2}>
        <Text fontSize="xs" color={tarefa.minha ? "blue.600" : "gray.600"} fontWeight={tarefa.minha ? "semibold" : "normal"} noOfLines={1}>
          {tarefa.minha ? "Você" : tarefa.responsavel_nome}{!tarefa.minha && tarefa.responsavel_cargo ? ` · ${tarefa.responsavel_cargo}` : ""}
        </Text>
        <Flex align="center" gap={2} flexShrink={0}>
          {tarefa.total_comentarios > 0 && (
            <Flex align="center" gap={0.5} color="gray.500"><Icon as={MessageSquare} boxSize={3} /><Text fontSize="2xs">{tarefa.total_comentarios}</Text></Flex>
          )}
          {tarefa.prazo && (
            <Flex align="center" gap={0.5} color={tarefa.atrasada ? "red.600" : "gray.500"}>
              <Icon as={CalendarDays} boxSize={3} /><Text fontSize="2xs" fontWeight={tarefa.atrasada ? "bold" : "normal"}>{formatarDataIso(tarefa.prazo).slice(0, 5)}</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
      {aoAvancar && tarefa.pode_atuar && (tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO") && (
        <Button size="xs" width="100%" marginTop={2} variant="outline" colorScheme={tarefa.status === "PENDENTE" ? "blue" : "green"}
          onClick={(e) => { e.stopPropagation(); aoAvancar(tarefa.status === "PENDENTE" ? "EM_ANDAMENTO" : "CONCLUIDA"); }}>
          {tarefa.status === "PENDENTE" ? "Iniciar" : "Concluir"}
        </Button>
      )}
    </Box>
  );
};

export const Tarefas = () => {
  const toast = useToast();
  const { editaTudo: gestao, veTudo } = usePermissoes();
  const modalForm = useDisclosure();
  const painel = useDisclosure();

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState<TarefaDetalhe | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [editando, setEditando] = useState<Tarefa | null>(null);

  const [busca, setBusca] = useState("");
  const [responsavel, setResponsavel] = useState("");  // "" = todos, "MINHAS" = só as minhas
  const [prioridade, setPrioridade] = useState("");
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false);

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error" }), [toast]);

  const carregar = useCallback(async () => {
    try { setTarefas(await apiTarefas.listar()); }
    catch (e) { erro(e, "Erro ao carregar as tarefas"); }
    finally { setCarregando(false); }
  }, [erro]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { if (gestao) apiTarefas.responsaveis().then(setResponsaveis).catch((e) => erro(e, "Erro ao carregar os responsáveis")); }, [gestao, erro]);

  // atualiza o painel aberto e a tarefa no quadro
  function aplicar(tarefa: TarefaDetalhe) {
    setDetalhe(tarefa);
    setTarefas((lista) => lista.map((t) => (t.id === tarefa.id ? tarefa : t)));
  }

  async function abrir(id: string) {
    setDetalhe(null);
    setCarregandoDetalhe(true);
    painel.onOpen();
    try { setDetalhe(await apiTarefas.ver(id)); }
    catch (e) { erro(e, "Erro ao abrir a tarefa"); painel.onClose(); }
    finally { setCarregandoDetalhe(false); }
  }

  async function mudarStatus(id: string, status: StatusTarefa, comentario = "") {
    try {
      const atualizada = await apiTarefas.mudarStatus(id, status, comentario);
      aplicar(atualizada);
      toast({ title: `Tarefa ${ROTULOS_STATUS[status].rotulo.toLowerCase()}`, status: "success", duration: 2000 });
    } catch (e) { erro(e, "Não foi possível alterar a situação"); }
  }

  async function comentar(texto: string) {
    if (!detalhe) return;
    try { aplicar(await apiTarefas.comentar(detalhe.id, texto)); }
    catch (e) { erro(e, "Não foi possível comentar"); }
  }

  function novaTarefa() {
    setEditando(null);
    modalForm.onOpen();
  }

  function editarAberta() {
    if (!detalhe) return;
    setEditando(detalhe);
    modalForm.onOpen();
  }

  async function salvar(dados: TarefaDados) {
    try {
      if (editando) {
        aplicar(await apiTarefas.editar(editando.id, dados));
        toast({ title: "Tarefa atualizada", status: "success", duration: 2000 });
      } else {
        const criada = await apiTarefas.criar(dados);
        setTarefas((lista) => [criada, ...lista]);
        toast({ title: `Tarefa ${numeroTarefa(criada.numero)} criada`, status: "success", duration: 2000 });
      }
      modalForm.onClose();
    } catch (e) { erro(e, "Erro ao salvar a tarefa"); }
  }

  async function excluirAberta() {
    if (!detalhe || !window.confirm(`Excluir a tarefa ${numeroTarefa(detalhe.numero)}? O histórico também será apagado.`)) return;
    try {
      await apiTarefas.excluir(detalhe.id);
      setTarefas((lista) => lista.filter((t) => t.id !== detalhe.id));
      painel.onClose();
      toast({ title: "Tarefa excluída", status: "success", duration: 2000 });
    } catch (e) { erro(e, "Não foi possível excluir a tarefa"); }
  }

  // FILTROS
  const termo = busca.trim().toLowerCase();
  const filtradas = tarefas
    .filter((t) => {
      if (responsavel === "MINHAS" && !t.minha) return false;
      if (responsavel && responsavel !== "MINHAS" && t.responsavel_id !== responsavel) return false;
      if (prioridade && t.prioridade !== prioridade) return false;
      if (!termo) return true;
      return [t.titulo, t.local, t.responsavel_nome, t.responsavel_cargo, t.descricao, numeroTarefa(t.numero)].some((x) => (x ?? "").toLowerCase().includes(termo));
    })
    .sort((a, b) => Number(b.atrasada) - Number(a.atrasada) || ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]);

  const colunas: StatusTarefa[] = mostrarCanceladas ? ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] : ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"];
  const pessoasNoQuadro = Array.from(new Map(tarefas.map((t) => [t.responsavel_id, t.responsavel_nome])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const ativas = tarefas.filter((t) => t.status === "PENDENTE" || t.status === "EM_ANDAMENTO");

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Tarefas</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>
              {veTudo && responsavel !== "MINHAS" ? "Tarefas do condomínio e seus responsáveis." : "Tarefas designadas a você."}
            </Text>
          </Box>
          {gestao && <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={novaTarefa}>Nova tarefa</Button>}
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
          <Indicador rotulo="Pendentes" valor={tarefas.filter((t) => t.status === "PENDENTE").length} />
          <Indicador rotulo="Em andamento" valor={tarefas.filter((t) => t.status === "EM_ANDAMENTO").length} cor="blue.600" />
          <Indicador rotulo="Atrasadas" valor={ativas.filter((t) => t.atrasada).length} cor="red.600" />
          <Indicador rotulo="Minhas em aberto" valor={ativas.filter((t) => t.minha).length} cor="purple.600" />
        </SimpleGrid>

        <Flex gap={3} marginBottom={5} direction={{ base: "column", md: "row" }} align={{ md: "center" }} wrap="wrap">
          <InputGroup maxWidth={{ md: "300px" }}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar tarefa, local ou nº" bg="white" borderRadius="lg" />
          </InputGroup>
          {veTudo && (
            <Select maxWidth={{ md: "220px" }} bg="white" borderRadius="lg" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
              <option value="">Todos os responsáveis</option>
              <option value="MINHAS">Só as minhas</option>
              {pessoasNoQuadro.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </Select>
          )}
          <Select maxWidth={{ md: "180px" }} bg="white" borderRadius="lg" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
            <option value="">Todas as prioridades</option>
            {(Object.keys(ROTULOS_PRIORIDADE) as PrioridadeTarefa[]).map((p) => <option key={p} value={p}>{ROTULOS_PRIORIDADE[p].rotulo}</option>)}
          </Select>
          <Checkbox isChecked={mostrarCanceladas} onChange={(e) => setMostrarCanceladas(e.target.checked)}><Text fontSize="sm">Mostrar canceladas</Text></Checkbox>
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : tarefas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <Icon as={ListChecks} boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">{gestao ? "Nenhuma tarefa criada" : "Nenhuma tarefa designada a você"}</Text>
            {gestao && <Button marginTop={5} size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={novaTarefa}>Nova tarefa</Button>}
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: colunas.length }} spacing={4} alignItems="flex-start">
            {colunas.map((coluna) => {
              const daColuna = filtradas.filter((t) => t.status === coluna);
              return (
                <Box key={coluna} bg="gray.50" borderRadius="xl" padding={3} border="1px solid" borderColor="gray.100">
                  <Flex justify="space-between" align="center" marginBottom={3} paddingX={1}>
                    <Flex align="center" gap={2}>
                      <Box width={2} height={2} borderRadius="full" bg={`${ROTULOS_STATUS[coluna].cor}.400`} />
                      <Text fontSize="sm" fontWeight="semibold">{ROTULOS_STATUS[coluna].rotulo}</Text>
                    </Flex>
                    <Badge borderRadius="full" paddingX={2}>{daColuna.length}</Badge>
                  </Flex>
                  <Stack spacing={2} maxHeight={{ md: "calc(100vh - 380px)" }} overflowY="auto">
                    {daColuna.length === 0 && <Text fontSize="xs" color="gray.400" paddingX={1} paddingY={3}>Nenhuma tarefa.</Text>}
                    {daColuna.map((t) => (
                      <CartaoTarefa key={t.id} tarefa={t} aoAbrir={() => abrir(t.id)} aoAvancar={(status) => mudarStatus(t.id, status)} />
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}

        <PainelTarefa aberto={painel.isOpen} aoFechar={painel.onClose} tarefa={detalhe} carregando={carregandoDetalhe} gestao={gestao}
          aoMudarStatus={(status, comentario) => (detalhe ? mudarStatus(detalhe.id, status, comentario) : Promise.resolve())}
          aoComentar={comentar} aoEditar={editarAberta} aoExcluir={excluirAberta} />

        {gestao && <ModalTarefa aberto={modalForm.isOpen} aoFechar={modalForm.onClose} tarefa={editando} responsaveis={responsaveis} aoSalvar={salvar} />}
      </Box>
    </Flex>
  );
};
