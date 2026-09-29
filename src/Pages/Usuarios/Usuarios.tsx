// ---------------------------------------------------------
// USUÁRIOS DO SISTEMA (somente ADM)
// ---------------------------------------------------------
// Todos os logins, com os condomínios e o perfil em cada um.
// Ações: bloquear/desbloquear e gerar nova senha temporária.
// O acesso a um condomínio é dado em Pessoas (ou ao designar
// o síndico no painel).
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Flex, Input, InputGroup, InputLeftElement, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, Select, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

import { chamarApi, formatarData } from "../../Components/config";
import { SenhaTemporaria } from "../../Components/SenhaTemporaria";
import { useAuth } from "../Login/useAuth";
import { ROTULOS_PERFIL, type PerfilPessoa } from "../Pessoas/ConfigPessoas";
import { Titulo } from "../Titulos/Titulos";

type Usuario = {
  id: string;
  full_name: string;
  email: string;
  status: "ativo" | "inativo" | "bloqueado";
  admin_sistema: boolean;
  trocar_senha: boolean;
  created_at: string;
  condominios: { condominio_id: string; condominio_nome: string; perfil: PerfilPessoa; ativo: boolean }[];
};

const api = {
  listar: () => chamarApi<Usuario[]>("/users/", "GET", "Não foi possível carregar os usuários."),
  status: (id: string, status: "ativo" | "bloqueado") => chamarApi<void>(`/users/${id}/status`, "PATCH", "Não foi possível alterar o usuário.", { status }),
  novaSenha: (id: string) => chamarApi<{ email: string; senha_temporaria: string }>(`/users/${id}/nova-senha`, "POST", "Não foi possível gerar a senha."),
};

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };

export const Usuarios = () => {
  const toast = useToast();
  const { user } = useAuth();
  const modalSenha = useDisclosure();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [senha, setSenha] = useState<{ email: string; senha_temporaria: string } | null>(null);

  const carregar = useCallback(async () => {
    try { setUsuarios(await api.listar()); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao carregar os usuários", status: "error" }); }
    finally { setCarregando(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  async function alternarBloqueio(u: Usuario) {
    const bloquear = u.status === "ativo";
    if (bloquear && !window.confirm(`Bloquear ${u.full_name}? Ele não conseguirá entrar em nenhum condomínio.`)) return;
    try {
      await api.status(u.id, bloquear ? "bloqueado" : "ativo");
      toast({ title: bloquear ? "Usuário bloqueado" : "Usuário desbloqueado", status: "success", duration: 2000 });
      await carregar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao alterar o usuário", status: "error" }); }
  }

  async function gerarSenha(u: Usuario) {
    if (!window.confirm(`Gerar uma nova senha para ${u.full_name}? A senha atual deixa de funcionar.`)) return;
    try {
      setSenha(await api.novaSenha(u.id));
      modalSenha.onOpen();
      await carregar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao gerar a senha", status: "error" }); }
  }

  if (!user?.admin_sistema) {
    return (
      <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Apenas o administrador do sistema acessa os usuários.</Text>
      </Flex>
    );
  }

  const nomesCondominios = Array.from(new Map(usuarios.flatMap((u) => u.condominios.map((c) => [c.condominio_id, c.condominio_nome] as const))).entries())
    .sort((a, b) => a[1].localeCompare(b[1]));
  const termo = busca.trim().toLowerCase();
  const filtrados = usuarios.filter((u) => {
    if (filtro === "ADM" && !u.admin_sistema) return false;
    if (filtro === "BLOQUEADOS" && u.status === "ativo") return false;
    if (filtro === "SEM_CONDOMINIO" && (u.admin_sistema || u.condominios.length > 0)) return false;
    if (filtro && !["ADM", "BLOQUEADOS", "SEM_CONDOMINIO"].includes(filtro) && !u.condominios.some((c) => c.condominio_id === filtro)) return false;
    if (!termo) return true;
    return [u.full_name, u.email, ...u.condominios.map((c) => c.condominio_nome)].some((t) => t.toLowerCase().includes(termo));
  });

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Box marginBottom={6}>
          <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Usuários do sistema</Text>
          <Text fontSize="sm" color="gray.500" marginTop={1}>{usuarios.length} login(s). O acesso a um condomínio é dado em Pessoas ou ao designar o síndico.</Text>
        </Box>

        <Flex gap={3} marginBottom={5} direction={{ base: "column", md: "row" }}>
          <InputGroup maxWidth={{ md: "360px" }}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou condomínio" bg="white" borderRadius="lg" />
          </InputGroup>
          <Select maxWidth={{ md: "260px" }} bg="white" borderRadius="lg" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos os usuários</option>
            <option value="ADM">Administradores do sistema</option>
            <option value="BLOQUEADOS">Bloqueados</option>
            <option value="SEM_CONDOMINIO">Sem condomínio</option>
            {nomesCondominios.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </Select>
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Usuário</Th>
                    <Th {...estiloTh}>Condomínios e perfis</Th>
                    <Th {...estiloTh}>Situação</Th>
                    <Th {...estiloTh}>Criado em</Th>
                    <Th {...estiloTh} />
                  </Tr>
                </Thead>
                <Tbody>
                  {filtrados.map((u) => (
                    <Tr key={u.id} opacity={u.status === "ativo" ? 1 : 0.6}>
                      <Td paddingLeft={5}>
                        <Flex align="center" gap={2}>
                          <Text fontWeight="medium">{u.full_name}</Text>
                          {u.admin_sistema && <Badge colorScheme="purple" textTransform="none">ADM do sistema</Badge>}
                        </Flex>
                        <Text fontSize="xs" color="gray.500">{u.email}</Text>
                      </Td>
                      <Td>
                        <Flex gap={1} wrap="wrap" maxWidth="420px">
                          {u.condominios.length === 0 && <Text fontSize="xs" color="gray.400">{u.admin_sistema ? "Todos (ADM)" : "Nenhum"}</Text>}
                          {u.condominios.map((c) => (
                            <Badge key={c.condominio_id} variant="outline" colorScheme={c.perfil === "SINDICO" ? "blue" : "gray"} textTransform="none" opacity={c.ativo ? 1 : 0.5}>
                              {c.condominio_nome} · {ROTULOS_PERFIL[c.perfil] ?? c.perfil}
                            </Badge>
                          ))}
                        </Flex>
                      </Td>
                      <Td>
                        <Badge colorScheme={u.status === "ativo" ? "green" : "red"} textTransform="none">{u.status === "ativo" ? "Ativo" : "Bloqueado"}</Badge>
                        {u.trocar_senha && <Text fontSize="2xs" color="orange.600">Senha temporária</Text>}
                      </Td>
                      <Td fontSize="sm">{formatarData(u.created_at)}</Td>
                      <Td>
                        <Flex gap={2} justify="flex-end">
                          <Button size="xs" variant="outline" onClick={() => gerarSenha(u)}>Nova senha</Button>
                          {u.id !== user.id && (
                            <Button size="xs" variant="ghost" colorScheme={u.status === "ativo" ? "red" : "green"} onClick={() => alternarBloqueio(u)}>
                              {u.status === "ativo" ? "Bloquear" : "Desbloquear"}
                            </Button>
                          )}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Modal isOpen={modalSenha.isOpen} onClose={modalSenha.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>Nova senha gerada</ModalHeader>
            <ModalCloseButton />
            <ModalBody>{senha && <SenhaTemporaria email={senha.email} senha={senha.senha_temporaria} />}</ModalBody>
            <ModalFooter><Button colorScheme="blue" onClick={modalSenha.onClose}>Fechar</Button></ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
