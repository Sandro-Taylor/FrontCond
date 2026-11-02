// ---------------------------------------------------------
// PAINEL DO SISTEMA – CONDOMÍNIOS (somente ADM)
// ---------------------------------------------------------
// Todos os condomínios com síndico e números principais.
// Novo condomínio em 2 passos: dados -> síndico (com login).
// Ações: entrar no condomínio, editar, trocar síndico,
// arquivar/restaurar.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge, Box, Button, Flex, IconButton, Input, InputGroup, InputLeftElement, Menu, MenuButton, MenuItem, MenuList,
  SimpleGrid, Spinner, Text, Tooltip, useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, ChevronDownIcon, SearchIcon, WarningTwoIcon } from "@chakra-ui/icons";

import { formatarCnpj } from "../../Components/config";
import { useAuth } from "../Login/useAuth";
import { Titulo } from "../Titulos/Titulos";
import { apiCondominios, type Condominio, type CondominioPainel } from "./ConfigCondominios";
import { ModalCondominio, ModalSindico } from "./ModaisCondominio";
import { ModalConselheiros } from "./ModalConselheiros";

const Indicador = ({ rotulo, valor, cor }: { rotulo: string; valor: number; cor?: string }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Text fontSize="xs" fontWeight="medium" color="gray.500">{rotulo}</Text>
    <Text marginTop={1} fontSize="2xl" fontWeight="semibold" color={cor ?? "gray.800"}>{valor}</Text>
  </Box>
);

const Numero = ({ rotulo, valor }: { rotulo: string; valor: number }) => (
  <Box>
    <Text fontSize="lg" fontWeight="semibold" color="gray.800" lineHeight="1.1">{valor}</Text>
    <Text fontSize="2xs" color="gray.500">{rotulo}</Text>
  </Box>
);

export const Condominios = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, recarregarUsuario, trocarCondominio } = useAuth();
  const modalCondominio = useDisclosure();
  const modalSindico = useDisclosure();
  const modalConselheiros = useDisclosure();

  const [itens, setItens] = useState<CondominioPainel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [editando, setEditando] = useState<Condominio | null>(null);
  const [itemSindico, setItemSindico] = useState<CondominioPainel | null>(null);

  const carregar = useCallback(async () => {
    try { setItens(await apiCondominios.painel()); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar os condomínios", status: "error" }); }
    finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  function novo() { setEditando(null); modalCondominio.onOpen(); }
  function editar(c: Condominio) { setEditando(c); modalCondominio.onOpen(); }
  function sindico(item: CondominioPainel) { setItemSindico(item); modalSindico.onOpen(); }
  function conselheiros(item: CondominioPainel) { setItemSindico(item); modalConselheiros.onOpen(); }

  async function aoSalvo(salvo: Condominio, eraNovo: boolean) {
    modalCondominio.onClose();
    toast({ title: eraNovo ? "Condomínio cadastrado" : "Condomínio atualizado", status: "success", duration: 2000 });
    await recarregarUsuario();
    const lista = await apiCondominios.painel().catch(() => itens);
    setItens(lista);
    // passo 2: designar o síndico do condomínio novo
    const item = lista.find((i) => i.condominio.id === salvo.id);
    if (eraNovo && item) sindico(item);
  }

  async function entrar(c: Condominio) {
    await recarregarUsuario();
    trocarCondominio(c.id);
    navigate("/");
  }

  async function alternarAtivo(c: Condominio) {
    if (c.ativo && !window.confirm(`Arquivar o condomínio "${c.nome}"? Os dados ficam guardados, mas ninguém consegue acessá-lo.`)) return;
    try {
      if (c.ativo) await apiCondominios.arquivar(c.id);
      else await apiCondominios.restaurar(c.id);
      toast({ title: c.ativo ? "Condomínio arquivado" : "Condomínio restaurado", status: "success", duration: 2000 });
      await carregar();
      await recarregarUsuario();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro ao alterar o condomínio", status: "error" });
    }
  }

  if (!user?.admin_sistema) {
    return (
      <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Apenas o administrador do sistema acessa o painel de condomínios.</Text>
      </Flex>
    );
  }

  const ativos = itens.filter((i) => i.condominio.ativo);
  const termo = busca.trim().toLowerCase();
  const filtrados = itens.filter((i) => {
    if (!mostrarArquivados && !i.condominio.ativo) return false;
    if (!termo) return true;
    const c = i.condominio;
    return [c.nome, c.cidade, c.bairro, c.cnpj, ...i.sindicos.map((s) => s.nome)].some((t) => (t ?? "").toLowerCase().includes(termo));
  });

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Painel do sistema</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Todos os condomínios, seus síndicos e pendências.</Text>
          </Box>
          <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={novo}>Novo condomínio</Button>
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
          <Indicador rotulo="Condomínios ativos" valor={ativos.length} />
          <Indicador rotulo="Apartamentos" valor={ativos.reduce((t, i) => t + i.total_apartamentos, 0)} />
          <Indicador rotulo="Usuários com acesso" valor={ativos.reduce((t, i) => t + i.total_usuarios, 0)} />
          <Indicador rotulo="Sem síndico" valor={ativos.filter((i) => i.sindicos.length === 0).length} cor="orange.500" />
        </SimpleGrid>

        <Flex gap={3} marginBottom={5} align="center" wrap="wrap">
          <InputGroup maxWidth="380px">
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, cidade, CNPJ ou síndico" bg="white" borderRadius="lg" />
          </InputGroup>
          <Button size="sm" variant={mostrarArquivados ? "solid" : "ghost"} onClick={() => setMostrarArquivados(!mostrarArquivados)}>
            {mostrarArquivados ? "Ocultar arquivados" : "Mostrar arquivados"}
          </Button>
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : filtrados.length === 0 ? (
          <Box bg="white" borderRadius="xl" padding={10} textAlign="center" border="1px solid" borderColor="gray.100">
            <Text color="gray.500">{itens.length === 0 ? "Nenhum condomínio cadastrado ainda." : "Nenhum condomínio encontrado."}</Text>
            {itens.length === 0 && <Button marginTop={4} size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={novo}>Novo condomínio</Button>}
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2, "2xl": 3 }} spacing={4}>
            {filtrados.map((item) => {
              const c = item.condominio;
              const pendencias = [
                item.chamados_aguardando > 0 && `${item.chamados_aguardando} chamado(s) aguardando`,
                item.cotas_atrasadas > 0 && `${item.cotas_atrasadas} cota(s) atrasada(s)`,
                item.tarefas_atrasadas > 0 && `${item.tarefas_atrasadas} tarefa(s) atrasada(s)`,
              ].filter(Boolean) as string[];
              return (
                <Flex key={c.id} direction="column" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={5} gap={4} opacity={c.ativo ? 1 : 0.6}>
                  <Flex justify="space-between" align="flex-start" gap={3}>
                    <Box minWidth={0}>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="semibold" fontSize="lg" color="gray.800" noOfLines={1}>{c.nome}</Text>
                        {!c.ativo && <Badge textTransform="none">Arquivado</Badge>}
                      </Flex>
                      <Text fontSize="xs" color="gray.500">
                        {[c.cidade && `${c.cidade}${c.uf ? `/${c.uf}` : ""}`, c.cnpj && `CNPJ ${formatarCnpj(c.cnpj)}`].filter(Boolean).join(" · ") || "Endereço não informado"}
                      </Text>
                    </Box>
                    <Menu placement="bottom-end">
                      <MenuButton as={IconButton} aria-label="Ações" icon={<ChevronDownIcon />} size="sm" variant="ghost" />
                      <MenuList fontSize="sm">
                        <MenuItem onClick={() => editar(c)}>Editar dados</MenuItem>
                        <MenuItem onClick={() => sindico(item)}>{item.sindicos.length ? "Trocar síndico" : "Designar síndico"}</MenuItem>
                        <MenuItem onClick={() => conselheiros(item)}>Definir conselheiros</MenuItem>
                        <MenuItem color={c.ativo ? "red.600" : undefined} onClick={() => alternarAtivo(c)}>{c.ativo ? "Arquivar" : "Restaurar"}</MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>

                  <Box bg={item.sindicos.length ? "gray.50" : "orange.50"} borderRadius="lg" paddingX={3} paddingY={2}>
                    <Text fontSize="2xs" color="gray.500">Síndico</Text>
                    {item.sindicos.length ? item.sindicos.map((s) => (
                      <Flex key={s.pessoa_id} align="center" gap={2}>
                        <Text fontSize="sm" fontWeight="medium">{s.nome}</Text>
                        {!s.tem_acesso && <Tooltip label="Sem login no sistema" hasArrow><WarningTwoIcon boxSize={3} color="orange.400" /></Tooltip>}
                        {s.email && <Text fontSize="xs" color="gray.500" noOfLines={1}>{s.email}</Text>}
                      </Flex>
                    )) : (
                      <Flex justify="space-between" align="center" gap={2}>
                        <Text fontSize="sm" color="orange.700">Sem síndico designado</Text>
                        {c.ativo && <Button size="xs" colorScheme="orange" onClick={() => sindico(item)}>Designar</Button>}
                      </Flex>
                    )}
                  </Box>

                  <Box bg="gray.50" borderRadius="lg" paddingX={3} paddingY={2}>
                    <Flex justify="space-between" align="center" gap={2}>
                      <Text fontSize="2xs" color="gray.500">Conselheiros</Text>
                      {c.ativo && <Button size="xs" variant="link" colorScheme="blue" onClick={() => conselheiros(item)}>{item.conselheiros.length ? "Alterar" : "Definir"}</Button>}
                    </Flex>
                    {item.conselheiros.length ? (
                      <Text fontSize="sm" noOfLines={2}>{item.conselheiros.map((p) => p.nome).join(", ")}</Text>
                    ) : <Text fontSize="sm" color="gray.400">Nenhum conselheiro</Text>}
                  </Box>

                  <SimpleGrid columns={3} spacing={2}>
                    <Numero rotulo="Apartamentos" valor={item.total_apartamentos} />
                    <Numero rotulo="Pessoas" valor={item.total_pessoas} />
                    <Numero rotulo="Com acesso" valor={item.total_usuarios} />
                  </SimpleGrid>

                  {pendencias.length > 0 && (
                    <Flex gap={1.5} wrap="wrap">
                      {pendencias.map((p) => <Badge key={p} colorScheme="red" variant="subtle" textTransform="none">{p}</Badge>)}
                    </Flex>
                  )}

                  {c.ativo && <Button size="sm" colorScheme="blue" variant="outline" marginTop="auto" onClick={() => entrar(c)}>Entrar no condomínio</Button>}
                </Flex>
              );
            })}
          </SimpleGrid>
        )}

        <ModalCondominio aberto={modalCondominio.isOpen} aoFechar={modalCondominio.onClose} condominio={editando} aoSalvo={aoSalvo} />
        <ModalConselheiros aberto={modalConselheiros.isOpen} aoFechar={modalConselheiros.onClose} item={itemSindico} aoSalvo={carregar} />
        <ModalSindico aberto={modalSindico.isOpen} aoFechar={modalSindico.onClose} item={itemSindico} aoDesignado={carregar} />
      </Box>
    </Flex>
  );
};
