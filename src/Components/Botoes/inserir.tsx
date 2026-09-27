import { forwardRef } from "react";
import { AddIcon } from "@chakra-ui/icons";
import { IconButton, VStack, Text, Box } from "@chakra-ui/react";


interface Props {
  onClick: () => void;
}

export const BotaoInserir = forwardRef<HTMLDivElement, Props>(({ onClick, ...rest }, ref) => {
  return (
    <Box ref={ref} bg="transparent" _hover={{ bg: "gray.600", color: "white" }} borderRadius="md" p={1} transition="all 0.2s ease" onClick={onClick} {...rest}>
      <VStack spacing={0.5} align="center">
        <IconButton aria-label="Adicionar" icon={<AddIcon />} colorScheme="blue" variant="ghost" size="sm" pointerEvents="none"/>
        <Text fontSize="2xs" textAlign="center" fontWeight="bold">Adicionar</Text>
      </VStack>
    </Box>
  );
});
