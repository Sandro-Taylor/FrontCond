// ---------------------------------------------------------
// WHATSAPP (teste, só ADM do sistema) – tipos e API
// ---------------------------------------------------------

import { chamarApi } from "../../Components/config";

export type EstadoWhatsApp = "CONECTADO" | "CONECTANDO" | "DESCONECTADO" | "SEM_INSTANCIA" | "INDISPONIVEL";

export type StatusWhatsApp = {
  estado: EstadoWhatsApp;
  qrcode: string | null; // imagem (data URL) para ler com o celular
  mensagem: string | null;
};

export type MensagemWhatsApp = {
  id: string;
  recebida: boolean; // true = veio do contato; false = enviada por nós
  texto: string;
  autor_nome: string | null;
  created_at: string;
};

export type ConversaResumo = {
  id: string;
  nome: string | null;
  telefone: string | null;
  contatos: string[]; // pessoas cadastradas com esse telefone ("Nome · Condomínio")
  nao_lidas: number;
  modo: "ROBO" | "ATENDENTE"; // ROBO = atendimento automático; ATENDENTE = uma pessoa está atendendo
  ultima_mensagem: string | null;
  ultima_mensagem_em: string;
};

export type ConversaDetalhe = ConversaResumo & { mensagens: MensagemWhatsApp[] };

export type Novidade = {
  id: string;
  conversa_id: string;
  nome: string | null;
  telefone: string | null;
  contatos: string[];
  texto: string;
  created_at: string;
};

export type Novidades = { agora: string; mensagens: Novidade[] };

export const ROTULOS_ESTADO: Record<EstadoWhatsApp, { rotulo: string; cor: string }> = {
  CONECTADO: { rotulo: "Conectado", cor: "green" },
  CONECTANDO: { rotulo: "Aguardando leitura do QR code", cor: "yellow" },
  DESCONECTADO: { rotulo: "Desconectado", cor: "gray" },
  SEM_INSTANCIA: { rotulo: "Ainda não conectado", cor: "gray" },
  INDISPONIVEL: { rotulo: "Evolution API fora do ar", cor: "red" },
};

// 5511999999999 -> +55 (11) 99999-9999
export function formatarWhats(telefone: string | null | undefined) {
  if (!telefone) return "";
  const n = telefone.replace(/\D/g, "");
  if (n.startsWith("55") && (n.length === 12 || n.length === 13)) {
    const ddd = n.slice(2, 4);
    const numero = n.slice(4);
    return `+55 (${ddd}) ${numero.slice(0, numero.length - 4)}-${numero.slice(-4)}`;
  }
  return `+${n}`;
}

export function nomeContato(contato: { nome: string | null; telefone: string | null }) {
  return contato.nome || formatarWhats(contato.telefone) || "Contato do WhatsApp";
}

export const apiWhatsApp = {
  status: () => chamarApi<StatusWhatsApp>("/whatsapp/status", "GET", "Não foi possível consultar o WhatsApp."),
  conectar: () => chamarApi<StatusWhatsApp>("/whatsapp/conectar", "POST", "Não foi possível conectar o WhatsApp."),
  desconectar: () => chamarApi<StatusWhatsApp>("/whatsapp/desconectar", "POST", "Não foi possível desconectar o WhatsApp."),
  conversas: () => chamarApi<ConversaResumo[]>("/whatsapp/conversas", "GET", "Não foi possível carregar as conversas."),
  ver: (id: string) => chamarApi<ConversaDetalhe>(`/whatsapp/conversas/${id}`, "GET", "Não foi possível abrir a conversa."),
  enviar: (id: string, texto: string) =>
    chamarApi<ConversaDetalhe>(`/whatsapp/conversas/${id}/mensagens`, "POST", "Não foi possível enviar a mensagem.", { texto }),
  assumir: (id: string) => chamarApi<ConversaDetalhe>(`/whatsapp/conversas/${id}/assumir`, "POST", "Não foi possível assumir a conversa."),
  devolver: (id: string) => chamarApi<ConversaDetalhe>(`/whatsapp/conversas/${id}/devolver`, "POST", "Não foi possível devolver ao robô."),
  novidades: (desde: string | null) =>
    chamarApi<Novidades>(`/whatsapp/novidades${desde ? `?desde=${encodeURIComponent(desde)}` : ""}`, "GET", "Não foi possível consultar novas mensagens."),
};
