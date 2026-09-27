import { API_BASE_URL_USERS } from "../../../config";
import { cabecalhos, mensagemErro } from "../../../Components/config";

export type NovaVagaDados = {
  numero: string;
  localizacao: string | null;
  observacao: string | null;
};

export type NovoVeiculoDados = {
  pessoa_id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
};

async function verificar(response: Response, mensagem: string) {
  if (!response.ok) {
    throw new Error(await mensagemErro(response, mensagem));
  }

  return response.json();
}

export async function adicionarVaga(
  apartamentoId: string,
  dados: NovaVagaDados
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/apartamentos/${apartamentoId}/vagas`,
    {
      method: "POST",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  return verificar(response, "Não foi possível adicionar a vaga.");
}

export async function adicionarVeiculo(
  vagaId: string,
  dados: NovoVeiculoDados
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/vagas/${vagaId}/veiculos`,
    {
      method: "POST",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  return verificar(response, "Não foi possível adicionar o veículo.");
}

export async function adicionarVeiculoPessoa(
  pessoaId: string,
  dados: Omit<NovoVeiculoDados, "pessoa_id">
) {
  const response = await fetch(
    `${API_BASE_URL_USERS}/pessoas/${pessoaId}/veiculos`,
    {
      method: "POST",
      headers: cabecalhos(),
      body: JSON.stringify(dados),
    }
  );

  return verificar(response, "Não foi possível adicionar o veículo.");
}