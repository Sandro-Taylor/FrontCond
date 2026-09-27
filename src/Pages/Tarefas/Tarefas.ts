import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL_USERS } from "../../config";

export type Projeto = {
  id: string;
  projeto: string;
};

export type Colaborador = {
  idColaborador: string;
  nome: string;
  cpf: string;
  cargo: string | null;
};

export type Tarefa = {
  id: string;
  idProjeto: string;
  idResponsavel: string;
  tarefa: string;
  descricao: string | null;
  prioridade: string;
  prazo: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
  dataConclusao: string | null;
  status: string | null;
  ativo: boolean;
  dataArquivamento: string | null;
};

export type TarefaCriarPayload = {
  idProjeto: string;
  idResponsavel: string;
  tarefa: string;
  descricao: string | null;
  prioridade: string;
  prazo: string | null;
  status: string | null;
};

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { Authorization: `Bearer ${token}` };
}

async function tratarResposta<T>(response: Response, mensagemErro: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail ?? mensagemErro);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export function useTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);

    try {
      const [tarefasResposta, opcoesResposta] = await Promise.all([
        fetch(`${API_BASE_URL_USERS}/tarefas/`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL_USERS}/tarefas/opcoes`, { headers: authHeaders() }),
      ]);

      const tarefasData = await tratarResposta<Tarefa[]>(
        tarefasResposta,
        "Não foi possível carregar as tarefas",
      );
      const opcoesData = await tratarResposta<{ projetos: Projeto[]; colaboradores: Colaborador[] }>(
        opcoesResposta,
        "Não foi possível carregar as opções",
      );

      setTarefas(tarefasData);
      setProjetos(opcoesData.projetos);
      setColaboradores(opcoesData.colaboradores);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function criar(payload: TarefaCriarPayload) {
    setCriando(true);

    try {
      const response = await fetch(`${API_BASE_URL_USERS}/tarefas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const novaTarefa = await tratarResposta<Tarefa>(response, "Não foi possível criar a tarefa");
      setTarefas((atual) => [novaTarefa, ...atual]);
      return novaTarefa;
    } finally {
      setCriando(false);
    }
  }

  async function editarCampo(id: string, campo: keyof TarefaCriarPayload, valor: string) {
    const response = await fetch(`${API_BASE_URL_USERS}/tarefas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ [campo]: valor }),
    });

    const tarefaAtualizada = await tratarResposta<Tarefa>(response, "Não foi possível salvar a alteração");
    setTarefas((atual) => atual.map((item) => (item.id === id ? tarefaAtualizada : item)));
  }

  async function arquivar(id: string) {
    const response = await fetch(`${API_BASE_URL_USERS}/tarefas/${id}/arquivar`, {
      method: "PATCH",
      headers: authHeaders(),
    });

    const tarefaAtualizada = await tratarResposta<Tarefa>(response, "Não foi possível arquivar a tarefa");
    setTarefas((atual) => atual.map((item) => (item.id === id ? tarefaAtualizada : item)));
  }

  async function restaurar(id: string) {
    const response = await fetch(`${API_BASE_URL_USERS}/tarefas/${id}/restaurar`, {
      method: "PATCH",
      headers: authHeaders(),
    });

    const tarefaAtualizada = await tratarResposta<Tarefa>(response, "Não foi possível restaurar a tarefa");
    setTarefas((atual) => atual.map((item) => (item.id === id ? tarefaAtualizada : item)));
  }

  async function excluir(id: string) {
    const response = await fetch(`${API_BASE_URL_USERS}/tarefas/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    await tratarResposta<void>(response, "Não foi possível excluir a tarefa");
    setTarefas((atual) => atual.filter((item) => item.id !== id));
  }

  return {
    tarefas,
    projetos,
    colaboradores,
    carregando,
    criando,
    criar,
    editarCampo,
    arquivar,
    restaurar,
    excluir,
    recarregar: carregarTudo,
  };
}
