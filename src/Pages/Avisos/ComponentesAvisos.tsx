// ---------------------------------------------------------
// COMPONENTES DOS AVISOS
// ---------------------------------------------------------
// CartaoAviso: um aviso com "li e estou ciente"; para a
//              gestão, mostra quantos leram e as ações.
// ModalAviso:  publicar / editar aviso (gestão).
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Badge, Box, Button, Checkbox, Flex, FormControl, FormHelperText, FormLabel, Icon, IconButton, Input, Menu, MenuButton,
  MenuItem, MenuList, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Popover,
  PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger, Select, SimpleGrid, Spinner, Text, Textarea, useToast,
} from "@chakra-ui/react";
import { CheckIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Pin } from "lucide-react";

import { formatarDataHora, formatarDataIso } from "../../Components/config";
import { ROTULOS_PRIORIDADE, apiAvisos, type Aviso, type AvisoEditar, type Leitura, type PrioridadeAviso } from "./ConfigAvisos";

// quem leu (gestão)
const Leituras = ({ aviso }: { aviso: Aviso }) => {
  const [leituras, setLeituras] = useState<Leitura[] | null>(null);
  return (
    <Popover placement="bottom-start" isLazy onOpen={() => apiAvisos.leituras(aviso.id).then(setLeituras).catch(() => setLeituras([]))}>
      <PopoverTrigger>
        <Button size="xs" variant="link" color="gray.500" fontWeight="normal">
          {aviso.total_leituras} de {aviso.total_destinatarios} confirmaram leitura
        </Button>
      </PopoverTrigger>
      <PopoverContent width="280px">
        <PopoverArrow />
        <PopoverBody maxHeight="260px" overflowY="auto">
          {leituras === null ? <Spinner size="sm" /> : leituras.length === 0 ? (
            <Text fontSize="sm" color="gray.500">Ninguém confirmou ainda.</Text>
          ) : leituras.map((l) => (
            <Flex key={l.nome + l.lido_em} justify="space-between" fontSize="sm" paddingY={1} gap={2}>
              <Text noOfLines={1}>{l.nome}</Text>
              <Text color="gray.500" fontSize="xs" flexShrink={0}>{formatarDataHora(l.lido_em)}</Text>
            </Flex>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

type CartaoProps = {
  aviso: Aviso;
  gestao: boolean;
  resumido?: boolean; // quadro da página inicial: corta o texto
  aoCiente: (aviso: Aviso) => void;
  aoEditar?: (aviso: Aviso) => void;
  aoAlternarFixado?: (aviso: Aviso) => void;
  aoArquivar?: (aviso: Aviso) => void;
  aoExcluir?: (aviso: Aviso) => void;
};

export const CartaoAviso = ({ aviso, gestao, resumido, aoCiente, aoEditar, aoAlternarFixado, aoArquivar, aoExcluir }: CartaoProps) => {
  const [expandido, setExpandido] = useState(!resumido);
  const prioridade = ROTULOS_PRIORIDADE[aviso.prioridade];
  const corBorda = aviso.prioridade === "URGENTE" ? "red.400" : aviso.prioridade === "IMPORTANTE" ? "orange.300" : "gray.200";

  return (
    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" borderLeft="4px solid" borderLeftColor={corBorda}
      padding={4} opacity={aviso.vigente ? 1 : 0.6}>
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box minWidth={0}>
          <Flex align="center" gap={2} wrap="wrap">
            {aviso.fixado && <Icon as={Pin} boxSize={3.5} color="blue.500" />}
            <Text fontWeight="semibold" color="gray.800">{aviso.titulo}</Text>
            {aviso.prioridade !== "NORMAL" && <Badge colorScheme={prioridade.cor} textTransform="none">{prioridade.rotulo}</Badge>}
            {!aviso.lido && aviso.vigente && <Badge colorScheme="blue" variant="solid" textTransform="none">Novo</Badge>}
            {!aviso.ativo && <Badge textTransform="none">Arquivado</Badge>}
            {aviso.ativo && !aviso.vigente && <Badge textTransform="none">Expirado</Badge>}
          </Flex>
          <Text fontSize="xs" color="gray.500" marginTop={0.5}>
            {aviso.autor_nome} · {formatarDataHora(aviso.created_at)}
            {aviso.expira_em && ` · válido até ${formatarDataIso(aviso.expira_em)}`}
          </Text>
        </Box>
        {gestao && (
          <Menu placement="bottom-end">
            <MenuButton as={IconButton} aria-label="Ações" icon={<ChevronDownIcon />} size="xs" variant="ghost" />
            <MenuList fontSize="sm">
              {aoEditar && <MenuItem onClick={() => aoEditar(aviso)}>Editar</MenuItem>}
              {aoAlternarFixado && <MenuItem onClick={() => aoAlternarFixado(aviso)}>{aviso.fixado ? "Desafixar" : "Fixar no topo"}</MenuItem>}
              {aoArquivar && <MenuItem onClick={() => aoArquivar(aviso)}>{aviso.ativo ? "Arquivar" : "Restaurar"}</MenuItem>}
              {aoExcluir && <MenuItem color="red.600" onClick={() => aoExcluir(aviso)}>Excluir</MenuItem>}
            </MenuList>
          </Menu>
        )}
      </Flex>

      <Text marginTop={3} fontSize="sm" color="gray.700" whiteSpace="pre-wrap" noOfLines={expandido ? undefined : 3}>{aviso.conteudo}</Text>
      {resumido && aviso.conteudo.length > 180 && (
        <Button size="xs" variant="link" colorScheme="blue" marginTop={1} onClick={() => setExpandido(!expandido)}>{expandido ? "Ver menos" : "Ler tudo"}</Button>
      )}

      <Flex marginTop={3} justify="space-between" align="center" gap={3} wrap="wrap">
        {gestao && aviso.total_leituras !== null ? <Leituras aviso={aviso} /> : <span />}
        {aviso.ativo && (aviso.lido ? (
          <Flex align="center" gap={1} fontSize="xs" color="green.600"><CheckIcon boxSize={2.5} /> Ciente</Flex>
        ) : (
          <Button size="xs" colorScheme="blue" variant="outline" onClick={() => aoCiente(aviso)}>Li e estou ciente</Button>
        ))}
      </Flex>
    </Box>
  );
};


// =========================================================
// PUBLICAR / EDITAR
// =========================================================

export const ModalAviso = ({ aberto, aoFechar, aviso, aoSalvar }: {
  aberto: boolean; aoFechar: () => void; aviso: Aviso | null; aoSalvar: (dados: AvisoEditar) => Promise<void>;
}) => {
  const toast = useToast();
  const vazio = { titulo: "", conteudo: "", prioridade: "NORMAL" as PrioridadeAviso, fixado: false, expira_em: "", ativo: true };
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm(aviso
      ? { titulo: aviso.titulo, conteudo: aviso.conteudo, prioridade: aviso.prioridade, fixado: aviso.fixado, expira_em: aviso.expira_em ?? "", ativo: aviso.ativo }
      : { titulo: "", conteudo: "", prioridade: "NORMAL", fixado: false, expira_em: "", ativo: true });
  }, [aberto, aviso]);

  async function salvar() {
    if (form.titulo.trim().length < 3) { toast({ title: "Informe um título (mínimo 3 letras)", status: "warning" }); return; }
    if (!form.conteudo.trim()) { toast({ title: "Escreva o texto do aviso", status: "warning" }); return; }
    setSalvando(true);
    try {
      await aoSalvar({ ...form, titulo: form.titulo.trim(), conteudo: form.conteudo.trim(), expira_em: form.expira_em || null });
    } finally { setSalvando(false); }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>{aviso ? "Editar aviso" : "Novo aviso"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Título</FormLabel>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} maxLength={150} placeholder="Ex.: Manutenção do elevador" />
          </FormControl>
          <FormControl isRequired marginTop={3}>
            <FormLabel fontSize="sm">Texto</FormLabel>
            <Textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={7} />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3}>
            <FormControl>
              <FormLabel fontSize="sm">Prioridade</FormLabel>
              <Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as PrioridadeAviso })}>
                {(Object.keys(ROTULOS_PRIORIDADE) as PrioridadeAviso[]).map((p) => <option key={p} value={p}>{ROTULOS_PRIORIDADE[p].rotulo}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Válido até</FormLabel>
              <Input type="date" value={form.expira_em} onChange={(e) => setForm({ ...form, expira_em: e.target.value })} />
              <FormHelperText fontSize="xs">Em branco: fica no quadro até ser arquivado.</FormHelperText>
            </FormControl>
          </SimpleGrid>
          <Checkbox marginTop={3} isChecked={form.fixado} onChange={(e) => setForm({ ...form, fixado: e.target.checked })}>
            <Text fontSize="sm">Fixar no topo do quadro</Text>
          </Checkbox>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>{aviso ? "Salvar" : "Publicar"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
