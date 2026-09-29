// ---------------------------------------------------------
// APARTAMENTOS (tela principal de cadastro)
// ---------------------------------------------------------
// Lista as unidades do condomínio com a ocupação e os
// titulares. Ao abrir uma unidade, pessoas, vagas e veículos
// são geridos no modal de detalhe.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementType } from "react";
import {
  Badge, Box, Button, Divider, Flex, FormControl, FormLabel, Input, InputGroup, InputLeftElement, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Text,
  useDisclosure, useToast,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { rotuloApartamento } from "../Pessoas/ConfigPessoas";
import { IconeCarro, IconeCasa, IconeChave, IconePredio, IconeUsuario, IconeVaga } from "../Pessoas/IconesPessoas";
import { apiApartamentos } from "./API";
import { OCUPACAO, type ApartamentoResumo, type Ocupacao } from "./ConfigApartamentos";

type FiltroOcupacao = "TODOS" | Ocupacao;
const FORM_VAZIO = { bloco: "", numero: "", andar: "", observacao: "" };

const Indicador = ({ icone: Icone, rotulo, valor }: { icone: ElementType; rotulo: string; valor: number }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Flex align="center" gap={2} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>
    <Text marginTop={1} fontSize="2xl" fontWeight="semibold" color="gray.800">{valor}</Text>
  </Box>
);

const Contador = ({ icone: Icone, valor, rotulo }: { icone: ElementType; valor: number; rotulo: string }) => (
  <Flex align="center" gap={1.5} fontSize="xs" color="gray.600" title={rotulo}>
    <Icone boxSize={3.5} color="gray.400" />{valor} {rotulo}
  </Flex>
);

export const Apartamentos = () => {
  const toast = useToast();
  const permissoes = usePermissoes();
  const modalNovo = useDisclosure();
  const navigate = useNavigate();

  const [apartamentos, setApartamentos] = useState<ApartamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroOcupacao>("TODOS");
  const [formulario, setFormulario] = useState(FORM_VAZIO);

  const carregar = useCallback(async () => {
    try {
      setApartamentos(await apiApartamentos.listar());
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar apartamentos", status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrir(id: string) {
    navigate(`/Apartamentos/${id}`);
  }

  async function criar() {
    if (!formulario.numero.trim()) {
      toast({ title: "Informe o número do apartamento", status: "warning" });
      return;
    }
    try {
      setSalvando(true);
      const novo = await apiApartamentos.criar({
        bloco: formulario.bloco.trim() || null,
        numero: formulario.numero.trim(),
        andar: formulario.andar.trim() === "" ? null : Number(formulario.andar),
        observacao: formulario.observacao.trim() || null,
      });
      toast({ title: `Apartamento ${rotuloApartamento(novo)} cadastrado`, status: "success" });
      setFormulario(FORM_VAZIO);
      modalNovo.onClose();
      abrir(novo.id); // já abre a página da unidade para adicionar pessoas, vagas e veículos
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao cadastrar apartamento", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = apartamentos.filter((a) => {
    if (filtro !== "TODOS" && a.ocupacao !== filtro) return false;
    if (!termo) return true;
    return (
      rotuloApartamento(a).toLowerCase().includes(termo) ||
      a.proprietarios.some((nome) => nome.toLowerCase().includes(termo)) ||
      a.inquilinos.some((nome) => nome.toLowerCase().includes(termo))
    );
  });

  const contar = (ocupacao: Ocupacao) => apartamentos.filter((a) => a.ocupacao === ocupacao).length;

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Apartamentos</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>{apartamentos.length} unidade(s) cadastrada(s)</Text>
          </Box>
          {permissoes.editaTudo && <Button colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={modalNovo.onOpen}>Novo apartamento</Button>}
        </Flex>

        {!carregando && apartamentos.length > 0 && (
          <>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
              <Indicador icone={IconePredio} rotulo="Unidades" valor={apartamentos.length} />
              <Indicador icone={IconeChave} rotulo="Ocupadas pelo proprietário" valor={contar("OCUPADO_PROPRIETARIO")} />
              <Indicador icone={IconeCasa} rotulo="Alugadas" valor={contar("ALUGADO")} />
              <Indicador icone={IconePredio} rotulo="Vazias" valor={contar("VAZIO")} />
            </SimpleGrid>

            <Flex gap={3} marginBottom={5} direction={{ base: "column", md: "row" }}>
              <InputGroup maxWidth={{ md: "380px" }}>
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" boxSize={3.5} /></InputLeftElement>
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por unidade, proprietário ou inquilino" bg="white" borderRadius="lg" />
              </InputGroup>
              <Select maxWidth={{ md: "240px" }} bg="white" borderRadius="lg" value={filtro} onChange={(e) => setFiltro(e.target.value as FiltroOcupacao)}>
                <option value="TODOS">Todas as ocupações</option>
                {(Object.keys(OCUPACAO) as Ocupacao[]).map((o) => <option key={o} value={o}>{OCUPACAO[o].rotulo}</option>)}
              </Select>
            </Flex>
          </>
        )}

        {carregando ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : apartamentos.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <IconePredio boxSize={6} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Nenhum apartamento cadastrado</Text>
            {permissoes.editaTudo && <Button marginTop={5} size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={modalNovo.onOpen}>Novo apartamento</Button>}
          </Flex>
        ) : filtrados.length === 0 ? (
          <Flex direction="column" align="center" padding={16}>
            <SearchIcon color="gray.300" boxSize={6} />
            <Text marginTop={3}>Nenhum apartamento encontrado</Text>
            <Button marginTop={4} size="sm" onClick={() => { setBusca(""); setFiltro("TODOS"); }}>Limpar filtros</Button>
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
            {filtrados.map((apartamento) => {
              const ocupacao = OCUPACAO[apartamento.ocupacao];
              return (
                <Flex key={apartamento.id} direction="column" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" cursor="pointer"
                  opacity={apartamento.ativo ? 1 : 0.6} onClick={() => abrir(apartamento.id)}
                  _hover={{ borderColor: "blue.200", boxShadow: "0 8px 24px rgba(16,24,40,.07)" }}>
                  <Flex justify="space-between" align="center" padding={5} gap={3}>
                    <Box>
                      <Text fontWeight="semibold" fontSize="lg" color="gray.800">{rotuloApartamento(apartamento)}</Text>
                      <Text fontSize="xs" color="gray.500">{apartamento.andar !== null ? `${apartamento.andar}º andar` : "Andar não informado"}</Text>
                    </Box>
                    <Badge colorScheme={ocupacao.cor} borderRadius="full" paddingX={2.5} textTransform="none">{ocupacao.rotulo}</Badge>
                  </Flex>
                  <Divider />
                  <Box padding={5} flex={1}>
                    <Text fontSize="xs" color="gray.500">Proprietário(s)</Text>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{apartamento.proprietarios.join(", ") || "Não informado"}</Text>
                    {apartamento.inquilinos.length > 0 && (
                      <>
                        <Text fontSize="xs" color="gray.500" marginTop={2}>Inquilino(s)</Text>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{apartamento.inquilinos.join(", ")}</Text>
                      </>
                    )}
                  </Box>
                  <Divider />
                  <Flex gap={4} paddingX={5} paddingY={3} wrap="wrap">
                    <Contador icone={IconeUsuario} valor={apartamento.total_residentes} rotulo="residentes" />
                    <Contador icone={IconeVaga} valor={apartamento.total_vagas} rotulo="vagas" />
                    <Contador icone={IconeCarro} valor={apartamento.total_veiculos} rotulo="veículos" />
                  </Flex>
                </Flex>
              );
            })}
          </SimpleGrid>
        )}

        {/* NOVO APARTAMENTO */}
        <Modal isOpen={modalNovo.isOpen} onClose={modalNovo.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>Novo apartamento</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={3} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Bloco</FormLabel>
                  <Input value={formulario.bloco} onChange={(e) => setFormulario({ ...formulario, bloco: e.target.value })} placeholder="Ex.: A" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Número</FormLabel>
                  <Input value={formulario.numero} onChange={(e) => setFormulario({ ...formulario, numero: e.target.value })} placeholder="Ex.: 101" autoFocus />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Andar</FormLabel>
                  <Input type="number" value={formulario.andar} onChange={(e) => setFormulario({ ...formulario, andar: e.target.value })} placeholder="Ex.: 1" />
                </FormControl>
              </SimpleGrid>
              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Observação</FormLabel>
                <Input value={formulario.observacao} onChange={(e) => setFormulario({ ...formulario, observacao: e.target.value })} />
              </FormControl>
              <Text fontSize="xs" color="gray.500" marginTop={3}>Depois de salvar, a unidade abre para você adicionar proprietário, inquilino, residentes, vagas e veículos.</Text>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modalNovo.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={criar} isLoading={salvando}>Cadastrar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
