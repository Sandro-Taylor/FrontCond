// ---------------------------------------------------------
// CADASTRO DE PESSOA
// ---------------------------------------------------------
// Dados da pessoa, perfil de acesso e, para funcionário, a
// ficha (cargo, vínculo, turno...). A ligação com
// apartamentos é feita na tela de Apartamentos.
// ---------------------------------------------------------

import { useState } from "react";
import { Box, Button, Divider, Flex, FormControl, FormLabel, Select, Text, useToast } from "@chakra-ui/react";
import { CamposPessoa, PESSOA_VAZIA, paraPessoaDados, validarPessoa, type ValoresPessoa } from "./CamposPessoa";
import { CamposFuncionario, FICHA_VAZIA, paraFichaDados, validarFicha, type ValoresFicha } from "./CamposFuncionario";
import { useAuth } from "../Login/useAuth";
import { CampoResponsavel, useOpcoesResponsavel } from "./CampoResponsavel";
import { PERFIS_SO_ADM, ROTULOS_PERFIL, type Cargo, type PerfilPessoa, type PessoaCriarDados } from "./ConfigPessoas";

type CriarPessoaProps = {
  aoCriar: () => void;
  criando: boolean;
  criar: (dados: PessoaCriarDados) => Promise<boolean>;
  cargos: Cargo[];
};

export function CriarPessoa({ aoCriar, criando, criar, cargos }: CriarPessoaProps) {
  const toast = useToast();
  const [valores, setValores] = useState<ValoresPessoa>(PESSOA_VAZIA);
  const [perfil, setPerfil] = useState<PerfilPessoa>("MORADOR");
  const [ficha, setFicha] = useState<ValoresFicha>(FICHA_VAZIA);
  const { user } = useAuth();
  const [responsavel, setResponsavel] = useState<string | null>(null); // vazio = síndico do prédio; só o ADM escolhe
  const opcoesResponsavel = useOpcoesResponsavel(Boolean(user?.admin_sistema));
  const funcionario = perfil === "FUNCIONARIO";
  // síndico e conselheiro: só o ADM do sistema designa
  const perfis = (Object.keys(ROTULOS_PERFIL) as PerfilPessoa[]).filter((p) => user?.admin_sistema || !PERFIS_SO_ADM.includes(p));

  async function cadastrar() {
    const erro = validarPessoa(valores) ?? (funcionario ? validarFicha(ficha) : null);
    if (erro) {
      toast({ title: erro, status: "warning" });
      return;
    }
    const dados: PessoaCriarDados = { ...paraPessoaDados(valores), ...(user?.admin_sistema ? { responsavel_user_id: responsavel } : {}), perfil, funcionario: funcionario ? paraFichaDados(ficha) : null };
    if (await criar(dados)) aoCriar();
  }

  return (
    <Flex direction="column" gap={5}>
      <CamposPessoa valores={valores} aoMudar={setValores} />

      <FormControl>
        <FormLabel fontSize="sm">Perfil</FormLabel>
        <Select value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilPessoa)}>
          {perfis.map((opcao) => (
            <option key={opcao} value={opcao}>{ROTULOS_PERFIL[opcao]}</option>
          ))}
        </Select>
      </FormControl>

      {user?.admin_sistema && <CampoResponsavel valor={responsavel} aoMudar={setResponsavel} opcoes={opcoesResponsavel} />}

      {funcionario && (
        <Box>
          <Divider marginBottom={4} />
          <Text fontSize="sm" fontWeight="semibold" marginBottom={3}>Ficha do funcionário</Text>
          <CamposFuncionario valores={ficha} aoMudar={setFicha} cargos={cargos} />
        </Box>
      )}

      <Text fontSize="xs" color="gray.500">
        {funcionario
          ? "Funcionário: quem trabalha no condomínio de forma fixa (próprio ou terceirizado). Serviços eventuais: use Prestador de serviço."
          : "Para ligar a pessoa a um apartamento (proprietário, inquilino ou residente), use a tela Apartamentos."}
      </Text>

      <Flex justify="flex-end">
        <Button colorScheme="blue" onClick={cadastrar} isLoading={criando}>Cadastrar pessoa</Button>
      </Flex>
    </Flex>
  );
}
