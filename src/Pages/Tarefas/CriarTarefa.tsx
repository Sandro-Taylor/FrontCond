import { Badge, Box, Button, Flex, FormControl, FormErrorMessage, Input, Modal, ModalBody,ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select,
  Spinner, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr, useDisclosure } from "@chakra-ui/react";
import { Field, Form, Formik, type FieldProps } from "formik";
import * as yup from "yup";
import { BotaoInserir } from "../../Components/Botoes/inserir";
import { Titulo } from "../Titulos/Titulos";
import { formatarData } from "../../Components/config";
import { useTarefas, type TarefaCriarPayload } from "./Tarefas";

import { CelulaEditavel } from "../../Components/CelulaEditavel";
import { BotaoArquivar } from "../../Components/Botoes/Arquivar";
import { BotaoRestaurar } from "../../Components/Botoes/Restaurar";
import { BotaoExcluir } from "../../Components/Botoes/Excluir";

type TarefaForm = {
  idProjeto: string;
  idResponsavel: string;
  tarefa: string;
  descricao: string;
  prioridade: string;
  prazo: string;
  status: string;
};

const tarefaValidation = yup.object({
  idProjeto: yup.string().required("Selecione o projeto"),
  idResponsavel: yup.string().required("Selecione o responsável"),
  tarefa: yup.string().min(3).required("Informe o título"),
  prioridade: yup.string().required("Selecione a prioridade"),
});

const coresPrioridade: Record<string, string> = {
  baixa: "gray",
  media: "blue",
  alta: "orange",
  urgente: "red",
};

export const Tarefas = () => {
  const {
    tarefas,
    projetos,
    colaboradores,
    carregando,
    criando,
    criar,
    editarCampo,
    arquivar,
    restaurar,
    excluir,
  } = useTarefas();
  const { isOpen, onOpen, onClose } = useDisclosure();

  function nomeProjeto(idProjeto: string) {
    return projetos.find((projeto) => projeto.id === idProjeto)?.projeto ?? "-";
  }

  function nomeResponsavel(idResponsavel: string) {
    return colaboradores.find((colaborador) => colaborador.idColaborador === idResponsavel)?.nome ?? "-";
  }

  async function handleCriar(values: TarefaForm, resetForm: () => void) {
    const payload: TarefaCriarPayload = {
      idProjeto: values.idProjeto,
      idResponsavel: values.idResponsavel,
      tarefa: values.tarefa,
      descricao: values.descricao || null,
      prioridade: values.prioridade,
      prazo: values.prazo || null,
      status: values.status || null,
    };

    await criar(payload);
    resetForm();
    onClose();
  }

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0}>
        <Flex align="center" gap={2} marginBottom={6}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" letterSpacing="-0.02em" color="gray.800">
              Tarefas
            </Text>
            <Text fontSize="sm" color="gray.500" marginTop={0.5}>
              {tarefas.length} {tarefas.length === 1 ? "tarefa cadastrada" : "tarefas cadastradas"}
            </Text>
          </Box>
          <BotaoInserir onClick={onOpen} />
        </Flex>

        {carregando ? (
          <Flex justify="center" padding={10}>
            <Spinner />
          </Flex>
        ) : tarefas.length === 0 ? (
          <Box bg="white" borderRadius="xl" padding={10} textAlign="center" boxShadow="sm">
            <Text color="gray.500">Nenhuma tarefa cadastrada ainda.</Text>
          </Box>
        ) : (
          <Box bg="white" borderRadius="xl" overflowX="auto" boxShadow="sm">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Tarefa</Th>
                  <Th>Projeto</Th>
                  <Th>Responsável</Th>
                  <Th>Prioridade</Th>
                  <Th>Status</Th>
                  <Th>Prazo</Th>
                  <Th>Criado em</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tarefas.map((item) => {
                  const arquivado = !item.ativo;
                  return (
                    <Tr key={item.id} _hover={{ bg: "gray.50" }} opacity={arquivado ? 0.6 : 1}>
                      <Td minWidth="200px">
                        <CelulaEditavel
                          valor={item.tarefa}
                          fontWeight="600"
                          editavel={!arquivado}
                          onSalvar={(valor) => editarCampo(item.id, "tarefa", valor)}
                        />
                      </Td>
                      <Td minWidth="160px">{nomeProjeto(item.idProjeto)}</Td>
                      <Td minWidth="160px">{nomeResponsavel(item.idResponsavel)}</Td>
                      <Td>
                        <Badge colorScheme={coresPrioridade[item.prioridade] ?? "gray"} textTransform="capitalize">
                          {item.prioridade}
                        </Badge>
                      </Td>
                      <Td minWidth="140px">
                        <CelulaEditavel
                          valor={item.status || ""}
                          placeholder="Adicionar status"
                          editavel={!arquivado}
                          onSalvar={(valor) => editarCampo(item.id, "status", valor)}
                        />
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.500">
                          {item.prazo ? formatarData(item.prazo) : "-"}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.500">{formatarData(item.dataCriacao)}</Text>
                      </Td>
                      <Td>
                        <Flex align="center" gap={2}>
                          {item.ativo ? (
                            <BotaoArquivar onClick={() => arquivar(item.id)} />
                          ) : (
                            <BotaoRestaurar onClick={() => restaurar(item.id)} />
                          )}
                          <BotaoExcluir onClick={() => excluir(item.id)} />
                        </Flex>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}

        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nova tarefa</ModalHeader>
            <ModalCloseButton />
            <Formik<TarefaForm>
              initialValues={{
                idProjeto: "",
                idResponsavel: "",
                tarefa: "",
                descricao: "",
                prioridade: "media",
                prazo: "",
                status: "",
              }}
              validationSchema={tarefaValidation}
              onSubmit={(values, { resetForm }) => handleCriar(values, resetForm)}
            >
              {({ isSubmitting }) => (
                <Form>
                  <ModalBody>
                    <Flex direction="column" gap={4}>
                      <Field name="idProjeto">
                        {({ field, form }: FieldProps) => (
                          <FormControl isInvalid={Boolean(form.errors.idProjeto)}>
                            <Text marginBottom={2} fontWeight="700">Projeto</Text>
                            <Select {...field} placeholder="Selecione o projeto">
                              {projetos.map((projeto) => (
                                <option key={projeto.id} value={projeto.id}>
                                  {projeto.projeto}
                                </option>
                              ))}
                            </Select>
                            <FormErrorMessage>{String(form.errors.idProjeto ?? "")}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>

                      <Field name="idResponsavel">
                        {({ field, form }: FieldProps) => (
                          <FormControl isInvalid={Boolean(form.errors.idResponsavel)}>
                            <Text marginBottom={2} fontWeight="700">Responsável</Text>
                            <Select {...field} placeholder="Selecione a pessoa">
                              {colaboradores.map((colaborador) => (
                                <option key={colaborador.idColaborador} value={colaborador.idColaborador}>
                                  {colaborador.nome}
                                  {colaborador.cargo ? ` — ${colaborador.cargo}` : ""}
                                </option>
                              ))}
                            </Select>
                            <FormErrorMessage>{String(form.errors.idResponsavel ?? "")}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>

                      <Field name="tarefa">
                        {({ field, form }: FieldProps) => (
                          <FormControl isInvalid={Boolean(form.errors.tarefa)}>
                            <Text marginBottom={2} fontWeight="700">Título</Text>
                            <Input {...field} placeholder="Título da tarefa" autoFocus />
                            <FormErrorMessage>{String(form.errors.tarefa ?? "")}</FormErrorMessage>
                          </FormControl>
                        )}
                      </Field>

                      <Field name="descricao">
                        {({ field }: FieldProps) => (
                          <FormControl>
                            <Text marginBottom={2} fontWeight="700">Descrição</Text>
                            <Textarea {...field} rows={4} placeholder="Descreva a tarefa" resize="vertical" />
                          </FormControl>
                        )}
                      </Field>

                      <Flex gap={4}>
                        <Field name="prioridade">
                          {({ field }: FieldProps) => (
                            <FormControl>
                              <Text marginBottom={2} fontWeight="700">Prioridade</Text>
                              <Select {...field}>
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">Urgente</option>
                              </Select>
                            </FormControl>
                          )}
                        </Field>

                        <Field name="status">
                          {({ field }: FieldProps) => (
                            <FormControl>
                              <Text marginBottom={2} fontWeight="700">Status</Text>
                              <Input {...field} placeholder="Ex.: A fazer" />
                            </FormControl>
                          )}
                        </Field>
                      </Flex>

                      <Field name="prazo">
                        {({ field }: FieldProps) => (
                          <FormControl>
                            <Text marginBottom={2} fontWeight="700">Prazo</Text>
                            <Input {...field} type="datetime-local" />
                          </FormControl>
                        )}
                      </Field>
                    </Flex>
                  </ModalBody>

                  <ModalFooter gap={3}>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button colorScheme="blue" type="submit" isLoading={isSubmitting || criando}>
                      Criar tarefa
                    </Button>
                  </ModalFooter>
                </Form>
              )}
            </Formik>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
