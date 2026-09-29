// ---------------------------------------------------------
// MODAIS DAS TAREFAS
// ---------------------------------------------------------
// ModalTarefa:  criar / editar (gestão)
// PainelTarefa: detalhe com ações, histórico e comentários
// ---------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Badge, Box, Button, Divider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Select, SimpleGrid, Spinner, Stack, Text, Textarea, useToast,
} from "@chakra-ui/react";

import { formatarDataHora, formatarDataIso } from "../../Components/config";
import { ROTULOS_PERFIL, type PerfilPessoa } from "../Pessoas/ConfigPessoas";
import {
  ROTULOS_PRIORIDADE, ROTULOS_STATUS, numeroTarefa,
  type PrioridadeTarefa, type Responsavel, type StatusTarefa, type Tarefa, type TarefaDados, type TarefaDetalhe,
} from "./ConfigTarefas";

const rotuloPerfil = (perfil: string) => ROTULOS_PERFIL[perfil as PerfilPessoa] ?? perfil;


// =========================================================
// CRIAR / EDITAR
// =========================================================

export const ModalTarefa = ({ aberto, aoFechar, tarefa, responsaveis, aoSalvar }: {
  aberto: boolean; aoFechar: () => void; tarefa: Tarefa | null; responsaveis: Responsavel[]; aoSalvar: (dados: TarefaDados) => Promise<void>;
}) => {
  const toast = useToast();
  const [form, setForm] = useState({ titulo: "", descricao: "", local: "", responsavel_id: "", prioridade: "MEDIA" as PrioridadeTarefa, prazo: "" });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm(tarefa
      ? { titulo: tarefa.titulo, descricao: tarefa.descricao ?? "", local: tarefa.local ?? "", responsavel_id: tarefa.responsavel_id, prioridade: tarefa.prioridade, prazo: tarefa.prazo ?? "" }
      : { titulo: "", descricao: "", local: "", responsavel_id: "", prioridade: "MEDIA", prazo: "" });
  }, [aberto, tarefa]);

  async function salvar() {
    if (form.titulo.trim().length < 3) { toast({ title: "Informe um título (mínimo 3 letras)", status: "warning" }); return; }
    if (!form.responsavel_id) { toast({ title: "Escolha o responsável", status: "warning" }); return; }
    setSalvando(true);
    try {
      await aoSalvar({
        titulo: form.titulo.trim(), descricao: form.descricao.trim() || null, local: form.local.trim() || null,
        responsavel_id: form.responsavel_id, prioridade: form.prioridade, prazo: form.prazo || null,
      });
    } finally { setSalvando(false); }
  }

  // agrupa: Síndico, Conselho e Funcionários (ordenados por cargo)
  const grupos = [
    { rotulo: "Síndico", pessoas: responsaveis.filter((r) => r.perfil === "SINDICO") },
    { rotulo: "Conselho", pessoas: responsaveis.filter((r) => r.perfil === "CONSELHEIRO") },
    {
      rotulo: "Funcionários",
      pessoas: responsaveis.filter((r) => r.perfil === "FUNCIONARIO")
        .sort((a, b) => (a.cargo ?? "~").localeCompare(b.cargo ?? "~") || a.nome.localeCompare(b.nome)),
    },
  ].filter((g) => g.pessoas.length > 0);

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>{tarefa ? `Editar tarefa ${numeroTarefa(tarefa.numero)}` : "Nova tarefa"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Título</FormLabel>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} maxLength={150} placeholder="Ex.: Trocar lâmpadas do hall" />
          </FormControl>
          <FormControl marginTop={3}>
            <FormLabel fontSize="sm">Descrição</FormLabel>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} placeholder="O que precisa ser feito, materiais, observações..." />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Responsável</FormLabel>
              <Select value={form.responsavel_id} placeholder="Selecione" onChange={(e) => setForm({ ...form, responsavel_id: e.target.value })}>
                {grupos.map((g) => (
                  <optgroup key={g.rotulo} label={g.rotulo}>
                    {g.pessoas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}{p.perfil === "FUNCIONARIO" ? ` — ${p.cargo ?? "sem cargo"}` : ""}{p.tem_acesso ? "" : " (sem acesso ao sistema)"}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              {responsaveis.length === 0 && <Text fontSize="xs" color="orange.600" marginTop={1}>Cadastre em Pessoas o síndico, conselheiros ou funcionários.</Text>}
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Local</FormLabel>
              <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} maxLength={100} placeholder="Ex.: Garagem, Bloco A" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Prioridade</FormLabel>
              <Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as PrioridadeTarefa })}>
                {(Object.keys(ROTULOS_PRIORIDADE) as PrioridadeTarefa[]).map((p) => <option key={p} value={p}>{ROTULOS_PRIORIDADE[p].rotulo}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Prazo</FormLabel>
              <Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
            </FormControl>
          </SimpleGrid>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>{tarefa ? "Salvar" : "Criar tarefa"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


// =========================================================
// DETALHE
// =========================================================

const Info = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
  <Box>
    <Text fontSize="xs" color="gray.500">{rotulo}</Text>
    <Box fontSize="sm" color="gray.800">{children}</Box>
  </Box>
);

// próximos passos do fluxo para cada situação
function proximasAcoes(tarefa: Tarefa, gestao: boolean): { status: StatusTarefa; rotulo: string; cor: string }[] {
  const acoes: { status: StatusTarefa; rotulo: string; cor: string }[] = [];
  if (tarefa.status === "PENDENTE") acoes.push({ status: "EM_ANDAMENTO", rotulo: "Iniciar", cor: "blue" });
  if (tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO") acoes.push({ status: "CONCLUIDA", rotulo: "Concluir", cor: "green" });
  if (tarefa.status === "EM_ANDAMENTO") acoes.push({ status: "PENDENTE", rotulo: "Voltar para pendente", cor: "gray" });
  if (gestao && (tarefa.status === "CONCLUIDA" || tarefa.status === "CANCELADA")) acoes.push({ status: "PENDENTE", rotulo: "Reabrir", cor: "gray" });
  if (gestao && (tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO")) acoes.push({ status: "CANCELADA", rotulo: "Cancelar tarefa", cor: "red" });
  return acoes;
}

export const PainelTarefa = ({ aberto, aoFechar, tarefa, carregando, gestao, aoMudarStatus, aoComentar, aoEditar, aoExcluir }: {
  aberto: boolean; aoFechar: () => void; tarefa: TarefaDetalhe | null; carregando: boolean; gestao: boolean;
  aoMudarStatus: (status: StatusTarefa, comentario: string) => Promise<void>;
  aoComentar: (texto: string) => Promise<void>;
  aoEditar: () => void; aoExcluir: () => void;
}) => {
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => { setComentario(""); }, [tarefa?.id]);
  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [tarefa?.historico.length]);

  async function executar(acao: () => Promise<void>) {
    setEnviando(true);
    try { await acao(); setComentario(""); } finally { setEnviando(false); }
  }

  return (
    <Drawer isOpen={aberto} onClose={aoFechar} size="md" placement="right">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        {carregando || !tarefa ? (
          <Flex flex={1} justify="center" align="center"><Spinner color="blue.500" /></Flex>
        ) : (
          <>
            <DrawerHeader borderBottom="1px solid" borderColor="gray.100" paddingRight={12}>
              <Text fontSize="xs" color="gray.500" fontWeight="normal">Tarefa {numeroTarefa(tarefa.numero)} · criada por {tarefa.criado_por_nome} em {formatarDataHora(tarefa.created_at)}</Text>
              <Text fontSize="lg">{tarefa.titulo}</Text>
              <Flex gap={2} marginTop={1} wrap="wrap">
                <Badge colorScheme={ROTULOS_STATUS[tarefa.status].cor} textTransform="none">{ROTULOS_STATUS[tarefa.status].rotulo}</Badge>
                <Badge colorScheme={ROTULOS_PRIORIDADE[tarefa.prioridade].cor} variant="outline" textTransform="none">Prioridade {ROTULOS_PRIORIDADE[tarefa.prioridade].rotulo.toLowerCase()}</Badge>
                {tarefa.atrasada && <Badge colorScheme="red" variant="solid" textTransform="none">Atrasada</Badge>}
              </Flex>
            </DrawerHeader>

            <DrawerBody>
              <SimpleGrid columns={2} spacing={3}>
                <Info rotulo="Responsável">{tarefa.responsavel_nome} <Text as="span" color="gray.500" fontSize="xs">({tarefa.responsavel_cargo ?? rotuloPerfil(tarefa.responsavel_perfil)})</Text></Info>
                <Info rotulo="Prazo"><Text color={tarefa.atrasada ? "red.600" : undefined}>{tarefa.prazo ? formatarDataIso(tarefa.prazo) : "Sem prazo"}</Text></Info>
                <Info rotulo="Local">{tarefa.local ?? "-"}</Info>
                <Info rotulo="Concluída em">{tarefa.concluida_em ? formatarDataHora(tarefa.concluida_em) : "-"}</Info>
              </SimpleGrid>
              {tarefa.descricao && (
                <Box marginTop={4}>
                  <Text fontSize="xs" color="gray.500">Descrição</Text>
                  <Text fontSize="sm" whiteSpace="pre-wrap">{tarefa.descricao}</Text>
                </Box>
              )}

              {tarefa.pode_atuar && proximasAcoes(tarefa, gestao).length > 0 && (
                <Flex gap={2} marginTop={4} wrap="wrap">
                  {proximasAcoes(tarefa, gestao).map((a) => (
                    <Button key={a.rotulo} size="sm" colorScheme={a.cor} variant={a.status === "CONCLUIDA" || a.status === "EM_ANDAMENTO" ? "solid" : "outline"}
                      isDisabled={enviando} onClick={() => executar(() => aoMudarStatus(a.status, comentario.trim()))}>{a.rotulo}</Button>
                  ))}
                </Flex>
              )}

              <Divider marginY={4} />
              <Text fontWeight="semibold" fontSize="sm" marginBottom={2}>Histórico</Text>
              <Stack spacing={3}>
                {tarefa.historico.map((h) => h.tipo === "EVENTO" ? (
                  <Text key={h.id} fontSize="xs" color="gray.500">
                    • {h.texto} — {h.autor_nome}, {formatarDataHora(h.created_at)}
                  </Text>
                ) : (
                  <Box key={h.id} bg="gray.50" borderRadius="lg" paddingX={3} paddingY={2}>
                    <Flex justify="space-between" gap={2}>
                      <Text fontSize="xs" fontWeight="semibold">{h.autor_nome}</Text>
                      <Text fontSize="2xs" color="gray.500">{formatarDataHora(h.created_at)}</Text>
                    </Flex>
                    <Text fontSize="sm" whiteSpace="pre-wrap">{h.texto}</Text>
                  </Box>
                ))}
                <div ref={fim} />
              </Stack>
            </DrawerBody>

            <DrawerFooter borderTop="1px solid" borderColor="gray.100" flexDirection="column" alignItems="stretch" gap={2}>
              {tarefa.pode_atuar && (
                <Flex gap={2} align="flex-end">
                  <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} resize="none" maxLength={2000}
                    placeholder="Comentário (vai junto se você mudar a situação)" />
                  <Button colorScheme="blue" isDisabled={!comentario.trim()} isLoading={enviando} onClick={() => executar(() => aoComentar(comentario.trim()))}>Comentar</Button>
                </Flex>
              )}
              {gestao && (
                <Flex gap={2} justify="flex-end">
                  <Button size="sm" variant="outline" onClick={aoEditar}>Editar</Button>
                  <Button size="sm" variant="ghost" colorScheme="red" onClick={aoExcluir}>Excluir</Button>
                </Flex>
              )}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
