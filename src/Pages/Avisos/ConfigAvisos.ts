// ---------------------------------------------------------
// AVISOS – tipos, rótulos e chamadas da API
// ---------------------------------------------------------

import { chamarApi } from "../../Components/config";

export type PrioridadeAviso = "NORMAL" | "IMPORTANTE" | "URGENTE";

export type Aviso = {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: PrioridadeAviso;
  fixado: boolean;
  expira_em: string | null;
  ativo: boolean;
  vigente: boolean;
  autor_nome: string;
  created_at: string;
  updated_at: string;
  lido: boolean;
  total_leituras: number | null;      // só para a gestão
  total_destinatarios: number | null; // só para a gestão
};

export type AvisoDados = {
  titulo: string;
  conteudo: string;
  prioridade: PrioridadeAviso;
  fixado: boolean;
  expira_em: string | null;
};

export type AvisoEditar = AvisoDados & { ativo: boolean };
export type Leitura = { nome: string; lido_em: string };

export const ROTULOS_PRIORIDADE: Record<PrioridadeAviso, { rotulo: string; cor: string }> = {
  NORMAL: { rotulo: "Normal", cor: "gray" },
  IMPORTANTE: { rotulo: "Importante", cor: "orange" },
  URGENTE: { rotulo: "Urgente", cor: "red" },
};

export const apiAvisos = {
  listar: (historico = false) => chamarApi<Aviso[]>(`/avisos/${historico ? "?historico=true" : ""}`, "GET", "Não foi possível carregar os avisos."),
  publicar: (dados: AvisoDados) => chamarApi<Aviso>("/avisos/", "POST", "Não foi possível publicar o aviso.", dados),
  editar: (id: string, dados: AvisoEditar) => chamarApi<Aviso>(`/avisos/${id}`, "PUT", "Não foi possível salvar o aviso.", dados),
  excluir: (id: string) => chamarApi<void>(`/avisos/${id}`, "DELETE", "Não foi possível excluir o aviso."),
  ciente: (id: string) => chamarApi<Aviso>(`/avisos/${id}/ciente`, "POST", "Não foi possível confirmar a leitura."),
  leituras: (id: string) => chamarApi<Leitura[]>(`/avisos/${id}/leituras`, "GET", "Não foi possível carregar as leituras."),
};
