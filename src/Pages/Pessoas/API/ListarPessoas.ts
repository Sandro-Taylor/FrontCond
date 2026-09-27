import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";
import type { Pessoa } from "../ConfigPessoas";

export async function listarPessoas(): Promise<Pessoa[]> {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/`,
    {
      headers: cabecalhos(),
    }
  );

  if (!response.ok) {
    throw new Error(await mensagemErro(response, "Não foi possível listar as pessoas."));
  }

  return response.json();
}
