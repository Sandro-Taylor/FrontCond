// ---------------------------------------------------------
// ACESSO AO SISTEMA DE UMA PESSOA
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";

export type AcessoResultado = {
  email: string;
  senha_temporaria: string | null; // só quando o login é criado ou a senha é redefinida
  login_existente: boolean;        // e-mail já tinha login (ex.: síndico de outro condomínio)
};

async function chamar<T>(caminho: string, metodo: string, padrao: string, corpo?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL_USERS}/pessoas/${caminho}`, {
    method: metodo,
    headers: cabecalhos(),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (!response.ok) throw new Error(await mensagemErro(response, padrao));
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const darAcesso = (pessoaId: string, email: string) =>
  chamar<AcessoResultado>(`${pessoaId}/acesso`, "POST", "Não foi possível dar acesso.", { email });

export const removerAcesso = (pessoaId: string) =>
  chamar<void>(`${pessoaId}/acesso`, "DELETE", "Não foi possível remover o acesso.");

export const gerarNovaSenha = (pessoaId: string) =>
  chamar<AcessoResultado>(`${pessoaId}/acesso/nova-senha`, "POST", "Não foi possível gerar nova senha.");
