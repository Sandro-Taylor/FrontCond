// ---------------------------------------------------------
// ADMINISTRAÇÃO GERAL (só ADM do sistema) – tipos e API
// ---------------------------------------------------------

import { chamarApi } from "../../Components/config";
import type { Parentesco, PerfilPessoa, TipoRelacao } from "../Pessoas/ConfigPessoas";

export type ResponsavelResumo = { id: string; nome: string; email: string };
export type SindicoVisao = { pessoa_id: string; nome: string; telefone: string | null; email: string | null; tem_login: boolean };

export type CondominioVisao = {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  sindicos: SindicoVisao[];
  total_apartamentos: number;
  total_moradores: number;
  sem_responsavel: number; // moradores no padrão (síndico do prédio)
};

export type PessoaAdmin = {
  id: string;
  nome: string;
  perfil: PerfilPessoa;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  foto_arquivo_id: string | null;
  tem_login: boolean;
  login_status: string | null;
  responsavel: ResponsavelResumo | null; // null = padrão (síndico do prédio)
  recebe_origem: "ESCOLHIDO" | "SINDICO" | "TODOS";
  recebe_nomes: string[];
  chamados_abertos: { id: string; numero: number; assunto: string; status: "ABERTO" | "RESPONDIDO"; updated_at: string }[];
  whatsapp: { conversa_id: string; nome: string | null; nao_lidas: number; ultima_mensagem: string | null; ultima_mensagem_em: string } | null;
  created_at: string;
};

export type PessoaNaUnidade = {
  vinculo_id: string;
  tipo_relacao: TipoRelacao;
  reside: boolean;
  parentesco: Parentesco | null;
  principal: boolean;
  titular_nome: string | null;
  pessoa: PessoaAdmin;
};

export type ApartamentoAdmin = {
  id: string;
  rotulo: string;
  bloco: string;
  numero: string;
  andar: number | null;
  observacao: string | null;
  ocupacao: "OCUPADO_PROPRIETARIO" | "ALUGADO" | "VAZIO";
  pessoas: PessoaNaUnidade[];
  veiculos: { placa: string | null; marca: string | null; modelo: string | null; cor: string | null; condutor: string | null; vaga: string | null }[];
  vagas: { numero: string; tipo: "FIXA" | "ROTATIVA"; localizacao: string | null }[];
  financeiro: { cotas_abertas: number; cotas_atrasadas: number; valor_em_aberto: number };
};

export type CondominioDetalhe = {
  id: string;
  nome: string;
  sindicos: SindicoVisao[];
  responsaveis_disponiveis: ResponsavelResumo[];
  apartamentos: ApartamentoAdmin[];
  sem_unidade: PessoaAdmin[];
};

export type CampoEditavel = "nome" | "cpf" | "email" | "telefone" | "data_nascimento" | "responsavel_user_id";

export type ResponsavelLista = {
  id: string;
  nome: string;
  email: string;
  status: "ativo" | "inativo" | "bloqueado";
  trocar_senha: boolean;
  total_pessoas: number;
  created_at: string;
};

export type ResponsavelCriado = { id: string; nome: string; email: string; senha_temporaria: string | null; login_existente: boolean };

export const OCUPACAO_ADMIN: Record<ApartamentoAdmin["ocupacao"], { rotulo: string; cor: string }> = {
  OCUPADO_PROPRIETARIO: { rotulo: "Proprietário mora", cor: "green" },
  ALUGADO: { rotulo: "Alugado", cor: "blue" },
  VAZIO: { rotulo: "Vazio", cor: "gray" },
};

export const apiAdministracao = {
  visaoGeral: () => chamarApi<CondominioVisao[]>("/administracao/visao-geral", "GET", "Não foi possível carregar os condomínios."),
  condominio: (id: string) => chamarApi<CondominioDetalhe>(`/administracao/condominios/${id}`, "GET", "Não foi possível carregar o condomínio."),
  editarPessoa: (pessoaId: string, campo: CampoEditavel, valor: string | null) =>
    chamarApi<void>(`/administracao/pessoas/${pessoaId}`, "PATCH", "Não foi possível salvar.", { [campo]: valor }),
  aplicarResponsavel: (condominioId: string, responsavelId: string, somenteSemResponsavel: boolean) =>
    chamarApi<{ atualizados: number }>(`/administracao/condominios/${condominioId}/responsavel`, "POST", "Não foi possível aplicar o responsável.",
      { responsavel_user_id: responsavelId, somente_sem_responsavel: somenteSemResponsavel }),
  responsaveis: () => chamarApi<ResponsavelLista[]>("/administracao/responsaveis", "GET", "Não foi possível carregar os responsáveis."),
  criarResponsavel: (nome: string, email: string) =>
    chamarApi<ResponsavelCriado>("/administracao/responsaveis", "POST", "Não foi possível criar o responsável.", { nome, email }),
  removerResponsavel: (userId: string) =>
    chamarApi<void>(`/users/${userId}/responsavel`, "PATCH", "Não foi possível remover o responsável.", { responsavel: false }),
  novaSenha: (userId: string) =>
    chamarApi<{ email: string; senha_temporaria: string }>(`/users/${userId}/nova-senha`, "POST", "Não foi possível gerar a senha."),
};
