// ---------------------------------------------------------
// CAMPOS DE PESSOA (formulário compartilhado)
// ---------------------------------------------------------
// Usado no cadastro de pessoa e ao adicionar uma pessoa nova
// dentro de um apartamento.
// ---------------------------------------------------------

import { Box, FormControl, FormErrorMessage, FormLabel, Input, SimpleGrid } from "@chakra-ui/react";
import { formatarCpf, formatarTelefone, somenteNumeros } from "../../Components/config";
import type { PessoaDados } from "./ConfigPessoas";

export type ValoresPessoa = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
};

export const PESSOA_VAZIA: ValoresPessoa = { nome: "", cpf: "", dataNascimento: "", telefone: "", email: "" };

export function cpfValido(cpf: string) {
  const numeros = somenteNumeros(cpf);
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;
  const digito = (quantidade: number) => {
    let soma = 0;
    for (let i = 0; i < quantidade; i++) soma += Number(numeros[i]) * (quantidade + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(numeros[9]) && digito(10) === Number(numeros[10]);
}

// devolve a mensagem de erro, ou null se estiver tudo certo
export function validarPessoa(valores: ValoresPessoa): string | null {
  if (valores.nome.trim().length < 3) return "Informe o nome (mínimo 3 letras)";
  if (valores.cpf && !cpfValido(valores.cpf)) return "CPF inválido";
  return null;
}

// formato que a API espera (sem máscara, vazio vira null)
export function paraPessoaDados(valores: ValoresPessoa): PessoaDados {
  return {
    nome: valores.nome.trim(),
    cpf: valores.cpf ? somenteNumeros(valores.cpf) : null,
    email: valores.email.trim() || null,
    telefone: valores.telefone ? somenteNumeros(valores.telefone) || null : null,
    data_nascimento: valores.dataNascimento || null,
  };
}

type Props = {
  valores: ValoresPessoa;
  aoMudar: (valores: ValoresPessoa) => void;
  tamanho?: "sm" | "md";
};

export function CamposPessoa({ valores, aoMudar, tamanho = "md" }: Props) {
  const alterar = (campo: keyof ValoresPessoa, valor: string) => aoMudar({ ...valores, [campo]: valor });
  const digitosCpf = somenteNumeros(valores.cpf).length;
  const erroCpf = digitosCpf === 11 && !cpfValido(valores.cpf) ? "CPF inválido" : digitosCpf > 0 && digitosCpf < 11 ? "Digite os 11 números" : "";

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
      <Box gridColumn={{ md: "span 2" }}>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Nome</FormLabel>
          <Input size={tamanho} value={valores.nome} onChange={(e) => alterar("nome", e.target.value)} placeholder="Nome completo" />
        </FormControl>
      </Box>

      <FormControl isInvalid={Boolean(erroCpf)}>
        <FormLabel fontSize="sm">CPF</FormLabel>
        <Input size={tamanho} value={valores.cpf} onChange={(e) => alterar("cpf", formatarCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} />
        <FormErrorMessage>{erroCpf}</FormErrorMessage>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Data de nascimento</FormLabel>
        <Input size={tamanho} type="date" value={valores.dataNascimento} onChange={(e) => alterar("dataNascimento", e.target.value)} />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Telefone / WhatsApp</FormLabel>
        <Input size={tamanho} value={valores.telefone} onChange={(e) => alterar("telefone", formatarTelefone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">E-mail</FormLabel>
        <Input size={tamanho} type="email" value={valores.email} onChange={(e) => alterar("email", e.target.value)} placeholder="nome@exemplo.com" />
      </FormControl>
    </SimpleGrid>
  );
}
