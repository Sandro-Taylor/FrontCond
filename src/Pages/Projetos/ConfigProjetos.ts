
export type Projeto = {
  id: string;
  projeto: string;
  descricao: string | null;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  dataArquivamento: string | null;
};

export type ProjetoCriarDados = {
  projeto: string;
  descricao: string | null;
};

export type ProjetoEditarDados = Partial<ProjetoCriarDados>;
