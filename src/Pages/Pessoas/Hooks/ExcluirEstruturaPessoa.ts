import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";

async function excluir(url: string, mensagem: string) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: cabecalhos(),
  });

  if (!response.ok) {
    throw new Error(await mensagemErro(response, mensagem));
  }
}

export function excluirApartamento(id: string) {
  return excluir(
    `${API_BASE_URL_USERS}/pessoas/apartamentos/${id}`,
    "Não foi possível excluir o apartamento."
  );
}

export function excluirVinculo(id: string) {
  return excluir(
    `${API_BASE_URL_USERS}/pessoas/vinculos/${id}`,
    "Não foi possível excluir o vínculo."
  );
}

export function excluirVaga(id: string) {
  return excluir(
    `${API_BASE_URL_USERS}/pessoas/vagas/${id}`,
    "Não foi possível excluir a vaga."
  );
}

export function excluirVeiculo(id: string) {
  return excluir(
    `${API_BASE_URL_USERS}/pessoas/veiculos/${id}`,
    "Não foi possível excluir o veículo."
  );
}
