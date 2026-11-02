// ---------------------------------------------------------
// CAMPO "RESPONSÁVEL (WHATSAPP)" DO CADASTRO DE PESSOA
// ---------------------------------------------------------
// Quem recebe e responde as mensagens de WhatsApp da pessoa.
//   vazio ... síndico do prédio (padrão; acompanha a troca de síndico)
//   id ...... usuário marcado como RESPONSÁVEL (em Usuários)
// Só o ADM do sistema escolhe; os demais só veem.
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import { FormControl, FormHelperText, FormLabel, Select } from "@chakra-ui/react";
import { chamarApi } from "../../Components/config";

export type OpcoesResponsavel = {
  sindicos: { id: string; nome: string; tem_login: boolean }[];
  responsaveis: { id: string; nome: string }[];
};

export function useOpcoesResponsavel(ativo = true) {
  const [opcoes, setOpcoes] = useState<OpcoesResponsavel | null>(null);
  useEffect(() => {
    if (!ativo) return;
    chamarApi<OpcoesResponsavel>("/pessoas/opcoes-responsavel", "GET", "Não foi possível carregar os responsáveis.")
      .then(setOpcoes)
      .catch(() => setOpcoes({ sindicos: [], responsaveis: [] }));
  }, [ativo]);
  return opcoes;
}

export function rotuloSindicoPadrao(sindicos: { nome: string }[] | undefined) {
  if (!sindicos || sindicos.length === 0) return "Síndico do prédio (padrão) · nenhum síndico designado";
  return `Síndico do prédio: ${sindicos.map((s) => s.nome).join(", ")} (padrão)`;
}

type SeletorProps = {
  valor: string | null;
  aoMudar: (valor: string | null) => void;
  opcoes: OpcoesResponsavel | null;
  tamanho?: "sm" | "md";
  desabilitado?: boolean;
  nomeAtual?: string | null; // responsável salvo que não está mais na lista
};

export function SeletorResponsavel({ valor, aoMudar, opcoes, tamanho = "md", desabilitado, nomeAtual }: SeletorProps) {
  const naLista = !valor || opcoes?.responsaveis.some((r) => r.id === valor);
  return (
    <Select size={tamanho} value={valor ?? ""} isDisabled={desabilitado} onChange={(e) => aoMudar(e.target.value || null)}>
      <option value="">{rotuloSindicoPadrao(opcoes?.sindicos)}</option>
      {opcoes?.responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
      {!naLista && valor && <option value={valor}>{nomeAtual ?? "Responsável anterior"} (não é mais responsável)</option>}
    </Select>
  );
}

export function CampoResponsavel({ valor, aoMudar, opcoes, tamanho = "md" }: Omit<SeletorProps, "desabilitado" | "nomeAtual">) {
  const semSindico = opcoes && !opcoes.sindicos.some((s) => s.tem_login);
  return (
    <FormControl>
      <FormLabel fontSize="sm">Responsável (WhatsApp)</FormLabel>
      <SeletorResponsavel valor={valor} aoMudar={aoMudar} opcoes={opcoes} tamanho={tamanho} />
      <FormHelperText fontSize="xs">
        {semSindico && !valor
          ? (opcoes?.sindicos.length
            ? "O síndico ainda não tem acesso ao sistema: enquanto isso, as mensagens vão para os responsáveis cadastrados."
            : "Este condomínio ainda não tem síndico: as mensagens vão para os responsáveis cadastrados.")
          : "Quem recebe e responde as mensagens de WhatsApp desta pessoa."}
      </FormHelperText>
    </FormControl>
  );
}
