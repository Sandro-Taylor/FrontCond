// ---------------------------------------------------------
// CADASTRO DE PESSOA
// ---------------------------------------------------------
// Só os dados da pessoa e o perfil de acesso. A ligação com
// apartamentos é feita na tela de Apartamentos.
// ---------------------------------------------------------

import { useState } from "react";
import { Button, Flex, FormControl, FormLabel, Select, Text, useToast } from "@chakra-ui/react";
import { CamposPessoa, PESSOA_VAZIA, paraPessoaDados, validarPessoa, type ValoresPessoa } from "./CamposPessoa";
import { ROTULOS_PERFIL, type PerfilPessoa, type PessoaCriarDados } from "./ConfigPessoas";

type CriarPessoaProps = {
  aoCriar: () => void;
  criando: boolean;
  criar: (dados: PessoaCriarDados) => Promise<boolean>;
};

export function CriarPessoa({ aoCriar, criando, criar }: CriarPessoaProps) {
  const toast = useToast();
  const [valores, setValores] = useState<ValoresPessoa>(PESSOA_VAZIA);
  const [perfil, setPerfil] = useState<PerfilPessoa>("MORADOR");

  async function cadastrar() {
    const erro = validarPessoa(valores);
    if (erro) {
      toast({ title: erro, status: "warning" });
      return;
    }
    if (await criar({ ...paraPessoaDados(valores), perfil })) aoCriar();
  }

  return (
    <Flex direction="column" gap={5}>
      <CamposPessoa valores={valores} aoMudar={setValores} />

      <FormControl>
        <FormLabel fontSize="sm">Perfil de acesso</FormLabel>
        <Select value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilPessoa)}>
          {(Object.keys(ROTULOS_PERFIL) as PerfilPessoa[]).map((opcao) => (
            <option key={opcao} value={opcao}>{ROTULOS_PERFIL[opcao]}</option>
          ))}
        </Select>
      </FormControl>

      <Text fontSize="xs" color="gray.500">
        Para ligar a pessoa a um apartamento (proprietário, inquilino ou residente), use a tela Apartamentos.
      </Text>

      <Flex justify="flex-end">
        <Button colorScheme="blue" onClick={cadastrar} isLoading={criando}>Cadastrar pessoa</Button>
      </Flex>
    </Flex>
  );
}
