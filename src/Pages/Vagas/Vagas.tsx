// ---------------------------------------------------------
// VAGAS (cadastro geral do condomínio)
// ---------------------------------------------------------
// FIXA: demarcada; pode ser de um apartamento ou estar livre.
// ROTATIVA: uso comum; veículo sem vaga fixa usa as rotativas.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, IconButton, Input, Link, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Table, TableContainer, Tbody, Td,
  Text, Th, Thead, Tooltip, Tr, useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { rotuloApartamento } from "../Pessoas/ConfigPessoas";
import { IconeCarro, IconeChave, IconePredio, IconeVaga } from "../Pessoas/IconesPessoas";
import { apiApartamentos } from "../Apartamentos/API";
import type { ApartamentoResumo } from "../Apartamentos/ConfigApartamentos";
import { ROTULOS_TIPO_VAGA, apiVagas, type TipoVaga, type Vaga } from "./ConfigVagas";

type Filtro = "TODAS" | "FIXA_OCUPADA" | "FIXA_LIVRE" | "ROTATIVA";
const FORM_VAZIO = { numero: "", tipo: "FIXA" as TipoVaga, apartamento_id: "", localizacao: "", observacao: "", ativo: true };
const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };

const Indicador = ({ icone: Icone, rotulo, valor }: { icone: ElementType; rotulo: string; valor: number }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Flex align="center" gap={2} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>
    <Text marginTop={1} fontSize="2xl" fontWeight="semibold" color="gray.800">{valor}</Text>
  </Box>
);

export const Vagas = () => {
  const toast = useToast();
  const permissoes = usePermissoes();
  const modal = useDisclosure();

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [apartamentos, setApartamentos] = useState<ApartamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [editando, setEditando] = useState<Vaga | null>(null);
  const [formulario, setFormulario] = useState(FORM_VAZIO);

  const carregar = useCallback(async () => {
    try {
      const [listaVagas, listaAptos] = await Promise.all([apiVagas.listar(), apiApartamentos.listar()]);
      setVagas(listaVagas);
      setApartamentos(listaAptos);
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar vagas", status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNova() {
    setEditando(null);
    setFormulario(FORM_VAZIO);
    modal.onOpen();
  }

  function abrirEdicao(vaga: Vaga) {
    setEditando(vaga);
    setFormulario({
      numero: vaga.numero, tipo: vaga.tipo, apartamento_id: vaga.apartamento_id ?? "",
      localizacao: vaga.localizacao ?? "", observacao: vaga.observacao ?? "", ativo: vaga.ativo,
    });
    modal.onOpen();
  }

  async function salvar() {
    if (!formulario.numero.trim()) {
      toast({ title: "Informe o número da vaga", status: "warning" });
      return;
    }
    const dados = {
      numero: formulario.numero.trim(),
      tipo: formulario.tipo,
      apartamento_id: formulario.tipo === "FIXA" ? formulario.apartamento_id || null : null,
      localizacao: formulario.localizacao.trim() || null,
      observacao: formulario.observacao.trim() || null,
    };
    try {
      setSalvando(true);
      if (editando) await apiVagas.editar(editando.id, { ...dados, ativo: formulario.ativo });
      else await apiVagas.criar(dados);
      toast({ title: editando ? "Vaga atualizada" : "Vaga cadastrada", status: "success", duration: 2000 });
      modal.onClose();
      await carregar();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao salvar vaga", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(vaga: Vaga) {
    if (!window.confirm(`Excluir a vaga ${vaga.numero}?${vaga.veiculos.length ? "\n\nOs veículos que a usam passam a usar as vagas rotativas." : ""}`)) return;
    try {
      await apiVagas.excluir(vaga.id);
      toast({ title: "Vaga excluída", status: "success", duration: 2000 });
      await carregar();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao excluir vaga", status: "error" });
    }
  }

  const fixasOcupadas = vagas.filter((v) => v.tipo === "FIXA" && v.apartamento_id);
  const fixasLivres = vagas.filter((v) => v.tipo === "FIXA" && !v.apartamento_id);
  const rotativas = vagas.filter((v) => v.tipo === "ROTATIVA");
  const filtradas =
    filtro === "FIXA_OCUPADA" ? fixasOcupadas : filtro === "FIXA_LIVRE" ? fixasLivres : filtro === "ROTATIVA" ? rotativas : vagas;

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Vagas</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Vagas fixas das unidades e vagas rotativas de uso comum.</Text>
          </Box>
          {permissoes.editaTudo && <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={abrirNova}>Nova vaga</Button>}
        </Flex>

        {!carregando && vagas.length > 0 && (
          <>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
              <Indicador icone={IconeVaga} rotulo="Total de vagas" valor={vagas.length} />
              <Indicador icone={IconeChave} rotulo="Fixas com dono" valor={fixasOcupadas.length} />
              <Indicador icone={IconePredio} rotulo="Fixas livres" valor={fixasLivres.length} />
              <Indicador icone={IconeCarro} rotulo="Rotativas" valor={rotativas.length} />
            </SimpleGrid>
            <Select maxWidth="260px" bg="white" borderRadius="lg" marginBottom={5} value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
              <option value="TODAS">Todas as vagas</option>
              <option value="FIXA_OCUPADA">Fixas com dono</option>
              <option value="FIXA_LIVRE">Fixas livres</option>
              <option value="ROTATIVA">Rotativas</option>
            </Select>
          </>
        )}

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : vagas.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <IconeVaga boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Nenhuma vaga cadastrada</Text>
            {permissoes.editaTudo && <Button marginTop={5} size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={abrirNova}>Nova vaga</Button>}
          </Flex>
        ) : (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Vaga</Th>
                    <Th {...estiloTh}>Tipo</Th>
                    <Th {...estiloTh}>Unidade</Th>
                    <Th {...estiloTh}>Localização</Th>
                    <Th {...estiloTh}>Veículo(s)</Th>
                    <Th {...estiloTh} />
                  </Tr>
                </Thead>
                <Tbody>
                  {filtradas.map((vaga) => (
                    <Tr key={vaga.id} opacity={vaga.ativo ? 1 : 0.5}>
                      <Td paddingLeft={5} fontWeight="semibold">Vaga {vaga.numero}</Td>
                      <Td><Badge colorScheme={ROTULOS_TIPO_VAGA[vaga.tipo].cor} textTransform="none">{ROTULOS_TIPO_VAGA[vaga.tipo].rotulo}</Badge></Td>
                      <Td fontSize="sm">
                        {vaga.tipo === "ROTATIVA" ? "Uso comum"
                          : vaga.apartamento_id
                            ? <Link as={RouterLink} to={`/Apartamentos/${vaga.apartamento_id}`} color="blue.600">{vaga.apartamento_rotulo}</Link>
                            : <Text as="span" color="gray.500">Livre</Text>}
                      </Td>
                      <Td fontSize="sm">{vaga.localizacao ?? "-"}</Td>
                      <Td fontSize="sm">{vaga.veiculos.join(", ") || "-"}</Td>
                      <Td>
                        <Flex gap={1} justify="flex-end">
                          {permissoes.editaTudo && <Tooltip label="Editar" hasArrow><IconButton aria-label="Editar" icon={<EditIcon />} size="xs" variant="ghost" onClick={() => abrirEdicao(vaga)} /></Tooltip>}
                          {permissoes.editaTudo && <Tooltip label="Excluir" hasArrow><IconButton aria-label="Excluir" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" onClick={() => excluir(vaga)} /></Tooltip>}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Modal isOpen={modal.isOpen} onClose={modal.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>{editando ? `Editar vaga ${editando.numero}` : "Nova vaga"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Número</FormLabel>
                  <Input value={formulario.numero} onChange={(e) => setFormulario({ ...formulario, numero: e.target.value })} placeholder="Ex.: 12" autoFocus />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Tipo</FormLabel>
                  <Select value={formulario.tipo} onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value as TipoVaga })}>
                    <option value="FIXA">Fixa</option>
                    <option value="ROTATIVA">Rotativa (uso comum)</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              {formulario.tipo === "FIXA" && (
                <FormControl marginTop={3}>
                  <FormLabel fontSize="sm">Unidade dona da vaga</FormLabel>
                  <Select value={formulario.apartamento_id} onChange={(e) => setFormulario({ ...formulario, apartamento_id: e.target.value })}>
                    <option value="">Livre (sem dono)</option>
                    {apartamentos.map((a) => <option key={a.id} value={a.id}>{rotuloApartamento(a)}</option>)}
                  </Select>
                </FormControl>
              )}
              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Localização</FormLabel>
                <Input value={formulario.localizacao} onChange={(e) => setFormulario({ ...formulario, localizacao: e.target.value })} placeholder="Ex.: Subsolo 1, coberta" />
              </FormControl>
              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Observação</FormLabel>
                <Input value={formulario.observacao} onChange={(e) => setFormulario({ ...formulario, observacao: e.target.value })} />
              </FormControl>
              {editando && (
                <FormControl marginTop={3}>
                  <FormLabel fontSize="sm">Situação</FormLabel>
                  <Select value={formulario.ativo ? "ativo" : "inativo"} onChange={(e) => setFormulario({ ...formulario, ativo: e.target.value === "ativo" })}>
                    <option value="ativo">Ativa</option>
                    <option value="inativo">Inativa</option>
                  </Select>
                </FormControl>
              )}
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modal.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
