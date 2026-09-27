// ---------------------------------------------------------
// VAGAS – tipos e chamadas da API
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, mensagemErro } from "../../Components/config";

export type TipoVaga = "FIXA" | "ROTATIVA";

export const ROTULOS_TIPO_VAGA: Record<TipoVaga, { rotulo: string; cor: string }> = {
  FIXA: { rotulo: "Fixa", cor: "purple" },
  ROTATIVA: { rotulo: "Rotativa", cor: "orange" },
};

export type Vaga = {
  id: string;
  numero: string;
  tipo: TipoVaga;
  localizacao: string | null;
  observacao: string | null;
  ativo: boolean;
  apartamento_id: string | null;
  apartamento_rotulo: string | null;
  veiculos: string[];
};

export type VagaDados = {
  numero: string;
  tipo: TipoVaga;
  apartamento_id: string | null;
  localizacao: string | null;
  observacao: string | null;
};

export type VagaEditar = VagaDados & { ativo: boolean };

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

export const apiVagas = {
  listar: () => chamar<Vaga[]>("/vagas/", "GET", "Não foi possível carregar as vagas."),
  criar: (dados: VagaDados) => chamar<Vaga>("/vagas/", "POST", "Não foi possível cadastrar a vaga.", dados),
  editar: (id: string, dados: VagaEditar) => chamar<Vaga>(`/vagas/${id}`, "PUT", "Não foi possível salvar a vaga.", dados),
  excluir: (id: string) => chamar<void>(`/vagas/${id}`, "DELETE", "Não foi possível excluir a vaga."),
};
