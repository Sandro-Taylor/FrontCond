// ---------------------------------------------------------
// INICIALIZAÇÃO DO REACT
// ---------------------------------------------------------
// Renderiza a aplicação e disponibiliza o Chakra UI.
// ---------------------------------------------------------

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

import { App } from "./App";

// ajustes para celular: janelas (modais) com margem pequena e página sem rolagem lateral
const tema = extendTheme({
  styles: { global: { "html, body": { overflowX: "hidden" } } },
  components: {
    Modal: { baseStyle: { dialog: { marginX: { base: 3, md: "auto" }, marginY: { base: 4, md: 16 } } } },
  },
});


createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <ChakraProvider theme={tema}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
