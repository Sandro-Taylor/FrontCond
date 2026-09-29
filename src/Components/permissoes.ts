// ---------------------------------------------------------
// PERMISSÕES POR PERFIL (espelham App/dependencies.py)
// ---------------------------------------------------------
//   ADM, SINDICO ............ veem e editam tudo
//   CONSELHEIRO, FUNCIONARIO  veem tudo, não editam
//   MORADOR ................. vê e edita só as próprias unidades
//                             (pessoas, veículos); vagas só vê
//   PRESTADOR ............... só a página inicial
// TAREFAS: ADM/SINDICO criam e designam; CONSELHEIRO vê todas;
//          FUNCIONARIO vê as dele; MORADOR/PRESTADOR sem acesso
// FINANCEIRO: ADM/SINDICO lançam; CONSELHEIRO vê tudo;
//             MORADOR vê só as próprias unidades
// O backend valida tudo de novo; aqui é só para esconder o
// que o perfil não pode usar.
// ---------------------------------------------------------

import { useAuth, type Perfil } from "../Pages/Login/useAuth";

export type Permissoes = {
  editaTudo: boolean;       // criar/editar/excluir qualquer coisa do condomínio
  veTudo: boolean;          // ver todas as unidades, vagas, veículos e pessoas
  editaUnidade: boolean;    // editar pessoas e veículos (morador: só das próprias unidades)
  acessaCadastros: boolean; // entrar em Apartamentos, Veículos e Pessoas
  veFinanceiroTudo: boolean; // ver as cotas de todas as unidades
  acessaFinanceiro: boolean; // entrar em Financeiro
  acessaTarefas: boolean;    // entrar em Tarefas
};

export function calcularPermissoes(perfil: Perfil | null | undefined): Permissoes {
  const editaTudo = perfil === "ADM" || perfil === "SINDICO";
  const veTudo = editaTudo || perfil === "CONSELHEIRO" || perfil === "FUNCIONARIO";
  const morador = perfil === "MORADOR";
  const veFinanceiroTudo = editaTudo || perfil === "CONSELHEIRO";
  return {
    editaTudo, veTudo, editaUnidade: editaTudo || morador, acessaCadastros: veTudo || morador,
    veFinanceiroTudo, acessaFinanceiro: veFinanceiroTudo || morador, acessaTarefas: veTudo,
  };
}

export function usePermissoes(): Permissoes {
  const { user, condominioAtual } = useAuth();
  return calcularPermissoes(condominioAtual?.perfil ?? (user?.admin_sistema ? "ADM" : null));
}
