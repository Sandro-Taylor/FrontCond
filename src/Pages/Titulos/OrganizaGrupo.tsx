import { Box, Button, Collapse, Icon, Text, Tooltip, VStack } from "@chakra-ui/react";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { AJUDA_MENU, ROTAS } from "./Dados";

// TÓPICO DO MENU: abre e fecha como leque; abre sozinho se a página atual está nele
const CHAVE_MENU = "menu_topicos_abertos";

function lerAbertos(): Record<string, boolean> {try { return JSON.parse(localStorage.getItem(CHAVE_MENU) ?? "{}"); } catch { return {};}}

// ITEM DO MENU (destaca a página atual; ao passar o mouse mostra o que a página faz: AJUDA_MENU em Dados.ts)
export const ItemMenu = ({ para, icone, children }: { para: string; icone: ElementType; children: ReactNode }) => {
  const { pathname } = useLocation();
  const ativo = para === ROTAS.INICIO ? pathname === para : pathname.toLowerCase().startsWith(para.toLowerCase());
  return (
    <Tooltip label={AJUDA_MENU[para]} placement="right" hasArrow openDelay={400} maxWidth="280px" fontSize="xs">
      <Button as={RouterLink} to={para} variant={ativo ? "solid" : "ghost"} colorScheme={ativo ? "blue" : undefined} bg={ativo ? "blue.50" : undefined}
        color={ativo ? "blue.700" : undefined} size="sm" justifyContent="flex-start" leftIcon={<Icon as={icone} boxSize={4} />} fontWeight={ativo ? "semibold" : "medium"}>
        {children}
      </Button>
    </Tooltip>
  );
};

export const Grupo = ({ id, titulo, icone, rotas, children }: { id: string; titulo: string; icone: ElementType; rotas: string[]; children: ReactNode }) => {
  const { pathname } = useLocation();
  const contemAtual = rotas.some((r) => pathname.toLowerCase().startsWith(r.toLowerCase()));
  const [aberto, setAberto] = useState<boolean>(() => lerAbertos()[id] ?? contemAtual);
  useEffect(() => { if (contemAtual) setAberto(true); }, [contemAtual]);
  function alternar() {
    const novo = !aberto;
    setAberto(novo);
    try { localStorage.setItem(CHAVE_MENU, JSON.stringify({ ...lerAbertos(), [id]: novo })); } catch { /* sem localStorage */ }
  }

  return (
    <Box>
      <Button variant="ghost" size="sm" width="100%" justifyContent="space-between" onClick={alternar} aria-expanded={aberto}
        color={contemAtual ? "blue.700" : "gray.700"} fontWeight="semibold"
        leftIcon={<Icon as={icone} boxSize={4} />} rightIcon={<Icon as={ChevronDown} boxSize={4} transition="transform 0.2s" transform={aberto ? "rotate(180deg)" : undefined} />}>
        <Text as="span" flex={1} textAlign="left">{titulo}</Text>
      </Button>
      <Collapse in={aberto} animateOpacity>
        <VStack align="stretch" spacing={1} paddingLeft={4} marginLeft={3} marginTop={1} borderLeft="1px solid" borderColor="gray.100">
          {children}
        </VStack>
      </Collapse>
    </Box>
  );
};
