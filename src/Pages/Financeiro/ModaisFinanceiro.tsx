// ---------------------------------------------------------
// MODAIS DO FINANCEIRO (síndico/ADM)
// ---------------------------------------------------------
// Configurar padrões, gerar cotas do mês, lançar/editar uma
// cota e dar baixa (registrar pagamento).
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Button, FormControl, FormHelperText, FormLabel, Input, InputGroup, InputLeftAddon, InputRightAddon, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Text, Textarea, useToast,
} from "@chakra-ui/react";

import { rotuloApartamento } from "../Pessoas/ConfigPessoas";
import type { ApartamentoResumo } from "../Apartamentos/ConfigApartamentos";
import {
  ROTULOS_FORMA_PAGAMENTO, formatarCompetencia, formatarMoeda, hojeIso, lerValor, mesAtual, valorParaTexto,
  type Configuracao, type Cota, type CotaCriar, type CotaEditar, type FormaPagamento, type Pagamento, type TipoCota,
} from "./ConfigFinanceiro";

// estrutura comum dos modais
const Janela = ({ aberto, aoFechar, titulo, salvando, aoSalvar, textoBotao = "Salvar", children }: {
  aberto: boolean; aoFechar: () => void; titulo: string; salvando: boolean; aoSalvar: () => void; textoBotao?: string; children: ReactNode;
}) => (
  <Modal isOpen={aberto} onClose={aoFechar} size="lg" isCentered>
    <ModalOverlay />
    <ModalContent borderRadius="2xl">
      <ModalHeader>{titulo}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>{children}</ModalBody>
      <ModalFooter gap={3}>
        <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
        <Button colorScheme="blue" onClick={aoSalvar} isLoading={salvando}>{textoBotao}</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

const CampoValor = ({ valor, aoMudar, placeholder }: { valor: string; aoMudar: (texto: string) => void; placeholder?: string }) => (
  <InputGroup>
    <InputLeftAddon>R$</InputLeftAddon>
    <Input value={valor} onChange={(e) => aoMudar(e.target.value.replace(/[^\d.,]/g, ""))} placeholder={placeholder ?? "0,00"} inputMode="decimal" />
  </InputGroup>
);

// "2026-10" + dia 10 -> "2026-10-10" (respeita o último dia do mês)
function vencimentoPadrao(competencia: string, dia: number) {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimo = new Date(ano, mes, 0).getDate();
  return `${competencia}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`;
}

type Salvar<T> = (dados: T) => Promise<void>;


// =========================================================
// CONFIGURAÇÃO
// =========================================================

export const ModalConfiguracao = ({ aberto, aoFechar, configuracao, aoSalvar }: {
  aberto: boolean; aoFechar: () => void; configuracao: Configuracao | null; aoSalvar: Salvar<Configuracao>;
}) => {
  const toast = useToast();
  const [form, setForm] = useState({ valor: "", dia: "10", multa: "2", juros: "1" });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto || !configuracao) return;
    setForm({
      valor: valorParaTexto(configuracao.valor_cota),
      dia: String(configuracao.dia_vencimento),
      multa: valorParaTexto(configuracao.multa_percentual),
      juros: valorParaTexto(configuracao.juros_mensal),
    });
  }, [aberto, configuracao]);

  async function salvar() {
    const valor = form.valor.trim() ? lerValor(form.valor) : null;
    const dia = Number(form.dia);
    const multa = lerValor(form.multa || "0");
    const juros = lerValor(form.juros || "0");
    if ((valor !== null && !(valor > 0)) || !(dia >= 1 && dia <= 31) || Number.isNaN(multa) || Number.isNaN(juros)) {
      toast({ title: "Confira os valores informados", status: "warning" });
      return;
    }
    setSalvando(true);
    try { await aoSalvar({ valor_cota: valor, dia_vencimento: dia, multa_percentual: multa, juros_mensal: juros }); }
    finally { setSalvando(false); }
  }

  return (
    <Janela aberto={aberto} aoFechar={aoFechar} titulo="Configuração do financeiro" salvando={salvando} aoSalvar={salvar}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <FormControl>
          <FormLabel fontSize="sm">Valor padrão da cota</FormLabel>
          <CampoValor valor={form.valor} aoMudar={(valor) => setForm({ ...form, valor })} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Dia do vencimento</FormLabel>
          <Input type="number" min={1} max={31} value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Multa por atraso</FormLabel>
          <InputGroup>
            <Input value={form.multa} onChange={(e) => setForm({ ...form, multa: e.target.value.replace(/[^\d.,]/g, "") })} inputMode="decimal" />
            <InputRightAddon>%</InputRightAddon>
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Juros ao mês</FormLabel>
          <InputGroup>
            <Input value={form.juros} onChange={(e) => setForm({ ...form, juros: e.target.value.replace(/[^\d.,]/g, "") })} inputMode="decimal" />
            <InputRightAddon>%</InputRightAddon>
          </InputGroup>
          <FormHelperText fontSize="xs">Proporcional aos dias de atraso.</FormHelperText>
        </FormControl>
      </SimpleGrid>
    </Janela>
  );
};


// =========================================================
// GERAR COTAS DO MÊS
// =========================================================

export const ModalGerarCotas = ({ aberto, aoFechar, configuracao, competenciaInicial, aoGerar }: {
  aberto: boolean; aoFechar: () => void; configuracao: Configuracao | null; competenciaInicial: string;
  aoGerar: Salvar<{ competencia: string; valor: number | null; dia_vencimento: number | null }>;
}) => {
  const toast = useToast();
  const [form, setForm] = useState({ competencia: mesAtual(), valor: "", dia: "" });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) setForm({ competencia: competenciaInicial || mesAtual(), valor: "", dia: "" });
  }, [aberto, competenciaInicial]);

  async function gerar() {
    const valor = form.valor.trim() ? lerValor(form.valor) : null;
    const dia = form.dia.trim() ? Number(form.dia) : null;
    if (!form.competencia) { toast({ title: "Escolha o mês", status: "warning" }); return; }
    if (valor === null && !configuracao?.valor_cota) { toast({ title: "Informe o valor ou defina o valor padrão na configuração", status: "warning" }); return; }
    if ((valor !== null && !(valor > 0)) || (dia !== null && !(dia >= 1 && dia <= 31))) { toast({ title: "Confira os valores informados", status: "warning" }); return; }
    setSalvando(true);
    try { await aoGerar({ competencia: form.competencia, valor, dia_vencimento: dia }); }
    finally { setSalvando(false); }
  }

  return (
    <Janela aberto={aberto} aoFechar={aoFechar} titulo="Gerar cotas do mês" salvando={salvando} aoSalvar={gerar} textoBotao="Gerar cotas">
      <FormControl isRequired>
        <FormLabel fontSize="sm">Mês (competência)</FormLabel>
        <Input type="month" value={form.competencia} onChange={(e) => setForm({ ...form, competencia: e.target.value })} />
      </FormControl>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3}>
        <FormControl>
          <FormLabel fontSize="sm">Valor</FormLabel>
          <CampoValor valor={form.valor} aoMudar={(valor) => setForm({ ...form, valor })} placeholder={configuracao?.valor_cota ? valorParaTexto(configuracao.valor_cota) : "0,00"} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Dia do vencimento</FormLabel>
          <Input type="number" min={1} max={31} value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} placeholder={String(configuracao?.dia_vencimento ?? 10)} />
        </FormControl>
      </SimpleGrid>
      <Text fontSize="xs" color="gray.500" marginTop={3}>
        Cria a cota ordinária de {form.competencia ? formatarCompetencia(form.competencia) : "..."} para cada apartamento ativo.
        Apartamentos que já têm a cota do mês não são alterados. Em branco, usa o valor e o dia padrão.
      </Text>
    </Janela>
  );
};


// =========================================================
// LANÇAR / EDITAR COTA
// =========================================================

export const ModalCota = ({ aberto, aoFechar, cota, apartamentos, configuracao, competenciaInicial, aoCriar, aoEditar }: {
  aberto: boolean; aoFechar: () => void; cota: Cota | null; apartamentos: ApartamentoResumo[]; configuracao: Configuracao | null;
  competenciaInicial: string; aoCriar: Salvar<CotaCriar>; aoEditar: (id: string, dados: CotaEditar) => Promise<void>;
}) => {
  const toast = useToast();
  const vazio = { apartamento_id: "", competencia: mesAtual(), tipo: "EXTRA" as TipoCota, descricao: "", valor: "", vencimento: "", observacao: "" };
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    if (cota) {
      setForm({
        apartamento_id: cota.apartamento_id, competencia: cota.competencia.slice(0, 7), tipo: cota.tipo, descricao: cota.descricao ?? "",
        valor: valorParaTexto(cota.valor), vencimento: cota.vencimento, observacao: cota.observacao ?? "",
      });
    } else {
      const competencia = competenciaInicial || mesAtual();
      setForm({ ...vazio, competencia, vencimento: vencimentoPadrao(competencia, configuracao?.dia_vencimento ?? 10) });
    }
  }, [aberto, cota]);

  async function salvar() {
    const valor = lerValor(form.valor);
    if (!cota && !form.apartamento_id) { toast({ title: "Escolha a unidade", status: "warning" }); return; }
    if (!(valor > 0)) { toast({ title: "Informe o valor", status: "warning" }); return; }
    if (!form.vencimento) { toast({ title: "Informe o vencimento", status: "warning" }); return; }
    const comum = { descricao: form.descricao.trim() || null, valor, vencimento: form.vencimento, observacao: form.observacao.trim() || null };
    setSalvando(true);
    try {
      if (cota) await aoEditar(cota.id, comum);
      else await aoCriar({ ...comum, apartamento_id: form.apartamento_id, competencia: form.competencia, tipo: form.tipo });
    } finally { setSalvando(false); }
  }

  return (
    <Janela aberto={aberto} aoFechar={aoFechar} titulo={cota ? `Editar cota · ${cota.apartamento_rotulo}` : "Lançar cota"} salvando={salvando} aoSalvar={salvar}>
      {!cota && (
        <>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Unidade</FormLabel>
            <Select value={form.apartamento_id} placeholder="Selecione a unidade" onChange={(e) => setForm({ ...form, apartamento_id: e.target.value })}>
              {apartamentos.filter((a) => a.ativo).map((a) => <option key={a.id} value={a.id}>{rotuloApartamento(a)}</option>)}
            </Select>
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Tipo</FormLabel>
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCota })}>
                <option value="EXTRA">Extra</option>
                <option value="ORDINARIA">Ordinária</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Mês (competência)</FormLabel>
              <Input type="month" value={form.competencia} onChange={(e) => setForm({ ...form, competencia: e.target.value })} />
            </FormControl>
          </SimpleGrid>
        </>
      )}

      <FormControl marginTop={cota ? 0 : 3}>
        <FormLabel fontSize="sm">Descrição</FormLabel>
        <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: fundo de reserva, obra da fachada..." maxLength={150} />
      </FormControl>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} marginTop={3}>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Valor</FormLabel>
          <CampoValor valor={form.valor} aoMudar={(valor) => setForm({ ...form, valor })} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Vencimento</FormLabel>
          <Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
        </FormControl>
      </SimpleGrid>
      <FormControl marginTop={3}>
        <FormLabel fontSize="sm">Observação</FormLabel>
        <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />
      </FormControl>
    </Janela>
  );
};


// =========================================================
// DAR BAIXA (PAGAMENTO)
// =========================================================

export const ModalPagamento = ({ aberto, aoFechar, cota, aoPagar }: {
  aberto: boolean; aoFechar: () => void; cota: Cota | null; aoPagar: (id: string, dados: Pagamento) => Promise<void>;
}) => {
  const toast = useToast();
  const [form, setForm] = useState({ data: hojeIso(), valor: "", forma: "PIX" as FormaPagamento, observacao: "" });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto && cota) setForm({ data: hojeIso(), valor: valorParaTexto(cota.valor_atualizado), forma: "PIX", observacao: "" });
  }, [aberto, cota]);

  if (!cota) return null;

  async function pagar() {
    if (!cota) return;
    const valor = lerValor(form.valor);
    if (!(valor > 0)) { toast({ title: "Informe o valor pago", status: "warning" }); return; }
    if (!form.data || form.data > hojeIso()) { toast({ title: "Informe uma data de pagamento válida", status: "warning" }); return; }
    setSalvando(true);
    try { await aoPagar(cota.id, { data_pagamento: form.data, valor_pago: valor, forma_pagamento: form.forma, observacao: form.observacao.trim() || null }); }
    finally { setSalvando(false); }
  }

  return (
    <Janela aberto={aberto} aoFechar={aoFechar} titulo={`Dar baixa · ${cota.apartamento_rotulo}`} salvando={salvando} aoSalvar={pagar} textoBotao="Registrar pagamento">
      <Text fontSize="sm" color="gray.600" marginBottom={3}>
        Cota {formatarCompetencia(cota.competencia)} · valor {formatarMoeda(cota.valor)}
        {cota.situacao === "ATRASADA" && ` + multa ${formatarMoeda(cota.multa)} + juros ${formatarMoeda(cota.juros)} (${cota.dias_atraso} dia(s) de atraso)`}
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Data do pagamento</FormLabel>
          <Input type="date" value={form.data} max={hojeIso()} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm">Valor pago</FormLabel>
          <CampoValor valor={form.valor} aoMudar={(valor) => setForm({ ...form, valor })} />
        </FormControl>
      </SimpleGrid>
      <FormControl isRequired marginTop={3}>
        <FormLabel fontSize="sm">Forma de pagamento</FormLabel>
        <Select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value as FormaPagamento })}>
          {(Object.keys(ROTULOS_FORMA_PAGAMENTO) as FormaPagamento[]).map((forma) => <option key={forma} value={forma}>{ROTULOS_FORMA_PAGAMENTO[forma]}</option>)}
        </Select>
      </FormControl>
      <FormControl marginTop={3}>
        <FormLabel fontSize="sm">Observação</FormLabel>
        <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />
      </FormControl>
    </Janela>
  );
};
