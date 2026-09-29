// ---------------------------------------------------------
// MODAIS DO PAINEL DE CONDOMÍNIOS (ADM)
// ---------------------------------------------------------
// ModalCondominio: cadastrar / editar (nome, CNPJ, contato)
// ModalSindico:    designar ou trocar o síndico; cria o
//                  login e mostra a senha temporária
// CamposContato:   contato e endereço (também usados pelo
//                  síndico na página inicial)
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Select, SimpleGrid, Spinner, Stack, Text, useToast,
} from "@chakra-ui/react";

import { formatarCep, formatarCnpj, formatarTelefone } from "../../Components/config";
import { SenhaTemporaria } from "../../Components/SenhaTemporaria";
import { CamposPessoa, PESSOA_VAZIA, paraPessoaDados, validarPessoa, type ValoresPessoa } from "../Pessoas/CamposPessoa";
import { ROTULOS_PERFIL, type PerfilPessoa } from "../Pessoas/ConfigPessoas";
import {
  UFS, apiCondominios,
  type Condominio, type CondominioPainel, type ContatoCondominio, type DadosCondominio, type PessoaDoCondominio,
  type SindicoAnterior, type SindicoDesignado,
} from "./ConfigCondominios";

// ================= CONTATO E ENDEREÇO =================

export type ValoresContato = Record<keyof ContatoCondominio, string>;

export const contatoDe = (c: Condominio | null): ValoresContato => ({
  cep: formatarCep(c?.cep), logradouro: c?.logradouro ?? "", numero: c?.numero ?? "", complemento: c?.complemento ?? "",
  bairro: c?.bairro ?? "", cidade: c?.cidade ?? "", uf: c?.uf ?? "", telefone: formatarTelefone(c?.telefone), email: c?.email ?? "",
});

// campos vazios vão como null; o backend limpa máscaras e valida
export function paraEnvio<T extends Record<string, string>>(valores: T): Record<keyof T, string | null> {
  const dados = {} as Record<keyof T, string | null>;
  (Object.keys(valores) as (keyof T)[]).forEach((campo) => { dados[campo] = valores[campo].trim() || null; });
  return dados;
}

export function CamposContato({ valores, aoMudar }: { valores: ValoresContato; aoMudar: (v: ValoresContato) => void }) {
  const campo = (nome: keyof ValoresContato, rotulo: string, props: Record<string, unknown> = {}) => (
    <FormControl>
      <FormLabel fontSize="sm">{rotulo}</FormLabel>
      <Input size="sm" value={valores[nome]} onChange={(e) => aoMudar({ ...valores, [nome]: e.target.value })} {...props} />
    </FormControl>
  );
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {campo("telefone", "Telefone", { placeholder: "(00) 0000-0000" })}
      {campo("email", "E-mail", { type: "email" })}
      {campo("cep", "CEP", { placeholder: "00000-000" })}
      {campo("logradouro", "Endereço (rua, avenida)", { placeholder: "Ex.: Rua das Flores" })}
      {campo("numero", "Número")}
      {campo("complemento", "Complemento")}
      {campo("bairro", "Bairro")}
      {campo("cidade", "Cidade")}
      <FormControl>
        <FormLabel fontSize="sm">UF</FormLabel>
        <Select size="sm" value={valores.uf} onChange={(e) => aoMudar({ ...valores, uf: e.target.value })} placeholder="Selecione">
          {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </Select>
      </FormControl>
    </SimpleGrid>
  );
}

// ================= CADASTRAR / EDITAR =================

export function ModalCondominio({ aberto, aoFechar, condominio, aoSalvo }: {
  aberto: boolean; aoFechar: () => void; condominio: Condominio | null; aoSalvo: (salvo: Condominio, novo: boolean) => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState<ValoresContato>(contatoDe(null));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setNome(condominio?.nome ?? "");
    setCnpj(formatarCnpj(condominio?.cnpj));
    setContato(contatoDe(condominio));
  }, [aberto, condominio]);

  async function salvar() {
    if (nome.trim().length < 3) { toast({ title: "Informe o nome do condomínio (mínimo 3 letras)", status: "warning" }); return; }
    const dados = { ...paraEnvio(contato), nome: nome.trim(), cnpj: cnpj.trim() || null } as DadosCondominio;
    try {
      setSalvando(true);
      const salvo = condominio ? await apiCondominios.editar(condominio.id, dados) : await apiCondominios.criar(dados);
      aoSalvo(salvo, !condominio);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro ao salvar o condomínio", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>
          {condominio ? "Editar condomínio" : "Novo condomínio"}
          {!condominio && <Text fontSize="sm" fontWeight="normal" color="gray.500">Passo 1 de 2 · dados do condomínio. No passo 2 você designa o síndico.</Text>}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} marginBottom={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Nome</FormLabel>
              <Input size="sm" value={nome} onChange={(e) => setNome(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">CNPJ</FormLabel>
              <Input size="sm" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            </FormControl>
          </SimpleGrid>
          <CamposContato valores={contato} aoMudar={setContato} />
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" onClick={salvar} isLoading={salvando}>{condominio ? "Salvar" : "Cadastrar e continuar"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ================= DESIGNAR / TROCAR SÍNDICO =================

type Origem = "NOVA" | "EXISTENTE";

export function ModalSindico({ aberto, aoFechar, item, aoDesignado }: {
  aberto: boolean; aoFechar: () => void; item: CondominioPainel | null; aoDesignado: () => void;
}) {
  const toast = useToast();
  const [origem, setOrigem] = useState<Origem>("NOVA");
  const [valores, setValores] = useState<ValoresPessoa>(PESSOA_VAZIA);
  const [pessoas, setPessoas] = useState<PessoaDoCondominio[] | null>(null);
  const [pessoaId, setPessoaId] = useState("");
  const [email, setEmail] = useState("");
  const [anterior, setAnterior] = useState<SindicoAnterior>("MORADOR");
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<SindicoDesignado | null>(null);

  const temSindico = (item?.sindicos.length ?? 0) > 0;

  useEffect(() => {
    if (!aberto || !item) return;
    setOrigem("NOVA"); setValores(PESSOA_VAZIA); setPessoaId(""); setEmail(""); setAnterior("MORADOR"); setResultado(null); setPessoas(null);
    apiCondominios.pessoasDe(item.condominio.id).then(setPessoas).catch(() => setPessoas([]));
  }, [aberto, item]);

  const escolhida = pessoas?.find((p) => p.id === pessoaId);
  const candidatos = (pessoas ?? []).filter((p) => p.ativo && p.perfil !== "SINDICO");

  async function designar() {
    if (!item) return;
    let dados;
    if (origem === "NOVA") {
      const erro = validarPessoa(valores);
      if (erro) { toast({ title: erro, status: "warning" }); return; }
      if (!valores.email.trim()) { toast({ title: "Informe o e-mail: ele será o login do síndico", status: "warning" }); return; }
      dados = { pessoa_id: null, pessoa: paraPessoaDados(valores), email: null, sindico_anterior: anterior };
    } else {
      if (!escolhida) { toast({ title: "Escolha a pessoa", status: "warning" }); return; }
      if (!escolhida.user_id && !escolhida.email && !email.trim()) { toast({ title: "Informe o e-mail: ele será o login do síndico", status: "warning" }); return; }
      dados = { pessoa_id: escolhida.id, pessoa: null, email: email.trim() || null, sindico_anterior: anterior };
    }
    try {
      setSalvando(true);
      setResultado(await apiCondominios.designarSindico(item.condominio.id, dados));
      aoDesignado();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Erro ao designar o síndico", status: "error" });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal isOpen={aberto} onClose={aoFechar} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="2xl">
        <ModalHeader>
          {resultado ? "Síndico designado" : temSindico ? "Trocar síndico" : "Designar síndico"}
          <Text fontSize="sm" fontWeight="normal" color="gray.500">{item?.condominio.nome}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {resultado ? (
            <Stack spacing={3}>
              <Text fontSize="sm"><b>{resultado.nome}</b> agora é o síndico deste condomínio.</Text>
              <SenhaTemporaria email={resultado.email} senha={resultado.senha_temporaria} />
            </Stack>
          ) : (
            <Stack spacing={4}>
              {temSindico && (
                <Box bg="gray.50" borderRadius="lg" padding={3} fontSize="sm">
                  Síndico atual: <b>{item?.sindicos.map((s) => s.nome).join(", ")}</b>
                </Box>
              )}

              <RadioGroup value={origem} onChange={(v) => setOrigem(v as Origem)}>
                <Stack direction={{ base: "column", md: "row" }} spacing={5}>
                  <Radio value="NOVA">Cadastrar pessoa nova</Radio>
                  <Radio value="EXISTENTE" isDisabled={candidatos.length === 0}>Escolher pessoa já cadastrada</Radio>
                </Stack>
              </RadioGroup>

              {origem === "NOVA" ? (
                <>
                  <CamposPessoa valores={valores} aoMudar={setValores} tamanho="sm" />
                  <Text fontSize="xs" color="gray.500">O e-mail é obrigatório: ele será o login do síndico.</Text>
                </>
              ) : pessoas === null ? (
                <Flex justify="center"><Spinner size="sm" /></Flex>
              ) : (
                <>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Pessoa</FormLabel>
                    <Select size="sm" value={pessoaId} placeholder="Selecione" onChange={(e) => setPessoaId(e.target.value)}>
                      {candidatos.map((p) => <option key={p.id} value={p.id}>{p.nome} · {ROTULOS_PERFIL[p.perfil as PerfilPessoa] ?? p.perfil}</option>)}
                    </Select>
                  </FormControl>
                  {escolhida && !escolhida.user_id && (
                    <FormControl isRequired={!escolhida.email}>
                      <FormLabel fontSize="sm">E-mail (login)</FormLabel>
                      <Input size="sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={escolhida.email ?? "nome@exemplo.com"} />
                      <FormHelperText fontSize="xs">{escolhida.email ? "Em branco: usa o e-mail do cadastro." : "Esta pessoa não tem e-mail cadastrado."}</FormHelperText>
                    </FormControl>
                  )}
                  {escolhida?.user_id && <Text fontSize="xs" color="gray.500">Esta pessoa já tem login; ela entra com a senha que já usa.</Text>}
                </>
              )}

              {temSindico && (
                <FormControl>
                  <FormLabel fontSize="sm">O síndico atual passa a ser</FormLabel>
                  <Select size="sm" value={anterior} onChange={(e) => setAnterior(e.target.value as SindicoAnterior)}>
                    <option value="MORADOR">Morador</option>
                    <option value="CONSELHEIRO">Conselheiro</option>
                    <option value="MANTER">Continua síndico (dois síndicos)</option>
                  </Select>
                </FormControl>
              )}
            </Stack>
          )}
        </ModalBody>
        <ModalFooter gap={3}>
          {resultado ? (
            <Button colorScheme="blue" onClick={aoFechar}>Concluir</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={aoFechar}>{temSindico ? "Cancelar" : "Fazer depois"}</Button>
              <Button colorScheme="blue" onClick={designar} isLoading={salvando}>Designar síndico</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
