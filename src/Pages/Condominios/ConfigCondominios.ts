// ---------------------------------------------------------
// CONDOMÍNIOS – tipos e chamadas da API (ADM do sistema)
// ---------------------------------------------------------

import { API_BASE_URL_USERS } from "../../config";
import { chamarApi, mensagemErro } from "../../Components/config";
import type { PessoaDados } from "../Pessoas/ConfigPessoas";

export type Condominio = {
  id: string;
  nome: string;
  cnpj: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type SindicoResumo = { pessoa_id: string; nome: string; email: string | null; tem_acesso: boolean };

export type CondominioPainel = {
  condominio: Condominio;
  sindicos: SindicoResumo[];
  total_apartamentos: number;
  total_pessoas: number;
  total_usuarios: number;
  chamados_aguardando: number;
  cotas_atrasadas: number;
  tarefas_atrasadas: number;
};

export type SindicoAnterior = "MORADOR" | "CONSELHEIRO" | "MANTER";

export type DesignarSindico = {
  pessoa_id: string | null;
  pessoa: PessoaDados | null;
  email: string | null;
  sindico_anterior: SindicoAnterior;
};

export type SindicoDesignado = { pessoa_id: string; nome: string; email: string; senha_temporaria: string | null; login_existente: boolean };

// pessoa de um condomínio que não é o selecionado no menu (para escolher o síndico)
export type PessoaDoCondominio = { id: string; nome: string; perfil: string; email: string | null; user_id: string | null; ativo: boolean };

export type DadosCondominio = Record<"nome" | "cnpj" | "cep" | "logradouro" | "numero" | "complemento" | "bairro" | "cidade" | "uf" | "telefone" | "email", string | null>;
export type ContatoCondominio = Omit<DadosCondominio, "nome" | "cnpj">;

export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export const apiCondominios = {
  painel: () => chamarApi<CondominioPainel[]>("/condominios/painel", "GET", "Não foi possível carregar os condomínios."),
  criar: (dados: DadosCondominio) => chamarApi<Condominio>("/condominios/", "POST", "Não foi possível cadastrar o condomínio.", dados),
  editar: (id: string, dados: DadosCondominio) => chamarApi<Condominio>(`/condominios/${id}`, "PUT", "Não foi possível salvar o condomínio.", dados),
  arquivar: (id: string) => chamarApi<Condominio>(`/condominios/${id}/arquivar`, "PATCH", "Não foi possível arquivar o condomínio."),
  restaurar: (id: string) => chamarApi<Condominio>(`/condominios/${id}/restaurar`, "PATCH", "Não foi possível restaurar o condomínio."),
  designarSindico: (id: string, dados: DesignarSindico) =>
    chamarApi<SindicoDesignado>(`/condominios/${id}/sindico`, "POST", "Não foi possível designar o síndico.", dados),
  editarContato: (dados: ContatoCondominio) => chamarApi<Condominio>("/condominios/atual/contato", "PUT", "Não foi possível salvar os dados do condomínio.", dados),

  // lista as pessoas de outro condomínio (o cabeçalho X-Condominio-Id é o do condomínio escolhido)
  pessoasDe: async (condominioId: string): Promise<PessoaDoCondominio[]> => {
    const response = await fetch(`${API_BASE_URL_USERS}/pessoas/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`, "X-Condominio-Id": condominioId },
    });
    if (!response.ok) throw new Error(await mensagemErro(response, "Não foi possível carregar as pessoas do condomínio."));
    return response.json();
  },
};
