// ---------------------------------------------------------
// TAREFAS – tipos, rótulos e chamadas da API
// ---------------------------------------------------------

import { chamarApi } from "../../Components/config";

export type PrioridadeTarefa = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
export type StatusTarefa = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";

export type Tarefa = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string | null;
  local: string | null;
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_perfil: string;
  responsavel_cargo: string | null; // funcionário: porteiro, zelador...
  criado_por_nome: string;
  prioridade: PrioridadeTarefa;
  status: StatusTarefa;
  prazo: string | null;
  atrasada: boolean;
  concluida_em: string | null;
  created_at: string;
  updated_at: string;
  total_comentarios: number;
  minha: boolean;
  pode_atuar: boolean;
};

export type Historico = { id: string; autor_nome: string; tipo: "COMENTARIO" | "EVENTO"; texto: string; created_at: string };
export type TarefaDetalhe = Tarefa & { historico: Historico[] };

export type TarefaDados = {
  titulo: string;
  descricao: string | null;
  local: string | null;
  responsavel_id: string;
  prioridade: PrioridadeTarefa;
  prazo: string | null;
};

export type Responsavel = { id: string; nome: string; perfil: string; cargo: string | null; tem_acesso: boolean };

export const ROTULOS_STATUS: Record<StatusTarefa, { rotulo: string; cor: string }> = {
  PENDENTE: { rotulo: "Pendente", cor: "gray" },
  EM_ANDAMENTO: { rotulo: "Em andamento", cor: "blue" },
  CONCLUIDA: { rotulo: "Concluída", cor: "green" },
  CANCELADA: { rotulo: "Cancelada", cor: "red" },
};

export const ROTULOS_PRIORIDADE: Record<PrioridadeTarefa, { rotulo: string; cor: string }> = {
  BAIXA: { rotulo: "Baixa", cor: "gray" },
  MEDIA: { rotulo: "Média", cor: "blue" },
  ALTA: { rotulo: "Alta", cor: "orange" },
  URGENTE: { rotulo: "Urgente", cor: "red" },
};

export const numeroTarefa = (numero: number) => `#${String(numero).padStart(4, "0")}`;

export const apiTarefas = {
  listar: () => chamarApi<Tarefa[]>("/tarefas/", "GET", "Não foi possível carregar as tarefas."),
  responsaveis: () => chamarApi<Responsavel[]>("/tarefas/responsaveis", "GET", "Não foi possível carregar os responsáveis."),
  ver: (id: string) => chamarApi<TarefaDetalhe>(`/tarefas/${id}`, "GET", "Não foi possível carregar a tarefa."),
  criar: (dados: TarefaDados) => chamarApi<TarefaDetalhe>("/tarefas/", "POST", "Não foi possível criar a tarefa.", dados),
  editar: (id: string, dados: TarefaDados) => chamarApi<TarefaDetalhe>(`/tarefas/${id}`, "PUT", "Não foi possível salvar a tarefa.", dados),
  mudarStatus: (id: string, status: StatusTarefa, comentario?: string) =>
    chamarApi<TarefaDetalhe>(`/tarefas/${id}/status`, "PATCH", "Não foi possível alterar a situação.", { status, comentario: comentario || null }),
  comentar: (id: string, texto: string) => chamarApi<TarefaDetalhe>(`/tarefas/${id}/comentarios`, "POST", "Não foi possível comentar.", { texto }),
  excluir: (id: string) => chamarApi<void>(`/tarefas/${id}`, "DELETE", "Não foi possível excluir a tarefa."),
};
