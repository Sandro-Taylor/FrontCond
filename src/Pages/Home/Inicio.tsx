import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Divider, Flex, Heading, Image, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { EmailIcon, PhoneIcon } from "@chakra-ui/icons";
import fachada from "../../assets/Fachada.png";
import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, formatarCep, formatarCnpj, formatarTelefone, mensagemErro } from "../../Components/config";
import { useAuth } from "../Login/useAuth";
import { Titulo } from "../Titulos/Titulos";
import { IconeCarro, IconeCartao, IconeCasa, IconePredio, IconeUsuario, IconeVaga } from "../Pessoas/IconesPessoas";

type Resumo = {
  condominio: {
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
  };
  total_apartamentos: number;
  total_vagas: number;
  vagas_fixas: number;
  vagas_rotativas: number;
  total_pessoas: number;
  total_veiculos: number;
};

const Numero = ({ icone: Icone, rotulo, valor, detalhe, link }: { icone: ElementType; rotulo: string; valor: number; detalhe?: string; link: string }) => (
  <Flex as={RouterLink} to={link} align="center" gap={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.100" paddingX={3} paddingY={2} _hover={{ borderColor: "blue.200" }}>
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
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(Boolean(condominioAtual));

  useEffect(() => {
    if (!condominioAtual) return;
    fetch(`${API_BASE_URL_USERS}/condominios/atual/resumo`, { headers: cabecalhos() })
      .then(async (response) => {
        if (!response.ok) throw new Error(await mensagemErro(response, "Não foi possível carregar os dados do condomínio."));
        setResumo(await response.json());
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
  }, [condominioAtual]);

  const c = resumo?.condominio;
  const linhaEndereco = c ? [c.logradouro && `${c.logradouro}${c.numero ? `, ${c.numero}` : ""}`, c.complemento].filter(Boolean).join(" - ") : "";
  const linhaCidade = c ? [c.bairro, [c.cidade, c.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ") : "";

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />

      <Box flex={1} minWidth={0} paddingY={8} paddingRight={{ md: 6 }}>
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
              {carregando ? (
                <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>
              ) : erro ? (
                <Text color="red.500" fontSize="sm">{erro}</Text>
              ) : resumo && c && (
                <>
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" padding={4}>
                    <Text fontWeight="semibold">{c.nome}</Text>
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

                  <SimpleGrid columns={2} spacing={2}>
                    <Numero icone={IconeCasa} rotulo="Apartamentos" valor={resumo.total_apartamentos} link="/Apartamentos" />
                    <Numero icone={IconeVaga} rotulo="Vagas" valor={resumo.total_vagas} detalhe={`${resumo.vagas_fixas} fixas · ${resumo.vagas_rotativas} rotativas`} link="/Vagas" />
                    <Numero icone={IconeUsuario} rotulo="Pessoas" valor={resumo.total_pessoas} link="/Pessoas" />
                    <Numero icone={IconeCarro} rotulo="Veículos" valor={resumo.total_veiculos} link="/Veiculos" />
                  </SimpleGrid>
                </>
              )}
            </Flex>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
