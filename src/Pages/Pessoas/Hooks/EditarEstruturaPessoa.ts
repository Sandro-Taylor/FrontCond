import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";

import type {
  ApartamentoEditarDados,
  VinculoEditarDados,
  VagaEditarDados,
  VeiculoEditarDados,
} from "../ConfigPessoas";

async function verificarResposta(
  response: Response,
  mensagem: string
) {
  if (!response.ok) {
    throw new Error(await mensagemErro(response, mensagem));
  }

  return response;
}

export async function editarApartamento(
  id: string,
  dados: ApartamentoEditarDados
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/apartamentos/${id}`,
    {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  await verificarResposta(
    response,
    "Não foi possível atualizar o apartamento."
  );
}

export async function editarVinculo(
  id: string,
  dados: VinculoEditarDados
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/vinculos/${id}`,
    {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  await verificarResposta(
    response,
    "Não foi possível atualizar o vínculo."
  );
}

export async function editarVaga(
  id: string,
  dados: VagaEditarDados
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/vagas/${id}`,
    {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  await verificarResposta(
    response,
    "Não foi possível atualizar a vaga."
  );
}

export async function editarVeiculo(
  id: string,
  dados: VeiculoEditarDados
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/veiculos/${id}`,
    {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  await verificarResposta(
    response,
    "Não foi possível atualizar o veículo."
  );
}
