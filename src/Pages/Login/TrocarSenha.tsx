// ---------------------------------------------------------
// TROCAR SENHA
// ---------------------------------------------------------
// obrigatoria = primeiro acesso com senha temporária: a tela
// ocupa tudo e o sistema só libera depois da troca.
// Sem obrigatoria: troca voluntária, aberta pelo menu.
// ---------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, AlertIcon, Box, Button, Center, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Text, useToast,
} from "@chakra-ui/react";

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, mensagemErro } from "../../Components/config";
import { Titulo } from "../Titulos/Titulos";
import { useAuth } from "./useAuth";

function FormularioSenha({ obrigatoria }: { obrigatoria: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { recarregarUsuario, logout } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (novaSenha.length < 8) {
      toast({ title: "A nova senha precisa ter pelo menos 8 caracteres", status: "warning" });
      return;
    }
    if (novaSenha !== confirmacao) {
      toast({ title: "A confirmação não confere com a nova senha", status: "warning" });
      return;
    }
    try {
      setSalvando(true);
      const response = await fetch(`${API_BASE_URL_USERS}/eu/senha`, {
        method: "POST",
        headers: cabecalhos(),
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });
      if (!response.ok) throw new Error(await mensagemErro(response, "Não foi possível trocar a senha."));
      toast({ title: "Senha alterada", status: "success" });
      setSenhaAtual(""); setNovaSenha(""); setConfirmacao("");
      await recarregarUsuario(); // libera o sistema quando era a troca obrigatória
      if (!obrigatoria) navigate("/");
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao trocar a senha", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Box bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100" padding={8} width="100%" maxWidth="420px">
      <Heading size="md">{obrigatoria ? "Crie sua senha" : "Trocar senha"}</Heading>
      {obrigatoria && (
        <Alert status="info" borderRadius="md" fontSize="sm" marginTop={4}>
          <AlertIcon />Este é seu primeiro acesso. Troque a senha temporária que você recebeu por uma senha sua.
        </Alert>
      )}
      <Flex direction="column" gap={4} marginTop={5} as="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); salvar(); }}>
        <FormControl isRequired>
          <FormLabel fontSize="sm">{obrigatoria ? "Senha temporária" : "Senha atual"}</FormLabel>
          <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" autoFocus />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Nova senha</FormLabel>
          <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
          <FormHelperText fontSize="xs">Mínimo de 8 caracteres.</FormHelperText>
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Confirme a nova senha</FormLabel>
          <Input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="new-password" />
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={salvando}>Salvar nova senha</Button>
        {obrigatoria && <Button variant="ghost" size="sm" onClick={logout}>Sair</Button>}
      </Flex>
    </Box>
  );
}

// tela cheia do primeiro acesso (usada pelo Routes)
export const TrocarSenhaObrigatoria = () => (
  <Center minHeight="100vh" bg="gray.50" padding={4}>
    <FormularioSenha obrigatoria />
  </Center>
);

// página "Trocar senha" do menu
export const TrocarSenha = () => (
  <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
    <Titulo />
    <Box flex={1} paddingY={8} paddingRight={{ md: 6 }}>
      <Text fontSize="2xl" fontWeight="semibold" color="gray.800" marginBottom={6}>Trocar senha</Text>
      <FormularioSenha obrigatoria={false} />
    </Box>
  </Flex>
);
