// ---------------------------------------------------------
// CONSELHEIROS DO CONDOMÍNIO (só ADM do sistema)
// ---------------------------------------------------------
// Marca quais pessoas do condomínio são conselheiras. Pode ser
// qualquer pessoa ativa da lista (menos o síndico). Quem for
// desmarcado volta a ser morador.
// ---------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  Badge, Box, Button, Checkbox, Flex, Input, InputGroup, InputLeftElement, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, Spinner, Stack, Text, useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

import { ROTULOS_PERFIL, type PerfilPessoa } from "../Pessoas/ConfigPessoas";
import { apiCondominios, type CondominioPainel, type PessoaDoCondominio } from "./ConfigCondominios";

export function ModalConselheiros({ aberto, aoFechar, item, aoSalvo }: {
  aberto: boolean; aoFechar: () => void; item: CondominioPainel | null; aoSalvo: () => void;
}) {
  const toast = useToast();
  const [pessoas, setPessoas] = useState<PessoaDoCondominio[] | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto || !item) return;
    setPessoas(null); setBusca("");
    setMarcados(new Set(item.conselheiros.map((c) => c.pessoa_id)));
    apiCondominios.pessoasDe(item.condominio.id).then(setPessoas).catch(() => setPessoas([]));
  }, [aberto, item]);

  const termo = busca.trim().toLowerCase();
  const candidatos = useMemo(() => (pessoas ?? [])
    .filter((p) => p.ativo && p.perfil !== "SINDICO")
    .filter((p) => !termo || p.nome.toLowerCase().includes(termo) || (p.email ?? "").toLowerCase().includes(termo))
    .sort((a, b) => Number(marcados.has(b.id)) - Number(marcados.has(a.id)) || a.nome.localeCompare(b.nome)),
  [pessoas, termo, marcados]);

  function alternar(id: string) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  }

  async function salvar() {
    if (!item) return;
    setSalvando(true);
    try {
      await apiCondominios.definirConselheiros(item.condominio.id, Array.from(marcados));
      toast({ title: "Conselheiros atualizados", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>
          Conselheiros
          <Text fontSize="sm" fontWeight="normal" color="gray.500">{item?.condominio.nome} · {marcados.size} selecionado(s)</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <InputGroup size="sm" marginBottom={3}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3} /></InputLeftElement>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa" borderRadius="lg" />
          </InputGroup>
          {!pessoas ? (
            <Flex justify="center" padding={6}><Spinner /></Flex>
          ) : candidatos.length === 0 ? (
            <Text fontSize="sm" color="gray.500">Nenhuma pessoa encontrada. Cadastre as pessoas do condomínio em Pessoas.</Text>
          ) : (
            <Stack spacing={1}>
              {candidatos.map((p) => (
                <Box key={p.id} as="label" display="flex" alignItems="center" gap={3} paddingX={2} paddingY={2} borderRadius="md" cursor="pointer"
                  bg={marcados.has(p.id) ? "blue.50" : undefined} _hover={{ bg: marcados.has(p.id) ? "blue.50" : "gray.50" }}>
                  <Checkbox isChecked={marcados.has(p.id)} onChange={() => alternar(p.id)} />
                  <Box flex={1} minWidth={0}>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{p.nome}</Text>
                    {p.email && <Text fontSize="xs" color="gray.500" noOfLines={1}>{p.email}</Text>}
                  </Box>
                  <Badge variant="subtle" textTransform="none" fontSize="2xs">{ROTULOS_PERFIL[p.perfil as PerfilPessoa] ?? p.perfil}</Badge>
                </Box>
              ))}
            </Stack>
          )}
          <Text fontSize="xs" color="gray.500" marginTop={3}>Quem for desmarcado volta a ser morador. Para acessar o sistema, dê acesso à pessoa em Pessoas.</Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando} isDisabled={!pessoas}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
