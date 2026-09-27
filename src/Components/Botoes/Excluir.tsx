import { forwardRef } from "react";
import { DeleteIcon } from "@chakra-ui/icons";
import { IconButton, VStack, Text, Box } from "@chakra-ui/react";

interface Props {
  onClick: () => void;
}

export const BotaoExcluir = forwardRef<HTMLDivElement, Props>(({ onClick, ...rest }, ref) => {
  return (
    <Box ref={ref} bg="transparent" _hover={{ bg: "gray.600", color: "white" }} borderRadius="md" p={1} transition="all 0.2s ease" onClick={onClick} {...rest}>
      <VStack spacing={0.5} align="center">
        <IconButton aria-label="Excluir permanentemente" icon={<DeleteIcon />} colorScheme="red" variant="ghost" size="sm" pointerEvents="none"/>
        <Text fontSize="2xs" textAlign="center" fontWeight="bold">Excluir</Text>
      </VStack>
    </Box>
  );
});
