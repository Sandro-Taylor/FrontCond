import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos }  from"../../../Components/config"
import type { Projeto, ProjetoCriarDados } from "../ConfigProjetos";

export async function criarProjeto( projeto: string, descricao: string): Promise<Projeto> {
  const dados: ProjetoCriarDados = { projeto, descricao: descricao || null };
  const response = await fetch(`${API_BASE_URL_USERS}/projetos/`, {method: "POST",headers: cabecalhos(),body: JSON.stringify(dados)});
  if (!response.ok) {throw new Error("Não foi possível criar o projeto.")}
  return response.json();
}
