import { forwardRef } from "react";
import { IconButton, VStack, Text, Box } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";

interface Props {
  onClick: () => void;
}

export const BotaoRestaurar = forwardRef<HTMLDivElement, Props>(({ onClick, ...rest }, ref) => {
  return (
    <Box ref={ref} bg="transparent" _hover={{ bg: "gray.600", color: "white" }} borderRadius="md" p={1} transition="all 0.2s ease" onClick={onClick} {...rest}>
      <VStack spacing={0.5} align="center">
        <IconButton aria-label="Restaurar" icon={<RepeatIcon />} colorScheme="green" variant="ghost" size="sm" pointerEvents="none"/>
        <Text fontSize="2xs" textAlign="center" fontWeight="bold">Restaurar</Text>
      </VStack>
    </Box>
  );
});
