// ---------------------------------------------------------
// PLANO DE CONTAS
// ---------------------------------------------------------
// Grupos e categorias de receitas e despesas do condomínio.
// Os lançamentos do extrato são classificados nessas categorias
// (aba Movimentações da Conta bancária) e o sistema aprende pelo
// favorecido. Ver: ADM, síndico e conselheiro. Alterar: ADM e síndico.
// Categoria em uso não é excluída: é desativada.
// RATEIO: despesas marcadas entram no rateio da cota ordinária
// (forma "despesas do mês anterior"); desmarque, por ex., obras
// pagas com taxa extra.
// ---------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Icon, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, Select, Spinner, Stack, Switch, Text, Tooltip, useToast,
} from "@chakra-ui/react";
import { Eye, EyeOff, ListTree, Pencil, Plus, Trash2 } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import {
  apiPlano, CORES_TIPO_CONTA, ROTULOS_TIPO_CONTA, type CategoriaPlano, type GrupoPlano, type TipoConta,
} from "../Movimentacoes/ConfigMovimentacoes";

// janela de criar/renomear: grupo (com tipo) ou categoria (dentro de um grupo)
type Edicao = { modo: "novo-grupo" } | { modo: "nova-categoria"; grupo: GrupoPlano } | { modo: "renomear"; conta: CategoriaPlano };

const ModalConta = ({ edicao, aoFechar, aoSalvo }: { edicao: Edicao | null; aoFechar: () => void; aoSalvo: () => void }) => {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("DESPESA");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!edicao) return;
    setNome(edicao.modo === "renomear" ? edicao.conta.nome : "");
    setTipo("DESPESA");
  }, [edicao]);

  if (!edicao) return null;
  const titulo = edicao.modo === "novo-grupo" ? "Novo grupo" : edicao.modo === "nova-categoria" ? `Nova categoria em ${edicao.grupo.nome}` : "Renomear";

  async function salvar() {
    if (!edicao) return;
    if (nome.trim().length < 2) { toast({ title: "Informe o nome", status: "warning" }); return; }
    setSalvando(true);
    try {
      if (edicao.modo === "novo-grupo") await apiPlano.criar({ nome: nome.trim(), tipo });
      else if (edicao.modo === "nova-categoria") await apiPlano.criar({ nome: nome.trim(), grupo_id: edicao.grupo.id });
      else await apiPlano.alterar(edicao.conta.id, { nome: nome.trim() });
      toast({ title: "Salvo", status: "success", duration: 2000 });
      aoSalvo();
      aoFechar();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Erro ao salvar", status: "error" }); }
    finally { setSalvando(false); }
  }

  return (
    <Modal isOpen onClose={aoFechar} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="2xl" marginX={4}>
        <ModalHeader>{titulo}</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap={4}>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Nome</FormLabel>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") salvar(); }} />
          </FormControl>
          {edicao.modo === "novo-grupo" && (
            <FormControl>
              <FormLabel fontSize="sm">Tipo</FormLabel>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoConta)}>
                <option value="DESPESA">Despesa</option>
                <option value="RECEITA">Receita</option>
                <option value="TRANSFERENCIA">Movimentação interna (não é receita nem despesa)</option>
              </Select>
            </FormControl>
          )}
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={aoFechar}>Cancelar</Button>
          <Button colorScheme="blue" isLoading={salvando} onClick={salvar}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const PlanoContas = () => {
  const toast = useToast();
  const { editaTudo, veFinanceiroTudo } = usePermissoes();
  const [grupos, setGrupos] = useState<GrupoPlano[] | null>(null);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [criando, setCriando] = useState(false);
  const [mostrarInativas, setMostrarInativas] = useState(false);

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error", duration: 6000 }), [toast]);

  const carregar = useCallback(async () => {
    try { setGrupos(await apiPlano.listar()); }
    catch (e) { erro(e, "Erro ao carregar o plano de contas"); setGrupos([]); }
  }, [erro]);

  useEffect(() => { if (veFinanceiroTudo) carregar(); }, [carregar, veFinanceiroTudo]);

  async function criarPadrao() {
    setCriando(true);
    try {
      const r = await apiPlano.criarPadrao();
      toast({ title: `Plano criado com ${r.categorias} categorias${r.classificadas ? ` · ${r.classificadas} lançamentos já classificados` : ""}`, status: "success" });
      await carregar();
    } catch (e) { erro(e, "Erro ao criar o plano"); }
    finally { setCriando(false); }
  }

  async function alternarAtivo(c: CategoriaPlano, grupo: boolean) {
    if (c.ativo && !window.confirm(`Desativar "${c.nome}"${grupo ? " e as categorias dele" : ""}? Some da lista de escolha, mas os lançamentos já classificados continuam.`)) return;
    try { await apiPlano.alterar(c.id, { ativo: !c.ativo }); await carregar(); }
    catch (e) { erro(e, "Erro ao salvar"); }
  }

  async function alternarRateio(c: CategoriaPlano, grupo: boolean) {
    try { await apiPlano.alterar(c.id, { rateio: !c.rateio }); await carregar(); }
    catch (e) { erro(e, `Erro ao salvar${grupo ? " o grupo" : ""}`); }
  }

  const chaveRateio = (c: CategoriaPlano, grupo: boolean) => c.tipo === "DESPESA" && (
    <Tooltip label={c.rateio ? "Entra no rateio da cota ordinária" : "Fora do rateio (ex.: obras pagas com taxa extra)"}>
      <Flex align="center" gap={1.5} minWidth="78px">
        <Switch size="sm" isChecked={c.rateio} isDisabled={!editaTudo} onChange={() => alternarRateio(c, grupo)} />
        <Text fontSize="2xs" color={c.rateio ? "gray.600" : "gray.400"}>Rateio</Text>
      </Flex>
    </Tooltip>
  );

  async function excluir(c: CategoriaPlano, grupo: boolean) {
    if (!window.confirm(`Excluir "${c.nome}"${grupo ? " e todas as categorias dele" : ""}?`)) return;
    try { await apiPlano.excluir(c.id); toast({ title: "Excluído", status: "success", duration: 2000 }); await carregar(); }
    catch (e) { erro(e, "Erro ao excluir"); }
  }

  if (!veFinanceiroTudo) {
    return (
      <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Seu perfil não tem acesso ao plano de contas.</Text>
      </Flex>
    );
  }

  const acoes = (c: CategoriaPlano, grupo: boolean) => editaTudo && (
    <Flex gap={0} flexShrink={0}>
      {grupo && c.ativo && <Tooltip label="Nova categoria"><IconButton aria-label="Nova categoria" size="xs" variant="ghost" colorScheme="blue" icon={<Icon as={Plus} boxSize={4} />} onClick={() => setEdicao({ modo: "nova-categoria", grupo: c as GrupoPlano })} /></Tooltip>}
      <Tooltip label="Renomear"><IconButton aria-label="Renomear" size="xs" variant="ghost" colorScheme="blue" icon={<Icon as={Pencil} boxSize={4} />} onClick={() => setEdicao({ modo: "renomear", conta: c })} /></Tooltip>
      <Tooltip label={c.ativo ? "Desativar" : "Reativar"}><IconButton aria-label={c.ativo ? "Desativar" : "Reativar"} size="xs" variant="ghost" icon={<Icon as={c.ativo ? EyeOff : Eye} boxSize={4} />} onClick={() => alternarAtivo(c, grupo)} /></Tooltip>
      {!c.codigo && c.lancamentos === 0 && <Tooltip label="Excluir"><IconButton aria-label="Excluir" size="xs" variant="ghost" colorScheme="red" icon={<Icon as={Trash2} boxSize={4} />} onClick={() => excluir(c, grupo)} /></Tooltip>}
    </Flex>
  );

  const visiveis = (grupos ?? []).filter((g) => mostrarInativas || g.ativo);

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={5}>
          <Box>
            <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Plano de contas</Text>
            <Text fontSize="sm" color="gray.500" marginTop={1}>Categorias usadas para classificar o extrato e montar a prestação de contas.</Text>
          </Box>
          {editaTudo && grupos && grupos.length > 0 && (
            <Flex gap={2} wrap="wrap">
              <Button size="sm" variant="ghost" onClick={() => setMostrarInativas((v) => !v)}>{mostrarInativas ? "Esconder inativas" : "Mostrar inativas"}</Button>
              <Button size="sm" colorScheme="blue" borderRadius="lg" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={() => setEdicao({ modo: "novo-grupo" })}>Novo grupo</Button>
            </Flex>
          )}
        </Flex>

        {!grupos ? (
          <Flex justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
        ) : grupos.length === 0 ? (
          <Flex direction="column" align="center" padding={16} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" textAlign="center">
            <Icon as={ListTree} boxSize={7} color="gray.400" />
            <Text marginTop={3} color="gray.700" fontWeight="medium">Este condomínio ainda não tem plano de contas</Text>
            <Text fontSize="sm" color="gray.500" maxWidth="440px">O plano padrão já vem com os grupos usados pelas administradoras (salários, encargos, concessionárias, manutenção...). Depois você ajusta como quiser.</Text>
            {editaTudo && <Button marginTop={5} colorScheme="blue" isLoading={criando} onClick={criarPadrao}>Criar plano padrão</Button>}
          </Flex>
        ) : (
          <Stack spacing={3}>
            {visiveis.map((g) => (
              <Box key={g.id} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden" opacity={g.ativo ? 1 : 0.55}>
                <Flex align="center" gap={3} paddingX={4} paddingY={2.5} bg="gray.50" wrap="wrap">
                  <Text fontWeight="semibold" fontSize="sm" color="gray.800" flex={1} minWidth="160px">{g.nome}</Text>
                  <Badge colorScheme={CORES_TIPO_CONTA[g.tipo]} variant="subtle" textTransform="none">{ROTULOS_TIPO_CONTA[g.tipo]}</Badge>
                  {!g.ativo && <Badge textTransform="none">Inativo</Badge>}
                  <Text fontSize="xs" color="gray.500" minWidth="90px" textAlign="right">{g.lancamentos} lançamento(s)</Text>
                  {chaveRateio(g, true)}
                  {acoes(g, true)}
                </Flex>
                {g.categorias.filter((c) => mostrarInativas || c.ativo).map((c) => (
                  <Flex key={c.id} align="center" gap={3} paddingX={4} paddingLeft={8} paddingY={2} borderTop="1px solid" borderColor="gray.50" opacity={c.ativo ? 1 : 0.55} wrap="wrap">
                    <Text fontSize="sm" color="gray.700" flex={1} minWidth="160px">{c.nome}</Text>
                    {c.codigo && <Badge variant="outline" textTransform="none" fontSize="2xs">automática</Badge>}
                    {!c.ativo && <Badge textTransform="none">Inativa</Badge>}
                    <Text fontSize="xs" color="gray.500" minWidth="90px" textAlign="right">{c.lancamentos || "—"}</Text>
                    {chaveRateio(c, false)}
                    {acoes(c, false)}
                  </Flex>
                ))}
              </Box>
            ))}
          </Stack>
        )}

        <ModalConta edicao={edicao} aoFechar={() => setEdicao(null)} aoSalvo={carregar} />
      </Box>
    </Flex>
  );
};
