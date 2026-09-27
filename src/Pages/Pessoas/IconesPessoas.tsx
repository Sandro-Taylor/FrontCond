import type { ElementType } from "react";
import { Flex, createIcon } from "@chakra-ui/react";

const traco = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const};
export const IconePredio = createIcon({ displayName: "IconePredio", viewBox: "0 0 24 24", defaultProps: traco, path: (
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </>
  ),
});

export const IconeCarro = createIcon({  displayName: "IconeCarro",  viewBox: "0 0 24 24",  defaultProps: traco,  path: (
    <>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </>
)});

export const IconeVaga = createIcon({ displayName: "IconeVaga", viewBox: "0 0 24 24", defaultProps: traco, path: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </>
)});

export const IconeCartao = createIcon({  displayName: "IconeCartao",  viewBox: "0 0 24 24",  defaultProps: traco,  path: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.2 15a3 3 0 0 1 5.6 0M15 10h3M15 14h3" />
    </>
)});

export const IconeAndares = createIcon({  displayName: "IconeAndares",  viewBox: "0 0 24 24",  defaultProps: traco,  path: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
});

export const IconeChave = createIcon({  displayName: "IconeChave",  viewBox: "0 0 24 24",  defaultProps: traco,  path: (
    <path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
)});

export const IconeCasa = createIcon({  displayName: "IconeCasa",  viewBox: "0 0 24 24",  defaultProps: traco,  path: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
)});

export const IconeUsuario = createIcon({  displayName: "IconeUsuario",  viewBox: "0 0 24 24",  defaultProps: traco,  path: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
)});

/* Quadradinho colorido que abriga um ícone */
export const IconeTile = ({  icone: Icone,  cor = "blue",  tamanho = 10,}: {  icone: ElementType;  cor?: string;  tamanho?: number}) => (
  <Flex align="center" justify="center" flexShrink={0} boxSize={tamanho} borderRadius="lg" bg={cor === "gray" ? "white" : `${cor}.50`}
    color={`${cor}.500`} border="1px solid" borderColor={cor === "gray" ? "gray.100" : "transparent"}  >
    <Icone boxSize={tamanho > 8 ? 5 : 4} />
  </Flex>
);
