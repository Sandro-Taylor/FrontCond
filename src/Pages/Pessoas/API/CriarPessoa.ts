import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";
import type { Pessoa, PessoaCriarDados } from "../ConfigPessoas";

export async function criarPessoa(
  dados: PessoaCriarDados
): Promise<Pessoa> {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/`,
    {
      method: "POST",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  if (!response.ok) {
    throw new Error(await mensagemErro(response, "Não foi possível cadastrar a pessoa."));
  }

  return response.json();
}
