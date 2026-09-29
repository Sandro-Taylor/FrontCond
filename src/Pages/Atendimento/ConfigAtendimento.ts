// ---------------------------------------------------------
// ATENDIMENTO (fale com o síndico) – tipos e API
// ---------------------------------------------------------

import { chamarApi } from "../../Components/config";

export type CategoriaChamado = "DUVIDA" | "SOLICITACAO" | "RECLAMACAO" | "SUGESTAO" | "MANUTENCAO" | "OUTRO";
export type StatusChamado = "ABERTO" | "RESPONDIDO" | "ENCERRADO";

export type ChamadoResumo = {
  id: string;
  numero: number;
  assunto: string;
  categoria: CategoriaChamado;
  status: StatusChamado;
  autor_nome: string;
  autor_unidades: string[];
  nao_lido: boolean;
  total_mensagens: number;
  created_at: string;
  updated_at: string;
  encerrado_em: string | null;
};

export type Mensagem = {
  id: string;
  autor_nome: string;
  da_gestao: boolean;
  minha: boolean;
  texto: string;
  created_at: string;
};

export type ChamadoDetalhe = ChamadoResumo & { mensagens: Mensagem[] };

export const ROTULOS_CATEGORIA: Record<CategoriaChamado, string> = {
  DUVIDA: "Dúvida", SOLICITACAO: "Solicitação", RECLAMACAO: "Reclamação", SUGESTAO: "Sugestão", MANUTENCAO: "Manutenção", OUTRO: "Outro",
};

// o texto depende de quem está vendo: a gestão "responde", o morador "aguarda"
export function rotuloStatus(status: StatusChamado, gestao: boolean): { rotulo: string; cor: string } {
  if (status === "ENCERRADO") return { rotulo: "Encerrado", cor: "gray" };
  if (status === "ABERTO") return gestao ? { rotulo: "Aguardando resposta", cor: "orange" } : { rotulo: "Aguardando o síndico", cor: "yellow" };
  return gestao ? { rotulo: "Respondido", cor: "blue" } : { rotulo: "Respondido", cor: "green" };
}

export const protocolo = (numero: number) => `#${String(numero).padStart(4, "0")}`;

export const apiChamados = {
  listar: () => chamarApi<ChamadoResumo[]>("/chamados/", "GET", "Não foi possível carregar os chamados."),
  abrir: (dados: { assunto: string; categoria: CategoriaChamado; mensagem: string }) =>
    chamarApi<ChamadoDetalhe>("/chamados/", "POST", "Não foi possível enviar a mensagem.", dados),
  ver: (id: string) => chamarApi<ChamadoDetalhe>(`/chamados/${id}`, "GET", "Não foi possível carregar o chamado."),
  responder: (id: string, texto: string) => chamarApi<ChamadoDetalhe>(`/chamados/${id}/mensagens`, "POST", "Não foi possível enviar a mensagem.", { texto }),
  encerrar: (id: string) => chamarApi<ChamadoDetalhe>(`/chamados/${id}/encerrar`, "PATCH", "Não foi possível encerrar o chamado."),
  reabrir: (id: string) => chamarApi<ChamadoDetalhe>(`/chamados/${id}/reabrir`, "PATCH", "Não foi possível reabrir o chamado."),
};
