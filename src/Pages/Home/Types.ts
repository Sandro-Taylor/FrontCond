export type Resumo = {
  condominio: {
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
  };
  gestao: {
    pessoa_id: string;
    nome: string;
    perfil: "SINDICO" | "CONSELHEIRO";
    unidade: string | null;
    telefone: string | null; // só do síndico
    email: string | null;    // só do síndico
    foto_arquivo_id: string | null;
  }[];
  total_apartamentos: number;
  total_vagas: number;
  vagas_fixas: number;
  vagas_rotativas: number;
  total_pessoas: number;
  total_veiculos: number;
};