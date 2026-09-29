// ---------------------------------------------------------
// FUNCIONÁRIOS – cargos e ficha do funcionário
// ---------------------------------------------------------

import { chamarApi } from "../../../Components/config";
import type { Cargo, FichaFuncionario, FichaFuncionarioDados } from "../ConfigPessoas";

export const apiCargos = {
  listar: () => chamarApi<Cargo[]>("/cargos/", "GET", "Não foi possível carregar os cargos."),
  criar: (nome: string) => chamarApi<Cargo>("/cargos/", "POST", "Não foi possível criar o cargo.", { nome, ativo: true }),
  editar: (id: string, nome: string, ativo: boolean) => chamarApi<Cargo>(`/cargos/${id}`, "PUT", "Não foi possível salvar o cargo.", { nome, ativo }),
  excluir: (id: string) => chamarApi<void>(`/cargos/${id}`, "DELETE", "Não foi possível excluir o cargo."),
};

export const salvarFichaFuncionario = (pessoaId: string, ficha: FichaFuncionarioDados) =>
  chamarApi<FichaFuncionario>(`/pessoas/${pessoaId}/funcionario`, "PUT", "Não foi possível salvar a ficha do funcionário.", ficha);
