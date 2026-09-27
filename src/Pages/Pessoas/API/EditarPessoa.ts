import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";
import type { Pessoa, PessoaEditarDados } from "../ConfigPessoas";

export async function editarPessoa(
  id: string,
  dados: PessoaEditarDados
): Promise<Pessoa> {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/${id}`,
    {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  if (!response.ok) {
    throw new Error(await mensagemErro(response, "Não foi possível editar a pessoa."));
  }

  return response.json();
}
