import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos }  from"../../../Components/config"
import type { Projeto } from "../ConfigProjetos";

export async function listarProjetos(): Promise<Projeto[]> {
  const response = await fetch(`${API_BASE_URL_USERS}/projetos/`, {headers: cabecalhos()});
  if (!response.ok) {throw new Error("Não foi possível listar os projetos.")}
  return response.json();
}
