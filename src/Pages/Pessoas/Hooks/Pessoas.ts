import { useCallback, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { listarPessoas } from "../API/ListarPessoas";
import { criarPessoa } from "../API/CriarPessoa";
import { editarPessoa } from "../API/EditarPessoa";
import { excluirPessoa } from "../API/ExcluirPessoas";
import type { Pessoa, PessoaCriarDados, PessoaEditarDados } from "../ConfigPessoas";

export function usePessoas() {
  const toast = useToast();

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  const mensagem = (erro: unknown, padrao: string) => (erro instanceof Error ? erro.message : padrao);

  const carregarPessoas = useCallback(async () => {
    try {
      setCarregando(true);
      setPessoas(await listarPessoas());
    } catch (erro) {
      toast({ title: mensagem(erro, "Erro ao carregar pessoas"), status: "error" });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  const criar = useCallback(async (dados: PessoaCriarDados): Promise<boolean> => {
    try {
      setCriando(true);
      await criarPessoa(dados);
      await carregarPessoas();
      toast({ title: "Pessoa cadastrada", status: "success" });
      return true;
    } catch (erro) {
      toast({ title: mensagem(erro, "Erro ao cadastrar pessoa"), status: "error" });
      return false;
    } finally {
      setCriando(false);
    }
  }, [carregarPessoas, toast]);

  const editar = useCallback(async (id: string, dados: PessoaEditarDados): Promise<boolean> => {
    try {
      await editarPessoa(id, dados);
      await carregarPessoas();
      toast({ title: "Pessoa atualizada", status: "success" });
      return true;
    } catch (erro) {
      toast({ title: mensagem(erro, "Erro ao atualizar pessoa"), status: "error" });
      return false;
    }
  }, [carregarPessoas, toast]);

  const excluir = useCallback(async (id: string): Promise<boolean> => {
    if (!window.confirm("Excluir permanentemente esta pessoa? Ela sai de todos os apartamentos, e os residentes ligados a ela também.")) {
      return false;
    }
    try {
      await excluirPessoa(id);
      await carregarPessoas();
      toast({ title: "Pessoa excluída", status: "success" });
      return true;
    } catch (erro) {
      toast({ title: mensagem(erro, "Erro ao excluir pessoa"), status: "error" });
      return false;
    }
  }, [carregarPessoas, toast]);

  useEffect(() => { carregarPessoas(); }, [carregarPessoas]);

  return { pessoas, carregando, criando, criar, editar, excluir, carregarPessoas };
}
