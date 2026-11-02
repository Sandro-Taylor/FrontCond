// ---------------------------------------------------------
// ARQUIVOS (GOOGLE DRIVE) – tipos e API (só ADM do sistema)
// ---------------------------------------------------------

import { chamarApi } from "../../Components/config";

export type StatusDrive = {
  configurado: boolean;
  conectado: boolean;
  email: string | null;
  usado: number | null;
  limite: number | null;
  erro: string | null;
};

export type ItemDrive = {
  id: string;
  nome: string;
  mime: string;
  pasta: boolean;
  tamanho: number | null;
  modificado_em: string | null;
  uso_no_sistema: string | null;
  link_web: string | null;
};

// arquivos que o Google edita no navegador (salvando no próprio arquivo do Drive)
const EDITORES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheets", // .xlsx
  "application/vnd.ms-excel": "spreadsheets",                                          // .xls
  "text/csv": "spreadsheets",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document", // .docx
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "presentation", // .pptx
};

export function linkEdicao(item: ItemDrive): string | null {
  if (item.pasta) return null;
  if (EDITORES[item.mime]) return `https://docs.google.com/${EDITORES[item.mime]}/d/${item.id}/edit`;
  if (item.mime.startsWith("application/vnd.google-apps.")) return item.link_web; // Planilhas/Documentos do Google
  return null;
}

export type Navegacao = {
  pasta: { id: string; nome: string };
  caminho: { id: string; nome: string }[];
  itens: ItemDrive[];
};

export function formatarTamanho(bytes: number | null | undefined) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export const apiDrive = {
  status: () => chamarApi<StatusDrive>("/drive/status", "GET", "Não foi possível consultar o Drive."),
  conectar: () => chamarApi<{ url: string }>("/drive/conectar", "POST", "Não foi possível iniciar a conexão."),
  desconectar: () => chamarApi<void>("/drive/desconectar", "POST", "Não foi possível desconectar."),
  navegar: (pasta: string | null) => chamarApi<Navegacao>(`/drive/navegar${pasta ? `?pasta=${encodeURIComponent(pasta)}` : ""}`, "GET", "Não foi possível abrir a pasta."),
  criarPasta: (pai: string, nome: string) => chamarApi<{ id: string; nome: string }>("/drive/pastas", "POST", "Não foi possível criar a pasta.", { pai, nome }),
  renomear: (id: string, nome: string) => chamarApi<void>(`/drive/itens/${encodeURIComponent(id)}`, "PATCH", "Não foi possível renomear.", { nome }),
  excluir: (id: string) => chamarApi<void>(`/drive/itens/${encodeURIComponent(id)}`, "DELETE", "Não foi possível excluir."),
};
