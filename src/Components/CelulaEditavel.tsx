import { useEffect, useRef, useState } from "react";
import { Box, Input, Spinner, Text, Textarea } from "@chakra-ui/react";

interface CelulaEditavelProps {
  valor: string;
  onSalvar: (novoValor: string) => Promise<void>;
  as?: "input" | "textarea";
  tipo?: "text" | "date";              // tipo do input (date abre o calendário)
  formatar?: (valor: string) => string; // como mostrar o valor (máscara), sem alterar o que é salvo
  placeholder?: string;
  fontWeight?: string;
  editavel?: boolean;
}

export const CelulaEditavel = ({
  valor,
  onSalvar,
  as = "input",
  tipo = "text",
  formatar,
  placeholder,
  fontWeight,
  editavel = true,
}: CelulaEditavelProps) => {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(valor);
  const [salvando, setSalvando] = useState(false);
  const valorOriginal = useRef(valor);

  useEffect(() => {
    setRascunho(valor);
    valorOriginal.current = valor;
  }, [valor]);

  async function salvar() {
    setEditando(false);

    const novoValor = rascunho.trim();

    if (novoValor === valorOriginal.current.trim()) return;

    setSalvando(true);

    try {
      await onSalvar(novoValor);
      valorOriginal.current = novoValor;
    } catch {
      setRascunho(valorOriginal.current);
    } finally {
      setSalvando(false);
    }
  }

  function aoTeclar(event: React.KeyboardEvent) {
    if (event.key === "Enter" && as === "input") salvar();

    if (event.key === "Escape") {
      setRascunho(valorOriginal.current);
      setEditando(false);
    }
  }

  if (salvando) {
    return <Spinner size="sm" />;
  }

  if (editando && editavel) {
    if (as === "textarea") {
      return (
        <Textarea autoFocus size="sm" value={rascunho} placeholder={placeholder}
          onChange={(event) => setRascunho(event.target.value)} onBlur={salvar} onKeyDown={aoTeclar} />
      );
    }

    return (
      <Input autoFocus size="sm" type={tipo} value={rascunho} placeholder={placeholder}
        onChange={(event) => setRascunho(event.target.value)} onBlur={salvar} onKeyDown={aoTeclar} />
    );
  }

  return (
    <Box
      cursor={editavel ? "pointer" : "default"}
      borderRadius="md"
      paddingX={2}
      paddingY={1}
      marginX={-2}
      transition="background 0.15s"
      _hover={editavel ? { bg: "gray.50" } : undefined}
      onClick={() => editavel && setEditando(true)}
    >
      <Text
        fontWeight={fontWeight}
        color={valor ? "gray.800" : "gray.400"}
        fontSize="sm"
      >
        {valor ? (formatar ? formatar(valor) : valor) : placeholder}
      </Text>
    </Box>
  );
};
