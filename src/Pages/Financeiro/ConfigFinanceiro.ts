// ---------------------------------------------------------
// FINANCEIRO – tipos, rótulos e chamadas da API
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../config";
import { cabecalhos, mensagemErro } from "../../Components/config";

export type TipoCota = "ORDINARIA" | "EXTRA";
export type SituacaoCota = "ABERTA" | "ATRASADA" | "PAGA" | "CANCELADA";
export type FormaPagamento = "PIX" | "BOLETO" | "DINHEIRO" | "TRANSFERENCIA" | "CARTAO" | "OUTRO";

export type Cota = {
  id: string;
  apartamento_id: string;
  apartamento_rotulo: string;
  responsavel: string | null;
  competencia: string; // "2026-10-01"
  tipo: TipoCota;
  descricao: string | null;
  valor: number;
  vencimento: string;
  status: "ABERTA" | "PAGA" | "CANCELADA";
  situacao: SituacaoCota;
  dias_atraso: number;
  multa: number;
  juros: number;
  valor_atualizado: number;
  data_pagamento: string | null;
  valor_pago: number | null;
  forma_pagamento: FormaPagamento | null;
  observacao: string | null;
};

export type FormaRateio = "FIXO" | "DESPESAS" | "ORCAMENTO";

export const ROTULOS_RATEIO: Record<FormaRateio, { rotulo: string; ajuda: string }> = {
  FIXO: { rotulo: "Valor fixo igual para todas as unidades", ajuda: "Todas as unidades pagam o mesmo valor." },
  DESPESAS: { rotulo: "Rateio das despesas do mês anterior", ajuda: "Soma das despesas reais do mês anterior (pelo plano de contas) x fração ideal de cada unidade." },
  ORCAMENTO: { rotulo: "Orçamento mensal fixo", ajuda: "Orçamento aprovado em assembleia x fração ideal de cada unidade." },
};

export type Configuracao = {
  valor_cota: number | null;
  dia_vencimento: number;
  multa_percentual: number;
  juros_mensal: number;
  rateio_forma: FormaRateio;
  orcamento_mensal: number | null;
  fundo_reserva_percentual: number;
  pix_chave: string | null;
  pix_nome: string | null;
  pix_cidade: string | null;
};

export type SituacaoTaxa = "A_INICIAR" | "EM_ANDAMENTO" | "ENCERRADA" | "INATIVA";
export type TaxaExtra = {
  id: string;
  descricao: string;
  valor_mensal: string;
  parcelas: number | null;
  inicio: string; // "2026-03-01"
  ativo: boolean;
  parcela_atual: number | null;
  situacao: SituacaoTaxa;
};
export type DadosTaxa = { descricao: string; valor_mensal: number; parcelas: number | null; inicio: string; ativo: boolean };
export const ROTULOS_SITUACAO_TAXA: Record<SituacaoTaxa, { rotulo: string; cor: string }> = {
  A_INICIAR: { rotulo: "A iniciar", cor: "purple" },
  EM_ANDAMENTO: { rotulo: "Em andamento", cor: "green" },
  ENCERRADA: { rotulo: "Encerrada", cor: "gray" },
  INATIVA: { rotulo: "Inativa", cor: "gray" },
};

export type CotaCriar = {
  apartamento_id: string;
  competencia: string; // "2026-10"
  tipo: TipoCota;
  descricao: string | null;
  valor: number;
  vencimento: string;
  observacao: string | null;
};

export type CotaEditar = Pick<CotaCriar, "descricao" | "valor" | "vencimento" | "observacao">;

export type Pagamento = {
  data_pagamento: string;
  valor_pago: number;
  forma_pagamento: FormaPagamento;
  observacao: string | null;
};

export const ROTULOS_SITUACAO: Record<SituacaoCota, { rotulo: string; cor: string }> = {
  ABERTA: { rotulo: "Em aberto", cor: "yellow" },
  ATRASADA: { rotulo: "Atrasada", cor: "red" },
  PAGA: { rotulo: "Paga", cor: "green" },
  CANCELADA: { rotulo: "Cancelada", cor: "gray" },
};

export const ROTULOS_TIPO_COTA: Record<TipoCota, string> = { ORDINARIA: "Ordinária", EXTRA: "Extra" };

export const ROTULOS_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  PIX: "PIX", BOLETO: "Boleto", DINHEIRO: "Dinheiro", TRANSFERENCIA: "Transferência", CARTAO: "Cartão", OUTRO: "Outro",
};

// FORMATAÇÕES
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatarMoeda = (valor: number | null | undefined) => moeda.format(valor ?? 0);

// "2026-10-01" ou "2026-10" -> "10/2026"
export function formatarCompetencia(valor: string) {
  const [ano, mes] = valor.split("-");
  return `${mes}/${ano}`;
}

// mês/dia atuais no horário de Brasília
export function hojeIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()); // "2026-09-28"
}
export const mesAtual = () => hojeIso().slice(0, 7);

// texto digitado ("1.234,56" ou "1234.56") -> número
export function lerValor(texto: string): number {
  const limpo = texto.trim().replace(/\s|R\$/g, "");
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : NaN;
}
export const valorParaTexto = (valor: number | null | undefined) => (valor == null ? "" : valor.toFixed(2).replace(".", ","));

// API
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

export type PixCota = { copia_cola: string; qr_svg: string; valor: number; vencimento: string; atrasada: boolean; recebedor: string; chave: string };

export const apiFinanceiro = {
  pix: (id: string) => chamar<PixCota>(`/financeiro/cotas/${id}/pix`, "GET", "Não foi possível gerar o PIX."),
  configuracao: () => chamar<Configuracao>("/financeiro/configuracao", "GET", "Não foi possível carregar a configuração."),
  taxas: () => chamar<TaxaExtra[]>("/financeiro/taxas-extras/", "GET", "Não foi possível carregar as taxas extras."),
  criarTaxa: (dados: DadosTaxa) => chamar<TaxaExtra>("/financeiro/taxas-extras/", "POST", "Não foi possível salvar a taxa.", dados),
  editarTaxa: (id: string, dados: DadosTaxa) => chamar<TaxaExtra>(`/financeiro/taxas-extras/${id}`, "PUT", "Não foi possível salvar a taxa.", dados),
  excluirTaxa: (id: string) => chamar<void>(`/financeiro/taxas-extras/${id}`, "DELETE", "Não foi possível excluir a taxa."),
  salvarConfiguracao: (dados: Configuracao) => chamar<Configuracao>("/financeiro/configuracao", "PUT", "Não foi possível salvar a configuração.", dados),
  listar: (filtros: { competencia?: string; apartamento_id?: string } = {}) => {
    const params = new URLSearchParams();
    if (filtros.competencia) params.set("competencia", filtros.competencia);
    if (filtros.apartamento_id) params.set("apartamento_id", filtros.apartamento_id);
    const query = params.toString();
    return chamar<Cota[]>(`/financeiro/cotas${query ? `?${query}` : ""}`, "GET", "Não foi possível carregar as cotas.");
  },
  gerar: (dados: { competencia: string; valor: number | null; dia_vencimento: number | null }) =>
    chamar<{ criadas: number; ja_existiam: number }>("/financeiro/cotas/gerar", "POST", "Não foi possível gerar as cotas.", dados),
  criar: (dados: CotaCriar) => chamar<Cota>("/financeiro/cotas", "POST", "Não foi possível lançar a cota.", dados),
  editar: (id: string, dados: CotaEditar) => chamar<Cota>(`/financeiro/cotas/${id}`, "PUT", "Não foi possível salvar a cota.", dados),
  pagar: (id: string, dados: Pagamento) => chamar<Cota>(`/financeiro/cotas/${id}/pagamento`, "POST", "Não foi possível registrar o pagamento.", dados),
  estornar: (id: string) => chamar<Cota>(`/financeiro/cotas/${id}/pagamento`, "DELETE", "Não foi possível estornar o pagamento."),
  cancelar: (id: string) => chamar<Cota>(`/financeiro/cotas/${id}/cancelar`, "PATCH", "Não foi possível cancelar a cota."),
  reabrir: (id: string) => chamar<Cota>(`/financeiro/cotas/${id}/reabrir`, "PATCH", "Não foi possível reabrir a cota."),
  excluir: (id: string) => chamar<void>(`/financeiro/cotas/${id}`, "DELETE", "Não foi possível excluir a cota."),
};
