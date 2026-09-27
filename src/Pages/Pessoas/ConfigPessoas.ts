// ---------------------------------------------------------
// TIPOS E RÓTULOS DE PESSOAS
// ---------------------------------------------------------

export type PerfilPessoa = "MORADOR" | "SINDICO" | "CONSELHEIRO" | "COLABORADOR" | "PRESTADOR";
export type TipoRelacao = "PROPRIETARIO" | "INQUILINO" | "RESIDENTE";
export type Parentesco =
  | "CONJUGE" | "FILHO" | "ENTEADO" | "PAI_MAE" | "SOGRO" | "IRMAO"
  | "AVO" | "NETO" | "OUTRO_PARENTE" | "EMPREGADO_DOMESTICO" | "OUTRO";

export const ROTULOS_PERFIL: Record<PerfilPessoa, string> = {
  MORADOR: "Morador",
  SINDICO: "Síndico",
  CONSELHEIRO: "Conselheiro",
  COLABORADOR: "Colaborador",
  PRESTADOR: "Prestador de serviço",
};

export const ROTULOS_TIPO_RELACAO: Record<TipoRelacao, string> = {
  PROPRIETARIO: "Proprietário",
  INQUILINO: "Inquilino",
  RESIDENTE: "Residente",
};

export const ROTULOS_PARENTESCO: Record<Parentesco, string> = {
  CONJUGE: "Cônjuge / Companheiro(a)",
  FILHO: "Filho(a)",
  ENTEADO: "Enteado(a)",
  PAI_MAE: "Pai / Mãe",
  SOGRO: "Sogro(a)",
  IRMAO: "Irmão(ã)",
  AVO: "Avô / Avó",
  NETO: "Neto(a)",
  OUTRO_PARENTE: "Outro parente",
  EMPREGADO_DOMESTICO: "Empregado(a) doméstico(a)",
  OUTRO: "Outro",
};

// ======================================================
// DADOS VINDOS DA API
// ======================================================

export type ApartamentoResumido = {
  id: string;
  bloco: string;
  numero: string;
};

export type VinculoDaPessoa = {
  id: string;
  tipo_relacao: TipoRelacao;
  reside: boolean;
  parentesco: Parentesco | null;
  titular_nome: string | null;
  principal: boolean;
  ativo: boolean;
  apartamento: ApartamentoResumido;
};

export type VeiculoDaPessoa = {
  id: string;
  apartamento_id: string;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
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
  apartamentos: VinculoDaPessoa[];
  veiculos: VeiculoDaPessoa[]; // veículos em que a pessoa é condutor
};

// ======================================================
// DADOS ENVIADOS PARA A API
// ======================================================

export type PessoaDados = {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
};

export type PessoaCriarDados = PessoaDados & {
  perfil: PerfilPessoa;
};

export type PessoaEditarDados = PessoaDados & {
  ativo: boolean;
  perfil?: PerfilPessoa;
};

// ======================================================
// TEXTOS
// ======================================================

export function rotuloApartamento(apartamento: { bloco: string; numero: string }) {
  return apartamento.bloco ? `Bloco ${apartamento.bloco} · ${apartamento.numero}` : `Apto ${apartamento.numero}`;
}

// "Proprietário (não reside)", "Inquilino", "Filho(a) de Maria"
export function descreverVinculo(vinculo: { tipo_relacao: TipoRelacao; reside: boolean; parentesco: Parentesco | null; titular_nome?: string | null }) {
  if (vinculo.tipo_relacao === "RESIDENTE") {
    const parentesco = vinculo.parentesco ? ROTULOS_PARENTESCO[vinculo.parentesco] : "Residente";
    return vinculo.titular_nome ? `${parentesco} de ${vinculo.titular_nome}` : parentesco;
  }
  if (vinculo.tipo_relacao === "PROPRIETARIO") {
    return vinculo.reside ? "Proprietário (reside)" : "Proprietário (não reside)";
  }
  return ROTULOS_TIPO_RELACAO[vinculo.tipo_relacao];
}

// ======================================================
// CATEGORIA (como a pessoa aparece na tela Pessoas)
// ======================================================

export type Categoria = "PROPRIETARIO" | "INQUILINO" | "RESIDENTE" | "COLABORADOR" | "PRESTADOR" | "GESTAO" | "SEM_VINCULO";

export const ROTULOS_CATEGORIA: Record<Categoria, { rotulo: string; cor: string }> = {
  PROPRIETARIO: { rotulo: "Proprietário", cor: "purple" },
  INQUILINO: { rotulo: "Inquilino", cor: "blue" },
  RESIDENTE: { rotulo: "Residente", cor: "teal" },
  COLABORADOR: { rotulo: "Colaborador", cor: "orange" },
  PRESTADOR: { rotulo: "Prestador de serviço", cor: "yellow" },
  GESTAO: { rotulo: "Síndico / Conselho", cor: "red" },
  SEM_VINCULO: { rotulo: "Sem vínculo", cor: "gray" },
};

export function categoriaPessoa(pessoa: Pessoa): Categoria {
  if (pessoa.perfil === "SINDICO" || pessoa.perfil === "CONSELHEIRO") return "GESTAO";
  if (pessoa.perfil === "COLABORADOR") return "COLABORADOR";
  if (pessoa.perfil === "PRESTADOR") return "PRESTADOR";
  const ativos = pessoa.apartamentos.filter((v) => v.ativo);
  if (ativos.some((v) => v.tipo_relacao === "PROPRIETARIO")) return "PROPRIETARIO";
  if (ativos.some((v) => v.tipo_relacao === "INQUILINO")) return "INQUILINO";
  if (ativos.some((v) => v.tipo_relacao === "RESIDENTE")) return "RESIDENTE";
  return "SEM_VINCULO";
}
