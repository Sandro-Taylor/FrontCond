import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";

export async function excluirPessoa(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/${id}`,
    {
      method: "DELETE",
      headers: cabecalhos(),
    }
  );

  if (!response.ok) {
    throw new Error(await mensagemErro(response, "Não foi possível excluir a pessoa."));
  }
}
