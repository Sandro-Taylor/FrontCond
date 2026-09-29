// ---------------------------------------------------------
// PÁGINA DO APARTAMENTO (/Apartamentos/:id)
// ---------------------------------------------------------
// Mostra tudo da unidade e permite ver, editar e adicionar:
//  - pessoas: titulares (proprietário/inquilino) e os
//    residentes ligados a cada um, com parentesco
//  - vagas fixas da unidade (novas ou vagas livres já cadastradas)
//  - veículos: vaga fixa da unidade ou rotativo, e condutor
//  - financeiro: cotas da unidade (só leitura; lançamentos na página Financeiro)
// ---------------------------------------------------------

import { Fragment, useCallback, useEffect, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Table, TableContainer, Tbody,
  Td, Text, Th, Thead, Tooltip, Tr, useDisclosure, useToast, Icon,
} from "@chakra-ui/react";
import { Wallet } from "lucide-react";
import { AddIcon, ArrowBackIcon, DeleteIcon, EditIcon, LinkIcon } from "@chakra-ui/icons";

import { Titulo } from "../Titulos/Titulos";
import { usePermissoes } from "../../Components/permissoes";
import { formatarCpf, formatarPlaca, formatarTelefone } from "../../Components/config";
import { editarPessoa } from "../Pessoas/API/EditarPessoa";
import { ROTULOS_PARENTESCO, ROTULOS_TIPO_RELACAO, rotuloApartamento, type PessoaDados, type TipoRelacao } from "../Pessoas/ConfigPessoas";
import { IconeCarro, IconePredio, IconeUsuario, IconeVaga } from "../Pessoas/IconesPessoas";
import { apiVagas, type Vaga } from "../Vagas/ConfigVagas";
import { apiApartamentos } from "./API";
import { ModalAdicionarPessoa, ModalEditarPessoa } from "./FormulariosPessoa";
import { apiFinanceiro, type Cota } from "../Financeiro/ConfigFinanceiro";
import { TabelaCotas } from "../Financeiro/TabelaCotas";
import {
  OCUPACAO, type ApartamentoDetalhe, type VagaApartamento, type VeiculoApartamento, type VeiculoDados, type VinculoApartamento, type VinculoDados,
} from "./ConfigApartamentos";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };
const corTipo = (tipo: TipoRelacao) => (tipo === "PROPRIETARIO" ? "purple" : tipo === "INQUILINO" ? "blue" : "teal");

const VEICULO_VAZIO = { placa: "", marca: "", modelo: "", cor: "", descricao: "", vaga_id: "", pessoa_id: "" };

// ---------------------------------------------------------
// COMPONENTES AUXILIARES
// ---------------------------------------------------------

const Resumo = ({ icone: Icone, rotulo, valor }: { icone: ElementType; rotulo: string; valor: ReactNode }) => (
  <Box bg="white" paddingX={5} paddingY={4}>
    <Flex align="center" gap={2} color="gray.500">
      <Icone boxSize={3.5} />
      <Text fontSize="xs" fontWeight="medium">{rotulo}</Text>
    </Flex>
    <Box marginTop={1} fontSize="lg" fontWeight="semibold" color="gray.800">{valor}</Box>
  </Box>
);

const Secao = ({ icone: Icone, titulo, contador, acoes, children }: { icone: ElementType; titulo: string; contador: number; acoes?: ReactNode; children: ReactNode }) => (
  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" marginBottom={6} overflow="hidden">
    <Flex justify="space-between" align="center" paddingX={5} paddingY={4} borderBottom="1px solid" borderColor="gray.100" gap={3} wrap="wrap">
      <Flex align="center" gap={2}>
        <Icone boxSize={4} color="gray.400" />
        <Text fontWeight="semibold">{titulo}</Text>
        <Badge borderRadius="full" paddingX={2}>{contador}</Badge>
      </Flex>
      <Flex gap={2}>{acoes}</Flex>
    </Flex>
    {children}
  </Box>
);

const Vazio = ({ children }: { children: ReactNode }) => (
  <Text fontSize="sm" color="gray.400" paddingX={5} paddingY={6}>{children}</Text>
);

const Acao = ({ rotulo, icone, cor, onClick }: { rotulo: string; icone: React.ReactElement; cor?: string; onClick: () => void }) => (
  <Tooltip label={rotulo} hasArrow>
    <IconButton aria-label={rotulo} icon={icone} size="xs" variant="ghost" colorScheme={cor} onClick={onClick} />
  </Tooltip>
);

// ---------------------------------------------------------
// PÁGINA
// ---------------------------------------------------------

const IconeFinanceiro = (props: object) => <Icon as={Wallet} {...props} />;

// cotas da unidade (quem tem acesso ao financeiro)
const SecaoFinanceiro = ({ apartamentoId }: { apartamentoId: string }) => {
  const toast = useToast();
  const [cotas, setCotas] = useState<Cota[] | null>(null);

  useEffect(() => {
    apiFinanceiro.listar({ apartamento_id: apartamentoId })
      .then(setCotas)
      .catch((erro) => { setCotas([]); toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar as cotas", status: "error" }); });
  }, [apartamentoId, toast]);

  const emAberto = (cotas ?? []).filter((c) => c.status === "ABERTA").length;
  return (
    <Secao icone={IconeFinanceiro} titulo="Financeiro" contador={cotas?.length ?? 0}
      acoes={<>
        {emAberto > 0 && <Badge colorScheme="yellow" textTransform="none">{emAberto} em aberto</Badge>}
        <Button as={RouterLink} to="/Financeiro" size="xs" variant="ghost">Abrir financeiro</Button>
      </>}>
      {cotas === null ? (
        <Flex justify="center" padding={6}><Spinner size="sm" color="blue.500" /></Flex>
      ) : cotas.length === 0 ? (
        <Vazio>Nenhuma cota lançada para esta unidade.</Vazio>
      ) : (
        <Box borderTop="none"><TabelaCotas cotas={cotas} mostrarApartamento={false} /></Box>
      )}
    </Secao>
  );
};

export const ApartamentoPagina = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const permissoes = usePermissoes();

  const [apto, setApto] = useState<ApartamentoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);

  // modais
  const modalUnidade = useDisclosure();
  const modalAddPessoa = useDisclosure();
  const modalEditPessoa = useDisclosure();
  const modalVaga = useDisclosure();
  const modalVincularVaga = useDisclosure();
  const modalVeiculo = useDisclosure();

  const [formUnidade, setFormUnidade] = useState({ bloco: "", numero: "", andar: "", observacao: "", ativo: true });
  const [vinculoEditando, setVinculoEditando] = useState<VinculoApartamento | null>(null);
  const [vagaEditando, setVagaEditando] = useState<VagaApartamento | null>(null);
  const [formVaga, setFormVaga] = useState({ numero: "", localizacao: "" });
  const [vagasLivres, setVagasLivres] = useState<Vaga[]>([]);
  const [vagaParaVincular, setVagaParaVincular] = useState("");
  const [veiculoEditando, setVeiculoEditando] = useState<VeiculoApartamento | null>(null);
  const [formVeiculo, setFormVeiculo] = useState(VEICULO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      setApto(await apiApartamentos.buscar(id));
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar apartamento", status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [id, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  // executa uma alteração e troca a tela pelo apartamento devolvido pela API
  async function executar(acao: () => Promise<ApartamentoDetalhe>, sucesso: string): Promise<boolean> {
    try {
      setSalvando(true);
      setApto(await acao());
      toast({ title: sucesso, status: "success", duration: 2000 });
      return true;
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Não foi possível salvar", status: "error" });
      return false;
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Flex flex={1} justify="center" padding={16}><Spinner color="blue.500" size="lg" /></Flex>
      </Flex>
    );
  }

  if (!apto) {
    return (
      <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Box padding={10}>
          <Text color="gray.600">Apartamento não encontrado.</Text>
          <Button as={RouterLink} to="/Apartamentos" marginTop={4} size="sm" leftIcon={<ArrowBackIcon />}>Voltar para Apartamentos</Button>
        </Box>
      </Flex>
    );
  }

  const aptoId = apto.id;
  const titulares = apto.pessoas.filter((v) => v.tipo_relacao !== "RESIDENTE");
  const residentesDe = (vinculoId: string) => apto.pessoas.filter((v) => v.titular_vinculo_id === vinculoId);
  const ocupacao = OCUPACAO[apto.ocupacao];
  const moradores = apto.pessoas.filter((v) => v.ativo && v.reside).length;

  // ================= UNIDADE =================
  function abrirEdicaoUnidade() {
    setFormUnidade({ bloco: apto!.bloco, numero: apto!.numero, andar: apto!.andar !== null ? String(apto!.andar) : "", observacao: apto!.observacao ?? "", ativo: apto!.ativo });
    modalUnidade.onOpen();
  }

  async function salvarUnidade() {
    if (!formUnidade.numero.trim()) {
      toast({ title: "Informe o número do apartamento", status: "warning" });
      return;
    }
    const ok = await executar(() => apiApartamentos.editar(aptoId, {
      bloco: formUnidade.bloco.trim() || null,
      numero: formUnidade.numero.trim(),
      andar: formUnidade.andar.trim() === "" ? null : Number(formUnidade.andar),
      observacao: formUnidade.observacao.trim() || null,
      ativo: formUnidade.ativo,
    }), "Unidade atualizada");
    if (ok) modalUnidade.onClose();
  }

  async function excluirUnidade() {
    if (!window.confirm(`Excluir o apartamento ${rotuloApartamento(apto!)}?\n\nSaem junto: os vínculos com pessoas e os veículos da unidade. As vagas ficam livres e as pessoas continuam cadastradas.`)) return;
    try {
      await apiApartamentos.excluir(aptoId);
      toast({ title: "Apartamento excluído", status: "success" });
      navigate("/Apartamentos");
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao excluir", status: "error" });
    }
  }

  // ================= PESSOAS =================
  function abrirEdicaoPessoa(vinculo: VinculoApartamento) {
    setVinculoEditando(vinculo);
    modalEditPessoa.onOpen();
  }

  async function salvarPessoa(vinculo: VinculoApartamento, pessoa: PessoaDados, papel: VinculoDados): Promise<boolean> {
    try {
      setSalvando(true);
      await editarPessoa(vinculo.pessoa.id, { ...pessoa, ativo: vinculo.pessoa.ativo, perfil: vinculo.pessoa.perfil });
      setApto(await apiApartamentos.editarVinculo(aptoId, vinculo.id, { ...papel, ativo: vinculo.ativo }));
      toast({ title: "Pessoa atualizada", status: "success", duration: 2000 });
      return true;
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Não foi possível salvar", status: "error" });
      await carregar();
      return false;
    } finally {
      setSalvando(false);
    }
  }

  function removerPessoa(vinculo: VinculoApartamento) {
    const residentes = residentesDe(vinculo.id).length;
    const aviso = residentes > 0 ? `\n\nOs ${residentes} residente(s) ligados a ${vinculo.pessoa.nome} também sairão.` : "";
    if (!window.confirm(`Remover ${vinculo.pessoa.nome} deste apartamento?${aviso}\n\nA pessoa continua cadastrada na tela Pessoas.`)) return;
    executar(() => apiApartamentos.removerPessoa(aptoId, vinculo.id), "Pessoa removida do apartamento");
  }

  // ================= VAGAS =================
  function abrirNovaVaga() {
    setVagaEditando(null);
    setFormVaga({ numero: "", localizacao: "" });
    modalVaga.onOpen();
  }

  function abrirEdicaoVaga(vaga: VagaApartamento) {
    setVagaEditando(vaga);
    setFormVaga({ numero: vaga.numero, localizacao: vaga.localizacao ?? "" });
    modalVaga.onOpen();
  }

  async function salvarVaga() {
    if (!formVaga.numero.trim()) {
      toast({ title: "Informe o número da vaga", status: "warning" });
      return;
    }
    const dados = { numero: formVaga.numero.trim(), localizacao: formVaga.localizacao.trim() || null, observacao: vagaEditando?.observacao ?? null };
    const ok = vagaEditando
      ? await executar(() => apiApartamentos.editarVaga(aptoId, vagaEditando.id, { ...dados, ativo: vagaEditando.ativo }), "Vaga atualizada")
      : await executar(() => apiApartamentos.adicionarVaga(aptoId, dados), "Vaga fixa criada para a unidade");
    if (ok) modalVaga.onClose();
  }

  async function abrirVincularVaga() {
    try {
      const todas = await apiVagas.listar();
      const livres = todas.filter((v) => v.tipo === "FIXA" && !v.apartamento_id && v.ativo);
      setVagasLivres(livres);
      setVagaParaVincular(livres[0]?.id ?? "");
      modalVincularVaga.onOpen();
    } catch (erro) {
      toast({ title: erro instanceof Error ? erro.message : "Erro ao carregar vagas", status: "error" });
    }
  }

  async function vincularVaga() {
    if (!vagaParaVincular) return;
    if (await executar(() => apiApartamentos.vincularVaga(aptoId, vagaParaVincular), "Vaga vinculada à unidade")) modalVincularVaga.onClose();
  }

  function liberarVaga(vaga: VagaApartamento) {
    if (!window.confirm(`Liberar a vaga ${vaga.numero} desta unidade?\n\nA vaga continua cadastrada (livre) e os veículos que a usavam passam a usar as rotativas.`)) return;
    executar(() => apiApartamentos.liberarVaga(aptoId, vaga.id), "Vaga liberada");
  }

  // ================= VEÍCULOS =================
  function abrirNovoVeiculo() {
    setVeiculoEditando(null);
    setFormVeiculo(VEICULO_VAZIO);
    modalVeiculo.onOpen();
  }

  function abrirEdicaoVeiculo(veiculo: VeiculoApartamento) {
    setVeiculoEditando(veiculo);
    setFormVeiculo({
      placa: formatarPlaca(veiculo.placa), marca: veiculo.marca ?? "", modelo: veiculo.modelo ?? "", cor: veiculo.cor ?? "",
      descricao: veiculo.descricao ?? "", vaga_id: veiculo.vaga_id ?? "", pessoa_id: veiculo.pessoa_id ?? "",
    });
    modalVeiculo.onOpen();
  }

  async function salvarVeiculo() {
    if (!formVeiculo.placa.trim() && !formVeiculo.modelo.trim()) {
      toast({ title: "Informe ao menos a placa ou o modelo", status: "warning" });
      return;
    }
    const dados: VeiculoDados = {
      placa: formVeiculo.placa.trim() || null,
      marca: formVeiculo.marca.trim() || null,
      modelo: formVeiculo.modelo.trim() || null,
      cor: formVeiculo.cor.trim() || null,
      descricao: formVeiculo.descricao.trim() || null,
      vaga_id: formVeiculo.vaga_id || null,
      pessoa_id: formVeiculo.pessoa_id || null,
    };
    const ok = veiculoEditando
      ? await executar(() => apiApartamentos.editarVeiculo(aptoId, veiculoEditando.id, { ...dados, ativo: veiculoEditando.ativo }), "Veículo atualizado")
      : await executar(() => apiApartamentos.adicionarVeiculo(aptoId, dados), "Veículo adicionado");
    if (ok) modalVeiculo.onClose();
  }

  function excluirVeiculo(veiculo: VeiculoApartamento) {
    if (!window.confirm(`Excluir o veículo ${formatarPlaca(veiculo.placa) || veiculo.modelo || ""}?`)) return;
    executar(() => apiApartamentos.excluirVeiculo(aptoId, veiculo.id), "Veículo excluído");
  }

  // ================= LINHA DE PESSOA =================
  const LinhaPessoa = ({ vinculo, residente }: { vinculo: VinculoApartamento; residente?: boolean }) => (
    <Tr opacity={vinculo.ativo ? 1 : 0.5}>
      <Td paddingLeft={residente ? 10 : 5}>
        <Text fontWeight={residente ? "normal" : "semibold"}>{residente ? "↳ " : ""}{vinculo.pessoa.nome}</Text>
      </Td>
      <Td>
        {residente ? (
          <Text fontSize="sm">{vinculo.parentesco ? ROTULOS_PARENTESCO[vinculo.parentesco] : "Residente"}</Text>
        ) : (
          <Flex gap={2} align="center" wrap="wrap">
            <Badge colorScheme={corTipo(vinculo.tipo_relacao)} borderRadius="full" textTransform="none">{ROTULOS_TIPO_RELACAO[vinculo.tipo_relacao]}</Badge>
            {vinculo.tipo_relacao === "PROPRIETARIO" && (
              <Text fontSize="xs" color={vinculo.reside ? "green.600" : "gray.500"}>{vinculo.reside ? "mora no prédio" : "não mora no prédio"}</Text>
            )}
          </Flex>
        )}
      </Td>
      <Td fontSize="sm">{vinculo.pessoa.cpf ? formatarCpf(vinculo.pessoa.cpf) : "-"}</Td>
      <Td fontSize="sm">{vinculo.pessoa.telefone ? formatarTelefone(vinculo.pessoa.telefone) : "-"}</Td>
      <Td fontSize="sm">{vinculo.pessoa.email ?? "-"}</Td>
      <Td>
        <Flex gap={1} justify="flex-end">
          {permissoes.editaUnidade && <Acao rotulo="Editar" icone={<EditIcon />} onClick={() => abrirEdicaoPessoa(vinculo)} />}
          {permissoes.editaUnidade && <Acao rotulo="Remover do apartamento" icone={<DeleteIcon />} cor="red" onClick={() => removerPessoa(vinculo)} />}
        </Flex>
      </Td>
    </Tr>
  );

  return (
    <Flex align="flex-start" gap={6} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingRight={{ md: 6 }}>
        {/* CABEÇALHO */}
        <Button as={RouterLink} to="/Apartamentos" size="sm" variant="ghost" leftIcon={<ArrowBackIcon />} marginBottom={3} marginLeft={-3}>{permissoes.veTudo ? "Apartamentos" : "Minhas unidades"}</Button>
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap" marginBottom={6}>
          <Box>
            <Flex align="center" gap={3} wrap="wrap">
              <Text fontSize="2xl" fontWeight="semibold" color="gray.800">{rotuloApartamento(apto)}</Text>
              <Badge colorScheme={ocupacao.cor} borderRadius="full" paddingX={2.5} textTransform="none">{ocupacao.rotulo}</Badge>
              {!apto.ativo && <Badge colorScheme="red" borderRadius="full" paddingX={2.5} textTransform="none">Inativo</Badge>}
            </Flex>
            <Text fontSize="sm" color="gray.500" marginTop={1}>
              {[apto.andar !== null ? `${apto.andar}º andar` : "Andar não informado", apto.observacao].filter(Boolean).join(" · ")}
            </Text>
          </Box>
          {permissoes.editaTudo && (
            <Flex gap={2}>
              <Button size="sm" leftIcon={<EditIcon />} onClick={abrirEdicaoUnidade}>Editar unidade</Button>
              <Button size="sm" variant="ghost" colorScheme="red" leftIcon={<DeleteIcon />} onClick={excluirUnidade}>Excluir</Button>
            </Flex>
          )}
        </Flex>

        {/* RESUMO */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing="1px" bg="gray.100" border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" marginBottom={6}>
          <Resumo icone={IconePredio} rotulo="Ocupação" valor={ocupacao.rotulo} />
          <Resumo icone={IconeUsuario} rotulo="Moram na unidade" valor={moradores} />
          <Resumo icone={IconeVaga} rotulo="Vagas fixas" valor={apto.vagas.length} />
          <Resumo icone={IconeCarro} rotulo="Veículos" valor={apto.veiculos.length} />
        </SimpleGrid>

        {/* PESSOAS */}
        <Secao icone={IconeUsuario} titulo="Pessoas" contador={apto.pessoas.length}
          acoes={permissoes.editaUnidade && <Button size="sm" colorScheme="blue" leftIcon={<AddIcon boxSize={2.5} />} onClick={modalAddPessoa.onOpen}>Adicionar pessoa</Button>}>
          {apto.pessoas.length === 0 ? (
            <Vazio>Nenhuma pessoa ligada. Comece adicionando o proprietário.</Vazio>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Nome</Th>
                    <Th {...estiloTh}>Papel / parentesco</Th>
                    <Th {...estiloTh}>CPF</Th>
                    <Th {...estiloTh}>Telefone</Th>
                    <Th {...estiloTh}>E-mail</Th>
                    <Th {...estiloTh} />
                  </Tr>
                </Thead>
                <Tbody>
                  {titulares.map((titular) => (
                    <Fragment key={titular.id}>
                      <LinhaPessoa vinculo={titular} />
                      {residentesDe(titular.id).map((residente) => <LinhaPessoa key={residente.id} vinculo={residente} residente />)}
                    </Fragment>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Secao>

        {/* VAGAS */}
        <Secao icone={IconeVaga} titulo="Vagas fixas da unidade" contador={apto.vagas.length}
          acoes={permissoes.editaTudo && (
            <>
              <Button size="sm" variant="outline" leftIcon={<LinkIcon />} onClick={abrirVincularVaga}>Vincular vaga livre</Button>
              <Button size="sm" colorScheme="blue" leftIcon={<AddIcon boxSize={2.5} />} onClick={abrirNovaVaga}>Nova vaga</Button>
            </>
          )}>
          {apto.vagas.length === 0 ? (
            <Vazio>A unidade não tem vaga fixa. Os veículos dela usam as vagas rotativas.</Vazio>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Vaga</Th>
                    <Th {...estiloTh}>Localização</Th>
                    <Th {...estiloTh}>Veículo(s) nela</Th>
                    <Th {...estiloTh} />
                  </Tr>
                </Thead>
                <Tbody>
                  {apto.vagas.map((vaga) => {
                    const naVaga = apto.veiculos.filter((v) => v.vaga_id === vaga.id);
                    return (
                      <Tr key={vaga.id}>
                        <Td paddingLeft={5} fontWeight="semibold">Vaga {vaga.numero}</Td>
                        <Td fontSize="sm">{vaga.localizacao ?? "-"}</Td>
                        <Td fontSize="sm">{naVaga.map((v) => formatarPlaca(v.placa) || v.modelo).join(", ") || "Livre"}</Td>
                        <Td>
                          <Flex gap={1} justify="flex-end">
                            {permissoes.editaTudo && <Acao rotulo="Editar" icone={<EditIcon />} onClick={() => abrirEdicaoVaga(vaga)} />}
                            {permissoes.editaTudo && <Acao rotulo="Liberar da unidade" icone={<DeleteIcon />} cor="red" onClick={() => liberarVaga(vaga)} />}
                          </Flex>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Secao>

        {/* VEÍCULOS */}
        <Secao icone={IconeCarro} titulo="Veículos" contador={apto.veiculos.length}
          acoes={permissoes.editaUnidade && <Button size="sm" colorScheme="blue" leftIcon={<AddIcon boxSize={2.5} />} onClick={abrirNovoVeiculo}>Adicionar veículo</Button>}>
          {apto.veiculos.length === 0 ? (
            <Vazio>Nenhum veículo cadastrado.</Vazio>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th {...estiloTh} paddingLeft={5}>Placa</Th>
                    <Th {...estiloTh}>Marca / modelo</Th>
                    <Th {...estiloTh}>Cor</Th>
                    <Th {...estiloTh}>Vaga</Th>
                    <Th {...estiloTh}>Condutor</Th>
                    <Th {...estiloTh} />
                  </Tr>
                </Thead>
                <Tbody>
                  {apto.veiculos.map((veiculo) => (
                    <Tr key={veiculo.id} opacity={veiculo.ativo ? 1 : 0.5}>
                      <Td paddingLeft={5} fontWeight="semibold">{formatarPlaca(veiculo.placa) || "Sem placa"}</Td>
                      <Td fontSize="sm">{[veiculo.marca, veiculo.modelo].filter(Boolean).join(" ") || "-"}</Td>
                      <Td fontSize="sm">{veiculo.cor ?? "-"}</Td>
                      <Td>
                        {veiculo.vaga_numero
                          ? <Badge colorScheme="purple" textTransform="none">Vaga {veiculo.vaga_numero}</Badge>
                          : <Badge colorScheme="orange" textTransform="none">Rotativo</Badge>}
                      </Td>
                      <Td fontSize="sm">{veiculo.condutor_nome ?? "-"}</Td>
                      <Td>
                        <Flex gap={1} justify="flex-end">
                          {permissoes.editaUnidade && <Acao rotulo="Editar" icone={<EditIcon />} onClick={() => abrirEdicaoVeiculo(veiculo)} />}
                          {permissoes.editaUnidade && <Acao rotulo="Excluir" icone={<DeleteIcon />} cor="red" onClick={() => excluirVeiculo(veiculo)} />}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Secao>

        {/* FINANCEIRO */}
        {permissoes.acessaFinanceiro && <SecaoFinanceiro apartamentoId={aptoId} />}

        {/* ================= MODAIS ================= */}

        <ModalAdicionarPessoa aberto={modalAddPessoa.isOpen} aoFechar={modalAddPessoa.onClose} titulares={titulares}
          aoAdicionar={(dados) => executar(() => apiApartamentos.adicionarPessoa(aptoId, dados), "Pessoa adicionada ao apartamento")} />

        <ModalEditarPessoa aberto={modalEditPessoa.isOpen} aoFechar={modalEditPessoa.onClose} vinculo={vinculoEditando} titulares={titulares} aoSalvar={salvarPessoa} />

        {/* UNIDADE */}
        <Modal isOpen={modalUnidade.isOpen} onClose={modalUnidade.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>Editar unidade</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={3} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Bloco</FormLabel>
                  <Input value={formUnidade.bloco} onChange={(e) => setFormUnidade({ ...formUnidade, bloco: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Número</FormLabel>
                  <Input value={formUnidade.numero} onChange={(e) => setFormUnidade({ ...formUnidade, numero: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Andar</FormLabel>
                  <Input type="number" value={formUnidade.andar} onChange={(e) => setFormUnidade({ ...formUnidade, andar: e.target.value })} />
                </FormControl>
              </SimpleGrid>
              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Observação</FormLabel>
                <Input value={formUnidade.observacao} onChange={(e) => setFormUnidade({ ...formUnidade, observacao: e.target.value })} />
              </FormControl>
              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Situação</FormLabel>
                <Select value={formUnidade.ativo ? "ativo" : "inativo"} onChange={(e) => setFormUnidade({ ...formUnidade, ativo: e.target.value === "ativo" })}>
                  <option value="ativo">Ativa</option>
                  <option value="inativo">Inativa</option>
                </Select>
              </FormControl>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modalUnidade.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={salvarUnidade} isLoading={salvando}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* VAGA (nova ou edição) */}
        <Modal isOpen={modalVaga.isOpen} onClose={modalVaga.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>{vagaEditando ? `Editar vaga ${vagaEditando.numero}` : "Nova vaga fixa da unidade"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Número da vaga</FormLabel>
                  <Input value={formVaga.numero} onChange={(e) => setFormVaga({ ...formVaga, numero: e.target.value })} placeholder="Ex.: 12" autoFocus />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Localização</FormLabel>
                  <Input value={formVaga.localizacao} onChange={(e) => setFormVaga({ ...formVaga, localizacao: e.target.value })} placeholder="Ex.: Subsolo 1" />
                </FormControl>
              </SimpleGrid>
              {!vagaEditando && <Text fontSize="xs" color="gray.500" marginTop={3}>Vagas rotativas (uso comum) são cadastradas na tela Vagas.</Text>}
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modalVaga.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={salvarVaga} isLoading={salvando}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* VINCULAR VAGA LIVRE */}
        <Modal isOpen={modalVincularVaga.isOpen} onClose={modalVincularVaga.onClose} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>Vincular vaga livre</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {vagasLivres.length === 0 ? (
                <Text fontSize="sm" color="gray.500">Não há vagas fixas livres. Crie uma com "Nova vaga" ou cadastre na tela Vagas.</Text>
              ) : (
                <FormControl>
                  <FormLabel fontSize="sm">Vaga fixa sem dono</FormLabel>
                  <Select value={vagaParaVincular} onChange={(e) => setVagaParaVincular(e.target.value)}>
                    {vagasLivres.map((v) => <option key={v.id} value={v.id}>Vaga {v.numero}{v.localizacao ? ` · ${v.localizacao}` : ""}</option>)}
                  </Select>
                </FormControl>
              )}
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modalVincularVaga.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={vincularVaga} isLoading={salvando} isDisabled={vagasLivres.length === 0}>Vincular</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* VEÍCULO (novo ou edição) */}
        <Modal isOpen={modalVeiculo.isOpen} onClose={modalVeiculo.onClose} size="xl" isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>{veiculoEditando ? "Editar veículo" : "Adicionar veículo"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Placa</FormLabel>
                  <Input value={formVeiculo.placa} onChange={(e) => setFormVeiculo({ ...formVeiculo, placa: e.target.value.toUpperCase() })} placeholder="ABC1D23" maxLength={8} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Marca</FormLabel>
                  <Input value={formVeiculo.marca} onChange={(e) => setFormVeiculo({ ...formVeiculo, marca: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Modelo</FormLabel>
                  <Input value={formVeiculo.modelo} onChange={(e) => setFormVeiculo({ ...formVeiculo, modelo: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Cor</FormLabel>
                  <Input value={formVeiculo.cor} onChange={(e) => setFormVeiculo({ ...formVeiculo, cor: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Vaga</FormLabel>
                  <Select value={formVeiculo.vaga_id} onChange={(e) => setFormVeiculo({ ...formVeiculo, vaga_id: e.target.value })}>
                    <option value="">Rotativo (sem vaga fixa)</option>
                    {apto.vagas.map((vaga) => <option key={vaga.id} value={vaga.id}>Vaga {vaga.numero}{vaga.localizacao ? ` · ${vaga.localizacao}` : ""}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Condutor</FormLabel>
                  <Select value={formVeiculo.pessoa_id} onChange={(e) => setFormVeiculo({ ...formVeiculo, pessoa_id: e.target.value })}>
                    <option value="">Não informado</option>
                    {apto.pessoas.map((v) => <option key={v.pessoa_id} value={v.pessoa_id}>{v.pessoa.nome}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl marginTop={3}>
                <FormLabel fontSize="sm">Descrição</FormLabel>
                <Input value={formVeiculo.descricao} onChange={(e) => setFormVeiculo({ ...formVeiculo, descricao: e.target.value })} placeholder="Ex.: moto, carro elétrico..." />
              </FormControl>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={modalVeiculo.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={salvarVeiculo} isLoading={salvando}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};
