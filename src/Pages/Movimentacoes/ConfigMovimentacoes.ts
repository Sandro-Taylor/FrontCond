// ---------------------------------------------------------
// MOVIMENTAÇÕES BANCÁRIAS – tipos e API
// ---------------------------------------------------------
// Valores chegam da API como texto (Decimal): use numero().
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, chamarApi, mensagemErro } from "../../Components/config";

export type TipoMovimentacao = "ENTRADA" | "SAIDA";

export type Movimentacao = {
  id: string;
  data: string;
  lancamento: string;
  razao_social: string | null;
  cpf_cnpj: string | null;
  valor: string;
  tipo: TipoMovimentacao;
};

export type ListaMovimentacoes = {
  itens: Movimentacao[];
  total_entradas: string;
  total_saidas: string;
  resultado: string;
};

export type Extrato = {
  id: string;
  nome_arquivo: string;
  titular: string | null;
  agencia: string | null;
  conta: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  saldo_anterior: string | null;
  saldo_final: string | null;
  total_entradas: string;
  total_saidas: string;
  quantidade: number;
  created_at: string;
};

export type ResultadoImportacao = { extrato: Extrato; substituiu: boolean; avisos: string[] };

export const numero = (valor: string | number | null | undefined) => Number(valor ?? 0);

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function nomeMes(mes: string) { // "2026-01" -> "janeiro de 2026"
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} de ${ano}`;
}

export function formatarDocumento(doc: string | null) {
  if (!doc) return "";
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return doc;
}

export class ExtratoJaEnviado extends Error {}

export type MesFluxo = { mes: number; entradas: string; saidas: string; rendimento?: string | null; resultado: string; saldo_acumulado: string | null; tem_extrato: boolean; conferido?: boolean };
export type ContaFluxo = {
  chave: string; agencia: string | null; conta: string | null; titular: string | null;
  saldo_atual: string | null; saldo_em: string | null; meses: MesFluxo[];
  saldo_inicial: string | null; data_saldo_inicial: string | null; saldo_configurado: boolean; // saldo inicial preenchido à mão
};
export type FluxoCaixa = { ano: number; anos: number[]; contas: ContaFluxo[]; total: ContaFluxo; fundo: ContaFluxo | null; fundo_configurado: boolean; fundos: ContaFluxo[] };

// saldo lido no banco numa data, digitado pela gestão (tabela única saldos_informados)
//   CONTA: saldo da conta corrente | CDB: saldo líquido do CDB (fundo de reserva)
export type TipoSaldo = "CONTA" | "CDB";
export type SaldoInformado = { id: string; tipo: TipoSaldo; agencia: string; conta: string; descricao: string | null; data: string; valor: string; created_at: string };

// INVESTIMENTOS (CDB do fundo de reserva), digitados à mão
export type TipoInvestimento = "SALDO" | "APLICACAO" | "RESGATE" | "RENDIMENTO";
export const TIPOS_INVESTIMENTO: { valor: TipoInvestimento; rotulo: string; cor: string }[] = [
  { valor: "SALDO", rotulo: "Posição (saldo líquido)", cor: "purple" },
  { valor: "APLICACAO", rotulo: "Aplicação", cor: "blue" },
  { valor: "RESGATE", rotulo: "Resgate", cor: "orange" },
  { valor: "RENDIMENTO", rotulo: "Rendimento", cor: "green" },
];
export type DadosInvestimento = {
  agencia: string; conta: string; nome: string; data: string; tipo: TipoInvestimento; valor: number;
  valor_bruto: number | null; imposto: number | null; observacao: string | null;
};
export type LancamentoInvestimento = Omit<DadosInvestimento, "valor" | "valor_bruto" | "imposto"> & {
  id: string; chave: string; valor: string; valor_bruto: string | null; imposto: string | null; created_at: string;
};
export type ItemComparativo = {
  id: string; data: string; lancamento: string; agencia: string | null; conta: string | null;
  tipo: "APLICACAO" | "RESGATE"; valor: string; lancamento_id: string | null;
};
export type Investimentos = {
  ano: number; anos: number[]; total: ContaFluxo | null; investimentos: ContaFluxo[];
  lancamentos: LancamentoInvestimento[]; comparativo: { extrato: ItemComparativo[]; sem_extrato: string[] };
};

export type ItemPrevisao = { nome: string; tipo: TipoMovimentacao; meses_presente: number; valor_mensal: string; ultimo_valor: string; ultima_data: string };
// lançamento futuro (parcela combinada que ainda não está no extrato)
export type Futuro = {
  id: string; grupo_id: string; descricao: string; favorecido: string | null; tipo: TipoMovimentacao; valor: string;
  data: string; parcela: number; total_parcelas: number; na_previsao: boolean;
};
export type DadosFuturo = { descricao: string; favorecido: string | null; tipo: TipoMovimentacao; valor_parcela: number; parcelas: number; primeira_data: string };

export type MesPrevisao = {
  mes: string; entradas_fixas: string; saidas_fixas: string; futuros_entradas: string; futuros_saidas: string; aplicacao_fundo: string; saidas_eventuais: string; entradas_eventuais: string;
  saldo_sem_eventuais: string; saldo_previsto: string; saldo_fundo: string;
};
export type Previsao = {
  base_inicio: string | null; base_fim: string | null; meses_analisados: number; confianca: "BAIXA" | "MEDIA" | "ALTA";
  saldo_atual: string; saldo_em: string | null; fundo_atual: string; aplicacao_mensal: string; contas: string[];
  fixos: ItemPrevisao[]; eventuais_maiores: ItemPrevisao[]; meses: MesPrevisao[];
};

export const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function nomeConta(c: { agencia: string | null; conta: string | null }) {
  return [c.agencia && `Ag. ${c.agencia}`, c.conta && `Conta ${c.conta}`].filter(Boolean).join(" · ") || "Conta sem identificação";
}

export const apiMovimentacoes = {
  listar: (mes: string, tipo: string) => {
    const filtros = new URLSearchParams();
    if (mes) filtros.set("mes", mes);
    if (tipo) filtros.set("tipo", tipo);
    return chamarApi<ListaMovimentacoes>(`/movimentacoes/?${filtros}`, "GET", "Não foi possível carregar as movimentações.");
  },
  meses: () => chamarApi<{ mes: string; quantidade: number }[]>("/movimentacoes/meses", "GET", "Não foi possível carregar os meses."),
  extratos: () => chamarApi<Extrato[]>("/movimentacoes/extratos", "GET", "Não foi possível carregar os extratos."),
  fluxo: (ano: number | null) => chamarApi<FluxoCaixa>(`/movimentacoes/fluxo${ano ? `?ano=${ano}` : ""}`, "GET", "Não foi possível carregar o fluxo de caixa."),
  favorecidos: (filtro: { mes?: string; ano?: number }) => {
    const p = new URLSearchParams();
    if (filtro.mes) p.set("mes", filtro.mes);
    else if (filtro.ano) p.set("ano", String(filtro.ano));
    return chamarApi<Favorecido[]>(`/movimentacoes/favorecidos?${p}`, "GET", "Não foi possível carregar as despesas.");
  },
  futuros: () => chamarApi<Futuro[]>("/movimentacoes/futuros", "GET", "Não foi possível carregar os lançamentos futuros."),
  criarFuturo: (dados: DadosFuturo) => chamarApi<{ grupo_id: string; parcelas: number }>("/movimentacoes/futuros", "POST", "Não foi possível salvar o lançamento futuro.", dados),
  excluirFuturo: (id: string, todas: boolean) => chamarApi<void>(`/movimentacoes/futuros/${id}${todas ? "?todas=true" : ""}`, "DELETE", "Não foi possível excluir."),
  previsao: (contas: string[]) => {
    const p = new URLSearchParams({ meses: "6" });
    contas.forEach((c) => p.append("contas", c));
    return chamarApi<Previsao>(`/movimentacoes/previsao?${p}`, "GET", "Não foi possível calcular a previsão.");
  },
  saldosInformados: () => chamarApi<{ itens: SaldoInformado[]; fundo_atual: string }>("/movimentacoes/saldos-informados", "GET", "Não foi possível carregar os saldos informados."),
  informarSaldo: (dados: { tipo: TipoSaldo; agencia: string; conta: string; descricao: string | null; data: string; valor: number }) =>
    chamarApi<SaldoInformado>("/movimentacoes/saldos-informados", "POST", "Não foi possível salvar o saldo.", dados),
  excluirSaldo: (id: string) => chamarApi<void>(`/movimentacoes/saldos-informados/${id}`, "DELETE", "Não foi possível excluir o saldo."),
  investimentos: (ano: number | null) => chamarApi<Investimentos>(`/movimentacoes/investimentos${ano ? `?ano=${ano}` : ""}`, "GET", "Não foi possível carregar os investimentos."),
  lancarInvestimento: (dados: DadosInvestimento) =>
    chamarApi<LancamentoInvestimento>("/movimentacoes/investimentos/lancamentos", "POST", "Não foi possível salvar o lançamento.", dados),
  excluirLancamentoInvestimento: (id: string) => chamarApi<void>(`/movimentacoes/investimentos/lancamentos/${id}`, "DELETE", "Não foi possível excluir o lançamento."),
  excluirExtrato: (id: string) => chamarApi<void>(`/movimentacoes/extratos/${id}`, "DELETE", "Não foi possível excluir o extrato."),

  // envia o .xlsx; se o mês já foi enviado, lança ExtratoJaEnviado (a tela pergunta se substitui)
  importar: async (arquivo: File, substituir: boolean): Promise<ResultadoImportacao> => {
    const { Authorization, ...resto } = cabecalhos();
    const headers: Record<string, string> = {
      Authorization, "Content-Type": arquivo.type || "application/octet-stream", "X-Nome-Arquivo": encodeURIComponent(arquivo.name),
    };
    if (resto["X-Condominio-Id"]) headers["X-Condominio-Id"] = resto["X-Condominio-Id"];
    const resposta = await fetch(`${API_BASE_URL_USERS}/movimentacoes/importar?substituir=${substituir}`, { method: "POST", headers, body: arquivo });
    if (resposta.status === 409 && !substituir) {
      const mensagem = await mensagemErro(resposta, "Este extrato já foi enviado.");
      if (mensagem.includes("Deseja substituir")) throw new ExtratoJaEnviado(mensagem);
      throw new Error(mensagem);
    }
    if (!resposta.ok) throw new Error(await mensagemErro(resposta, "Não foi possível importar o extrato."));
    return resposta.json();
  },
};
