// ---------------------------------------------------------
// QUADRO DE AVISOS DA PÁGINA INICIAL
// ---------------------------------------------------------
// Mostra os avisos em vigor (fixados e urgentes primeiro),
// com "li e estou ciente", e o acesso ao "fale com o síndico"
// (para a gestão: atendimento com o número de novidades).
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Badge, Box, Button, Flex, Icon, Spinner, Stack, Text, useToast } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { Megaphone, MessageSquare } from "lucide-react";

import { usePermissoes } from "../../Components/permissoes";
import { apiChamados } from "../Atendimento/ConfigAtendimento";
import { apiAvisos, type Aviso } from "./ConfigAvisos";
import { CartaoAviso } from "./ComponentesAvisos";

const LIMITE = 4;

export const QuadroAvisos = () => {
  const toast = useToast();
  const { editaTudo: gestao } = usePermissoes();
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [novidades, setNovidades] = useState(0);

  const carregar = useCallback(async () => {
    try { setAvisos(await apiAvisos.listar()); }
    catch { setAvisos([]); }
  }, []);

  useEffect(() => {
    carregar();
    apiChamados.listar().then((lista) => setNovidades(lista.filter((c) => c.nao_lido).length)).catch(() => setNovidades(0));
  }, [carregar]);

  async function ciente(aviso: Aviso) {
    try {
      const atualizado = await apiAvisos.ciente(aviso.id);
      setAvisos((lista) => (lista ?? []).map((a) => (a.id === atualizado.id ? atualizado : a)));
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Não foi possível confirmar a leitura", status: "error" });
    }
  }

  const naoLidos = (avisos ?? []).filter((a) => !a.lido).length;

  return (
    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" marginTop={6}>
      <Flex justify="space-between" align="center" gap={3} paddingX={5} paddingY={4} borderBottom="1px solid" borderColor="gray.100" wrap="wrap">
        <Flex align="center" gap={2}>
          <Icon as={Megaphone} boxSize={4} color="gray.500" />
          <Text fontWeight="semibold">Quadro de avisos</Text>
          {naoLidos > 0 && <Badge colorScheme="blue" variant="solid" borderRadius="full" paddingX={2}>{naoLidos} novo(s)</Badge>}
        </Flex>
        <Flex gap={2} wrap="wrap">
          {gestao ? (
            <Button as={RouterLink} to="/Atendimento" size="sm" variant="outline" leftIcon={<Icon as={MessageSquare} boxSize={3.5} />}>
              Atendimento{novidades > 0 && <Badge marginLeft={2} colorScheme="red" variant="solid" borderRadius="full">{novidades}</Badge>}
            </Button>
          ) : (
            <Button as={RouterLink} to="/Atendimento?novo=1" size="sm" colorScheme="blue" leftIcon={<Icon as={MessageSquare} boxSize={3.5} />}>
              Fale com o síndico{novidades > 0 && <Badge marginLeft={2} colorScheme="red" variant="solid" borderRadius="full">{novidades}</Badge>}
            </Button>
          )}
          {gestao && <Button as={RouterLink} to="/Avisos" size="sm" variant="outline" leftIcon={<AddIcon boxSize={2.5} />}>Publicar aviso</Button>}
          <Button as={RouterLink} to="/Avisos" size="sm" variant="ghost">Ver todos</Button>
        </Flex>
      </Flex>

      <Box padding={4}>
        {avisos === null ? (
          <Flex justify="center" padding={6}><Spinner size="sm" color="blue.500" /></Flex>
        ) : avisos.length === 0 ? (
          <Text fontSize="sm" color="gray.400" padding={2}>Nenhum aviso no momento.</Text>
        ) : (
          <Stack spacing={3}>
            {avisos.slice(0, LIMITE).map((aviso) => <CartaoAviso key={aviso.id} aviso={aviso} gestao={gestao} resumido aoCiente={ciente} />)}
            {avisos.length > LIMITE && (
              <Button as={RouterLink} to="/Avisos" size="sm" variant="link" colorScheme="blue" alignSelf="flex-start">
                Ver mais {avisos.length - LIMITE} aviso(s)
              </Button>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};
