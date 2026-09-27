import { useCallback, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { listarProjetos } from "../API/ListarProjetos";
import { criarProjeto } from "../API/CriarProjetos";
import { atualizarCampo } from "../API/EditarProjetos";
import { arquivarProjeto } from "../API/ArquivarProjetos";
import { restaurarProjeto } from "../API/RestaurarProjetos";
import { excluirProjeto } from "../API/ExcluirProjetos";

import type { Projeto } from "../ConfigProjetos";

export function useProjetos() {
    const toast = useToast();
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [criando, setCriando] = useState(false);

    const carregar = useCallback(async () => {
        try {
            setCarregando(true);
            const dados = await listarProjetos();
            setProjetos(dados);
        }
        catch {toast({ title: "Erro ao carregar projetos", status: "error" })}
        finally {setCarregando(false)}
    }, [toast]);

    const criar = useCallback(
        async (projeto: string, descricao: string) => {
            if (!projeto.trim()) {
                toast({ title: "Informe o nome do projeto", status: "warning" });
                return;
            }
            try {
                setCriando(true);
                await criarProjeto(projeto, descricao);
                await carregar();
            }
            catch {toast({ title: "Erro ao criar projeto", status: "error" })}
            finally {setCriando(false)}
        },[carregar, toast]
    );

    const arquivar = useCallback(
        async (id: string) => {
            const confirmar = window.confirm("Deseja arquivar este projeto?");
            if (!confirmar) return;
            try {
                await arquivarProjeto(id);
                await carregar();
                toast({title: "Projeto arquivado",status: "success"});
            }
            catch { toast({ title: "Erro ao arquivar projeto", status: "error"})}
        },[carregar, toast]
    );

    const restaurar = useCallback(
        async (id: string) => {
            try {
                await restaurarProjeto(id);
                await carregar();
                toast({title: "Projeto restaurado",status: "success"});
            }
            catch {toast({title: "Erro ao restaurar projeto",status: "error"})}
        },[carregar, toast]
    );

    const excluir = useCallback(
        async (id: string) => {
            const confirmar = window.confirm("Excluir permanentemente este projeto? Essa ação não pode ser desfeita.");
            if (!confirmar) return;
            try {
                await excluirProjeto(id);
                await carregar();
                toast({title: "Projeto excluído",status: "success"});
            }
            catch {toast({title: "Erro ao excluir projeto",status: "error"})}
        },[carregar, toast]
    );

    const editarCampo = useCallback(
        async (id: string,campo: "projeto" | "descricao",valor: string) => {
            try {
                await atualizarCampo(id, campo, valor);
                await carregar();
                toast({title: "Projeto atualizado",status: "success"});
            }
            catch {toast({title: "Erro ao atualizar projeto",status: "error"})}
        },[carregar, toast]
    );

    useEffect(() => {carregar()}, [carregar]);

    return {
        projetos,
        carregando,
        criando,
        criar,
        editarCampo,
        arquivar,
        restaurar,
        excluir,
    };
}
