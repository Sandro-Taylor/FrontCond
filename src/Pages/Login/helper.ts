// ---------------------------------------------------------
// VALIDAÇÃO DO LOGIN
// ---------------------------------------------------------
// Define os campos e as validações do formulário.
// ---------------------------------------------------------

import * as yup from "yup";

export interface ValuesInputType {
  email: string;
  password: string;
}

export const initialValuesLogin: ValuesInputType = {
  email: "",
  password: "",
};

export const loginSchemaValidation = yup.object({
  email: yup
    .string()
    .email("Informe um e-mail válido")
    .required("E-mail obrigatório"),
  password: yup
    .string()
    .required("Senha obrigatória"),
});
