// ---------------------------------------------------------
// LOGIN E SENHA TEMPORÁRIA (mostrados uma única vez)
// ---------------------------------------------------------

import { Alert, AlertIcon, Box, Button, Flex, Text, VStack, useToast } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";

export function SenhaTemporaria({ email, senha }: { email: string; senha: string | null }) {
  const toast = useToast();

  async function copiar() {
    if (!senha) return;
    try {
      await navigator.clipboard.writeText(`Login: ${email}\nSenha temporária: ${senha}`);
      toast({ title: "Login e senha copiados", status: "success", duration: 1500 });
    } catch {
      toast({ title: "Não foi possível copiar; anote a senha", status: "warning" });
    }
  }

  return (
    <VStack align="stretch" spacing={3}>
      <Box>
        <Text fontSize="xs" color="gray.500">Login (e-mail)</Text>
        <Text fontWeight="semibold">{email}</Text>
      </Box>
      {senha ? (
        <>
          <Box>
            <Text fontSize="xs" color="gray.500">Senha temporária</Text>
            <Flex align="center" gap={2}>
              <Text fontFamily="mono" fontSize="lg" fontWeight="bold" letterSpacing="wider">{senha}</Text>
              <Button size="xs" leftIcon={<CopyIcon />} onClick={copiar}>Copiar</Button>
            </Flex>
          </Box>
          <Alert status="warning" borderRadius="md" fontSize="sm">
            <AlertIcon />Anote e repasse agora: a senha não será mostrada de novo. No primeiro acesso a pessoa cria a própria senha.
          </Alert>
        </>
      ) : (
        <Alert status="info" borderRadius="md" fontSize="sm">
          <AlertIcon />Este e-mail já tinha login no sistema. A pessoa entra com a senha que já usa.
        </Alert>
      )}
    </VStack>
  );
}
