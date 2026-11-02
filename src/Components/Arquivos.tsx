// ---------------------------------------------------------
// ARQUIVOS DO SISTEMA (Google Drive pelo backend)
// ---------------------------------------------------------
// As imagens não têm link público: o front busca o arquivo na
// API com o token e mostra por um endereço local (blob).
//   useUrlArquivo("/arquivos/<id>") -> url para <img>/<Avatar>
//   enviarArquivo(caminho, arquivo) -> envia o corpo bruto
//   FotoPessoa: avatar com a foto (e botões para trocar/remover)
// ---------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, Flex, Spinner, useToast, type AvatarProps } from "@chakra-ui/react";
import { API_BASE_URL_USERS } from "../config";
import { cabecalhos, mensagemErro } from "./config";

const cache = new Map<string, Promise<string>>(); // caminho -> url local

function autorizacao(): Record<string, string> {
  const { Authorization, ...resto } = cabecalhos();
  const saida: Record<string, string> = { Authorization };
  if (resto["X-Condominio-Id"]) saida["X-Condominio-Id"] = resto["X-Condominio-Id"];
  return saida;
}

export async function baixarArquivo(caminho: string): Promise<Blob> {
  const resposta = await fetch(`${API_BASE_URL_USERS}${caminho}`, { headers: autorizacao() });
  if (!resposta.ok) throw new Error(await mensagemErro(resposta, "Não foi possível abrir o arquivo."));
  return resposta.blob();
}

export function useUrlArquivo(caminho: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!caminho) { setUrl(null); return; }
    let ativo = true;
    if (!cache.has(caminho)) {
      const promessa = baixarArquivo(caminho).then((blob) => URL.createObjectURL(blob));
      promessa.catch(() => cache.delete(caminho));
      cache.set(caminho, promessa);
    }
    cache.get(caminho)!.then((u) => { if (ativo) setUrl(u); }).catch(() => { if (ativo) setUrl(null); });
    return () => { ativo = false; };
  }, [caminho]);
  return url;
}

export async function enviarArquivo<T>(caminho: string, arquivo: File, padrao: string): Promise<T> {
  const resposta = await fetch(`${API_BASE_URL_USERS}${caminho}`, {
    method: "POST",
    headers: { ...autorizacao(), "Content-Type": arquivo.type || "application/octet-stream", "X-Nome-Arquivo": encodeURIComponent(arquivo.name) },
    body: arquivo,
  });
  if (!resposta.ok) throw new Error(await mensagemErro(resposta, padrao));
  return resposta.json();
}

// ---------------------------------------------------------
// FOTO DA PESSOA
// ---------------------------------------------------------

type FotoPessoaProps = {
  nome: string;
  fotoId: string | null;
  tamanho?: AvatarProps["size"];
  pessoaId?: string;                          // informe para permitir trocar/remover
  editavel?: boolean;
  aoMudar?: (novoFotoId: string | null) => void;
};

export function FotoPessoa({ nome, fotoId, tamanho = "md", pessoaId, editavel = false, aoMudar }: FotoPessoaProps) {
  const toast = useToast();
  const url = useUrlArquivo(fotoId ? `/arquivos/${fotoId}` : null);
  const entrada = useRef<HTMLInputElement>(null);
  const [salvando, setSalvando] = useState(false);

  async function trocar(arquivo: File | undefined) {
    if (!arquivo || !pessoaId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) { toast({ title: "Escolha uma imagem JPG, PNG ou WEBP", status: "warning" }); return; }
    if (arquivo.size > 5 * 1024 * 1024) { toast({ title: "A foto deve ter até 5 MB", status: "warning" }); return; }
    setSalvando(true);
    try {
      const { foto_arquivo_id } = await enviarArquivo<{ foto_arquivo_id: string }>(`/pessoas/${pessoaId}/foto`, arquivo, "Não foi possível enviar a foto.");
      toast({ title: "Foto atualizada", status: "success", duration: 1500 });
      aoMudar?.(foto_arquivo_id);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao enviar a foto", status: "error" }); }
    finally { setSalvando(false); if (entrada.current) entrada.current.value = ""; }
  }

  async function remover() {
    if (!pessoaId || !window.confirm("Remover a foto?")) return;
    setSalvando(true);
    try {
      const resposta = await fetch(`${API_BASE_URL_USERS}/pessoas/${pessoaId}/foto`, { method: "DELETE", headers: autorizacao() });
      if (!resposta.ok) throw new Error(await mensagemErro(resposta, "Não foi possível remover a foto."));
      aoMudar?.(null);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao remover a foto", status: "error" }); }
    finally { setSalvando(false); }
  }

  const avatar = <Avatar name={nome} src={url ?? undefined} size={tamanho} bg="blue.500" color="white" />;
  if (!editavel || !pessoaId) return avatar;

  return (
    <Flex direction="column" align="center" gap={1}>
      <Box position="relative">
        {avatar}
        {salvando && <Flex position="absolute" inset={0} align="center" justify="center" bg="whiteAlpha.700" borderRadius="full"><Spinner size="sm" /></Flex>}
      </Box>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => trocar(e.target.files?.[0])} />
      <Flex gap={1}>
        <Button size="xs" variant="link" colorScheme="blue" onClick={() => entrada.current?.click()} isDisabled={salvando}>{fotoId ? "Trocar foto" : "Enviar foto"}</Button>
        {fotoId && <Button size="xs" variant="link" colorScheme="red" onClick={remover} isDisabled={salvando}>Remover</Button>}
      </Flex>
    </Flex>
  );
}
