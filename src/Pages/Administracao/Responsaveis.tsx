// ---------------------------------------------------------
// RESPONSÁVEIS DO WHATSAPP (aba da Administração geral; só ADM)
// ---------------------------------------------------------
// Responsável = pessoa de fora dos condomínios (não mora nem
// está ligada a apartamento) que atende o WhatsApp. Ganha um
// login próprio com senha temporária. O ADM escolhe, pessoa a
// pessoa, quem é atendido por ela; o padrão é o síndico.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader,
  ModalOverlay, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast,
} from "@chakra-ui/react";

import { formatarData } from "../../Components/config";
import { SenhaTemporaria } from "../../Components/SenhaTemporaria";
import { apiAdministracao, type ResponsavelLista } from "./ConfigAdministracao";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };

export const Responsaveis = ({ aoMudar }: { aoMudar: () => void }) => {
  const toast = useToast();
  const modalSenha = useDisclosure();
  const [lista, setLista] = useState<ResponsavelLista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState({ nome: "", email: "" });
  const [criando, setCriando] = useState(false);
  const [senha, setSenha] = useState<{ email: string; senha_temporaria: string } | null>(null);

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error" }), [toast]);

  const carregar = useCallback(async () => {
    try { setLista(await apiAdministracao.responsaveis()); }
    catch (e) { erro(e, "Erro ao carregar os responsáveis"); }
    finally { setCarregando(false); }
  }, [erro]);

  useEffect(() => { carregar(); }, [carregar]);

  async function criar() {
    if (form.nome.trim().length < 3) { toast({ title: "Informe o nome (mínimo 3 letras)", status: "warning" }); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { toast({ title: "Informe um e-mail válido: ele será o login", status: "warning" }); return; }
    setCriando(true);
    try {
      const criado = await apiAdministracao.criarResponsavel(form.nome.trim(), form.email.trim());
      setForm({ nome: "", email: "" });
      if (criado.senha_temporaria) {
        setSenha({ email: criado.email, senha_temporaria: criado.senha_temporaria });
        modalSenha.onOpen();
      } else {
        toast({ title: `${criado.nome} já tinha login e agora é responsável`, status: "success" });
      }
      await carregar();
      aoMudar();
    } catch (e) { erro(e, "Erro ao criar o responsável"); }
    finally { setCriando(false); }
  }

  async function remover(r: ResponsavelLista) {
    const aviso = r.total_pessoas > 0 ? ` As ${r.total_pessoas} pessoa(s) atendidas por ele voltam para o síndico do prédio.` : "";
    if (!window.confirm(`Remover ${r.nome} dos responsáveis?${aviso} O login continua existindo.`)) return;
    try {
      await apiAdministracao.removerResponsavel(r.id);
      toast({ title: "Responsável removido", status: "success", duration: 2000 });
      await carregar();
      aoMudar();
    } catch (e) { erro(e, "Erro ao remover"); }
  }

  async function gerarSenha(r: ResponsavelLista) {
    if (!window.confirm(`Gerar uma nova senha para ${r.nome}? A senha atual deixa de funcionar.`)) return;
    try {
      setSenha(await apiAdministracao.novaSenha(r.id));
      modalSenha.onOpen();
      await carregar();
    } catch (e) { erro(e, "Erro ao gerar a senha"); }
  }

  return (
    <Box>
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4} marginBottom={4}>
        <Text fontWeight="semibold" color="gray.800">Novo responsável</Text>
        <Text fontSize="sm" color="gray.500" marginBottom={3}>
          Para quem atende o WhatsApp e não mora nem trabalha num condomínio. Ele recebe um login com senha temporária e só acessa o WhatsApp.
        </Text>
        <Flex gap={3} direction={{ base: "column", md: "row" }} align={{ md: "flex-end" }}>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Nome</FormLabel>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={150} placeholder="Nome completo" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel fontSize="sm">E-mail (login)</FormLabel>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@exemplo.com"
              onKeyDown={(e) => { if (e.key === "Enter") criar(); }} />
          </FormControl>
          <Button colorScheme="green" onClick={criar} isLoading={criando} flexShrink={0}>Criar responsável</Button>
        </Flex>
      </Box>

      {carregando ? (
        <Flex justify="center" padding={10}><Spinner color="green.500" /></Flex>
      ) : lista.length === 0 ? (
        <Text fontSize="sm" color="gray.500" padding={4}>Nenhum responsável ainda. Enquanto isso, as mensagens de cada morador vão para o síndico do prédio.</Text>
      ) : (
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th {...estiloTh} paddingLeft={5}>Responsável</Th>
                  <Th {...estiloTh}>Pessoas atendidas</Th>
                  <Th {...estiloTh}>Situação</Th>
                  <Th {...estiloTh}>Desde</Th>
                  <Th {...estiloTh} />
                </Tr>
              </Thead>
              <Tbody>
                {lista.map((r) => (
                  <Tr key={r.id} opacity={r.status === "ativo" ? 1 : 0.6}>
                    <Td paddingLeft={5}>
                      <Text fontWeight="medium">{r.nome}</Text>
                      <Text fontSize="xs" color="gray.500">{r.email}</Text>
                    </Td>
                    <Td>{r.total_pessoas}</Td>
                    <Td>
                      <Badge colorScheme={r.status === "ativo" ? "green" : "red"} textTransform="none">{r.status === "ativo" ? "Ativo" : "Bloqueado"}</Badge>
                      {r.trocar_senha && <Text fontSize="2xs" color="orange.600">Senha temporária</Text>}
                    </Td>
                    <Td fontSize="sm">{formatarData(r.created_at)}</Td>
                    <Td>
                      <Flex gap={2} justify="flex-end">
                        <Button size="xs" variant="outline" onClick={() => gerarSenha(r)}>Nova senha</Button>
                        <Button size="xs" variant="ghost" colorScheme="red" onClick={() => remover(r)}>Remover</Button>
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
          <ModalHeader>Login do responsável</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{senha && <SenhaTemporaria email={senha.email} senha={senha.senha_temporaria} />}</ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={modalSenha.onClose}>Fechar</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
