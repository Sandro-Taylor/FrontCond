import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos }  from"../../../Components/config"
import type { Projeto } from "../ConfigProjetos";

export async function restaurarProjeto(id: string): Promise<Projeto> {
  const response = await fetch(`${API_BASE_URL_USERS}/projetos/${id}/restaurar`, {method: "PATCH",headers: cabecalhos()});
  if (!response.ok) {throw new Error("Não foi possível restaurar o projeto.")}
  return response.json();
}
