import { useState } from "react";
import { Badge, Box, Button, Flex, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, Textarea, useDisclosure } from "@chakra-ui/react";
import { CelulaEditavel } from "../../Components/CelulaEditavel";
import { BotaoArquivar } from "../../Components/Botoes/Arquivar";
import { BotaoRestaurar } from "../../Components/Botoes/Restaurar";
import { BotaoExcluir } from "../../Components/Botoes/Excluir";
import { BotaoInserir } from "../../Components/Botoes/inserir";
import { Titulo } from "../Titulos/Titulos";
import { formatarData } from "../../Components/config";

import { useProjetos } from "./Hooks/Projetos";

export const CriarProjeto = () => {
  const [projeto, setProjeto] = useState("");
  const [descricao, setDescricao] = useState("");
  const { projetos, carregando, criando, criar, editarCampo, arquivar, restaurar, excluir } = useProjetos();
  const { isOpen, onOpen, onClose } = useDisclosure();
  async function handleCriar() { await criar(projeto, descricao);setProjeto("");setDescricao("");onClose()}

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0}>
        {carregando ? (<Flex justify="center" padding={10}><Spinner/></Flex>) : projetos.length === 0 ? (
        <Box bg="white" borderRadius="xl" padding={10} textAlign="center" boxShadow="sm"><Text color="gray.500">Nenhum projeto cadastrado ainda.</Text></Box>) : (
        <Box bg="white" borderRadius="xl" overflowX="auto" boxShadow="sm">
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Projeto</Th>
                <Th>Descrição</Th>
                <Th>Status</Th>
                <Th>Criado em</Th>
                <Th>Atualizado em</Th>
                <Th>Arquivado em</Th>
              </Tr>
            </Thead>
            <Tbody>
              {projetos.map((item) => {
                const arquivado = !item.ativo;
                return (
                  <Tr key={item.id} _hover={{ bg: "gray.50" }} opacity={arquivado ? 0.6 : 1}>
                    <Td minWidth="180px">
                      <CelulaEditavel valor={item.projeto} fontWeight="600" editavel={!arquivado} onSalvar={(novoValor) => editarCampo(item.id, "projeto", novoValor)}/>
                    </Td>
                    <Td minWidth="240px">
                      <CelulaEditavel valor={item.descricao || ""} as="textarea" placeholder="Adicionar descrição" editavel={!arquivado} onSalvar={(novoValor) => editarCampo(item.id, "descricao", novoValor)}/>
                    </Td>
                    <Td><Badge colorScheme={item.ativo ? "green" : "red"}>{item.ativo ? "Ativo" : "Arquivado"}</Badge></Td>
                    <Td><Text fontSize="sm" color="gray.500">{formatarData(item.dataCriacao)}</Text></Td>
                    <Td><Text fontSize="sm" color="gray.500">{formatarData(item.dataAtualizacao)}</Text></Td>
                    <Td>{item.dataArquivamento ? (<Text fontSize="sm" color="red.500">{formatarData(item.dataArquivamento)}</Text>) : (<Text fontSize="sm" color="gray.300">-</Text>)}</Td>
                    <Td>
  <Flex align="center" gap={2}>
    {item.ativo ? (
      <BotaoArquivar onClick={() => arquivar(item.id)} />
    ) : (
      <BotaoRestaurar onClick={() => restaurar(item.id)} />
    )}
    <BotaoInserir onClick={() => onOpen()} />
    <BotaoExcluir onClick={() => excluir(item.id)} />
  </Flex>
</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>)}

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Novo projeto</ModalHeader>
            <ModalBody>
              <Flex direction="column" gap={3}>
                <Input value={projeto} onChange={(event) => setProjeto(event.target.value)} placeholder="Nome do projeto" autoFocus/>
                <Textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Descrição (opcional)" resize="vertical"/>
              </Flex>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={handleCriar} isLoading={criando}>Criar projeto</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
