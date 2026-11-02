// ---------------------------------------------------------
// POP-UP DE MENSAGENS DO WHATSAPP (responsáveis e síndicos)
// ---------------------------------------------------------
// Fica em todas as páginas. A cada poucos segundos pergunta
// ao backend se chegaram mensagens novas; cada contato vira
// um cartão no canto da tela, com resposta rápida.
// Na página WhatsApp não aparece (lá as conversas já atualizam).
// ---------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, CloseButton, Flex, Icon, ScaleFade, Stack, Text, Textarea, useToast } from "@chakra-ui/react";
import { MessageCircle, Send } from "lucide-react";

import { useAuth } from "../Login/useAuth";
import { ROTAS } from "../Titulos/Titulos";
import { formatarDataHora } from "../../Components/config";
import { apiWhatsApp, formatarWhats, nomeContato, type Novidade } from "./ConfigWhatsApp";

const INTERVALO_MS = 4000;
const MAX_CARTOES = 4;
const MARGEM_MS = 30000; // pergunta um pouco para trás (o id evita repetir) para não perder nada

type Cartao = {
  conversa_id: string;
  nome: string | null;
  telefone: string | null;
  contatos: string[];
  mensagens: { id: string; texto: string; created_at: string }[];
};

function bipe() {
  try {
    const contexto = new AudioContext();
    const oscilador = contexto.createOscillator();
    const volume = contexto.createGain();
    oscilador.frequency.value = 880;
    volume.gain.value = 0.05;
    oscilador.connect(volume);
    volume.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.15);
    oscilador.onended = () => { contexto.close(); };
  } catch { /* navegador sem áudio */ }
}

const CartaoWhatsApp = ({ cartao, aoFechar, aoAbrir }: { cartao: Cartao; aoFechar: () => void; aoAbrir: () => void }) => {
  const toast = useToast();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function responder() {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await apiWhatsApp.enviar(cartao.conversa_id, texto.trim());
      toast({ title: `Resposta enviada para ${nomeContato(cartao)}`, status: "success", duration: 2500 });
      aoFechar();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Não foi possível enviar", status: "error" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScaleFade in initialScale={0.9}>
      <Box bg="white" borderRadius="xl" boxShadow="xl" border="1px solid" borderColor="green.100" overflow="hidden">
        <Flex bg="green.500" color="white" paddingX={4} paddingY={2} align="center" gap={2}>
          <Icon as={MessageCircle} boxSize={4} />
          <Box flex={1} minWidth={0}>
            <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{nomeContato(cartao)}</Text>
            {cartao.nome && cartao.telefone && <Text fontSize="2xs" opacity={0.9}>{formatarWhats(cartao.telefone)}</Text>}
          </Box>
          <CloseButton size="sm" onClick={aoFechar} aria-label="Fechar" />
        </Flex>

        <Box paddingX={4} paddingTop={3}>
          {cartao.contatos.length > 0
            ? <Text fontSize="xs" color="gray.600" noOfLines={2}>{cartao.contatos.join(" | ")}</Text>
            : <Text fontSize="xs" color="gray.400">Telefone não cadastrado no sistema</Text>}
          <Stack spacing={2} marginTop={2} maxHeight="160px" overflowY="auto">
            {cartao.mensagens.slice(-3).map((m) => (
              <Box key={m.id} bg="green.50" borderRadius="lg" paddingX={3} paddingY={2}>
                <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" noOfLines={5}>{m.texto}</Text>
                <Text fontSize="2xs" color="gray.500" textAlign="right">{formatarDataHora(m.created_at)}</Text>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box padding={3}>
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} resize="none" size="sm" borderRadius="lg" maxLength={4000}
            placeholder="Responder pelo WhatsApp... (Ctrl+Enter envia)"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) responder(); }} />
          <Flex justify="space-between" marginTop={2} gap={2}>
            <Button size="sm" variant="ghost" onClick={aoAbrir}>Abrir conversa</Button>
            <Button size="sm" colorScheme="green" onClick={responder} isLoading={enviando} isDisabled={!texto.trim()} leftIcon={<Icon as={Send} boxSize={3.5} />}>Responder</Button>
          </Flex>
        </Box>
      </Box>
    </ScaleFade>
  );
};

export const PopupWhatsApp = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // o backend só devolve as mensagens que são de quem está logado
  const ativo = Boolean(user && !user.trocar_senha && (user.responsavel || user.condominios.some((c) => c.perfil === "SINDICO")));
  const naPaginaWhatsApp = pathname.toLowerCase().startsWith(ROTAS.WHATSAPP.toLowerCase());

  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const vistos = useRef(new Set<string>());
  const desde = useRef<string | null>(null);
  const naPaginaRef = useRef(naPaginaWhatsApp);
  naPaginaRef.current = naPaginaWhatsApp;

  // na página WhatsApp os cartões somem (a conversa já aparece lá)
  useEffect(() => { if (naPaginaWhatsApp) setCartoes([]); }, [naPaginaWhatsApp]);

  useEffect(() => {
    if (!ativo) { setCartoes([]); desde.current = null; return; }
    let parado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;

    function adicionar(novas: Novidade[]) {
      setCartoes((atuais) => {
        let lista = [...atuais];
        for (const m of novas) {
          const existente = lista.find((c) => c.conversa_id === m.conversa_id);
          const mensagem = { id: m.id, texto: m.texto, created_at: m.created_at };
          const cartao: Cartao = existente
            ? { ...existente, nome: m.nome, mensagens: [...existente.mensagens, mensagem] }
            : { conversa_id: m.conversa_id, nome: m.nome, telefone: m.telefone, contatos: m.contatos, mensagens: [mensagem] };
          lista = [cartao, ...lista.filter((c) => c.conversa_id !== m.conversa_id)];
        }
        return lista.slice(0, MAX_CARTOES);
      });
    }

    async function consultar() {
      try {
        const resposta = await apiWhatsApp.novidades(desde.current);
        desde.current = new Date(new Date(resposta.agora).getTime() - MARGEM_MS).toISOString();
        const novas = resposta.mensagens.filter((m) => !vistos.current.has(m.id));
        novas.forEach((m) => vistos.current.add(m.id));
        if (novas.length > 0 && !naPaginaRef.current && !parado) {
          adicionar(novas);
          bipe();
        }
      } catch { /* backend fora do ar: tenta de novo na próxima */ }
      if (!parado) espera = setTimeout(consultar, INTERVALO_MS);
    }

    consultar();
    return () => { parado = true; clearTimeout(espera); };
  }, [ativo]);

  if (!ativo || cartoes.length === 0) return null;

  const fechar = (id: string) => setCartoes((lista) => lista.filter((c) => c.conversa_id !== id));

  return (
    <Stack position="fixed" bottom={4} right={4} zIndex={1400} spacing={3} width={{ base: "calc(100vw - 32px)", sm: "360px" }} maxHeight="calc(100vh - 32px)" overflowY="auto">
      {cartoes.map((cartao) => (
        <CartaoWhatsApp key={cartao.conversa_id} cartao={cartao} aoFechar={() => fechar(cartao.conversa_id)}
          aoAbrir={() => { fechar(cartao.conversa_id); navigate(`${ROTAS.WHATSAPP}?conversa=${cartao.conversa_id}`); }} />
      ))}
    </Stack>
  );
};
