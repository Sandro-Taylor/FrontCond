// ---------------------------------------------------------
// TABELA DE COTAS
// ---------------------------------------------------------
// Usada na página Financeiro e na página do apartamento.
// As ações só aparecem quando a tela passa "aoAcao"
// (síndico/ADM). "aoPix" mostra o botão "Pagar com PIX" nas
// cotas em aberto (todos, inclusive o morador).
// ---------------------------------------------------------

import { Link as RouterLink } from "react-router-dom";
import {
  Badge, Box, Button, Icon, IconButton, Link, Menu, MenuButton, MenuItem, MenuList, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { QrCode } from "lucide-react";

import { formatarDataIso } from "../../Components/config";
import {
  ROTULOS_FORMA_PAGAMENTO, ROTULOS_SITUACAO, ROTULOS_TIPO_COTA, formatarCompetencia, formatarMoeda, type Cota,
} from "./ConfigFinanceiro";

export type AcaoCota = "PAGAR" | "EDITAR" | "CANCELAR" | "ESTORNAR" | "REABRIR" | "EXCLUIR";

const estiloTh = { textTransform: "none" as const, letterSpacing: "normal", fontSize: "xs", fontWeight: "medium", color: "gray.500" };

function acoesDisponiveis(cota: Cota): { acao: AcaoCota; rotulo: string; cor?: string }[] {
  if (cota.status === "ABERTA") {
    return [
      { acao: "PAGAR", rotulo: "Dar baixa (registrar pagamento)" },
      { acao: "EDITAR", rotulo: "Editar" },
      { acao: "CANCELAR", rotulo: "Cancelar cota", cor: "red.600" },
    ];
  }
  if (cota.status === "PAGA") return [{ acao: "ESTORNAR", rotulo: "Estornar pagamento", cor: "red.600" }];
  return [
    { acao: "REABRIR", rotulo: "Reabrir cota" },
    { acao: "EXCLUIR", rotulo: "Excluir cota", cor: "red.600" },
  ];
}

type Props = {
  cotas: Cota[];
  mostrarApartamento?: boolean;
  aoAcao?: (acao: AcaoCota, cota: Cota) => void;
  aoPix?: (cota: Cota) => void;
};

export const TabelaCotas = ({ cotas, mostrarApartamento = true, aoAcao, aoPix }: Props) => (
  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" overflow="hidden">
    <TableContainer>
      <Table size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th {...estiloTh} paddingLeft={5}>Competência</Th>
            {mostrarApartamento && <Th {...estiloTh}>Unidade</Th>}
            {mostrarApartamento && <Th {...estiloTh}>Responsável</Th>}
            <Th {...estiloTh}>Tipo</Th>
            <Th {...estiloTh} isNumeric>Valor</Th>
            <Th {...estiloTh}>Vencimento</Th>
            <Th {...estiloTh}>Situação</Th>
            <Th {...estiloTh}>Pagamento</Th>
            {aoPix && <Th {...estiloTh} />}
            {aoAcao && <Th {...estiloTh} />}
          </Tr>
        </Thead>
        <Tbody>
          {cotas.map((cota) => {
            const situacao = ROTULOS_SITUACAO[cota.situacao];
            return (
              <Tr key={cota.id} opacity={cota.status === "CANCELADA" ? 0.5 : 1}>
                <Td paddingLeft={5} fontWeight="semibold">{formatarCompetencia(cota.competencia)}</Td>
                {mostrarApartamento && (
                  <Td fontSize="sm">
                    <Link as={RouterLink} to={`/Apartamentos/${cota.apartamento_id}`} color="blue.600">{cota.apartamento_rotulo}</Link>
                  </Td>
                )}
                {mostrarApartamento && <Td fontSize="sm">{cota.responsavel ?? "-"}</Td>}
                <Td fontSize="sm">
                  {ROTULOS_TIPO_COTA[cota.tipo]}
                  {cota.descricao && <Text fontSize="xs" color="gray.500">{cota.descricao}</Text>}
                </Td>
                <Td isNumeric fontSize="sm">
                  {formatarMoeda(cota.valor)}
                  {cota.situacao === "ATRASADA" && (
                    <Text fontSize="xs" color="red.600">Atualizado: {formatarMoeda(cota.valor_atualizado)}</Text>
                  )}
                </Td>
                <Td fontSize="sm">{formatarDataIso(cota.vencimento)}</Td>
                <Td>
                  <Badge colorScheme={situacao.cor} textTransform="none">{situacao.rotulo}</Badge>
                  {cota.situacao === "ATRASADA" && <Text fontSize="xs" color="gray.500">{cota.dias_atraso} dia(s)</Text>}
                </Td>
                <Td fontSize="sm">
                  {cota.status === "PAGA" ? (
                    <>
                      <Text>{formatarDataIso(cota.data_pagamento)} · {formatarMoeda(cota.valor_pago)}</Text>
                      {cota.forma_pagamento && <Text fontSize="xs" color="gray.500">{ROTULOS_FORMA_PAGAMENTO[cota.forma_pagamento]}</Text>}
                    </>
                  ) : "-"}
                </Td>
                {aoPix && (
                  <Td>
                    {cota.status === "ABERTA" && (
                      <Button size="xs" colorScheme="green" variant="outline" leftIcon={<Icon as={QrCode} boxSize={3.5} />} onClick={() => aoPix(cota)}>
                        Pagar com PIX
                      </Button>
                    )}
                  </Td>
                )}
                {aoAcao && (
                  <Td>
                    <Menu placement="bottom-end">
                      <MenuButton as={IconButton} aria-label="Ações" icon={<ChevronDownIcon />} size="xs" variant="ghost" />
                      <MenuList fontSize="sm">
                        {acoesDisponiveis(cota).map((item) => (
                          <MenuItem key={item.acao} color={item.cor} onClick={() => aoAcao(item.acao, cota)}>{item.rotulo}</MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  </Td>
                )}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);
