// ---------------------------------------------------------
// CHAMADAS DA API DE APARTAMENTOS
// ---------------------------------------------------------
// As rotas de alteração devolvem o apartamento completo.
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, mensagemErro, somenteNumeros } from "../../Components/config";
import type {
  AdicionarPessoaDados, ApartamentoDados, ApartamentoDetalhe, ApartamentoEditar, ApartamentoResumo,
  PessoaDoVinculo, VagaDados, VagaEditar, VeiculoDados, VeiculoEditar, VinculoEditar,
} from "./ConfigApartamentos";

async function chamar<T>(caminho: string, metodo = "GET", corpo?: unknown, padrao = "Não foi possível concluir a operação."): Promise<T> {
  const response = await fetch(`${API_BASE_URL_USERS}${caminho}`, {
    method: metodo,
    headers: cabecalhos(),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (!response.ok) throw new Error(await mensagemErro(response, padrao));
  if (response.status === 204) return undefined as T;
  return response.json();
}

const base = (id: string) => `/apartamentos/${id}`;

export const apiApartamentos = {
  listar: () => chamar<ApartamentoResumo[]>("/apartamentos/", "GET", undefined, "Não foi possível carregar os apartamentos."),
  buscar: (id: string) => chamar<ApartamentoDetalhe>(base(id), "GET", undefined, "Não foi possível carregar o apartamento."),
  criar: (dados: ApartamentoDados) => chamar<ApartamentoDetalhe>("/apartamentos/", "POST", dados, "Não foi possível cadastrar o apartamento."),
  editar: (id: string, dados: ApartamentoEditar) => chamar<ApartamentoDetalhe>(base(id), "PUT", dados, "Não foi possível salvar o apartamento."),
  excluir: (id: string) => chamar<void>(base(id), "DELETE", undefined, "Não foi possível excluir o apartamento."),

  adicionarPessoa: (id: string, dados: AdicionarPessoaDados) => chamar<ApartamentoDetalhe>(`${base(id)}/pessoas`, "POST", dados, "Não foi possível adicionar a pessoa."),
  editarVinculo: (id: string, vinculoId: string, dados: VinculoEditar) => chamar<ApartamentoDetalhe>(`${base(id)}/pessoas/${vinculoId}`, "PUT", dados, "Não foi possível salvar o vínculo."),
  removerPessoa: (id: string, vinculoId: string) => chamar<ApartamentoDetalhe>(`${base(id)}/pessoas/${vinculoId}`, "DELETE", undefined, "Não foi possível remover a pessoa."),

  adicionarVaga: (id: string, dados: VagaDados) => chamar<ApartamentoDetalhe>(`${base(id)}/vagas`, "POST", dados, "Não foi possível adicionar a vaga."),
  editarVaga: (id: string, vagaId: string, dados: VagaEditar) => chamar<ApartamentoDetalhe>(`${base(id)}/vagas/${vagaId}`, "PUT", dados, "Não foi possível salvar a vaga."),
  vincularVaga: (id: string, vagaId: string) => chamar<ApartamentoDetalhe>(`${base(id)}/vagas/${vagaId}/vincular`, "POST", undefined, "Não foi possível vincular a vaga."),
  liberarVaga: (id: string, vagaId: string) => chamar<ApartamentoDetalhe>(`${base(id)}/vagas/${vagaId}`, "DELETE", undefined, "Não foi possível liberar a vaga."),

  adicionarVeiculo: (id: string, dados: VeiculoDados) => chamar<ApartamentoDetalhe>(`${base(id)}/veiculos`, "POST", dados, "Não foi possível adicionar o veículo."),
  editarVeiculo: (id: string, veiculoId: string, dados: VeiculoEditar) => chamar<ApartamentoDetalhe>(`${base(id)}/veiculos/${veiculoId}`, "PUT", dados, "Não foi possível salvar o veículo."),
  excluirVeiculo: (id: string, veiculoId: string) => chamar<ApartamentoDetalhe>(`${base(id)}/veiculos/${veiculoId}`, "DELETE", undefined, "Não foi possível excluir o veículo."),

  // devolve null quando não existe ninguém com o CPF no condomínio
  async buscarPessoaPorCpf(cpf: string): Promise<PessoaDoVinculo | null> {
    const response = await fetch(`${API_BASE_URL_USERS}/pessoas/cpf/${somenteNumeros(cpf)}`, { headers: cabecalhos() });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(await mensagemErro(response, "Não foi possível buscar o CPF."));
    return response.json();
  },
};
