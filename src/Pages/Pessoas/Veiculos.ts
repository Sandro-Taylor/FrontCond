import type { Vaga, Veiculo, Pessoa, VagaEditarDados, VeiculoEditarDados } from "./ConfigPessoas";
import type { NovaVagaDados, NovoVeiculoDados } from "./Hooks/AdicionarEstruturaPessoa";

// EDITAR VEÍCULO
export async function salvarVeiculo(editarVeiculo: (id: string, dados: VeiculoEditarDados) => Promise<boolean>, veiculo: Veiculo, vagaId: string | null, campo: "placa" | "marca" | "modelo" | "cor" | "descricao", valor: string) {
  await editarVeiculo(veiculo.id, {
    placa: campo === "placa" ? valor.trim() || null : veiculo.placa,
    marca: campo === "marca" ? valor.trim() || null : veiculo.marca,
    modelo: campo === "modelo" ? valor.trim() || null : veiculo.modelo,
    cor: campo === "cor" ? valor.trim() || null : veiculo.cor,
    descricao: campo === "descricao" ? valor.trim() || null : veiculo.descricao,
    vaga_id: vagaId || null,
    ativo: veiculo.ativo,
  });
}

// EDITAR VAGA
export async function salvarVaga(editarVaga: (id: string, dados: VagaEditarDados) => Promise<boolean>, vaga: Vaga, campo: "numero" | "localizacao" | "observacao", valor: string) {
  await editarVaga(vaga.id, {
    numero: campo === "numero" ? valor.trim() : vaga.numero,
    localizacao: campo === "localizacao" ? valor.trim() || null : vaga.localizacao,
    observacao: campo === "observacao" ? valor.trim() || null : vaga.observacao,
    ativo: vaga.ativo,
  });
}

// ADICIONAR VAGA
export async function handleAdicionarVaga(adicionarVaga: (apartamentoId: string, dados: NovaVagaDados) => Promise<boolean>, apartamentoId: string) {
  const numero = window.prompt("Número da nova vaga:");
  if (!numero?.trim()) { return; }

  const localizacao = window.prompt("Localização da vaga:");
  const observacao = window.prompt("Observação da vaga:");

  await adicionarVaga(apartamentoId, { numero: numero.trim(), localizacao: localizacao?.trim() || null, observacao: observacao?.trim() || null });
}

// ADICIONAR VEÍCULO
export async function handleAdicionarVeiculo(adicionarVeiculo: (vagaId: string, dados: NovoVeiculoDados) => Promise<boolean>, pessoaSelecionada: Pessoa | null, vagaId: string) {
  if (!pessoaSelecionada) { return; }

  const placa = window.prompt("Placa:");
  if (placa === null) { return; }

  const marca = window.prompt("Marca:");
  if (marca === null) { return; }

  const modelo = window.prompt("Modelo:");
  if (modelo === null) { return; }

  const cor = window.prompt("Cor:");
  if (cor === null) { return; }

  const descricao = window.prompt("Descrição:");

  await adicionarVeiculo(vagaId, {
    pessoa_id: pessoaSelecionada.id,
    placa: placa.trim() || null,
    marca: marca.trim() || null,
    modelo: modelo.trim() || null,
    cor: cor.trim() || null,
    descricao: descricao?.trim() || null,
  });
}

/* =======================================================
     ADICIONAR VEÍCULO SEM VAGA
  ======================================================= */

export async function handleAdicionarVeiculoPessoa(adicionarVeiculoPessoa: (pessoaId: string, dados: Omit<NovoVeiculoDados, "pessoa_id">) => Promise<boolean>, pessoaSelecionada: Pessoa | null) {
  if (!pessoaSelecionada) { return; }

  const placa = window.prompt("Placa:");
  if (placa === null) { return; }

  const marca = window.prompt("Marca:");
  if (marca === null) { return; }

  const modelo = window.prompt("Modelo:");
  if (modelo === null) { return; }

  const cor = window.prompt("Cor:");
  if (cor === null) { return; }

  const descricao = window.prompt("Descrição:");

  await adicionarVeiculoPessoa(pessoaSelecionada.id, {
    placa: placa.trim() || null,
    marca: marca.trim() || null,
    modelo: modelo.trim() || null,
    cor: cor.trim() || null,
    descricao: descricao?.trim() || null,
  });
}
