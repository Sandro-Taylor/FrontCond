// ---------------------------------------------------------
// AVISOS (quadro completo)
// ---------------------------------------------------------
// Todos: leem e confirmam "li e estou ciente".
// ADM/SINDICO: publicam, editam, fixam, arquivam e veem
//              quem já confirmou a leitura.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { Box, Button, ButtonGroup, Flex, Icon, Spinner, Stack, Text, useDisclosure, useToast } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { Megaphone } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { apiAvisos, type Aviso, type AvisoEditar } from "./ConfigAvisos";
import { CartaoAviso, ModalAviso } from "./ComponentesAvisos";

// aviso -> dados para o PUT (alterando só o que for passado)
const paraEditar = (aviso: Aviso, mudancas: Partial<AvisoEditar>): AvisoEditar => ({
  titulo: aviso.titulo, conteudo: aviso.conteudo, prioridade: aviso.prioridade, fixado: aviso.fixado,
  expira_em: aviso.expira_em, ativo: aviso.ativo, ...mudancas,
});

export const Avisos = () => {
  const toast = useToast();
  const { editaTudo: gestao } = usePermissoes();
  const modal = useDisclosure();

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [historico, setHistorico] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Aviso | null>(null);

  const carregar = useCallback(async () => {
    try {
      setAvisos(await apiAvisos.listar(historico));
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro ao carregar os avisos", status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [historico, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  async function executar(acao: () => Promise<unknown>, sucesso?: string) {
    try {
      await acao();
      if (sucesso) toast({ title: sucesso, status: "success", duration: 2000 });
      await carregar();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Não foi possível concluir a ação", status: "error" });
    }
  }

  const ciente = (aviso: Aviso) => executar(() => apiAvisos.ciente(aviso.id));
  const alternarFixado = (aviso: Aviso) => executar(() => apiAvisos.editar(aviso.id, paraEditar(aviso, { fixado: !aviso.fixado })));
  const arquivar = (aviso: Aviso) => executar(() => apiAvisos.editar(aviso.id, paraEditar(aviso, { ativo: !aviso.ativo })), aviso.ativo ? "Aviso arquivado" : "Aviso restaurado");
  const excluir = (aviso: Aviso) => {
    if (window.confirm(`Excluir o aviso "${aviso.titulo}"? Esta ação não pode ser desfeita.`)) executar(() => apiAvisos.excluir(aviso.id), "Aviso excluído");
  };

  function abrir(aviso: Aviso | null) {
    setEditando(aviso);
    modal.onOpen();
  }

  async function salvar(dados: AvisoEditar) {
    try {
      if (editando) await apiAvisos.editar(editando.id, dados);
      else await apiAvisos.publicar(dados);
      toast({ title: editando ? "Aviso atualizado" : "Aviso publicado", status: "success", duration: 2000 });
      modal.onClose();
      await carregar();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro ao salvar o aviso", status: "error" });
    }
  }

  const naoLidos = avisos.filter((a) => a.vigente && !a.lido).length;

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }} maxWidth="900px">
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Quadro de avisos</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>
              Comunicados da administração do condomínio.{naoLidos > 0 && ` Você tem ${naoLidos} aviso(s) novo(s).`}
            </Text>
          </Box>
          {gestao && <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={() => abrir(null)}>Novo aviso</Button>}
        </Flex>

        <ButtonGroup size="sm" isAttached variant="outline" marginBottom={5}>
          <Button onClick={() => setHistorico(false)} colorScheme={historico ? "gray" : "blue"} variant={historico ? "outline" : "solid"}>Em vigor</Button>
          <Button onClick={() => setHistorico(true)} colorScheme={historico ? "blue" : "gray"} variant={historico ? "solid" : "outline"}>Histórico</Button>
        </ButtonGroup>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : avisos.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <Icon as={Megaphone} boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Nenhum aviso {historico ? "publicado" : "em vigor"}</Text>
          </Flex>
        ) : (
          <Stack spacing={3}>
            {avisos.map((aviso) => (
              <CartaoAviso key={aviso.id} aviso={aviso} gestao={gestao} aoCiente={ciente}
                aoEditar={gestao ? abrir : undefined} aoAlternarFixado={gestao ? alternarFixado : undefined}
                aoArquivar={gestao ? arquivar : undefined} aoExcluir={gestao ? excluir : undefined} />
            ))}
          </Stack>
        )}

        {gestao && <ModalAviso aberto={modal.isOpen} aoFechar={modal.onClose} aviso={editando} aoSalvar={salvar} />}
      </Box>
    </Flex>
  );
};
