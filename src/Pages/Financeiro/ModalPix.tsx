// ---------------------------------------------------------
// PAGAR COM PIX (QR Code + "copia e cola" da cota)
// ---------------------------------------------------------
// PIX estático com o valor da cota (com multa e juros, se
// atrasada). O pagamento cai na conta do condomínio; a baixa
// é feita pelo síndico ao conferir o extrato.
// ---------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Alert, AlertIcon, Box, Button, Flex, Input, InputGroup, InputRightElement, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, useToast,
} from "@chakra-ui/react";

import { formatarDataIso } from "../../Components/config";
import { apiFinanceiro, formatarCompetencia, formatarMoeda, type Cota, type PixCota } from "./ConfigFinanceiro";

export const ModalPix = ({ cota, aoFechar }: { cota: Cota | null; aoFechar: () => void }) => {
  const toast = useToast();
  const [pix, setPix] = useState<PixCota | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!cota) return;
    setPix(null);
    setErro("");
    apiFinanceiro.pix(cota.id).then(setPix).catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível gerar o PIX."));
  }, [cota]);

  async function copiar() {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.copia_cola); toast({ title: "Código copiado. Cole no app do seu banco (PIX copia e cola).", status: "success", duration: 3000 }); }
    catch { toast({ title: "Não foi possível copiar: selecione o código e copie", status: "warning" }); }
  }

  return (
    <Modal isOpen={Boolean(cota)} onClose={aoFechar} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" marginX={4}>
        <ModalHeader>
          Pagar com PIX
          {cota && <Text fontSize="sm" fontWeight="normal" color="gray.500">{cota.apartamento_rotulo} · {formatarCompetencia(cota.competencia)}{cota.descricao ? ` · ${cota.descricao}` : ""}</Text>}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {erro ? (
            <Alert status="warning" borderRadius="lg"><AlertIcon />{erro}</Alert>
          ) : !pix ? (
            <Flex justify="center" padding={10}><Spinner color="blue.500" /></Flex>
          ) : (
            <Flex direction="column" align="center" gap={3}>
              <Text fontSize="3xl" fontWeight="bold" color="gray.800">{formatarMoeda(pix.valor)}</Text>
              <Text fontSize="sm" color={pix.atrasada ? "red.600" : "gray.500"} marginTop={-2}>
                {pix.atrasada ? `Vencida em ${formatarDataIso(pix.vencimento)} · valor com multa e juros de hoje` : `Vence em ${formatarDataIso(pix.vencimento)}`}
              </Text>
              <Box bg="white" padding={2} borderRadius="lg" border="1px solid" borderColor="gray.100" width="240px" sx={{ svg: { width: "100%", height: "auto" } }}
                dangerouslySetInnerHTML={{ __html: pix.qr_svg }} />
              <Text fontSize="xs" color="gray.500" textAlign="center">Abra o app do banco, escolha PIX e leia o QR Code — ou copie o código abaixo.</Text>
              <InputGroup size="sm">
                <Input value={pix.copia_cola} isReadOnly fontSize="xs" paddingRight="84px" onFocus={(e) => e.target.select()} />
                <InputRightElement width="80px"><Button size="xs" colorScheme="blue" onClick={copiar}>Copiar</Button></InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Recebedor: {pix.recebedor} · chave {pix.chave}. Confira antes de pagar. A baixa aparece aqui quando o síndico conferir o extrato.
              </Text>
            </Flex>
          )}
        </ModalBody>
        <ModalFooter><Button onClick={aoFechar}>Fechar</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
};
