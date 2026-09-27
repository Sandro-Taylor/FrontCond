// ---------------------------------------------------------
// CONDOMÍNIOS (somente ADM do sistema)
// ---------------------------------------------------------
// Listar, criar, editar, arquivar e restaurar condomínios.
// Depois de cada alteração recarrega o /eu, para o seletor
// de condomínio do menu ficar atualizado.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Table, TableContainer, Tbody, Td, Text,
  Th, Thead, Tr, useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, EditIcon } from "@chakra-ui/icons";

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, formatarData, formatarTelefone, mensagemErro } from "../../Components/config";
import { useAuth } from "../Login/useAuth";
import { Titulo } from "../Titulos/Titulos";

// TIPOS

export type Condominio = {
  id: string;
  nome: string;
  cnpj: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type Campo = "nome" | "cnpj" | "cep" | "logradouro" | "numero" | "complemento" | "bairro" | "cidade" | "uf" | "telefone" | "email";
type Formulario = Record<Campo, string>;

const FORMULARIO_VAZIO: Formulario = {
  nome: "", cnpj: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", telefone: "", email: "",
};

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

// MÁSCARAS

function formatarCnpj(valor: string | null) {
  if (!valor) return "";
  const cnpj = valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 14);
  return cnpj.length === 14 ? cnpj.replace(/^(\w{2})(\w{3})(\w{3})(\w{4})(\w{2})$/, "$1.$2.$3/$4-$5") : cnpj;
}

function formatarCep(valor: string | null) {
  if (!valor) return "";
  const cep = valor.replace(/\D/g, "").slice(0, 8);
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

// API

async function requisicao<T>(caminho: string, metodo: string, mensagemPadrao: string, corpo?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL_USERS}${caminho}`, {
    method: metodo,
    headers: cabecalhos(),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (!response.ok) throw new Error(await mensagemErro(response, mensagemPadrao));
  return response.json();
}

// campos vazios vão como null; o backend limpa máscaras e valida
function paraEnvio(formulario: Formulario) {
  const dados: Record<string, string | null> = {};
  (Object.keys(formulario) as Campo[]).forEach((campo) => {
    const valor = formulario[campo].trim();
    dados[campo] = valor === "" ? null : valor;
  });
  return dados;
}

// PÁGINA

export const Condominios = () => {
  const toast = useToast();
  const { user, recarregarUsuario } = useAuth();
  const modal = useDisclosure();

  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<Condominio | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setCondominios(await requisicao<Condominio[]>("/condominios/", "GET", "Não foi possível carregar os condomínios."));
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar condomínios", status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  function alterar(campo: Campo, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function abrirNovo() {
    setEditando(null);
    setFormulario(FORMULARIO_VAZIO);
    modal.onOpen();
  }

  function abrirEdicao(condominio: Condominio) {
    setEditando(condominio);
    setFormulario({
      nome: condominio.nome,
      cnpj: formatarCnpj(condominio.cnpj),
      cep: formatarCep(condominio.cep),
      logradouro: condominio.logradouro ?? "",
      numero: condominio.numero ?? "",
      complemento: condominio.complemento ?? "",
      bairro: condominio.bairro ?? "",
      cidade: condominio.cidade ?? "",
      uf: condominio.uf ?? "",
      telefone: formatarTelefone(condominio.telefone),
      email: condominio.email ?? "",
    });
    modal.onOpen();
  }

  async function salvar() {
    if (formulario.nome.trim().length < 3) {
      toast({ title: "Informe o nome do condomínio (mínimo 3 letras)", status: "warning" });
      return;
    }
    try {
      setSalvando(true);
      if (editando) {
        await requisicao(`/condominios/${editando.id}`, "PUT", "Não foi possível salvar o condomínio.", paraEnvio(formulario));
      } else {
        await requisicao("/condominios/", "POST", "Não foi possível cadastrar o condomínio.", paraEnvio(formulario));
      }
      toast({ title: editando ? "Condomínio atualizado" : "Condomínio cadastrado", status: "success" });
      modal.onClose();
      await carregar();
      await recarregarUsuario();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao salvar condomínio", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(condominio: Condominio) {
    if (condominio.ativo && !window.confirm(`Arquivar o condomínio "${condominio.nome}"? Os dados ficam guardados, mas ninguém consegue acessá-lo.`)) return;
    try {
      const acao = condominio.ativo ? "arquivar" : "restaurar";
      await requisicao(`/condominios/${condominio.id}/${acao}`, "PATCH", `Não foi possível ${acao} o condomínio.`);
      toast({ title: condominio.ativo ? "Condomínio arquivado" : "Condomínio restaurado", status: "success" });
      await carregar();
      await recarregarUsuario();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao alterar condomínio", status: "error" });
    }
  }

  if (!user?.admin_sistema) {
    return (
      <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Apenas o administrador do sistema pode gerenciar condomínios.</Text>
      </Flex>
    );
  }

  const campoTexto = (campo: Campo, rotulo: string, props: Record<string, unknown> = {}) => (
    <FormControl isRequired={campo === "nome"}>
      <FormLabel fontSize="sm">{rotulo}</FormLabel>
      <Input size="sm" value={formulario[campo]} onChange={(e) => alterar(campo, e.target.value)} {...props} />
    </FormControl>
  );

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="center" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Condomínios</Text>
            <Text fontSize="sm" color="gray.500">{condominios.length} cadastrado(s)</Text>
          </Box>
          <Button colorScheme="blue" leftIcon={<AddIcon boxSize={2.5} />} onClick={abrirNovo}>Novo condomínio</Button>
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : condominios.length === 0 ? (
          <Box bg="white" borderRadius="xl" padding={10} textAlign="center" boxShadow="sm">
            <Text color="gray.500">Nenhum condomínio cadastrado ainda.</Text>
          </Box>
        ) : (
          <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden">
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Nome</Th>
                    <Th>CNPJ</Th>
                    <Th>Cidade / UF</Th>
                    <Th>Telefone</Th>
                    <Th>Status</Th>
                    <Th>Criado em</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {condominios.map((condominio) => (
                    <Tr key={condominio.id} opacity={condominio.ativo ? 1 : 0.6}>
                      <Td fontWeight="semibold">{condominio.nome}</Td>
                      <Td>{formatarCnpj(condominio.cnpj) || "-"}</Td>
                      <Td>{[condominio.cidade, condominio.uf].filter(Boolean).join(" / ") || "-"}</Td>
                      <Td>{formatarTelefone(condominio.telefone) || "-"}</Td>
                      <Td><Badge colorScheme={condominio.ativo ? "green" : "red"}>{condominio.ativo ? "Ativo" : "Arquivado"}</Badge></Td>
                      <Td>{formatarData(condominio.created_at)}</Td>
                      <Td>
                        <Flex gap={2}>
                          <Button size="xs" variant="outline" leftIcon={<EditIcon />} onClick={() => abrirEdicao(condominio)}>Editar</Button>
                          <Button size="xs" variant="ghost" colorScheme={condominio.ativo ? "orange" : "green"} onClick={() => alternarAtivo(condominio)}>
                            {condominio.ativo ? "Arquivar" : "Restaurar"}
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="2xl" isCentered scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{editando ? "Editar condomínio" : "Novo condomínio"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box gridColumn={{ md: "span 2" }}>{campoTexto("nome", "Nome")}</Box>
                {campoTexto("cnpj", "CNPJ", { placeholder: "00.000.000/0000-00" })}
                {campoTexto("telefone", "Telefone", { placeholder: "(00) 0000-0000" })}
                <Box gridColumn={{ md: "span 2" }}>{campoTexto("email", "E-mail", { type: "email" })}</Box>
                {campoTexto("cep", "CEP", { placeholder: "00000-000" })}
                {campoTexto("logradouro", "Logradouro")}
                {campoTexto("numero", "Número")}
                {campoTexto("complemento", "Complemento")}
                {campoTexto("bairro", "Bairro")}
                {campoTexto("cidade", "Cidade")}
                <FormControl>
                  <FormLabel fontSize="sm">UF</FormLabel>
                  <Select size="sm" value={formulario.uf} onChange={(e) => alterar("uf", e.target.value)} placeholder="Selecione">
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modal.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>{editando ? "Salvar" : "Cadastrar"}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
