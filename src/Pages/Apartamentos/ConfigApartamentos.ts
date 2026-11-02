// ---------------------------------------------------------
// TIPOS DE APARTAMENTOS
// ---------------------------------------------------------

import type { Parentesco, PerfilPessoa, PessoaDados, TipoRelacao } from "../Pessoas/ConfigPessoas";

export type Ocupacao = "OCUPADO_PROPRIETARIO" | "ALUGADO" | "VAZIO";

export const OCUPACAO: Record<Ocupacao, { rotulo: string; cor: string }> = {
  OCUPADO_PROPRIETARIO: { rotulo: "Ocupado pelo proprietário", cor: "green" },
  ALUGADO: { rotulo: "Alugado", cor: "blue" },
  VAZIO: { rotulo: "Vazio", cor: "gray" },
};

// ======================================================
// DADOS VINDOS DA API
// ======================================================

export type ApartamentoResumo = {
  id: string;
  bloco: string;
  numero: string;
  andar: number | null;
  observacao: string | null;
  ativo: boolean;
  fracao_ideal: string | null;   // % no rateio (Fração ideal)
  ocupacao: Ocupacao;
  proprietarios: string[];
  inquilinos: string[];
  total_residentes: number;
  total_vagas: number;
  total_veiculos: number;
};

export type PessoaDoVinculo = {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  perfil: PerfilPessoa;
  ativo: boolean;
};

export type VinculoApartamento = {
  id: string;
  pessoa_id: string;
  tipo_relacao: TipoRelacao;
  reside: boolean;
  titular_vinculo_id: string | null;
  parentesco: Parentesco | null;
  principal: boolean;
  ativo: boolean;
  pessoa: PessoaDoVinculo;
};

export type VagaApartamento = {
  id: string;
  numero: string;
  tipo: "FIXA" | "ROTATIVA";
  localizacao: string | null;
  observacao: string | null;
  ativo: boolean;
};

export type VeiculoApartamento = {
  id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
  ativo: boolean;
  vaga_id: string | null;
  vaga_numero: string | null; // null = usa vagas rotativas
  pessoa_id: string | null;
  condutor_nome: string | null;
};

export type ApartamentoDetalhe = {
  id: string;
  bloco: string;
  numero: string;
  andar: number | null;
  observacao: string | null;
  ativo: boolean;
  fracao_ideal: string | null;   // % no rateio (Fração ideal)
  ocupacao: Ocupacao;
  pessoas: VinculoApartamento[];
  vagas: VagaApartamento[];
  veiculos: VeiculoApartamento[];
};

// ======================================================
// DADOS ENVIADOS PARA A API
// ======================================================

export type ApartamentoDados = {
  bloco: string | null;
  numero: string;
  andar: number | null;
  observacao: string | null;
};

export type ApartamentoEditar = ApartamentoDados & { ativo: boolean };

export type VinculoDados = {
  tipo_relacao: TipoRelacao;
  reside: boolean;
  titular_vinculo_id: string | null;
  parentesco: Parentesco | null;
};

export type AdicionarPessoaDados = VinculoDados & {
  pessoa_id?: string;   // pessoa já cadastrada
  pessoa?: PessoaDados; // ou uma pessoa nova
};

export type VinculoEditar = VinculoDados & { ativo: boolean };

export type VagaDados = {
  numero: string;
  localizacao: string | null;
  observacao: string | null;
};

export type VagaEditar = VagaDados & { ativo: boolean };

export type VeiculoDados = {
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
  vaga_id: string | null;
  pessoa_id: string | null;
};

export type VeiculoEditar = VeiculoDados & { ativo: boolean };
