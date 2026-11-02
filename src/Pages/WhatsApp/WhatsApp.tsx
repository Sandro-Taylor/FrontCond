// ---------------------------------------------------------
// WHATSAPP (teste)
// ---------------------------------------------------------
// ADM: conecta o número do sistema (QR code da Evolution API).
// ADM e RESPONSÁVEL: veem todas as conversas e respondem.
// SÍNDICO: vê e responde as conversas dos moradores que são dele.
// O pop-up aparece para quem é o responsável de cada pessoa.
// /WhatsApp?conversa=<id> abre direto uma conversa (pop-up).
// ---------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Badge, Box, Button, Flex, Icon, Image, Input, InputGroup, InputLeftElement, Spinner, Stack, Text, Textarea, useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { Bot, MessageCircle, QrCode, Send, Unplug, UserRound } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { useAuth } from "../Login/useAuth";
import { formatarDataHora } from "../../Components/config";
import {
  ROTULOS_ESTADO, apiWhatsApp, formatarWhats, nomeContato,
  type ConversaDetalhe, type ConversaResumo, type StatusWhatsApp,
} from "./ConfigWhatsApp";

const ATUALIZAR_MS = 5000;

// CONEXÃO DO NÚMERO
const PainelConexao = ({ podeConectar }: { podeConectar: boolean }) => {
  const toast = useToast();
  const [status, setStatus] = useState<StatusWhatsApp | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const qrNaTela = useRef(false);
  qrNaTela.current = Boolean(qrcode);

  const consultar = useCallback(async () => {
    try {
      const atual = await apiWhatsApp.status();
      setStatus(atual);
      if (atual.estado === "CONECTADO" && qrNaTela.current) {
        qrNaTela.current = false;
        setQrcode(null);
        toast({ title: "WhatsApp conectado", status: "success" });
      }
    } catch (e) {
      setStatus({ estado: "INDISPONIVEL", qrcode: null, mensagem: e instanceof Error ? e.message : null });
    }
  }, [toast]);

  // com QR code na tela, confere a cada 3 s se já foi lido
  useEffect(() => {
    consultar();
    const timer = setInterval(consultar, qrcode ? 3000 : 15000);
    return () => clearInterval(timer);
  }, [consultar, qrcode]);

  async function conectar() {
    setOcupado(true);
    try {
      const resposta = await apiWhatsApp.conectar();
      setStatus(resposta);
      setQrcode(resposta.qrcode);
      if (resposta.mensagem) toast({ title: resposta.mensagem, status: "info" });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao conectar", status: "error" }); }
    finally { setOcupado(false); }
  }

  async function desconectar() {
    if (!window.confirm("Desconectar o número do WhatsApp do sistema? As mensagens deixarão de chegar.")) return;
    setOcupado(true);
    try { setStatus(await apiWhatsApp.desconectar()); setQrcode(null); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao desconectar", status: "error" }); }
    finally { setOcupado(false); }
  }

  const estado = status?.estado;
  const rotulo = estado ? ROTULOS_ESTADO[estado] : null;

  return (
    <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4} marginBottom={4}>
      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
        <Flex align="center" gap={3}>
          <Icon as={MessageCircle} boxSize={5} color="green.500" />
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">Número do sistema</Text>
            {rotulo ? <Badge colorScheme={rotulo.cor} textTransform="none">{rotulo.rotulo}</Badge> : <Spinner size="xs" />}
          </Box>
        </Flex>
        <Flex gap={2}>
          {!podeConectar ? null : estado === "CONECTADO" ? (
            <Button size="sm" variant="outline" colorScheme="red" leftIcon={<Icon as={Unplug} boxSize={3.5} />} onClick={desconectar} isLoading={ocupado}>Desconectar</Button>
          ) : estado && estado !== "INDISPONIVEL" ? (
            <Button size="sm" colorScheme="green" leftIcon={<Icon as={QrCode} boxSize={3.5} />} onClick={conectar} isLoading={ocupado}>
              {qrcode ? "Gerar novo QR code" : "Conectar com QR code"}
            </Button>
          ) : null}
        </Flex>
      </Flex>

      {estado === "INDISPONIVEL" && (
        <Text fontSize="sm" color="red.600" marginTop={3}>
          {podeConectar
            ? <>A Evolution API não respondeu. No terminal, na pasta BackCond, rode <b>docker compose up -d whatsapp</b> e confira a EVOLUTION_API_KEY no .env.</>
            : "O WhatsApp do sistema está fora do ar. Avise o administrador."}
        </Text>
      )}

      {qrcode && estado !== "CONECTADO" && (
        <Flex marginTop={4} gap={6} align="center" direction={{ base: "column", md: "row" }}>
          <Image src={qrcode} alt="QR code do WhatsApp" boxSize="240px" border="1px solid" borderColor="gray.200" borderRadius="lg" />
          <Stack spacing={1} fontSize="sm" color="gray.600">
            <Text fontWeight="semibold" color="gray.800">Para conectar:</Text>
            <Text>1. Abra o WhatsApp no celular do número de teste.</Text>
            <Text>2. Toque em Configurações → Aparelhos conectados → Conectar um aparelho.</Text>
            <Text>3. Aponte a câmera para este QR code.</Text>
            <Text fontSize="xs" color="gray.500">O QR code expira em poucos segundos; se não funcionar, gere um novo.</Text>
          </Stack>
        </Flex>
      )}
    </Box>
  );
};

export const WhatsApp = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const fimConversa = useRef<HTMLDivElement>(null);

  const [conversas, setConversas] = useState<ConversaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberta, setAberta] = useState<ConversaDetalhe | null>(null);
  const [carregandoConversa, setCarregandoConversa] = useState(false);
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState("");
  const abertaId = aberta?.id;
  const ehSindico = Boolean(user?.condominios.some((c) => c.perfil === "SINDICO"));
  const temAcesso = Boolean(user?.admin_sistema || user?.responsavel || ehSindico);

  const carregarLista = useCallback(async () => {
    try { setConversas(await apiWhatsApp.conversas()); }
    catch { /* mantém a lista atual */ }
    finally { setCarregando(false); }
  }, []);

  // lista e conversa aberta atualizam sozinhas
  useEffect(() => {
    if (!temAcesso) return;
    carregarLista();
    const timer = setInterval(async () => {
      carregarLista();
      if (abertaId) {
        try { setAberta(await apiWhatsApp.ver(abertaId)); } catch { /* tenta de novo */ }
      }
    }, ATUALIZAR_MS);
    return () => clearInterval(timer);
  }, [carregarLista, abertaId, temAcesso]);

  useEffect(() => { fimConversa.current?.scrollIntoView({ block: "end" }); }, [aberta?.id, aberta?.mensagens.length]);

  async function abrir(id: string) {
    setCarregandoConversa(true);
    setResposta("");
    try {
      const detalhe = await apiWhatsApp.ver(id);
      setAberta(detalhe);
      setConversas((lista) => lista.map((c) => (c.id === id ? { ...c, nao_lidas: 0 } : c)));
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao abrir a conversa", status: "error" }); }
    finally { setCarregandoConversa(false); }
  }

  // /WhatsApp?conversa=<id> (botão "Abrir conversa" do pop-up)
  const pedida = parametros.get("conversa");
  useEffect(() => {
    if (pedida && temAcesso) {
      abrir(pedida);
      setParametros({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedida, temAcesso]);

  async function trocarModo(acao: "assumir" | "devolver") {
    if (!aberta) return;
    if (acao === "devolver" && !window.confirm("Encerrar o atendimento? O robô volta a responder este contato.")) return;
    try { setAberta(await apiWhatsApp[acao](aberta.id)); carregarLista(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao alterar a conversa", status: "error" }); }
  }

  async function enviar() {
    if (!aberta || !resposta.trim()) return;
    setEnviando(true);
    try {
      setAberta(await apiWhatsApp.enviar(aberta.id, resposta.trim()));
      setResposta("");
      carregarLista();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao enviar", status: "error" }); }
    finally { setEnviando(false); }
  }

  if (!temAcesso) {
    return (
      <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={8} color="gray.600">Apenas o administrador, os responsáveis e os síndicos acessam o WhatsApp.</Text>
      </Flex>
    );
  }

  const termo = busca.trim().toLowerCase();
  const filtradas = conversas.filter((c) => !termo || [c.nome ?? "", c.telefone ?? "", ...c.contatos].some((t) => t.toLowerCase().includes(termo)));
  const naoLidas = conversas.reduce((total, c) => total + (c.nao_lidas > 0 ? 1 : 0), 0);

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Box marginBottom={4}>
          <Text fontSize="2xl" fontWeight="semibold" color="gray.800">WhatsApp</Text>
          <Text fontSize="sm" color="gray.500" marginTop={1}>
            {user?.responsavel || ehSindico ? "Mensagens recebidas no número do sistema. As mensagens das pessoas que são suas aparecem em um pop-up em qualquer página." : "Mensagens recebidas no número do sistema. O pop-up aparece para o responsável de cada pessoa (padrão: o síndico do prédio)."}
            {naoLidas > 0 && ` ${naoLidas} conversa(s) com mensagem nova.`}
          </Text>
        </Box>

        <PainelConexao podeConectar={Boolean(user?.admin_sistema)} />

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="green.500" size="lg" /></Flex>
        ) : conversas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <Icon as={MessageCircle} boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Nenhuma mensagem recebida ainda</Text>
            <Text fontSize="sm" color="gray.500">Conecte o número e mande uma mensagem para ele de outro celular.</Text>
          </Flex>
        ) : (
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align="stretch">

            {/* LISTA */}
            <Box width={{ base: "100%", lg: "340px" }} flexShrink={0}>
              <InputGroup size="sm" marginBottom={3}>
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3} /></InputLeftElement>
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" bg="white" borderRadius="lg" />
              </InputGroup>
              <Stack spacing={2} maxHeight={{ lg: "calc(100vh - 340px)" }} overflowY="auto">
                {filtradas.length === 0 && <Text fontSize="sm" color="gray.500" padding={3}>Nenhuma conversa encontrada.</Text>}
                {filtradas.map((c) => {
                  const selecionada = aberta?.id === c.id;
                  return (
                    <Box key={c.id} as="button" textAlign="left" onClick={() => abrir(c.id)} bg={selecionada ? "green.50" : "white"}
                      border="1px solid" borderColor={selecionada ? "green.200" : "gray.100"} borderRadius="lg" padding={3} _hover={{ borderColor: "green.200" }}>
                      <Flex justify="space-between" gap={2} align="center">
                        <Text fontSize="sm" fontWeight={c.nao_lidas ? "bold" : "semibold"} color="gray.800" noOfLines={1}>{nomeContato(c)}</Text>
                        <Flex gap={1} align="center" flexShrink={0}>
                          <Badge colorScheme={c.modo === "ATENDENTE" ? "orange" : "gray"} variant="subtle" textTransform="none" fontSize="2xs">{c.modo === "ATENDENTE" ? "Atendente" : "Robô"}</Badge>
                          {c.nao_lidas > 0 && <Badge colorScheme="green" borderRadius="full">{c.nao_lidas}</Badge>}
                        </Flex>
                      </Flex>
                      {c.contatos.length > 0 && <Text fontSize="xs" color="gray.600" noOfLines={1}>{c.contatos.join(" | ")}</Text>}
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>{c.ultima_mensagem}</Text>
                      <Text fontSize="2xs" color="gray.400" textAlign="right">{formatarDataHora(c.ultima_mensagem_em)}</Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* CONVERSA */}
            <Flex flex={1} minWidth={0} direction="column" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" minHeight="420px">
              {carregandoConversa && !aberta ? (
                <Flex flex={1} justify="center" align="center"><Spinner color="green.500" /></Flex>
              ) : !aberta ? (
                <Flex flex={1} direction="column" justify="center" align="center" color="gray.400" padding={8}>
                  <Icon as={MessageCircle} boxSize={6} />
                  <Text marginTop={2} fontSize="sm">Selecione uma conversa.</Text>
                </Flex>
              ) : (
                <>
                  <Box paddingX={5} paddingY={4} borderBottom="1px solid" borderColor="gray.100">
                    <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
                      <Box>
                    <Text fontWeight="semibold" color="gray.800">{nomeContato(aberta)}</Text>
                    <Text fontSize="xs" color="gray.500">{formatarWhats(aberta.telefone)}</Text>
                    <Text fontSize="xs" color={aberta.contatos.length ? "gray.600" : "gray.400"}>
                      {aberta.contatos.length ? aberta.contatos.join(" | ") : "Telefone não cadastrado no sistema"}
                    </Text>
                      </Box>
                      {aberta.modo === "ATENDENTE" ? (
                        <Flex align="center" gap={2}>
                          <Badge colorScheme="orange" textTransform="none">Em atendimento</Badge>
                          <Button size="xs" variant="outline" leftIcon={<Icon as={Bot} boxSize={3.5} />} onClick={() => trocarModo("devolver")}>Encerrar e devolver ao robô</Button>
                        </Flex>
                      ) : (
                        <Flex align="center" gap={2}>
                          <Badge textTransform="none">Robô atendendo</Badge>
                          <Button size="xs" colorScheme="orange" variant="outline" leftIcon={<Icon as={UserRound} boxSize={3.5} />} onClick={() => trocarModo("assumir")}>Assumir conversa</Button>
                        </Flex>
                      )}
                    </Flex>
                  </Box>

                  <Stack spacing={3} flex={1} overflowY="auto" paddingX={5} paddingY={4} maxHeight={{ lg: "calc(100vh - 460px)" }} minHeight="240px" bg="gray.50">
                    {aberta.mensagens.map((m) => (
                      <Flex key={m.id} justify={m.recebida ? "flex-start" : "flex-end"}>
                        <Box maxWidth="80%" bg={m.recebida ? "white" : "green.500"} color={m.recebida ? "gray.800" : "white"} border={m.recebida ? "1px solid" : "none"}
                          borderColor="gray.200" borderRadius="xl" paddingX={4} paddingY={2}>
                          {!m.recebida && <Text fontSize="xs" fontWeight="semibold" opacity={0.85}>{m.autor_nome ?? "Enviada"}</Text>}
                          <Text fontSize="sm" whiteSpace="pre-wrap">{m.texto}</Text>
                          <Text fontSize="2xs" opacity={0.7} textAlign="right" marginTop={1}>{formatarDataHora(m.created_at)}</Text>
                        </Box>
                      </Flex>
                    ))}
                    <div ref={fimConversa} />
                  </Stack>

                  <Flex gap={2} padding={3} borderTop="1px solid" borderColor="gray.100" align="flex-end">
                    <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={2} resize="none" maxLength={4000}
                      placeholder="Escreva a resposta... (Ctrl+Enter envia)"
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar(); }} />
                    <Button colorScheme="green" onClick={enviar} isLoading={enviando} isDisabled={!resposta.trim()} leftIcon={<Icon as={Send} boxSize={3.5} />}>Enviar</Button>
                  </Flex>
                </>
              )}
            </Flex>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
