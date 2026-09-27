import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos }  from"../../../Components/config"
import type { Projeto } from "../ConfigProjetos";

export async function atualizarCampo(id: string, campo: "projeto" | "descricao", valor: string): Promise<Projeto> {
  const response = await fetch(`${API_BASE_URL_USERS}/projetos/${id}`, { method: "PUT", headers: cabecalhos(), body: JSON.stringify({[campo]: valor})});
  if (!response.ok) {throw new Error("Não foi possível editar o projeto.")}
  return response.json();
}
