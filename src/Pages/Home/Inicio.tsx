// PÁGINA AUTENTICADA

import { Box,
  Card,
  CardBody,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Flex,
  Image,
} from "@chakra-ui/react";

import fachada from "../../assets/Fachada.png";

import { useAuth } from "../Login/useAuth";
import { Titulo } from "../Titulos/Titulos";


export const Dashboard = () => {
  const { user, condominioAtual } = useAuth();

  return (
    <Flex
      align="flex-start"
      gap={6}
      direction={{ base: "column", md: "row" }}
    >
      <Titulo />

      <Box flex={1} minHeight="100vh" bg="gray.100">
        <Container maxWidth="container.xl" paddingY={12}>

          <Heading size="md">
            Olá, {user?.full_name}
          </Heading>

          <Text color="gray.500" marginTop={1}>
            Gerenciamento do condomínio
          </Text>

          <Image
            src={fachada}
            alt="Fachada do condomínio"
            marginTop={6}
            borderRadius="lg"
            width="50%"
            maxHeight="360px"
            objectFit="cover"
          />

          <SimpleGrid
            marginTop={8}
            columns={{ base: 1, md: 3 }}
            spacing={6}
          >

            <Card>
              <CardBody>
                <Text color="gray.500">
                  Usuário
                </Text>

                <Heading marginTop={2} size="sm">
                  {user?.full_name}
                </Heading>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Text color="gray.500">
                  Condomínio
                </Text>

                <Heading marginTop={2} size="sm">
                  {condominioAtual?.nome ?? "Nenhum condomínio selecionado"}
                </Heading>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Text color="gray.500">
                  Perfil
                </Text>

                <Heading marginTop={2} size="sm">
                  {condominioAtual?.perfil ?? (user?.admin_sistema ? "ADM" : "-")}
                </Heading>
              </CardBody>
            </Card>

          </SimpleGrid>

        </Container>
      </Box>
    </Flex>
  );
};
