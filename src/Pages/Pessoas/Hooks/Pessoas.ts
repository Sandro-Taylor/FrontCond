import { useCallback, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { listarPessoas } from "../API/ListarPessoas";
import { criarPessoa } from "../API/CriarPessoa";
import { editarPessoa } from "../API/EditarPessoa";
import { excluirPessoa } from "../API/ExcluirPessoas";

import {
  adicionarVaga,
  adicionarVeiculo,
  adicionarVeiculoPessoa,
  type NovaVagaDados,
  type NovoVeiculoDados,
} from "./AdicionarEstruturaPessoa";

import {
  editarApartamento,
  editarVinculo,
  editarVaga,
  editarVeiculo,
} from "./EditarEstruturaPessoa";

import {
  excluirApartamento,
  excluirVinculo,
  excluirVaga,
  excluirVeiculo,
} from "./ExcluirEstruturaPessoa";

import type {
  Pessoa,
  PessoaCriarDados,
  PessoaEditarDados,
  ApartamentoEditarDados,
  VinculoEditarDados,
  VagaEditarDados,
  VeiculoEditarDados,
} from "../ConfigPessoas";

export function usePessoas() {
  const toast = useToast();

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  const carregarPessoas = useCallback(async () => {
    try {
      setCarregando(true);
      setPessoas(await listarPessoas());
    } catch (erro) {
      toast({
        title: erro instanceof Error ? erro.message : "Erro ao carregar pessoas",
        status: "error",
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  const criar = useCallback(
    async (dados: PessoaCriarDados): Promise<boolean> => {
      if (!dados.nome.trim()) {
        toast({
          title: "Informe o nome",
          status: "warning",
        });

        return false;
      }

      try {
        setCriando(true);

        await criarPessoa(dados);
        await carregarPessoas();

        toast({
          title: "Pessoa cadastrada",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao cadastrar pessoa",
          status: "error",
        });

        return false;
      } finally {
        setCriando(false);
      }
    },
    [carregarPessoas, toast]
  );

  const editar = useCallback(
    async (
      id: string,
      dados: PessoaEditarDados
    ): Promise<boolean> => {
      try {
        await editarPessoa(id, dados);
        await carregarPessoas();

        toast({
          title: "Pessoa atualizada",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao atualizar pessoa",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const editarApartamentoDados = useCallback(
    async (
      id: string,
      dados: ApartamentoEditarDados
    ): Promise<boolean> => {
      try {
        await editarApartamento(id, dados);
        await carregarPessoas();

        toast({
          title: "Apartamento atualizado",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao atualizar apartamento",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const editarVinculoDados = useCallback(
    async (
      id: string,
      dados: VinculoEditarDados
    ): Promise<boolean> => {
      try {
        await editarVinculo(id, dados);
        await carregarPessoas();

        toast({
          title: "Vínculo atualizado",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao atualizar vínculo",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const editarVagaDados = useCallback(
    async (
      id: string,
      dados: VagaEditarDados
    ): Promise<boolean> => {
      try {
        await editarVaga(id, dados);
        await carregarPessoas();

        toast({
          title: "Vaga atualizada",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao atualizar vaga",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const editarVeiculoDados = useCallback(
    async (
      id: string,
      dados: VeiculoEditarDados
    ): Promise<boolean> => {
      try {
        await editarVeiculo(id, dados);
        await carregarPessoas();

        toast({
          title: "Veículo atualizado",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao atualizar veículo",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const adicionarVagaDados = useCallback(
    async (
      apartamentoId: string,
      dados: NovaVagaDados
    ): Promise<boolean> => {
      try {
        await adicionarVaga(apartamentoId, dados);
        await carregarPessoas();

        toast({
          title: "Vaga adicionada",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao adicionar vaga",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const adicionarVeiculoDados = useCallback(
    async (
      vagaId: string,
      dados: NovoVeiculoDados
    ): Promise<boolean> => {
      try {
        await adicionarVeiculo(vagaId, dados);
        await carregarPessoas();

        toast({
          title: "Veículo adicionado",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao adicionar veículo",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const adicionarVeiculoPessoaDados = useCallback(
    async (
      pessoaId: string,
      dados: Omit<NovoVeiculoDados, "pessoa_id">
    ): Promise<boolean> => {
      try {
        await adicionarVeiculoPessoa(pessoaId, dados);
        await carregarPessoas();

        toast({
          title: "Veículo adicionado",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao adicionar veículo",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const excluir = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm("Excluir permanentemente esta pessoa?")) {
        return false;
      }

      try {
        await excluirPessoa(id);
        await carregarPessoas();

        toast({
          title: "Pessoa excluída",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao excluir pessoa",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const excluirApartamentoDados = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm("Excluir este apartamento?")) {
        return false;
      }

      try {
        await excluirApartamento(id);
        await carregarPessoas();

        toast({
          title: "Apartamento excluído",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao excluir apartamento",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const excluirVinculoDados = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm("Remover o vínculo com este apartamento?")) {
        return false;
      }

      try {
        await excluirVinculo(id);
        await carregarPessoas();

        toast({
          title: "Vínculo removido",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao remover vínculo",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const excluirVagaDados = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm("Excluir esta vaga?")) {
        return false;
      }

      try {
        await excluirVaga(id);
        await carregarPessoas();

        toast({
          title: "Vaga excluída",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao excluir vaga",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  const excluirVeiculoDados = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm("Excluir este veículo?")) {
        return false;
      }

      try {
        await excluirVeiculo(id);
        await carregarPessoas();

        toast({
          title: "Veículo excluído",
          status: "success",
        });

        return true;
      } catch (erro) {
        toast({
          title:
            erro instanceof Error
              ? erro.message
              : "Erro ao excluir veículo",
          status: "error",
        });

        return false;
      }
    },
    [carregarPessoas, toast]
  );

  useEffect(() => {
    carregarPessoas();
  }, [carregarPessoas]);

  return {
    pessoas,
    carregando,
    criando,

    criar,
    editar,

    editarApartamento: editarApartamentoDados,
    editarVinculo: editarVinculoDados,
    editarVaga: editarVagaDados,
    editarVeiculo: editarVeiculoDados,

    adicionarVaga: adicionarVagaDados,
    adicionarVeiculo: adicionarVeiculoDados,
    adicionarVeiculoPessoa: adicionarVeiculoPessoaDados,

    excluir,
    excluirApartamento: excluirApartamentoDados,
    excluirVinculo: excluirVinculoDados,
    excluirVaga: excluirVagaDados,
    excluirVeiculo: excluirVeiculoDados,

    carregarPessoas,
  };
}
