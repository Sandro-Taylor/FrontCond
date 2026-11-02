// ---------------------------------------------------------
// MODAIS DE PESSOA DENTRO DO APARTAMENTO
// ---------------------------------------------------------
// - Adicionar pessoa: escolhe o papel na unidade e busca pelo
//   CPF quem já está cadastrado, ou cadastra uma pessoa nova.
// - Editar pessoa: dados pessoais + papel na unidade.
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Alert, AlertIcon, Box, Button, Divider, Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Text, useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

import { formatarCpf, formatarTelefone } from "../../Components/config";
import { CamposPessoa, PESSOA_VAZIA, paraPessoaDados, validarPessoa, type ValoresPessoa } from "../Pessoas/CamposPessoa";
import { CampoResponsavel, useOpcoesResponsavel } from "../Pessoas/CampoResponsavel";
import { useAuth } from "../Login/useAuth";
import {
  ROTULOS_PARENTESCO, ROTULOS_TIPO_RELACAO, type Parentesco, type PessoaDados, type TipoRelacao,
} from "../Pessoas/ConfigPessoas";
import { apiApartamentos } from "./API";
import type { AdicionarPessoaDados, PessoaDoVinculo, VinculoApartamento, VinculoDados } from "./ConfigApartamentos";

const PARENTESCOS = Object.keys(ROTULOS_PARENTESCO) as Parentesco[];

// ---------------------------------------------------------
// PAPEL NA UNIDADE (proprietário / inquilino / residente)
// ---------------------------------------------------------

export type ValoresVinculo = {
  tipo: TipoRelacao;
  reside: boolean;
  titularId: string;
  parentesco: Parentesco | "";
};

// devolve os dados para a API, ou a mensagem de erro
export function vinculoParaApi(valores: ValoresVinculo): VinculoDados | string {
  if (valores.tipo === "RESIDENTE" && (!valores.titularId || !valores.parentesco)) {
    return "Escolha a quem o residente está ligado e o parentesco";
  }
  return {
    tipo_relacao: valores.tipo,
    reside: valores.tipo === "PROPRIETARIO" ? valores.reside : true,
    titular_vinculo_id: valores.tipo === "RESIDENTE" ? valores.titularId : null,
    parentesco: valores.tipo === "RESIDENTE" ? (valores.parentesco as Parentesco) : null,
  };
}

type CamposVinculoProps = {
  valores: ValoresVinculo;
  aoMudar: (valores: ValoresVinculo) => void;
  titulares: VinculoApartamento[]; // possíveis titulares do residente
};

export function CamposVinculo({ valores, aoMudar, titulares }: CamposVinculoProps) {
  const alterar = (mudanca: Partial<ValoresVinculo>) => aoMudar({ ...valores, ...mudanca });

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
      <FormControl>
        <FormLabel fontSize="sm">Papel na unidade</FormLabel>
        <Select size="sm" value={valores.tipo} onChange={(e) => alterar({ tipo: e.target.value as TipoRelacao, titularId: valores.titularId || titulares[0]?.id || "" })}>
          <option value="PROPRIETARIO">Proprietário</option>
          <option value="INQUILINO">Inquilino</option>
          <option value="RESIDENTE" disabled={titulares.length === 0}>Residente (familiar, dependente, funcionário...)</option>
        </Select>
      </FormControl>

      {valores.tipo === "PROPRIETARIO" && (
        <FormControl>
          <FormLabel fontSize="sm">Mora no prédio?</FormLabel>
          <Select size="sm" value={valores.reside ? "sim" : "nao"} onChange={(e) => alterar({ reside: e.target.value === "sim" })}>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </Select>
        </FormControl>
      )}

      {valores.tipo === "RESIDENTE" && (
        <>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Ligado a</FormLabel>
            <Select size="sm" value={valores.titularId} onChange={(e) => alterar({ titularId: e.target.value })}>
              {titulares.map((titular) => (
                <option key={titular.id} value={titular.id}>{titular.pessoa.nome} ({ROTULOS_TIPO_RELACAO[titular.tipo_relacao]})</option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Parentesco / relação</FormLabel>
            <Select size="sm" value={valores.parentesco} placeholder="Selecione" onChange={(e) => alterar({ parentesco: e.target.value as Parentesco })}>
              {PARENTESCOS.map((opcao) => <option key={opcao} value={opcao}>{ROTULOS_PARENTESCO[opcao]}</option>)}
            </Select>
          </FormControl>
        </>
      )}
    </SimpleGrid>
  );
}

// ---------------------------------------------------------
// MODAL: ADICIONAR PESSOA
// ---------------------------------------------------------

type ModalAdicionarProps = {
  aberto: boolean;
  aoFechar: () => void;
  titulares: VinculoApartamento[];
  aoAdicionar: (dados: AdicionarPessoaDados) => Promise<boolean>;
};

export function ModalAdicionarPessoa({ aberto, aoFechar, titulares, aoAdicionar }: ModalAdicionarProps) {
  const toast = useToast();
  const [vinculo, setVinculo] = useState<ValoresVinculo>({ tipo: "PROPRIETARIO", reside: true, titularId: "", parentesco: "" });
  const [modo, setModo] = useState<"buscar" | "nova">("buscar");
  const [cpfBusca, setCpfBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [encontrada, setEncontrada] = useState<PessoaDoVinculo | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [valores, setValores] = useState<ValoresPessoa>(PESSOA_VAZIA);
  const [salvando, setSalvando] = useState(false);
  const editaTudo = Boolean(useAuth().user?.admin_sistema); // o responsável do WhatsApp: só o ADM escolhe
  const [responsavel, setResponsavel] = useState<string | null>(null);
  const opcoesResponsavel = useOpcoesResponsavel(aberto && editaTudo);

  // a cada abertura, começa limpo (sem titular: proprietário; com titular: residente)
  useEffect(() => {
    if (!aberto) return;
    setVinculo({ tipo: titulares.length === 0 ? "PROPRIETARIO" : "RESIDENTE", reside: true, titularId: titulares[0]?.id ?? "", parentesco: "" });
    setModo("buscar");
    setCpfBusca("");
    setEncontrada(null);
    setNaoEncontrada(false);
    setValores(PESSOA_VAZIA);
    setResponsavel(null);
  }, [aberto]);

  async function buscar() {
    if (cpfBusca.replace(/\D/g, "").length !== 11) {
      toast({ title: "Digite os 11 números do CPF", status: "warning" });
      return;
    }
    try {
      setBuscando(true);
      const pessoa = await apiApartamentos.buscarPessoaPorCpf(cpfBusca);
      setEncontrada(pessoa);
      setNaoEncontrada(!pessoa);
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao buscar CPF", status: "error" });
    } finally {
      setBuscando(false);
    }
  }

  async function adicionar() {
    const dadosVinculo = vinculoParaApi(vinculo);
    if (typeof dadosVinculo === "string") {
      toast({ title: dadosVinculo, status: "warning" });
      return;
    }

    let dados: AdicionarPessoaDados;
    if (modo === "buscar") {
      if (!encontrada) {
        toast({ title: "Busque a pessoa pelo CPF ou escolha \"Pessoa nova\"", status: "warning" });
        return;
      }
      dados = { ...dadosVinculo, pessoa_id: encontrada.id };
    } else {
      const erro = validarPessoa(valores);
      if (erro) {
        toast({ title: erro, status: "warning" });
        return;
      }
      dados = { ...dadosVinculo, pessoa: { ...paraPessoaDados(valores), ...(editaTudo ? { responsavel_user_id: responsavel } : {}) } };
    }

    setSalvando(true);
    const ok = await aoAdicionar(dados);
    setSalvando(false);
    if (ok) aoFechar();
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Adicionar pessoa ao apartamento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <CamposVinculo valores={vinculo} aoMudar={setVinculo} titulares={titulares} />

          <Divider marginY={5} />

          <Flex gap={2} marginBottom={4}>
            <Button size="sm" variant={modo === "buscar" ? "solid" : "outline"} colorScheme="blue" onClick={() => setModo("buscar")}>Pessoa já cadastrada</Button>
            <Button size="sm" variant={modo === "nova" ? "solid" : "outline"} colorScheme="blue" onClick={() => setModo("nova")}>Pessoa nova</Button>
          </Flex>

          {modo === "buscar" ? (
            <Box>
              <Flex gap={2}>
                <Input size="sm" maxWidth="220px" placeholder="CPF da pessoa" value={cpfBusca} inputMode="numeric" maxLength={14}
                  onChange={(e) => { setCpfBusca(formatarCpf(e.target.value)); setEncontrada(null); setNaoEncontrada(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") buscar(); }} />
                <Button size="sm" leftIcon={<SearchIcon />} onClick={buscar} isLoading={buscando}>Buscar</Button>
              </Flex>
              {encontrada && (
                <Alert status="success" marginTop={3} borderRadius="md" fontSize="sm">
                  <AlertIcon />{encontrada.nome} · CPF {formatarCpf(encontrada.cpf)}{encontrada.telefone ? ` · ${formatarTelefone(encontrada.telefone)}` : ""}
                </Alert>
              )}
              {naoEncontrada && (
                <Alert status="info" marginTop={3} borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  <Flex justify="space-between" align="center" flex={1} gap={3} wrap="wrap">
                    Nenhuma pessoa com este CPF no condomínio.
                    <Button size="xs" colorScheme="blue" onClick={() => { setValores({ ...PESSOA_VAZIA, cpf: cpfBusca }); setModo("nova"); }}>Cadastrar como pessoa nova</Button>
                  </Flex>
                </Alert>
              )}
              <Text fontSize="xs" color="gray.500" marginTop={3}>Para crianças ou pessoas sem CPF, use "Pessoa nova".</Text>
            </Box>
          ) : (
            <Box>
              <CamposPessoa valores={valores} aoMudar={setValores} tamanho="sm" />
              {editaTudo && (
                <Box marginTop={3}>
                  <CampoResponsavel valor={responsavel} aoMudar={setResponsavel} opcoes={opcoesResponsavel} tamanho="sm" />
                </Box>
              )}
            </Box>
          )}
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={adicionar} isLoading={salvando}>Adicionar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------
// MODAL: EDITAR PESSOA (dados pessoais + papel na unidade)
// ---------------------------------------------------------

type ModalEditarProps = {
  aberto: boolean;
  aoFechar: () => void;
  vinculo: VinculoApartamento | null;
  titulares: VinculoApartamento[];
  aoSalvar: (vinculo: VinculoApartamento, pessoa: PessoaDados, papel: VinculoDados) => Promise<boolean>;
};

export function ModalEditarPessoa({ aberto, aoFechar, vinculo, titulares, aoSalvar }: ModalEditarProps) {
  const toast = useToast();
  const [valores, setValores] = useState<ValoresPessoa>(PESSOA_VAZIA);
  const [papel, setPapel] = useState<ValoresVinculo>({ tipo: "PROPRIETARIO", reside: true, titularId: "", parentesco: "" });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto || !vinculo) return;
    setValores({
      nome: vinculo.pessoa.nome,
      cpf: formatarCpf(vinculo.pessoa.cpf),
      dataNascimento: vinculo.pessoa.data_nascimento ?? "",
      telefone: formatarTelefone(vinculo.pessoa.telefone),
      email: vinculo.pessoa.email ?? "",
    });
    setPapel({ tipo: vinculo.tipo_relacao, reside: vinculo.reside, titularId: vinculo.titular_vinculo_id ?? "", parentesco: vinculo.parentesco ?? "" });
  }, [aberto, vinculo]);

  if (!vinculo) return null;

  // a própria pessoa não pode ser titular dela mesma
  const outrosTitulares = titulares.filter((t) => t.id !== vinculo.id);

  async function salvar() {
    if (!vinculo) return;
    const erro = validarPessoa(valores);
    if (erro) {
      toast({ title: erro, status: "warning" });
      return;
    }
    const dadosPapel = vinculoParaApi(papel);
    if (typeof dadosPapel === "string") {
      toast({ title: dadosPapel, status: "warning" });
      return;
    }
    setSalvando(true);
    const ok = await aoSalvar(vinculo, paraPessoaDados(valores), dadosPapel);
    setSalvando(false);
    if (ok) aoFechar();
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Editar {vinculo.pessoa.nome}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" fontWeight="semibold" marginBottom={3}>Papel na unidade</Text>
          <CamposVinculo valores={papel} aoMudar={setPapel} titulares={outrosTitulares} />
          <Divider marginY={5} />
          <Text fontSize="sm" fontWeight="semibold" marginBottom={3}>Dados pessoais</Text>
          <CamposPessoa valores={valores} aoMudar={setValores} tamanho="sm" />
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
