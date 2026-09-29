// ---------------------------------------------------------
// ATENDIMENTO (fale com o síndico)
// ---------------------------------------------------------
// Morador/demais: abrem chamados e conversam com a gestão;
//                 veem só os próprios chamados.
// ADM/SINDICO:    veem todos, respondem e encerram.
// Cada chamado tem protocolo, categoria e histórico.
// /Atendimento?novo=1 abre direto o formulário de novo chamado.
// ---------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Icon, Input, InputGroup, InputLeftElement, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Spinner, Stack, Text, Textarea,
  useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";
import { MessageSquare, Send } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { formatarDataHora } from "../../Components/config";
import {
  ROTULOS_CATEGORIA, apiChamados, protocolo, rotuloStatus,
  type CategoriaChamado, type ChamadoDetalhe, type ChamadoResumo, type StatusChamado,
} from "./ConfigAtendimento";

type Filtro = "TODOS" | StatusChamado;

// NOVO CHAMADO
const ModalNovoChamado = ({ aberto, aoFechar, aoEnviar }: {
  aberto: boolean; aoFechar: () => void; aoEnviar: (dados: { assunto: string; categoria: CategoriaChamado; mensagem: string }) => Promise<void>;
}) => {
  const toast = useToast();
  const [form, setForm] = useState({ assunto: "", categoria: "DUVIDA" as CategoriaChamado, mensagem: "" });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { if (aberto) setForm({ assunto: "", categoria: "DUVIDA", mensagem: "" }); }, [aberto]);

  async function enviar() {
    if (form.assunto.trim().length < 3) { toast({ title: "Informe o assunto (mínimo 3 letras)", status: "warning" }); return; }
    if (!form.mensagem.trim()) { toast({ title: "Escreva a mensagem", status: "warning" }); return; }
    setEnviando(true);
    try { await aoEnviar({ assunto: form.assunto.trim(), categoria: form.categoria, mensagem: form.mensagem.trim() }); }
    finally { setEnviando(false); }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Falar com o síndico</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex gap={3} direction={{ base: "column", md: "row" }}>
            <FormControl isRequired flex={2}>
              <FormLabel fontSize="sm">Assunto</FormLabel>
              <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} maxLength={150} placeholder="Ex.: Vazamento na garagem" />
            </FormControl>
            <FormControl isRequired flex={1}>
              <FormLabel fontSize="sm">Categoria</FormLabel>
              <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaChamado })}>
                {(Object.keys(ROTULOS_CATEGORIA) as CategoriaChamado[]).map((c) => <option key={c} value={c}>{ROTULOS_CATEGORIA[c]}</option>)}
              </Select>
            </FormControl>
          </Flex>
          <FormControl isRequired marginTop={3}>
            <FormLabel fontSize="sm">Mensagem</FormLabel>
            <Textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} rows={6} maxLength={5000} />
          </FormControl>
          <Text fontSize="xs" color="gray.500" marginTop={2}>A conversa é privada entre você e a administração do condomínio. Você receberá um número de protocolo.</Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={enviar} isLoading={enviando} leftIcon={<Icon as={Send} boxSize={3.5} />}>Enviar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const Atendimento = () => {
  const toast = useToast();
  const { editaTudo: gestao } = usePermissoes();
  const modalNovo = useDisclosure();
  const [parametros, setParametros] = useSearchParams();
  const fimConversa = useRef<HTMLDivElement>(null);

  const [chamados, setChamados] = useState<ChamadoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<ChamadoDetalhe | null>(null);
  const [carregandoConversa, setCarregandoConversa] = useState(false);
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busca, setBusca] = useState("");

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error" }), [toast]);

  const carregar = useCallback(async () => {
    try { setChamados(await apiChamados.listar()); }
    catch (e) { erro(e, "Erro ao carregar os chamados"); }
    finally { setCarregando(false); }
  }, [erro]);

  useEffect(() => { carregar(); }, [carregar]);

  // /Atendimento?novo=1 (botão da página inicial)
  const pedirNovo = parametros.get("novo") === "1";
  useEffect(() => {
    if (pedirNovo && !gestao) {
      modalNovo.onOpen();
      setParametros({}, { replace: true });
    }
  }, [pedirNovo, gestao, modalNovo.onOpen, setParametros]);

  useEffect(() => { fimConversa.current?.scrollIntoView({ block: "end" }); }, [aberto?.mensagens.length]);

  // troca o chamado aberto e atualiza a linha dele na lista (sem recarregar tudo)
  function atualizarAberto(detalhe: ChamadoDetalhe) {
    setAberto(detalhe);
    setChamados((lista) => {
      const { mensagens: _mensagens, ...resumo } = detalhe;
      const outros = lista.filter((c) => c.id !== detalhe.id);
      return [resumo, ...outros].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    });
  }

  async function abrirChamado(id: string) {
    setCarregandoConversa(true);
    setResposta("");
    try { atualizarAberto(await apiChamados.ver(id)); }
    catch (e) { erro(e, "Erro ao abrir o chamado"); }
    finally { setCarregandoConversa(false); }
  }

  async function novoChamado(dados: { assunto: string; categoria: CategoriaChamado; mensagem: string }) {
    try {
      const chamado = await apiChamados.abrir(dados);
      toast({ title: `Mensagem enviada · protocolo ${protocolo(chamado.numero)}`, status: "success" });
      modalNovo.onClose();
      atualizarAberto(chamado);
    } catch (e) { erro(e, "Erro ao enviar a mensagem"); }
  }

  async function enviarResposta() {
    if (!aberto || !resposta.trim()) return;
    setEnviando(true);
    try {
      atualizarAberto(await apiChamados.responder(aberto.id, resposta.trim()));
      setResposta("");
    } catch (e) { erro(e, "Erro ao enviar a mensagem"); }
    finally { setEnviando(false); }
  }

  async function alterarSituacao(acao: "encerrar" | "reabrir") {
    if (!aberto) return;
    if (acao === "encerrar" && !window.confirm(`Encerrar o chamado ${protocolo(aberto.numero)}?`)) return;
    try { atualizarAberto(await apiChamados[acao](aberto.id)); }
    catch (e) { erro(e, "Não foi possível alterar o chamado"); }
  }

  // FILTROS
  const termo = busca.trim().toLowerCase();
  const filtrados = chamados.filter((c) => {
    if (filtro !== "TODOS" && c.status !== filtro) return false;
    if (!termo) return true;
    return [c.assunto, c.autor_nome, protocolo(c.numero), ...c.autor_unidades].some((t) => t.toLowerCase().includes(termo));
  });
  const naoLidos = chamados.filter((c) => c.nao_lido).length;

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">{gestao ? "Atendimento" : "Fale com o síndico"}</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>
              {gestao ? "Mensagens enviadas pelos moradores e demais usuários." : "Envie dúvidas, solicitações e reclamações à administração."}
              {naoLidos > 0 && ` ${naoLidos} com novidade.`}
            </Text>
          </Box>
          {!gestao && <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={modalNovo.onOpen}>Nova mensagem</Button>}
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : chamados.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <Icon as={MessageSquare} boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">{gestao ? "Nenhuma mensagem recebida" : "Você ainda não enviou mensagens"}</Text>
            {!gestao && <Button marginTop={5} size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={modalNovo.onOpen}>Nova mensagem</Button>}
          </Flex>
        ) : (
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align="stretch">

            {/* LISTA */}
            <Box width={{ base: "100%", lg: "360px" }} flexShrink={0}>
              <Stack spacing={2} marginBottom={3}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3} /></InputLeftElement>
                  <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={gestao ? "Buscar por assunto, nome, unidade ou protocolo" : "Buscar por assunto ou protocolo"} bg="white" borderRadius="lg" />
                </InputGroup>
                <Select size="sm" bg="white" borderRadius="lg" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
                  <option value="TODOS">Todos</option>
                  <option value="ABERTO">{gestao ? "Aguardando resposta" : "Aguardando o síndico"}</option>
                  <option value="RESPONDIDO">Respondidos</option>
                  <option value="ENCERRADO">Encerrados</option>
                </Select>
              </Stack>
              <Stack spacing={2} maxHeight={{ lg: "calc(100vh - 260px)" }} overflowY="auto">
                {filtrados.length === 0 && <Text fontSize="sm" color="gray.500" padding={3}>Nenhum chamado encontrado.</Text>}
                {filtrados.map((c) => {
                  const situacao = rotuloStatus(c.status, gestao);
                  const selecionado = aberto?.id === c.id;
                  return (
                    <Box key={c.id} as="button" textAlign="left" onClick={() => abrirChamado(c.id)} bg={selecionado ? "blue.50" : "white"}
                      border="1px solid" borderColor={selecionado ? "blue.200" : "gray.100"} borderRadius="lg" padding={3} _hover={{ borderColor: "blue.200" }}>
                      <Flex justify="space-between" gap={2} align="center">
                        <Text fontSize="xs" color="gray.500">{protocolo(c.numero)} · {ROTULOS_CATEGORIA[c.categoria]}</Text>
                        {c.nao_lido && <Box width={2} height={2} borderRadius="full" bg="blue.500" flexShrink={0} />}
                      </Flex>
                      <Text fontSize="sm" fontWeight={c.nao_lido ? "bold" : "semibold"} color="gray.800" noOfLines={1}>{c.assunto}</Text>
                      {gestao && <Text fontSize="xs" color="gray.600" noOfLines={1}>{c.autor_nome}{c.autor_unidades.length > 0 && ` · ${c.autor_unidades.join(", ")}`}</Text>}
                      <Flex justify="space-between" align="center" marginTop={1}>
                        <Badge colorScheme={situacao.cor} textTransform="none" fontSize="2xs">{situacao.rotulo}</Badge>
                        <Text fontSize="2xs" color="gray.400">{formatarDataHora(c.updated_at)}</Text>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* CONVERSA */}
            <Flex flex={1} minWidth={0} direction="column" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" minHeight="420px">
              {carregandoConversa ? (
                <Flex flex={1} justify="center" align="center"><Spinner color="blue.500" /></Flex>
              ) : !aberto ? (
                <Flex flex={1} direction="column" justify="center" align="center" color="gray.400" padding={8}>
                  <Icon as={MessageSquare} boxSize={6} />
                  <Text marginTop={2} fontSize="sm">Selecione um chamado para ver a conversa.</Text>
                </Flex>
              ) : (
                <>
                  <Flex justify="space-between" align="flex-start" gap={3} paddingX={5} paddingY={4} borderBottom="1px solid" borderColor="gray.100" wrap="wrap">
                    <Box minWidth={0}>
                      <Text fontSize="xs" color="gray.500">Protocolo {protocolo(aberto.numero)} · {ROTULOS_CATEGORIA[aberto.categoria]} · aberto em {formatarDataHora(aberto.created_at)}</Text>
                      <Text fontWeight="semibold" color="gray.800">{aberto.assunto}</Text>
                      {gestao && <Text fontSize="sm" color="gray.600">{aberto.autor_nome}{aberto.autor_unidades.length > 0 && ` · ${aberto.autor_unidades.join(", ")}`}</Text>}
                    </Box>
                    <Flex gap={2} align="center">
                      <Badge colorScheme={rotuloStatus(aberto.status, gestao).cor} textTransform="none">{rotuloStatus(aberto.status, gestao).rotulo}</Badge>
                      {aberto.status === "ENCERRADO"
                        ? <Button size="xs" variant="outline" onClick={() => alterarSituacao("reabrir")}>Reabrir</Button>
                        : <Button size="xs" variant="outline" colorScheme="red" onClick={() => alterarSituacao("encerrar")}>Encerrar</Button>}
                    </Flex>
                  </Flex>

                  <Stack spacing={3} flex={1} overflowY="auto" paddingX={5} paddingY={4} maxHeight={{ lg: "calc(100vh - 360px)" }} bg="gray.50">
                    {aberto.mensagens.map((m) => (
                      <Flex key={m.id} justify={m.minha ? "flex-end" : "flex-start"}>
                        <Box maxWidth="80%" bg={m.minha ? "blue.500" : "white"} color={m.minha ? "white" : "gray.800"} border={m.minha ? "none" : "1px solid"}
                          borderColor="gray.200" borderRadius="xl" paddingX={4} paddingY={2}>
                          <Text fontSize="xs" fontWeight="semibold" opacity={0.85}>{m.minha ? "Você" : m.da_gestao ? `${m.autor_nome} (administração)` : m.autor_nome}</Text>
                          <Text fontSize="sm" whiteSpace="pre-wrap">{m.texto}</Text>
                          <Text fontSize="2xs" opacity={0.7} textAlign="right" marginTop={1}>{formatarDataHora(m.created_at)}</Text>
                        </Box>
                      </Flex>
                    ))}
                    <div ref={fimConversa} />
                  </Stack>

                  {aberto.status === "ENCERRADO" ? (
                    <Text fontSize="sm" color="gray.500" paddingX={5} paddingY={4} borderTop="1px solid" borderColor="gray.100">
                      Chamado encerrado{aberto.encerrado_em && ` em ${formatarDataHora(aberto.encerrado_em)}`}. Reabra para enviar uma nova mensagem.
                    </Text>
                  ) : (
                    <Flex gap={2} padding={3} borderTop="1px solid" borderColor="gray.100" align="flex-end">
                      <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={2} resize="none" maxLength={5000}
                        placeholder={gestao ? "Escreva a resposta... (Ctrl+Enter envia)" : "Escreva sua mensagem... (Ctrl+Enter envia)"}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviarResposta(); }} />
                      <Button colorScheme="blue" onClick={enviarResposta} isLoading={enviando} isDisabled={!resposta.trim()} leftIcon={<Icon as={Send} boxSize={3.5} />}>Enviar</Button>
                    </Flex>
                  )}
                </>
              )}
            </Flex>
          </Flex>
        )}

        {!gestao && <ModalNovoChamado aberto={modalNovo.isOpen} aoFechar={modalNovo.onClose} aoEnviar={novoChamado} />}
      </Box>
    </Flex>
  );
};
