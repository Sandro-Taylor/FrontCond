export type PerfilPessoa = "MORADOR" | "SINDICO" | "CONSELHEIRO" | "COLABORADOR";

export const ROTULOS_PERFIL: Record<PerfilPessoa, string> = {
  MORADOR: "Morador",
  SINDICO: "Síndico",
  CONSELHEIRO: "Conselheiro",
  COLABORADOR: "Colaborador",
};

export type Veiculo = {
  id: string;
  pessoa_id: string;
  vaga_id: string | null;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
  ativo: boolean;
};

export type Vaga = {
  id: string;
  numero: string;
  localizacao: string | null;
  observacao: string | null;
  ativo: boolean;
  veiculos: Veiculo[];
};

export type Apartamento = {
  id: string;
  bloco: string;
  numero: string;
  andar: number | null;
  observacao: string | null;
  ativo: boolean;
  vagas: Vaga[];
};

export type PessoaApartamento = {
  id: string;
  tipo_relacao: "PROPRIETARIO" | "MORADOR";
  principal: boolean;
  ativo: boolean;
  apartamento: Apartamento;
};

export type Pessoa = {
  id: string;
  user_id: string | null;
  perfil: PerfilPessoa;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  ativo: boolean;
  created_at: string;
  apartamentos: PessoaApartamento[];
  veiculos: Veiculo[];
};


// ======================================================
// CADASTRO
// ======================================================

export type VeiculoCriarDados = {
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
};

export type VagaCriarDados = {
  numero: string;
  localizacao: string | null;
  observacao: string | null;
  veiculos: VeiculoCriarDados[];
};

export type ApartamentoCriarDados = {
  bloco: string | null;
  numero: string;
  andar: number | null;
  observacao: string | null;
  tipo_relacao: "PROPRIETARIO" | "MORADOR";
  principal: boolean;
  vagas: VagaCriarDados[];
};

export type PessoaCriarDados = {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  perfil: PerfilPessoa;
  apartamentos: ApartamentoCriarDados[];
};


export type PessoaEditarDados = {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  ativo: boolean;
  perfil?: PerfilPessoa;
};

export type ApartamentoEditarDados = {
  bloco: string | null;
  numero: string;
  andar: number | null;
  observacao: string | null;
  ativo: boolean;
};

export type VinculoEditarDados = {
  tipo_relacao: "PROPRIETARIO" | "MORADOR";
  principal: boolean;
  ativo: boolean;
};

export type VagaEditarDados = {
  numero: string;
  localizacao: string | null;
  observacao: string | null;
  ativo: boolean;
};

export type VeiculoEditarDados = {
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  descricao: string | null;
  vaga_id: string | null;
  ativo: boolean;
};
