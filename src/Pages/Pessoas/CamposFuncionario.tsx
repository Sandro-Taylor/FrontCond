// ---------------------------------------------------------
// CAMPOS DA FICHA DO FUNCIONÁRIO
// ---------------------------------------------------------
// Cargo, vínculo (próprio/terceirizado/autônomo), empresa,
// turno e admissão. Usado no cadastro e no detalhe da pessoa.
// Também tem o modal para gerenciar a lista de cargos.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Button, Flex, FormControl, FormLabel, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader,
  ModalOverlay, Select, SimpleGrid, Stack, Switch, Text, Tooltip, useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";

import { apiCargos } from "./API/FuncionarioPessoa";
import { ROTULOS_VINCULO_FUNCIONARIO, type Cargo, type FichaFuncionario, type FichaFuncionarioDados, type VinculoFuncionario } from "./ConfigPessoas";

export type ValoresFicha = { cargo_id: string; vinculo: VinculoFuncionario; empresa: string; turno: string; data_admissao: string };

export const FICHA_VAZIA: ValoresFicha = { cargo_id: "", vinculo: "PROPRIO", empresa: "", turno: "", data_admissao: "" };

export const fichaParaValores = (ficha: FichaFuncionario | null): ValoresFicha => ficha
  ? { cargo_id: ficha.cargo_id, vinculo: ficha.vinculo, empresa: ficha.empresa ?? "", turno: ficha.turno ?? "", data_admissao: ficha.data_admissao ?? "" }
  : FICHA_VAZIA;

// devolve a mensagem de erro, ou null se estiver tudo certo
export function validarFicha(valores: ValoresFicha): string | null {
  if (!valores.cargo_id) return "Escolha o cargo do funcionário";
  if (valores.vinculo === "TERCEIRIZADO" && !valores.empresa.trim()) return "Informe a empresa do funcionário terceirizado";
  return null;
}

export const paraFichaDados = (valores: ValoresFicha): FichaFuncionarioDados => ({
  cargo_id: valores.cargo_id,
  vinculo: valores.vinculo,
  empresa: valores.vinculo === "PROPRIO" ? null : valores.empresa.trim() || null,
  turno: valores.turno.trim() || null,
  data_admissao: valores.data_admissao || null,
});

type Props = {
  valores: ValoresFicha;
  aoMudar: (valores: ValoresFicha) => void;
  cargos: Cargo[];
  editavel?: boolean;
  tamanho?: "sm" | "md";
};

export function CamposFuncionario({ valores, aoMudar, cargos, editavel = true, tamanho = "md" }: Props) {
  const alterar = <K extends keyof ValoresFicha>(campo: K, valor: ValoresFicha[K]) => aoMudar({ ...valores, [campo]: valor });
  // cargo desativado continua aparecendo para quem já o tem
  const opcoes = cargos.filter((c) => c.ativo || c.id === valores.cargo_id);

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
      <FormControl isRequired isDisabled={!editavel}>
        <FormLabel fontSize="sm">Cargo</FormLabel>
        <Select size={tamanho} value={valores.cargo_id} placeholder="Selecione o cargo" onChange={(e) => alterar("cargo_id", e.target.value)}>
          {opcoes.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.ativo ? "" : " (desativado)"}</option>)}
        </Select>
      </FormControl>
      <FormControl isDisabled={!editavel}>
        <FormLabel fontSize="sm">Vínculo</FormLabel>
        <Select size={tamanho} value={valores.vinculo} onChange={(e) => alterar("vinculo", e.target.value as VinculoFuncionario)}>
          {(Object.keys(ROTULOS_VINCULO_FUNCIONARIO) as VinculoFuncionario[]).map((v) => <option key={v} value={v}>{ROTULOS_VINCULO_FUNCIONARIO[v]}</option>)}
        </Select>
      </FormControl>
      {valores.vinculo !== "PROPRIO" && (
        <FormControl isRequired={valores.vinculo === "TERCEIRIZADO"} isDisabled={!editavel}>
          <FormLabel fontSize="sm">Empresa</FormLabel>
          <Input size={tamanho} value={valores.empresa} onChange={(e) => alterar("empresa", e.target.value)} maxLength={150} placeholder="Nome da empresa" />
        </FormControl>
      )}
      <FormControl isDisabled={!editavel}>
        <FormLabel fontSize="sm">Turno / escala</FormLabel>
        <Input size={tamanho} value={valores.turno} onChange={(e) => alterar("turno", e.target.value)} maxLength={100} placeholder="Ex.: 12x36 noturno, 07h–16h" />
      </FormControl>
      <FormControl isDisabled={!editavel}>
        <FormLabel fontSize="sm">Admissão</FormLabel>
        <Input size={tamanho} type="date" value={valores.data_admissao} onChange={(e) => alterar("data_admissao", e.target.value)} />
      </FormControl>
    </SimpleGrid>
  );
}

// carrega os cargos do condomínio (só para quem vê tudo; o morador não usa)
export function useCargos(carregar: boolean) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const recarregar = useCallback(() => { apiCargos.listar().then(setCargos).catch(() => setCargos([])); }, []);
  useEffect(() => { if (carregar) recarregar(); }, [carregar, recarregar]);
  return { cargos, recarregar };
}

// GERENCIAR CARGOS (gestão)
export function ModalCargos({ aberto, aoFechar, cargos, aoMudar }: { aberto: boolean; aoFechar: () => void; cargos: Cargo[]; aoMudar: () => void }) {
  const toast = useToast();
  const [novo, setNovo] = useState("");

  async function executar(acao: () => Promise<unknown>) {
    try { await acao(); aoMudar(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Não foi possível salvar", status: "error" }); }
  }

  async function adicionar() {
    if (novo.trim().length < 2) return;
    await executar(() => apiCargos.criar(novo.trim()));
    setNovo("");
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>Cargos dos funcionários</ModalHeader>
        <ModalCloseButton />
        <ModalBody paddingBottom={6}>
          <Flex gap={2}>
            <Input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo cargo (ex.: Recepcionista)" maxLength={80}
              onKeyDown={(e) => { if (e.key === "Enter") adicionar(); }} />
            <Button colorScheme="blue" leftIcon={<AddIcon boxSize={2.5} />} onClick={adicionar} isDisabled={novo.trim().length < 2}>Adicionar</Button>
          </Flex>
          <Stack spacing={1} marginTop={4}>
            {cargos.map((cargo) => (
              <Flex key={cargo.id} justify="space-between" align="center" paddingX={3} paddingY={2} borderRadius="md" _hover={{ bg: "gray.50" }}>
                <Text fontSize="sm" color={cargo.ativo ? "gray.800" : "gray.400"}>{cargo.nome}</Text>
                <Flex align="center" gap={3}>
                  <Tooltip label={cargo.ativo ? "Ativo (aparece no cadastro)" : "Desativado"} hasArrow>
                    <span><Switch size="sm" isChecked={cargo.ativo} onChange={(e) => executar(() => apiCargos.editar(cargo.id, cargo.nome, e.target.checked))} /></span>
                  </Tooltip>
                  <IconButton aria-label="Excluir" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red"
                    onClick={() => { if (window.confirm(`Excluir o cargo ${cargo.nome}?`)) executar(() => apiCargos.excluir(cargo.id)); }} />
                </Flex>
              </Flex>
            ))}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
