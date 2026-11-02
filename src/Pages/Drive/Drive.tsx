// ---------------------------------------------------------
// ARQUIVOS (GOOGLE DRIVE) – só ADM do sistema
// ---------------------------------------------------------
// Conecta a conta Google (uma vez) e mostra tudo o que o sistema
// guarda na pasta "Gerenciador" do Drive: navegar nas pastas,
// ver miniaturas, enviar, renomear, baixar e excluir.
// O Google devolve para /Drive?drive=conectado (ou =erro).
// ---------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Badge, Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Flex, Icon, IconButton, Image, Menu, MenuButton, MenuItem, MenuList,
  Progress, SimpleGrid, Spinner, Text, Tooltip, useToast,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { EllipsisVertical, File as IconeArquivo, FileText, Folder, FolderPlus, HardDrive, Upload } from "lucide-react";

import { Titulo } from "../Titulos/Titulos";
import { useAuth } from "../Login/useAuth";
import { usePermissoes } from "../../Components/permissoes";
import { formatarDataHora } from "../../Components/config";
import { baixarArquivo, enviarArquivo, useUrlArquivo } from "../../Components/Arquivos";
import { apiDrive, formatarTamanho, linkEdicao, type ItemDrive, type Navegacao, type StatusDrive } from "./ConfigDrive";

const conteudo = (id: string) => `/drive/itens/${encodeURIComponent(id)}/conteudo`;

const Miniatura = ({ item }: { item: ItemDrive }) => {
  const imagem = item.mime.startsWith("image/");
  const url = useUrlArquivo(imagem ? conteudo(item.id) : null);
  if (item.pasta) return <Icon as={Folder} boxSize={10} color="yellow.500" />;
  if (imagem) return url ? <Image src={url} alt={item.nome} objectFit="cover" width="100%" height="100%" /> : <Spinner size="sm" color="gray.400" />;
  return <Icon as={item.mime.includes("pdf") || item.mime.startsWith("text/") ? FileText : IconeArquivo} boxSize={10} color="gray.400" />;
};

export const Drive = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const { editaTudo } = usePermissoes();
  const admin = Boolean(user?.admin_sistema);
  const temAcesso = admin || editaTudo;   // ADM do sistema, síndico e ADM do condomínio
  const entrada = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<StatusDrive | null>(null);
  const [navegacao, setNavegacao] = useState<Navegacao | null>(null);
  const [pastaAtual, setPastaAtual] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [conectando, setConectando] = useState(false);

  const erro = useCallback((e: unknown, padrao: string) => toast({ title: e instanceof Error ? e.message : padrao, status: "error" }), [toast]);

  const carregarStatus = useCallback(async () => {
    try { setStatus(await apiDrive.status()); }
    catch (e) { erro(e, "Erro ao consultar o Drive"); }
  }, [erro]);

  const abrir = useCallback(async (pasta: string | null) => {
    setCarregando(true);
    try { setNavegacao(await apiDrive.navegar(pasta)); setPastaAtual(pasta); }
    catch (e) { erro(e, "Erro ao abrir a pasta"); }
    finally { setCarregando(false); }
  }, [erro]);

  useEffect(() => { if (temAcesso) carregarStatus(); }, [carregarStatus, temAcesso]);
  useEffect(() => { if (status?.conectado) abrir(null); }, [status?.conectado, abrir]);

  // volta do Google
  useEffect(() => {
    const resultado = parametros.get("drive");
    if (!resultado) return;
    if (resultado === "conectado") toast({ title: "Google Drive conectado", status: "success" });
    else toast({ title: parametros.get("mensagem") || "Não foi possível conectar o Drive", status: "error", duration: 8000 });
    setParametros({}, { replace: true });
  }, [parametros, setParametros, toast]);

  async function conectar() {
    setConectando(true);
    try { window.location.href = (await apiDrive.conectar()).url; }
    catch (e) { erro(e, "Erro ao conectar"); setConectando(false); }
  }

  async function desconectar() {
    if (!window.confirm("Desconectar o Google Drive? Os arquivos continuam no Drive, mas o sistema deixa de exibi-los até conectar de novo.")) return;
    try { await apiDrive.desconectar(); setNavegacao(null); await carregarStatus(); }
    catch (e) { erro(e, "Erro ao desconectar"); }
  }

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length || !navegacao) return;
    setEnviando(true);
    try {
      for (const arquivo of Array.from(arquivos)) {
        if (arquivo.size > 25 * 1024 * 1024) { toast({ title: `${arquivo.name}: maior que 25 MB`, status: "warning" }); continue; }
        await enviarArquivo(`/drive/enviar?pasta=${encodeURIComponent(navegacao.pasta.id)}`, arquivo, "Não foi possível enviar o arquivo.");
      }
      toast({ title: "Envio concluído", status: "success", duration: 1500 });
      await abrir(pastaAtual);
    } catch (e) { erro(e, "Erro ao enviar"); }
    finally { setEnviando(false); if (entrada.current) entrada.current.value = ""; }
  }

  async function novaPasta() {
    if (!navegacao) return;
    const nome = window.prompt("Nome da nova pasta:")?.trim();
    if (!nome) return;
    try { await apiDrive.criarPasta(navegacao.pasta.id, nome); await abrir(pastaAtual); }
    catch (e) { erro(e, "Erro ao criar a pasta"); }
  }

  async function renomear(item: ItemDrive) {
    const nome = window.prompt("Novo nome:", item.nome)?.trim();
    if (!nome || nome === item.nome) return;
    try { await apiDrive.renomear(item.id, nome); await abrir(pastaAtual); }
    catch (e) { erro(e, "Erro ao renomear"); }
  }

  async function excluir(item: ItemDrive) {
    const aviso = item.uso_no_sistema ? `\n\nAtenção: ${item.uso_no_sistema}. Ele deixará de aparecer no sistema.` : "";
    const pasta = item.pasta ? " e tudo o que estiver dentro" : "";
    if (!window.confirm(`Mover "${item.nome}"${pasta} para a lixeira do Google Drive?${aviso}`)) return;
    try { await apiDrive.excluir(item.id); await abrir(pastaAtual); }
    catch (e) { erro(e, "Erro ao excluir"); }
  }

  // clique no cartão: pasta abre; planilha/documento abre o editor do Google; o resto baixa
  function abrirItem(item: ItemDrive) {
    if (item.pasta) { abrir(item.id); return; }
    const editar = linkEdicao(item);
    if (editar) window.open(editar, "_blank", "noopener");
    else baixar(item);
  }

  async function baixar(item: ItemDrive) {
    try {
      const blob = await baixarArquivo(`${conteudo(item.id)}?baixar=1`);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = item.nome;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    } catch (e) { erro(e, "Erro ao baixar"); }
  }

  if (!temAcesso) {
    return (
      <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
        <Titulo />
        <Text padding={10} color="gray.500">Apenas a administração do condomínio acessa os arquivos.</Text>
      </Flex>
    );
  }

  const uso = status?.usado != null && status.limite ? Math.min(100, (status.usado / status.limite) * 100) : null;

  return (
    <Flex align="flex-start" gap={{ base: 0, md: 6 }} direction={{ base: "column", md: "row" }}>
      <Titulo />
      <Box flex={1} minWidth={0} paddingY={6} paddingX={{ base: 4, md: 0 }} paddingRight={{ md: 6 }}>
        <Box marginBottom={4}>
          <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Arquivos (Google Drive)</Text>
          <Text fontSize="sm" color="gray.500" marginTop={1}>
            Todo o Drive da conta conectada. O que o sistema cria fica na pasta "Gerenciador".
            {" "}Excluir manda para a lixeira do Drive. Nenhum arquivo fica público.
          </Text>
        </Box>

        {/* CONEXÃO */}
        <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4} marginBottom={4}>
          {!status ? <Spinner size="sm" /> : (
            <Flex justify="space-between" align="center" gap={3} wrap="wrap">
              <Flex align="center" gap={3}>
                <Icon as={HardDrive} boxSize={6} color={status.conectado ? "green.500" : "gray.400"} />
                <Box>
                  <Flex align="center" gap={2}>
                    <Text fontWeight="semibold" color="gray.800">Google Drive</Text>
                    <Badge colorScheme={status.conectado ? "green" : "gray"} textTransform="none">{status.conectado ? "Conectado" : "Não conectado"}</Badge>
                  </Flex>
                  {status.email && <Text fontSize="sm" color="gray.600">{status.email}</Text>}
                  {status.erro && <Text fontSize="sm" color="red.600">{status.erro}</Text>}
                </Box>
              </Flex>
              {!admin && !status.conectado && <Text fontSize="sm" color="gray.500">Peça ao administrador do sistema para conectar o Drive.</Text>}
              {admin && status.configurado && (
                status.conectado
                  ? <Button size="sm" variant="outline" colorScheme="red" onClick={desconectar}>Desconectar</Button>
                  : <Button size="sm" colorScheme="blue" onClick={conectar} isLoading={conectando}>Conectar Google Drive</Button>
              )}
            </Flex>
          )}
          {uso != null && status && (
            <Box marginTop={3} maxWidth="420px">
              <Progress value={uso} size="sm" borderRadius="full" colorScheme={uso > 90 ? "red" : uso > 75 ? "orange" : "blue"} />
              <Text fontSize="xs" color="gray.500" marginTop={1}>{formatarTamanho(status.usado)} de {formatarTamanho(status.limite)} usados na conta</Text>
            </Box>
          )}
        </Box>

        {/* NAVEGADOR DE ARQUIVOS */}
        {status?.conectado && (
          <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="xl" padding={4}>
            <Flex justify="space-between" align="center" gap={3} wrap="wrap" marginBottom={4}>
              <Breadcrumb separator={<ChevronRightIcon color="gray.400" />} fontSize="sm">
                {(navegacao?.caminho ?? []).map((p, i, lista) => (
                  <BreadcrumbItem key={p.id} isCurrentPage={i === lista.length - 1}>
                    <BreadcrumbLink onClick={() => abrir(i === 0 ? null : p.id)} fontWeight={i === lista.length - 1 ? "semibold" : "normal"}>{p.nome}</BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
              <Flex gap={2}>
                <Button size="sm" variant="outline" leftIcon={<Icon as={FolderPlus} boxSize={4} />} onClick={novaPasta} isDisabled={!navegacao}>Nova pasta</Button>
                <Button size="sm" colorScheme="blue" leftIcon={<Icon as={Upload} boxSize={4} />} onClick={() => entrada.current?.click()} isLoading={enviando} isDisabled={!navegacao}>Enviar arquivos</Button>
                <input ref={entrada} type="file" multiple hidden onChange={(e) => enviar(e.target.files)} />
              </Flex>
            </Flex>

            {carregando && !navegacao ? (
              <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>
            ) : navegacao && navegacao.itens.length === 0 ? (
              <Text fontSize="sm" color="gray.500" padding={6} textAlign="center">Pasta vazia.</Text>
            ) : navegacao && (
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4, xl: 6 }} spacing={3} opacity={carregando ? 0.6 : 1}>
                {navegacao.itens.map((item) => (
                  <Box key={item.id} border="1px solid" borderColor="gray.100" borderRadius="lg" overflow="hidden" _hover={{ borderColor: "blue.200" }}>
                    <Flex height="110px" bg="gray.50" align="center" justify="center" cursor="pointer" overflow="hidden"
                      onClick={() => abrirItem(item)}>
                      <Miniatura item={item} />
                    </Flex>
                    <Flex padding={2} gap={1} align="flex-start">
                      <Box flex={1} minWidth={0}>
                        <Tooltip label={item.nome} openDelay={500}><Text fontSize="sm" fontWeight="medium" noOfLines={1}>{item.nome}</Text></Tooltip>
                        <Text fontSize="2xs" color="gray.500">{item.pasta ? "Pasta" : formatarTamanho(item.tamanho)}{item.modificado_em && ` · ${formatarDataHora(item.modificado_em)}`}</Text>
                        {linkEdicao(item) && <Badge colorScheme="blue" variant="subtle" textTransform="none" fontSize="2xs" marginTop={1} marginRight={1}>Editável</Badge>}
                        {item.uso_no_sistema && <Badge colorScheme="green" variant="subtle" textTransform="none" fontSize="2xs" marginTop={1} noOfLines={1}>{item.uso_no_sistema}</Badge>}
                      </Box>
                      <Menu placement="bottom-end">
                        <MenuButton as={IconButton} size="xs" variant="ghost" icon={<Icon as={EllipsisVertical} boxSize={4} />} aria-label="Ações" />
                        <MenuList fontSize="sm">
                          {item.pasta && <MenuItem onClick={() => abrir(item.id)}>Abrir</MenuItem>}
                          {linkEdicao(item) && <MenuItem onClick={() => abrirItem(item)}>Editar no Google</MenuItem>}
                          {!item.pasta && <MenuItem onClick={() => baixar(item)}>Baixar</MenuItem>}
                          <MenuItem onClick={() => renomear(item)}>Renomear</MenuItem>
                          <MenuItem color="red.600" onClick={() => excluir(item)}>Mover para a lixeira</MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
};
