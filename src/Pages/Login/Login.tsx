import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, Button, Container, Flex, FormControl, FormErrorMessage, Grid, GridItem, Heading, Input, InputGroup, InputLeftElement, InputRightElement, Stack, Text } from "@chakra-ui/react";
import { EmailIcon, LockIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Field, Form, Formik, type FieldProps } from "formik";
import { useAuth } from "./useAuth";
import { initialValuesLogin, loginSchemaValidation, type ValuesInputType } from "./helper";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const {logged, login, isLoadingLogin } = useAuth();

  if (logged) {return <Navigate to="/" replace />}

  return (
    <Grid minHeight="100vh" templateColumns={{base: "1fr", lg: "1.1fr 0.9fr"}}>
      <GridItem
        display={{
          base: "none",
          lg: "flex",
        }}
        alignItems="flex-end"
        padding={16}
        color="white"
        bgGradient="linear(145deg, #10203b 0%, #172f56 55%, #0d1a30 100%)"
      >
        <Box maxWidth="620px">
          <Flex
            width="58px"
            height="58px"
            alignItems="center"
            justifyContent="center"
            borderRadius="16px"
            bg="blue.500"
            fontSize="xl"
            fontWeight="800"
          >
            GC
          </Flex>

          <Text
            marginTop={12}
            color="blue.200"
            fontSize="xs"
            fontWeight="800"
            letterSpacing="2px"
          >
            GESTÃO CONDOMINIAL
          </Text>

          <Heading
            maxWidth="580px"
            marginTop={5}
            fontSize={{
              lg: "52px",
              xl: "68px",
            }}
            lineHeight="1"
            letterSpacing="-3px"
          >
            Seu condomínio organizado em um só lugar.
          </Heading>

          <Text
            maxWidth="520px"
            marginTop={6}
            color="blue.100"
            fontSize="lg"
            lineHeight="1.8"
          >
            Moradores, apartamentos, vagas, veículos,
            obras e tarefas do condomínio em um único ambiente.
          </Text>
        </Box>
      </GridItem>

      <GridItem
        display="flex"
        alignItems="center"
        justifyContent="center"
        padding={{
          base: 6,
          md: 12,
        }}
        bg="white"
      >
        <Container maxWidth="420px">
          <Box marginBottom={10}>
            <Text
              color="blue.600"
              fontSize="xs"
              fontWeight="800"
              letterSpacing="2px"
            >
              ACESSO SEGURO
            </Text>

            <Heading
              marginTop={3}
              fontSize="32px"
              letterSpacing="-1px"
            >
              Entre na sua conta
            </Heading>

            <Text
              marginTop={3}
              color="gray.500"
            >
              Entre com o e-mail e a senha cadastrados.
            </Text>
          </Box>

          <Formik
            initialValues={initialValuesLogin}
            validationSchema={loginSchemaValidation}
            validateOnBlur={false}
            validateOnChange={false}
            onSubmit={async (
              values: ValuesInputType,
            ) => {
              try {
                await login(values);
                setErrorMessage("");
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível entrar",
                );
              }
            }}
          >
            {() => (
              <Form>
                <Stack spacing={6}>
                  {errorMessage && (
                    <Text
                      padding={3}
                      borderRadius="md"
                      color="red.700"
                      bg="red.50"
                    >
                      {errorMessage}
                    </Text>
                  )}

                  <Field name="email">
                    {({
                      field,
                      form,
                    }: FieldProps) => (
                      <FormControl
                        isInvalid={Boolean(
                          form.errors.email,
                        )}
                      >
                        <Text
                          marginBottom={2}
                          color="gray.700"
                          fontSize="sm"
                          fontWeight="700"
                        >
                          E-mail
                        </Text>

                        <InputGroup size="lg">
                          <InputLeftElement>
                            <EmailIcon color="gray.400" />
                          </InputLeftElement>

                          <Input
                            {...field}
                            type="email"
                            placeholder="seu@email.com"
                            autoComplete="email"
                            borderColor="gray.200"
                            bg="gray.50"
                            _focus={{
                              borderColor: "blue.500",
                              bg: "white",
                              boxShadow:
                                "0 0 0 3px rgba(49, 130, 206, 0.12)",
                            }}
                          />
                        </InputGroup>

                        <FormErrorMessage>
                          {String(
                            form.errors.email ?? "",
                          )}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>

                  <Field name="password">
                    {({
                      field,
                      form,
                    }: FieldProps) => (
                      <FormControl
                        isInvalid={Boolean(
                          form.errors.password,
                        )}
                      >
                        <Text
                          marginBottom={2}
                          color="gray.700"
                          fontSize="sm"
                          fontWeight="700"
                        >
                          Senha
                        </Text>

                        <InputGroup size="lg">
                          <InputLeftElement>
                            <LockIcon color="gray.400" />
                          </InputLeftElement>

                          <Input
                            {...field}
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            placeholder="Digite sua senha"
                            autoComplete="current-password"
                            borderColor="gray.200"
                            bg="gray.50"
                            _focus={{
                              borderColor: "blue.500",
                              bg: "white",
                              boxShadow:
                                "0 0 0 3px rgba(49, 130, 206, 0.12)",
                            }}
                          />

                          <InputRightElement>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowPassword(
                                  !showPassword,
                                )
                              }
                            >
                              {showPassword ? (
                                <ViewOffIcon />
                              ) : (
                                <ViewIcon />
                              )}
                            </Button>
                          </InputRightElement>
                        </InputGroup>

                        <FormErrorMessage>
                          {String(
                            form.errors.password ?? "",
                          )}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>

                  <Button
                    height="52px"
                    type="submit"
                    colorScheme="blue"
                    bg="blue.600"
                    isLoading={isLoadingLogin}
                    _hover={{
                      bg: "blue.700",
                    }}
                  >
                    Entrar
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Container>
      </GridItem>
    </Grid>
  );
};
