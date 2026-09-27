// ---------------------------------------------------------
// VEÍCULOS – tipos e chamadas da API
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, mensagemErro } from "../../Components/config";

export type Veiculo = {
  id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
  ativo: boolean;
  apartamento_id: string;
  apartamento_rotulo: string;
  vaga_id: string | null;
  vaga_numero: string | null; // null = rotativo
  pessoa_id: string | null;
  condutor_nome: string | null;
};

export type VeiculoDados = {
  apartamento_id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
  vaga_id: string | null;
  pessoa_id: string | null;
};

export type VeiculoEditar = VeiculoDados & { ativo: boolean };

async function chamar<T>(caminho: string, metodo: string, padrao: string, corpo?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL_USERS}${caminho}`, {
    method: metodo,
    headers: cabecalhos(),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (!response.ok) throw new Error(await mensagemErro(response, padrao));
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const apiVeiculos = {
  listar: () => chamar<Veiculo[]>("/veiculos/", "GET", "Não foi possível carregar os veículos."),
  criar: (dados: VeiculoDados) => chamar<Veiculo>("/veiculos/", "POST", "Não foi possível cadastrar o veículo.", dados),
  editar: (id: string, dados: VeiculoEditar) => chamar<Veiculo>(`/veiculos/${id}`, "PUT", "Não foi possível salvar o veículo.", dados),
  excluir: (id: string) => chamar<void>(`/veiculos/${id}`, "DELETE", "Não foi possível excluir o veículo."),
};
