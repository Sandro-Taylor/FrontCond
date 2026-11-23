import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Divider, Flex, Heading, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, SimpleGrid, Spinner, Text, useDisclosure, useToast} from "@chakra-ui/react";
import { EditIcon, EmailIcon, PhoneIcon } from "@chakra-ui/icons";
import fachada from "../../assets/Fachada.png";
import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, formatarCep, formatarCnpj, formatarTelefone, mensagemErro } from "../../Components/config";
import { useAuth } from "../Login/useAuth";
import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { QuadroAvisos } from "../Avisos/QuadroAvisos";
import { apiCondominios, type Condominio } from "../Condominios/ConfigCondominios";
import { CamposContato, contatoDe, paraEnvio, type ValoresContato } from "../Condominios/ModaisCondominio";
import { IconeCarro, IconeCartao, IconeCasa, IconePredio, IconeUsuario, IconeVaga } from "../Pessoas/IconesPessoas";
import { FotoPessoa } from "../../Components/Arquivos";
import type { Resumo } from "./Types";

const Numero = ({ icone: Icone, rotulo, valor, detalhe, link }: { icone: ElementType; rotulo: string; valor: number; detalhe?: string; link?: string }) => (
  <Flex {...(link ? { as: RouterLink, to: link } : {})} align="center" gap={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.100" paddingX={3} paddingY={2} _hover={link ? { borderColor: "blue.200" } : undefined}>
    <Icone boxSize={4} color="gray.400" flexShrink={0} />
    <Text fontSize="lg" fontWeight="semibold" color="gray.800">{valor}</Text>
    <Box minWidth={0}>
      <Text fontSize="xs" color="gray.600" lineHeight="1.2">{rotulo}</Text>
      {detalhe && <Text fontSize="2xs" color="gray.500" lineHeight="1.2">{detalhe}</Text>}
    </Box>
  </Flex>
);

const Informacao = ({ icone: Icone, children }: { icone: ElementType; children: React.ReactNode }) => (
  <Flex gap={2} align="flex-start">
    <Icone boxSize={4} color="gray.400" marginTop={0.5} />
    <Box fontSize="sm" color="gray.700">{children}</Box>
  </Flex>
);

export const Dashboard = () => {
  const { user, condominioAtual } = useAuth();
  const permissoes = usePermissoes();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(Boolean(condominioAtual));
  const toast = useToast();
  const modalContato = useDisclosure();
  const [contato, setContato] = useState<ValoresContato>(contatoDe(null));
  const [salvandoContato, setSalvandoContato] = useState(false);
  const carregar = useCallback(() => {
    if (!condominioAtual) return;
    fetch(`${API_BASE_URL_USERS}/condominios/atual/resumo`, { headers: cabecalhos() })
      .then(async (response) => {
        if (!response.ok) throw new Error(await mensagemErro(response, "Não foi possível carregar os dados do condomínio."));
        setResumo(await response.json());
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
  }, [condominioAtual]);

  useEffect(() => { carregar(); }, [carregar]);

  // síndico (e ADM) editam contato e endereço; nome e CNPJ ficam com o ADM
  function abrirContato() { setContato(contatoDe((resumo?.condominio ?? null) as Condominio | null)); modalContato.onOpen()}
  async function salvarContato() {
    try {
      setSalvandoContato(true);
      await apiCondominios.editarContato(paraEnvio(contato));
      toast({ title: "Dados do condomínio atualizados", status: "success", duration: 2000 });
      modalContato.onClose();
      carregar();
    } 
    catch (e) {toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" })} 
    finally {setSalvandoContato(false)}
  }

  const c = resumo?.condominio;
  const linhaEndereco = c ? [c.logradouro && `${c.logradouro}${c.numero ? `, ${c.numero}` : ""}`, c.complemento].filter(Boolean).join(" - ") : "";
  const linhaCidade = c ? [c.bairro, [c.cidade, c.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ") : "";
  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={8} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Heading size="md">Olá, {user?.full_name}</Heading>
        <Text color="gray.500" marginTop={1}> Condomínio {condominioAtual ? condominioAtual.nome : "Gerenciamento do condomínio"}</Text>
        {!condominioAtual ? (
          <Box marginTop={8} bg="white" borderRadius="xl" padding={8} textAlign="center">
            <Text color="gray.600">Nenhum condomínio selecionado.</Text>
            {user?.admin_sistema && (
              <Button as={RouterLink} to="/Condominios" marginTop={4} size="sm" colorScheme="blue">Cadastrar condomínio</Button>
            )}
          </Box>
        ) : (
          <Flex marginTop={6} gap={5} direction={{ base: "column", xl: "row" }} align="flex-start">
            {/* FACHADA */}
            <Box width={{ base: "100%", xl: "55%" }} flexShrink={0}>
              <Image src={fachada} alt="Fachada do condomínio" borderRadius="xl" width="100%" height="auto" objectFit="contain" />
            </Box>
            {/* DADOS E NÚMEROS */}
            <Flex direction="column" flex={1} gap={3} width="100%">
              {carregando ? (<Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>) : erro ? (<Text color="red.500" fontSize="sm">{erro}</Text>) : resumo && c && (
                <>
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={4}>
                    <Flex justify="space-between" align="center" gap={2}>
                      <Text fontWeight="semibold">{c.nome}</Text>{permissoes.editaTudo && <Button size="xs" variant="ghost" leftIcon={<EditIcon />} onClick={abrirContato}>Editar dados</Button>}
                    </Flex>
                    <Divider marginY={2} />
                    <Flex direction="column" gap={2}>
                      <Informacao icone={IconePredio}>
                        {linhaEndereco || linhaCidade ? (
                          <>
                            {linhaEndereco && <Text>{linhaEndereco} - {linhaCidade}</Text>}
                            {c.cep && <Text color="gray.500">CEP {formatarCep(c.cep)}</Text>}
                          </>
                        ) : <Text color="gray.400">Endereço não informado</Text>}
                      </Informacao>
                      <Informacao icone={PhoneIcon}>{c.telefone ? formatarTelefone(c.telefone) : <Text as="span" color="gray.400">Telefone não informado</Text>}</Informacao>
                      <Informacao icone={EmailIcon}>{c.email ?? <Text as="span" color="gray.400">E-mail não informado</Text>}</Informacao>
                      <Informacao icone={IconeCartao}>{c.cnpj ? `CNPJ ${formatarCnpj(c.cnpj)}` : <Text as="span" color="gray.400">CNPJ não informado</Text>}</Informacao>
                    </Flex>
                  </Box>

                  {/* GESTÃO: SÍNDICO E CONSELHEIROS */}
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={4}>
                    <Text fontWeight="semibold">Gestão do condomínio</Text>
                    <Divider marginY={2} />
                    {resumo.gestao.length === 0 ? (<Text fontSize="sm" color="gray.400">Síndico e conselheiros ainda não designados.</Text>) : (
                      <Flex direction="column" gap={3}>
                        {resumo.gestao.map((m) => (
                          <Flex key={m.pessoa_id} align="center" gap={3}>
                            <FotoPessoa nome={m.nome} fotoId={m.foto_arquivo_id} tamanho="sm" />
                            <Box minWidth={0}>
                              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                {m.nome}
                                <Text as="span" fontSize="xs" fontWeight="normal" color={m.perfil === "SINDICO" ? "blue.600" : "gray.500"}>
                                  {" · "}{m.perfil === "SINDICO" ? "Síndico" : "Conselheiro"}{m.unidade && ` · ${m.unidade}`}
                                </Text>
                              </Text>
                              {(m.telefone || m.email) && (
                                <Text fontSize="xs" color="gray.500">{[m.telefone && formatarTelefone(m.telefone), m.email].filter(Boolean).join(" · ")}</Text>
                              )}
                            </Box>
                          </Flex>
                        ))}
                      </Flex>
                    )}
                  </Box>

                  <SimpleGrid columns={2} spacing={2}>
                    <Numero icone={IconeCasa} rotulo="Apartamentos" valor={resumo.total_apartamentos} link={permissoes.acessaCadastros ? "/Apartamentos" : undefined} />
                    <Numero icone={IconeVaga} rotulo="Vagas" valor={resumo.total_vagas} detalhe={`${resumo.vagas_fixas} fixas · ${resumo.vagas_rotativas} rotativas`} link={permissoes.veTudo ? "/Vagas" : undefined} />
                    <Numero icone={IconeUsuario} rotulo="Pessoas" valor={resumo.total_pessoas} link={permissoes.acessaCadastros ? "/Pessoas" : undefined} />
                    <Numero icone={IconeCarro} rotulo="Veículos" valor={resumo.total_veiculos} link={permissoes.acessaCadastros ? "/Veiculos" : undefined} />
                  </SimpleGrid>
                </>
              )}
            </Flex>
          </Flex>
        )}

        {/* AVISOS E FALE COM O SÍNDICO */}
        {condominioAtual && <QuadroAvisos />}

        <Modal isOpen={modalContato.isOpen} onClose={modalContato.onClose} size="2xl" isCentered scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>
              Dados do condomínio
              <Text fontSize="sm" fontWeight="normal" color="gray.500">Nome e CNPJ são alterados pelo administrador do sistema.</Text>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody><CamposContato valores={contato} aoMudar={setContato} /></ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modalContato.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={salvarContato} isLoading={salvandoContato}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
