import { useState } from "react";
import type { ElementType, ReactNode } from "react";
import { Alert, AlertIcon, Badge, Box, Button, Checkbox, Divider, Flex, FormControl, FormLabel, IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Select, SimpleGrid, Text, Textarea, Tooltip, VStack } from "@chakra-ui/react";
import { AddIcon, CalendarIcon, CheckCircleIcon, DeleteIcon, EmailIcon, PhoneIcon } from "@chakra-ui/icons";
import { ROTULOS_PERFIL, type PerfilPessoa, type PessoaCriarDados, type ApartamentoCriarDados, type VagaCriarDados, type VeiculoCriarDados } from "./ConfigPessoas";
import { IconeCarro, IconeCartao, IconePredio, IconeTile, IconeUsuario, IconeVaga } from "./IconesPessoas";

type CriarPessoaProps = {
  aoCriar: () => void;
  criando: boolean;
  criar: (dados: PessoaCriarDados) => Promise<boolean>;
};

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCpf(valor: string) {
  const numeros = somenteNumeros(valor).slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function cpfValido(cpf: string) {
  const numeros = somenteNumeros(cpf);
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
    return false;
  }

  const calcularDigito = (quantidade: number) => {
    let soma = 0;
    for (let i = 0; i < quantidade; i++) {soma += Number(numeros[i]) * (quantidade + 1 - i);}
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcularDigito(9) === Number(numeros[9]) && calcularDigito(10) === Number(numeros[10]);
}

function novoVeiculo(): VeiculoCriarDados {return { placa: null, marca: null, modelo: null, cor: null, descricao: null };}
function novaVaga(): VagaCriarDados {return { numero: "", localizacao: null, observacao: null, veiculos: [] };}
function novoApartamento(): ApartamentoCriarDados {return { bloco: null, numero: "", andar: null, observacao: null, tipo_relacao: "MORADOR", principal: false, vagas: [] };}

/* ---------- Blocos de apresentação ---------- */
const Campo = ({ rotulo, obrigatorio, invalido, children }: { rotulo: string; obrigatorio?: boolean; invalido?: boolean; children: ReactNode }) => (
  <FormControl isRequired={obrigatorio} isInvalid={invalido}>
    <FormLabel fontSize="xs" fontWeight="medium" color="gray.500" marginBottom={1}>{rotulo}</FormLabel>
    {children}
  </FormControl>
);

const CampoComIcone = ({ icone: Icone, children }: { icone: ElementType; children: ReactNode }) => (
  <InputGroup>
    <InputLeftElement pointerEvents="none"><Icone boxSize={3.5} color="gray.400" /></InputLeftElement>
    {children}
  </InputGroup>
);

const TituloSecao = ({ icone: Icone, contador, acao, children }: { icone: ElementType; contador?: number; acao?: ReactNode; children: ReactNode }) => (
  <Flex justify="space-between" align="center" gap={3}>
    <Flex align="center" gap={2}>
      <Icone boxSize={4} color="gray.400" />
      <Text fontSize="sm" fontWeight="semibold" color="gray.800">{children}</Text>
      {contador !== undefined && contador > 0 && (
        <Badge borderRadius="full" colorScheme="gray" fontSize="xs" paddingX={2}>{contador}</Badge>
      )}
    </Flex>
    {acao}
  </Flex>
);

const BotaoRemover = ({ rotulo, onClick }: { rotulo: string; onClick: () => void }) => (
  <Tooltip label={rotulo} placement="top" hasArrow>
    <IconButton aria-label={rotulo} icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost" colorScheme="red" onClick={onClick} />
  </Tooltip>
);

export function CriarPessoa({ aoCriar, criando, criar }: CriarPessoaProps) {
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<PerfilPessoa>("MORADOR");
  const [cpf, setCpf] = useState("");
  const [cpfTocado, setCpfTocado] = useState(false);
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [apartamentos, setApartamentos] = useState<ApartamentoCriarDados[]>([]);
  const quantidadeDigitos = somenteNumeros(cpf).length;
  const cpfCompleto = quantidadeDigitos === 11;
  const cpfErro = cpfCompleto ? !cpfValido(cpf) : cpfTocado && quantidadeDigitos > 0;
  const cpfOk = cpfCompleto && !cpfErro;
  function adicionarApartamento() {setApartamentos([...apartamentos, novoApartamento()]);}
  function removerApartamento(index: number) {setApartamentos(apartamentos.filter((_, i) => i !== index));}
  function alterarApartamento(index: number, dados: Partial<ApartamentoCriarDados>) {setApartamentos(apartamentos.map((apartamento, i) => (i === index ? { ...apartamento, ...dados } : apartamento)))}

  // VAGAS
  function adicionarVaga(apartamentoIndex: number) {
    const novos = [...apartamentos];
    novos[apartamentoIndex].vagas.push(novaVaga());
    setApartamentos(novos);
  }

  function removerVaga(apartamentoIndex: number, vagaIndex: number) {
    const novos = [...apartamentos];
    novos[apartamentoIndex].vagas = novos[apartamentoIndex].vagas.filter((_, i) => i !== vagaIndex);
    setApartamentos(novos);
  }

  function alterarVaga(apartamentoIndex: number, vagaIndex: number, dados: Partial<VagaCriarDados>) {
    const novos = [...apartamentos];
    novos[apartamentoIndex].vagas[vagaIndex] = { ...novos[apartamentoIndex].vagas[vagaIndex], ...dados };
    setApartamentos(novos);
  }


  // =====================================================
  // VEÍCULOS
  // =====================================================

  function adicionarVeiculo(apartamentoIndex: number, vagaIndex: number) {
    const novos = [...apartamentos];
    novos[apartamentoIndex].vagas[vagaIndex].veiculos.push(novoVeiculo());
    setApartamentos(novos);
  }


  function removerVeiculo(apartamentoIndex: number, vagaIndex: number, veiculoIndex: number) {
    const novos = [...apartamentos];
    novos[apartamentoIndex].vagas[vagaIndex].veiculos = novos[apartamentoIndex].vagas[vagaIndex].veiculos.filter((_, i) => i !== veiculoIndex);
    setApartamentos(novos);
  }


  function alterarVeiculo(apartamentoIndex: number, vagaIndex: number, veiculoIndex: number, dados: Partial<VeiculoCriarDados>) {
    const novos = [...apartamentos];
    novos[apartamentoIndex].vagas[vagaIndex].veiculos[veiculoIndex] = { ...novos[apartamentoIndex].vagas[vagaIndex].veiculos[veiculoIndex], ...dados };
    setApartamentos(novos);
  }


  // =====================================================
  // CADASTRAR
  // =====================================================

  async function handleCriarPessoa() {

    if (!nome.trim()) return;

    if (cpf && !cpfValido(cpf)) {
      setCpfTocado(true);
      return;
    }

    const dados: PessoaCriarDados = {
      nome: nome.trim(),
      cpf: cpf ? somenteNumeros(cpf) : null,
      email: email.trim() ? email.trim() : null,
      telefone: telefone.trim() ? somenteNumeros(telefone) : null,
      data_nascimento: dataNascimento || null,
      perfil,
      apartamentos,
    };

    const sucesso = await criar(dados);

    if (sucesso) {
      setTimeout(() => { aoCriar(); }, 0);
    }
  }


  return (
    <Flex direction="column" gap={6}>

      {/* PESSOA */}

      <Box>
        <Box marginBottom={4}><TituloSecao icone={IconeUsuario}>Dados da pessoa</TituloSecao></Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>

          <Campo rotulo="Nome" obrigatorio>
            <CampoComIcone icone={IconeUsuario}>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" focusBorderColor="blue.400" />
            </CampoComIcone>
          </Campo>


          <Campo rotulo="Perfil">
            <Select value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilPessoa)} focusBorderColor="blue.400">
              {(Object.keys(ROTULOS_PERFIL) as PerfilPessoa[]).map((opcao) => (
                <option key={opcao} value={opcao}>{ROTULOS_PERFIL[opcao]}</option>
              ))}
            </Select>
          </Campo>

          <Campo rotulo="CPF" invalido={cpfErro}>
            <InputGroup>
              <InputLeftElement pointerEvents="none"><IconeCartao boxSize={3.5} color={cpfErro ? "red.400" : "gray.400"} /></InputLeftElement>

              <Input value={cpf} onChange={(e) => setCpf(formatarCpf(e.target.value))} onBlur={() => setCpfTocado(true)} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} focusBorderColor="blue.400" />

              {cpfOk && (
                <InputRightElement pointerEvents="none"><CheckCircleIcon boxSize={3.5} color="green.500" /></InputRightElement>
              )}
            </InputGroup>

            {cpfErro && (
              <Alert status="error" variant="subtle" borderRadius="md" paddingX={3} paddingY={2} marginTop={2} fontSize="xs">
                <AlertIcon boxSize={3.5} />
                {cpfCompleto ? "CPF inválido. Confira os números digitados." : "CPF incompleto. Digite os 11 números."}
              </Alert>
            )}
          </Campo>


          <Campo rotulo="Data de nascimento">
            <CampoComIcone icone={CalendarIcon}>
              <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} focusBorderColor="blue.400" />
            </CampoComIcone>
          </Campo>


          <Campo rotulo="Telefone / WhatsApp">
            <CampoComIcone icone={PhoneIcon}>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" focusBorderColor="blue.400" />
            </CampoComIcone>
          </Campo>


          <Box gridColumn={{ md: "span 2" }}>
            <Campo rotulo="E-mail">
              <CampoComIcone icone={EmailIcon}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com" focusBorderColor="blue.400" />
              </CampoComIcone>
            </Campo>
          </Box>

        </SimpleGrid>
      </Box>


      <Divider borderColor="gray.100" />


      {/* APARTAMENTOS */}

      <Box>
        <TituloSecao
          icone={IconePredio}
          contador={apartamentos.length}
          acao={
            <Button size="sm" variant="outline" colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={adicionarApartamento}>Adicionar apartamento</Button>
          }
        >
          Apartamentos
        </TituloSecao>


        {apartamentos.length === 0 && (
          <Flex marginTop={4} direction="column" align="center" textAlign="center" border="1px dashed" borderColor="gray.200" borderRadius="xl" paddingX={6} paddingY={8}>
            <IconeTile icone={IconePredio} cor="gray" />
            <Text marginTop={3} fontSize="sm" fontWeight="medium" color="gray.700">Nenhum apartamento adicionado</Text>
            <Text marginTop={1} fontSize="xs" color="gray.500">Vincule a pessoa a um apartamento para cadastrar também suas vagas e veículos.</Text>
          </Flex>
        )}


        <VStack align="stretch" spacing={4} marginTop={4}>
          {apartamentos.map((apartamento, apartamentoIndex) => (

            <Box key={apartamentoIndex} border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>

              <Flex justify="space-between" align="center" marginBottom={4}>
                <Flex align="center" gap={3}>
                  <IconeTile icone={IconePredio} cor="blue" tamanho={8} />
                  <Text fontWeight="semibold" color="gray.800">Apartamento {apartamentoIndex + 1}</Text>
                </Flex>

                <BotaoRemover rotulo="Remover apartamento" onClick={() => removerApartamento(apartamentoIndex)} />
              </Flex>


              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>

                <Campo rotulo="Bloco">
                  <Input size="sm" borderRadius="md" placeholder="Ex.: A" value={apartamento.bloco ?? ""} onChange={(e) => alterarApartamento(apartamentoIndex, { bloco: e.target.value || null })} />
                </Campo>


                <Campo rotulo="Número">
                  <Input size="sm" borderRadius="md" placeholder="Ex.: 302" value={apartamento.numero} onChange={(e) => alterarApartamento(apartamentoIndex, { numero: e.target.value })} />
                </Campo>


                <Campo rotulo="Andar">
                  <Input size="sm" borderRadius="md" type="number" placeholder="Ex.: 3" value={apartamento.andar ?? ""} onChange={(e) => alterarApartamento(apartamentoIndex, { andar: e.target.value === "" ? null : Number(e.target.value) })} />
                </Campo>

              </SimpleGrid>


              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3} alignItems="end">

                <Campo rotulo="Vínculo">
                  <Select size="sm" borderRadius="md" value={apartamento.tipo_relacao} onChange={(e) => alterarApartamento(apartamentoIndex, { tipo_relacao: e.target.value as "PROPRIETARIO" | "MORADOR" })}>
                    <option value="MORADOR">Morador</option>
                    <option value="PROPRIETARIO">Proprietário</option>
                  </Select>
                </Campo>


                <Flex align="center" height="32px">
                  <Checkbox size="sm" isChecked={apartamento.principal} onChange={(e) => alterarApartamento(apartamentoIndex, { principal: e.target.checked })}>Apartamento principal</Checkbox>
                </Flex>

              </SimpleGrid>


              <Box marginTop={3}>
                <Campo rotulo="Observação">
                  <Textarea size="sm" rows={2} borderRadius="md" placeholder="Alguma informação extra sobre o apartamento" value={apartamento.observacao ?? ""} onChange={(e) => alterarApartamento(apartamentoIndex, { observacao: e.target.value || null })} />
                </Campo>
              </Box>


              {/* VAGAS */}

              <Divider marginY={5} borderColor="gray.100" />

              <TituloSecao
                icone={IconeVaga}
                contador={apartamento.vagas.length}
                acao={
                  <Button size="xs" variant="ghost" colorScheme="blue" leftIcon={<AddIcon boxSize={2} />} onClick={() => adicionarVaga(apartamentoIndex)}>Adicionar vaga</Button>
                }
              >
                Vagas
              </TituloSecao>


              {apartamento.vagas.length > 0 && (
                <VStack align="stretch" spacing={3} marginTop={3}>
                  {apartamento.vagas.map((vaga, vagaIndex) => (

                    <Box key={vagaIndex} bg="gray.50" borderRadius="lg" padding={3}>

                      <Flex justify="space-between" align="center" marginBottom={3}>
                        <Flex align="center" gap={2}>
                          <IconeVaga boxSize={4} color="gray.500" />
                          <Text fontSize="sm" fontWeight="semibold" color="gray.700">Vaga {vagaIndex + 1}</Text>
                        </Flex>

                        <BotaoRemover rotulo="Remover vaga" onClick={() => removerVaga(apartamentoIndex, vagaIndex)} />
                      </Flex>


                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>

                        <Campo rotulo="Número da vaga">
                          <Input size="sm" bg="white" borderRadius="md" placeholder="Ex.: 12" value={vaga.numero} onChange={(e) => alterarVaga(apartamentoIndex, vagaIndex, { numero: e.target.value })} />
                        </Campo>


                        <Campo rotulo="Localização">
                          <Input size="sm" bg="white" borderRadius="md" placeholder="Ex.: Subsolo 1" value={vaga.localizacao ?? ""} onChange={(e) => alterarVaga(apartamentoIndex, vagaIndex, { localizacao: e.target.value || null })} />
                        </Campo>

                      </SimpleGrid>


                      <Box marginTop={3}>
                        <Campo rotulo="Observação">
                          <Textarea size="sm" rows={2} bg="white" borderRadius="md" placeholder="Alguma informação extra sobre a vaga" value={vaga.observacao ?? ""} onChange={(e) => alterarVaga(apartamentoIndex, vagaIndex, { observacao: e.target.value || null })} />
                        </Campo>
                      </Box>


                      {/* VEÍCULOS */}

                      <Flex justify="space-between" align="center" marginTop={4}>
                        <Flex align="center" gap={2}>
                          <IconeCarro boxSize={4} color="gray.500" />
                          <Text fontSize="sm" fontWeight="semibold" color="gray.700">Veículos</Text>
                          {vaga.veiculos.length > 0 && (
                            <Badge borderRadius="full" colorScheme="gray" fontSize="xs" paddingX={2}>{vaga.veiculos.length}</Badge>
                          )}
                        </Flex>

                        <Button size="xs" variant="ghost" colorScheme="blue" leftIcon={<AddIcon boxSize={2} />} onClick={() => adicionarVeiculo(apartamentoIndex, vagaIndex)}>Adicionar veículo</Button>
                      </Flex>


                      {vaga.veiculos.length > 0 && (
                        <VStack align="stretch" spacing={2} marginTop={3}>
                          {vaga.veiculos.map((veiculo, veiculoIndex) => (

                            <Box key={veiculoIndex} bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" padding={3}>

                              <Flex justify="space-between" align="center" marginBottom={2}>
                                <Text fontSize="xs" fontWeight="medium" color="gray.500">Veículo {veiculoIndex + 1}</Text>
                                <BotaoRemover rotulo="Remover veículo" onClick={() => removerVeiculo(apartamentoIndex, vagaIndex, veiculoIndex)} />
                              </Flex>


                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>

                                <Input size="sm" borderRadius="md" placeholder="Placa" value={veiculo.placa ?? ""} onChange={(e) => alterarVeiculo(apartamentoIndex, vagaIndex, veiculoIndex, { placa: e.target.value.toUpperCase() || null })} />

                                <Input size="sm" borderRadius="md" placeholder="Marca" value={veiculo.marca ?? ""} onChange={(e) => alterarVeiculo(apartamentoIndex, vagaIndex, veiculoIndex, { marca: e.target.value || null })} />

                                <Input size="sm" borderRadius="md" placeholder="Modelo" value={veiculo.modelo ?? ""} onChange={(e) => alterarVeiculo(apartamentoIndex, vagaIndex, veiculoIndex, { modelo: e.target.value || null })} />

                                <Input size="sm" borderRadius="md" placeholder="Cor" value={veiculo.cor ?? ""} onChange={(e) => alterarVeiculo(apartamentoIndex, vagaIndex, veiculoIndex, { cor: e.target.value || null })} />

                              </SimpleGrid>


                              <Textarea size="sm" rows={2} borderRadius="md" marginTop={2} placeholder="Descrição do veículo" value={veiculo.descricao ?? ""} onChange={(e) => alterarVeiculo(apartamentoIndex, vagaIndex, veiculoIndex, { descricao: e.target.value || null })} />

                            </Box>
                          ))}
                        </VStack>
                      )}

                    </Box>
                  ))}
                </VStack>
              )}

            </Box>
          ))}
        </VStack>
      </Box>


      <Divider borderColor="gray.100" />


      <Button alignSelf="flex-end" colorScheme="blue" borderRadius="lg" leftIcon={<AddIcon boxSize={2.5} />} onClick={handleCriarPessoa} isLoading={criando} isDisabled={!nome.trim() || cpfErro}>Cadastrar pessoa</Button>

    </Flex>
  );
}
