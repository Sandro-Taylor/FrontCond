// ---------------------------------------------------------
// VEÍCULOS (visão geral do condomínio)
// ---------------------------------------------------------
// Todos os veículos com unidade, vaga (fixa ou rotativo) e
// condutor. Ao escolher a unidade no formulário, as listas de
// vaga e condutor mostram só o que é daquela unidade.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, IconButton, Input, InputGroup, InputLeftElement, Link, Modal,
  ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner,
  Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon, SearchIcon } from "@chakra-ui/icons";

import { Titulo } from "../Titulos/Titulos";
import { formatarPlaca } from "../../Components/config";
import { rotuloApartamento } from "../Pessoas/ConfigPessoas";
import { IconeCarro, IconeUsuario, IconeVaga } from "../Pessoas/IconesPessoas";
import { apiApartamentos } from "../Apartamentos/API";
import type { ApartamentoDetalhe, ApartamentoResumo } from "../Apartamentos/ConfigApartamentos";
import { apiVeiculos, type Veiculo } from "./ConfigVeiculos";

type Filtro = "TODOS" | "FIXA" | "ROTATIVO" | "SEM_CONDUTOR";
const FORM_VAZIO = { apartamento_id: "", placa: "", marca: "", modelo: "", cor: "", descricao: "", vaga_id: "", pessoa_id: "", ativo: true };
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

export const Veiculos = () => {
  const toast = useToast();
  const modal = useDisclosure();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [apartamentos, setApartamentos] = useState<ApartamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [editando, setEditando] = useState<Veiculo | null>(null);
  const [formulario, setFormulario] = useState(FORM_VAZIO);
  const [unidade, setUnidade] = useState<ApartamentoDetalhe | null>(null); // vagas e pessoas da unidade escolhida

  const carregar = useCallback(async () => {
    try {
      const [listaVeiculos, listaAptos] = await Promise.all([apiVeiculos.listar(), apiApartamentos.listar()]);
      setVeiculos(listaVeiculos);
      setApartamentos(listaAptos);
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar veículos", status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  // ao trocar a unidade no formulário, carrega as vagas e pessoas dela
  async function escolherUnidade(apartamentoId: string, manterVagaCondutor = false) {
    setFormulario((atual) => ({
      ...atual,
      apartamento_id: apartamentoId,
      vaga_id: manterVagaCondutor ? atual.vaga_id : "",
      pessoa_id: manterVagaCondutor ? atual.pessoa_id : "",
    }));
    setUnidade(null);
    if (!apartamentoId) return;
    try {
      setUnidade(await apiApartamentos.buscar(apartamentoId));
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar a unidade", status: "error" });
    }
  }

  function abrirNovo() {
    setEditando(null);
    setFormulario(FORM_VAZIO);
    setUnidade(null);
    modal.onOpen();
  }

  function abrirEdicao(veiculo: Veiculo) {
    setEditando(veiculo);
    setFormulario({
      apartamento_id: veiculo.apartamento_id, placa: formatarPlaca(veiculo.placa), marca: veiculo.marca ?? "",
      modelo: veiculo.modelo ?? "", cor: veiculo.cor ?? "", descricao: veiculo.descricao ?? "",
      vaga_id: veiculo.vaga_id ?? "", pessoa_id: veiculo.pessoa_id ?? "", ativo: veiculo.ativo,
    });
    escolherUnidade(veiculo.apartamento_id, true);
    modal.onOpen();
  }

  async function salvar() {
    if (!formulario.apartamento_id) {
      toast({ title: "Escolha a unidade do veículo", status: "warning" });
      return;
    }
    if (!formulario.placa.trim() && !formulario.modelo.trim()) {
      toast({ title: "Informe ao menos a placa ou o modelo", status: "warning" });
      return;
    }
    const dados = {
      apartamento_id: formulario.apartamento_id,
      placa: formulario.placa.trim() || null,
      marca: formulario.marca.trim() || null,
      modelo: formulario.modelo.trim() || null,
      cor: formulario.cor.trim() || null,
      descricao: formulario.descricao.trim() || null,
      vaga_id: formulario.vaga_id || null,
      pessoa_id: formulario.pessoa_id || null,
    };
    try {
      setSalvando(true);
      if (editando) await apiVeiculos.editar(editando.id, { ...dados, ativo: formulario.ativo });
      else await apiVeiculos.criar(dados);
      toast({ title: editando ? "Veículo atualizado" : "Veículo cadastrado", status: "success", duration: 2000 });
      modal.onClose();
      await carregar();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao salvar veículo", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(veiculo: Veiculo) {
    if (!window.confirm(`Excluir o veículo ${formatarPlaca(veiculo.placa) || veiculo.modelo || ""}?`)) return;
    try {
      await apiVeiculos.excluir(veiculo.id);
      toast({ title: "Veículo excluído", status: "success", duration: 2000 });
      await carregar();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao excluir veículo", status: "error" });
    }
  }

  // FILTROS
  const termo = busca.trim().toLowerCase();
  const termoPlaca = termo.replace(/[^0-9a-z]/g, "");
  const filtrados = veiculos.filter((v) => {
    if (filtro === "FIXA" && !v.vaga_id) return false;
    if (filtro === "ROTATIVO" && v.vaga_id) return false;
    if (filtro === "SEM_CONDUTOR" && v.pessoa_id) return false;
    if (!termo) return true;
    return (
      (termoPlaca !== "" && (v.placa ?? "").toLowerCase().includes(termoPlaca)) ||
      [v.marca, v.modelo, v.cor, v.apartamento_rotulo, v.condutor_nome].some((texto) => (texto ?? "").toLowerCase().includes(termo))
    );
  });

  const emVagaFixa = veiculos.filter((v) => v.vaga_id).length;
  const semCondutor = veiculos.filter((v) => !v.pessoa_id).length;

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Veículos</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Todos os veículos do condomínio, com unidade, vaga e condutor.</Text>
          </Box>
          <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={abrirNovo}>Novo veículo</Button>
        </Flex>

        {!carregando && veiculos.length > 0 && (
          <>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
              <Indicador icone={IconeCarro} rotulo="Total de veículos" valor={veiculos.length} />
              <Indicador icone={IconeVaga} rotulo="Em vaga fixa" valor={emVagaFixa} />
              <Indicador icone={IconeVaga} rotulo="Rotativos" valor={veiculos.length - emVagaFixa} />
              <Indicador icone={IconeUsuario} rotulo="Sem condutor" valor={semCondutor} />
            </SimpleGrid>

            <Flex gap={3} marginBottom={5} direction={{ base: "column", md: "row" }}>
              <InputGroup maxWidth={{ md: "380px" }}>
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por placa, modelo, unidade ou condutor" bg="white" borderRadius="lg" />
              </InputGroup>
              <Select maxWidth={{ md: "240px" }} bg="white" borderRadius="lg" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
                <option value="TODOS">Todos os veículos</option>
                <option value="FIXA">Em vaga fixa</option>
                <option value="ROTATIVO">Rotativos</option>
                <option value="SEM_CONDUTOR">Sem condutor</option>
              </Select>
            </Flex>
          </>
        )}

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : veiculos.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <IconeCarro boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Nenhum veículo cadastrado</Text>
            <Button marginTop={5} size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={abrirNovo}>Novo veículo</Button>
          </Flex>
        ) : filtrados.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <SearchIcon color="gray.300" boxSize={6} />
            <Text marginTop={3}>Nenhum veículo encontrado</Text>
            <Button marginTop={4} size="sm" onClick={() => { setBusca(""); setFiltro("TODOS"); }}>Limpar filtros</Button>
          </Flex>
        ) : (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Placa</Th>
                    <Th {...estiloTh}>Marca / modelo</Th>
                    <Th {...estiloTh}>Cor</Th>
                    <Th {...estiloTh}>Unidade</Th>
                    <Th {...estiloTh}>Vaga</Th>
                    <Th {...estiloTh}>Condutor</Th>
                    <Th {...estiloTh} />
                  </Tr>
                </Thead>
                <Tbody>
                  {filtrados.map((veiculo) => (
                    <Tr key={veiculo.id} opacity={veiculo.ativo ? 1 : 0.5}>
                      <Td paddingLeft={5} fontWeight="semibold">{formatarPlaca(veiculo.placa) || "Sem placa"}</Td>
                      <Td fontSize="sm">{[veiculo.marca, veiculo.modelo].filter(Boolean).join(" ") || "-"}</Td>
                      <Td fontSize="sm">{veiculo.cor ?? "-"}</Td>
                      <Td fontSize="sm">
                        <Link as={RouterLink} to={`/Apartamentos/${veiculo.apartamento_id}`} color="blue.600">{veiculo.apartamento_rotulo}</Link>
                      </Td>
                      <Td>
                        {veiculo.vaga_numero
                          ? <Badge colorScheme="purple" textTransform="none">Vaga {veiculo.vaga_numero}</Badge>
                          : <Badge colorScheme="orange" textTransform="none">Rotativo</Badge>}
                      </Td>
                      <Td fontSize="sm">{veiculo.condutor_nome ?? "-"}</Td>
                      <Td>
                        <Flex gap={1} justify="flex-end">
                          <Tooltip label="Editar" hasArrow><IconButton aria-label="Editar" icon={<EditIcon />} size="xs" variant="ghost" onClick={() => abrirEdicao(veiculo)} /></Tooltip>
                          <Tooltip label="Excluir" hasArrow><IconButton aria-label="Excluir" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" onClick={() => excluir(veiculo)} /></Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>{editando ? "Editar veículo" : "Novo veículo"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Unidade</FormLabel>
                <Select value={formulario.apartamento_id} placeholder="Selecione a unidade" onChange={(e) => escolherUnidade(e.target.value)}>
                  {apartamentos.map((a) => <option key={a.id} value={a.id}>{rotuloApartamento(a)}</option>)}
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Placa</FormLabel>
                  <Input value={formulario.placa} onChange={(e) => setFormulario({ ...formulario, placa: e.target.value.toUpperCase() })} placeholder="ABC1D23" maxLength={8} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Marca</FormLabel>
                  <Input value={formulario.marca} onChange={(e) => setFormulario({ ...formulario, marca: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Modelo</FormLabel>
                  <Input value={formulario.modelo} onChange={(e) => setFormulario({ ...formulario, modelo: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Cor</FormLabel>
                  <Input value={formulario.cor} onChange={(e) => setFormulario({ ...formulario, cor: e.target.value })} />
                </FormControl>
                <FormControl isDisabled={!formulario.apartamento_id}>
                  <FormLabel fontSize="sm">Vaga</FormLabel>
                  <Select value={formulario.vaga_id} onChange={(e) => setFormulario({ ...formulario, vaga_id: e.target.value })}>
                    <option value="">Rotativo (sem vaga fixa)</option>
                    {unidade?.vagas.map((vaga) => <option key={vaga.id} value={vaga.id}>Vaga {vaga.numero}{vaga.localizacao ? ` · ${vaga.localizacao}` : ""}</option>)}
                  </Select>
                </FormControl>
                <FormControl isDisabled={!formulario.apartamento_id}>
                  <FormLabel fontSize="sm">Condutor</FormLabel>
                  <Select value={formulario.pessoa_id} onChange={(e) => setFormulario({ ...formulario, pessoa_id: e.target.value })}>
                    <option value="">Não informado</option>
                    {unidade?.pessoas.map((v) => <option key={v.pessoa_id} value={v.pessoa_id}>{v.pessoa.nome}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Descrição</FormLabel>
                <Input value={formulario.descricao} onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })} placeholder="Ex.: moto, carro elétrico..." />
              </FormControl>

              {editando && (
                <FormControl marginTop={3}>
                  <FormLabel fontSize="sm">Situação</FormLabel>
                  <Select value={formulario.ativo ? "ativo" : "inativo"} onChange={(e) => setFormulario({ ...formulario, ativo: e.target.value === "ativo" })}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </Select>
                </FormControl>
              )}

              <Text fontSize="xs" color="gray.500" marginTop={3}>A vaga e o condutor listam só o que é da unidade escolhida. Sem vaga fixa, o veículo usa as rotativas.</Text>
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
