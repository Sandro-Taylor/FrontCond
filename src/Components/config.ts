// ---------------------------------------------------------
// CONFIGURAÇÕES COMPARTILHADAS DO FRONT
// ---------------------------------------------------------
// Cabeçalhos das chamadas à API, condomínio atual e
// formatações de exibição (datas, CPF, telefone...).
// ---------------------------------------------------------

const CHAVE_TOKEN = "access_token";
const CHAVE_CONDOMINIO = "condominio_id";
const FUSO = "America/Sao_Paulo";

// CONDOMÍNIO ATUAL (enviado em todas as chamadas no cabeçalho X-Condominio-Id)
export function obterCondominioAtual(): string | null {
  try { return localStorage.getItem(CHAVE_CONDOMINIO); } catch { return null; }
}

export function definirCondominioAtual(id: string | null) {
  try {
    if (id) localStorage.setItem(CHAVE_CONDOMINIO, id);
    else localStorage.removeItem(CHAVE_CONDOMINIO);
  } catch { /* navegador sem localStorage */ }
}

export function cabecalhos(): Record<string, string> {
  const token = localStorage.getItem(CHAVE_TOKEN);
  const condominio = obterCondominioAtual();
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  if (condominio) headers["X-Condominio-Id"] = condominio;
  return headers;
}

// DATAS (sempre no horário de Brasília)
export function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: FUSO });
}

export function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", { timeZone: FUSO });
}

// MÁSCARAS (o banco guarda sem máscara; a tela mostra com máscara)
export function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor: string | null | undefined) {
  if (!valor) return "";
  const numeros = somenteNumeros(valor).slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatarTelefone(valor: string | null | undefined) {
  if (!valor) return "";
  const numeros = somenteNumeros(valor).slice(0, 11);
  if (numeros.length <= 10) return numeros.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a));
  return numeros.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
}

export function formatarPlaca(valor: string | null | undefined) {
  if (!valor) return "";
  const placa = valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  // padrão antigo (ABC1234) mostra com hífen; Mercosul (ABC1D23) sem hífen
  return /^[A-Z]{3}\d{4}$/.test(placa) ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;
}

// data sem hora vinda do banco ("2026-09-27"): monta direto, sem conversão de fuso
export function formatarDataIso(valor: string | null | undefined) {
  if (!valor) return "";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

// ERROS DA API: devolve a mensagem que o backend mandou (texto ou lista de validação)
export async function mensagemErro(response: Response, padrao: string): Promise<string> {
  const corpo = await response.json().catch(() => null);
  const detalhe = corpo?.detail;
  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe) && detalhe.length > 0) {
    return detalhe.map((item: { msg?: string }) => String(item.msg ?? "").replace(/^Value error, /, "")).join("; ");
  }
  return padrao;
}

export function formatarCnpj(valor: string | null | undefined) {
  if (!valor) return "";
  const cnpj = valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 14);
  return cnpj.length === 14 ? cnpj.replace(/^(\w{2})(\w{3})(\w{3})(\w{4})(\w{2})$/, "$1.$2.$3/$4-$5") : cnpj;
}

export function formatarCep(valor: string | null | undefined) {
  if (!valor) return "";
  const cep = valor.replace(/\D/g, "").slice(0, 8);
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}
