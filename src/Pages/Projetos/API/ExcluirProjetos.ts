import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos }  from"../../../Components/config"

export async function excluirProjeto(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL_USERS}/projetos/${id}`, {method: "DELETE",headers: cabecalhos()});
  if (!response.ok) {throw new Error("Não foi possível excluir o projeto.")}
}
