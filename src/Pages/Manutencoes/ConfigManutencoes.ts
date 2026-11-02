// ---------------------------------------------------------
// MANUTENÇÕES E PRESTADORES – tipos e chamadas à API
// ---------------------------------------------------------
import { chamarApi } from "../../Components/config";

export type StatusManutencao = "VENCIDO" | "EM_BREVE" | "EM_DIA" | "SEM_DATA";

export const STATUS: Record<StatusManutencao, { rotulo: string; cor: string }> = {
  VENCIDO: { rotulo: "Vencido", cor: "red" },
  EM_BREVE: { rotulo: "Vence em breve", cor: "orange" },
  EM_DIA: { rotulo: "Em dia", cor: "green" },
  SEM_DATA: { rotulo: "Sem data", cor: "gray" },
};

export type DadosManutencao = {
  categoria: string; item: string; prestador_id: string | null; periodicidade: string | null; intervalo_meses: number | null;
  base_legal: string | null; ultima_execucao: string | null; observacoes: string | null;
};
export type Manutencao = DadosManutencao & {
  id: string; ordem: number; empresa: string | null; responsavel: string | null;  // do cadastro de prestadores
  proximo_vencimento: string | null; dias_restantes: number | null; status: StatusManutencao;
};
export type ListaManutencoes = { hoje: string; alerta_dias: number; resumo: Record<StatusManutencao, number>; itens: Manutencao[] };

export type DadosPrestador = {
  empresa: string; setor: string | null; pessoa: string | null; cnpj: string | null; telefone: string | null;
  custo: number | null; observacoes: string | null;
};
export type Prestador = Omit<DadosPrestador, "custo"> & { id: string; ordem: number; custo: string | null };
export type ListaPrestadores = { custo_mensal: string; itens: Prestador[] };

export const apiManutencoes = {
  listar: () => chamarApi<ListaManutencoes>("/manutencoes", "GET", "Não foi possível carregar as manutenções."),
  criar: (d: DadosManutencao) => chamarApi<Manutencao>("/manutencoes", "POST", "Não foi possível salvar.", d),
  editar: (id: string, d: DadosManutencao) => chamarApi<Manutencao>(`/manutencoes/${id}`, "PUT", "Não foi possível salvar.", d),
  executada: (id: string, data: string) => chamarApi<Manutencao>(`/manutencoes/${id}/executada`, "POST", "Não foi possível registrar.", { data }),
  excluir: (id: string) => chamarApi<void>(`/manutencoes/${id}`, "DELETE", "Não foi possível excluir."),
  alerta: (dias: number) => chamarApi<{ dias: number }>("/manutencoes/alerta", "PUT", "Não foi possível salvar o alerta.", { dias }),
};

export const apiPrestadores = {
  listar: () => chamarApi<ListaPrestadores>("/prestadores", "GET", "Não foi possível carregar os prestadores."),
  criar: (d: DadosPrestador) => chamarApi<Prestador>("/prestadores", "POST", "Não foi possível salvar.", d),
  editar: (id: string, d: DadosPrestador) => chamarApi<Prestador>(`/prestadores/${id}`, "PUT", "Não foi possível salvar.", d),
  excluir: (id: string) => chamarApi<void>(`/prestadores/${id}`, "DELETE", "Não foi possível excluir."),
};

export const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
