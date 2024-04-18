import express from "express"
import database from "../database/database.js"


const router = express.Router()

router.get("/", (req, res) => {

    database.select("*").where({ id_perfil: req.user.id, ativo: 1 }).table("projeto").then(projeto => {

        if (projeto.length > 0) {

            database.select(database.raw("historico.data_his,producao.id_historico, sum(qnt_produzida) as total")).where({ "producao.id_projeto": projeto[0].id }).table("producao").join("historico", "historico.id", "producao.id_historico").groupBy("id_historico").then(producao => {
                if (producao.length > 0) {

                    

                    let contador = 0;

                    for (let i = 0; i < producao.length; i++) {

                        contador += Number(producao[i].total);
                    }

                    
                    let porcentagem = (contador / projeto[0].quant_peca) * 100;

                   


                    res.render("projeto/index", { projeto: projeto, porcentagem: porcentagem, producao: producao })

                } else {
                    res.render("projeto/index", { projeto: projeto })
                }
            })

        } else {

            res.render("projeto/index", { projeto: projeto })
        }

    }).catch(err => {
        console.log(err)
    })

})

// CADASTRAR PROJETO 

router.get("/cadastrar", (req, res) => {

    database.select("*").where({ id_perfil: req.user.id }).table("fornecedor").then(fornecedor => {
        console.log(fornecedor)
        res.render("projeto/cadastro_projeto", { fornecedor: fornecedor })
    })

})

router.post("/cadastrar", (req, res) => {

    let erros = [];

    if (!req.body.nome_projeto || req.body.nome_projeto == undefined || req.body.nome_projeto == null) {
        erros.push({ error: "Nome Invalido" })
    } if (!req.body.valor_recebido || req.body.valor_recebido == undefined || req.body.valor_recebido == null) {
        erros.push({ error: "Valor Recebido Inválido" })
    } if (!req.body.data_inicio || req.body.data_inicio == undefined || req.body.data_inicio == null) {
        erros.push({ error: "Data de Inicio Inválida" })
    } if (req.body.data_inicio > req.body.data_fim) {
        erros.push({ error: "Datas não Coincidem!" })
    } if (!req.body.data_fim || req.body.data_fim == undefined || req.body.data_fim == null) {
        erros.push({ error: "Data de Fim Inválida" })
    } if (!req.body.custo_projeto || req.body.custo_projeto == undefined || req.body.custo_projeto == null) {
        erros.push({ error: "Custo de Projeto Inválido" })
    } if (!req.body.desc_peca || req.body.desc_peca == undefined || req.body.desc_peca == null) {
        erros.push({ error: "Descrição da Peça Inválida" })
    } if (!req.body.quant_peca || req.body.quant_peca == undefined || req.body.quant_peca == null) {
        erros.push({ error: "Quantidade de Peças Inválida" })
    } if (!req.body.valor_peca || req.body.valor_peca == undefined || req.body.valor_peca == null) {
        erros.push({ error: "Valor de Peça Inválido" })
    }



    if (erros.length > 0) res.render("projeto/cadastro_projeto", { erros: erros })

    else {


        const NovoProjeto = {
            id_perfil: req.user.id,
            id_fornecedor: req.body.fornecedor,
            nome: req.body.nome_projeto,
            valor_recebido: req.body.valor_recebido,
            desc_projeto: req.body.desc_projeto,
            data_inicio: req.body.data_inicio,
            data_fim: req.body.data_fim,
            custo: req.body.custo_projeto,
            desc_peca: req.body.desc_peca,
            quant_peca: req.body.quant_peca,
            valor_peca: req.body.valor_peca,
            ativo: true
        }

        database.select("ativo").where({ id_perfil: req.user.id, ativo: 1 }).table("projeto").then(data => {



            if (data.length > 0) {

                req.flash('error_msg', 'Já Existe um Projeto criado, Por Favor Finalize-o para a Criação de Outro')
                res.redirect("/projeto/cadastrar")
            } else {


                database.insert(NovoProjeto).into("projeto").then(data => {

                    req.flash('success_msg', 'Cadastro Feito!')
                    res.redirect("/projeto/sequencia")
                    console.log(`${data} Cadastro foi pro BD`)

                }).catch(err => {
                    req.flash('error_msg', 'deu pau')
                    erros.push({ error: "Ops, Algo deu Errado!" })
                    res.render("projeto/cadastro_projeto", { erros: erros })

                    console.log(err)
                })
            }
        })
    }



})


//Sequencia Operacional
router.get("/sequencia", (req, res) => {
    database.select("*").where({ id_perfil: req.user.id, ativo: 1 }).table("projeto").then(projeto => {
        database.select("*").where({ id_projeto: projeto[0].id }).table("sequencia").then(sequencia => {
            res.render("projeto/sequencia", { projeto: projeto, sequencia: sequencia })
        })
    })
})

router.post("/sequencia", (req, res) => {



    const Sequencia = {

        id_projeto: req.body.projeto,
        maquina: req.body.maquina,
        descricao: req.body.desc,
        tempo: req.body.tempo

    }

    database.insert(Sequencia).into("sequencia").then(data => {

        req.flash('success_msg', 'Cadastro Feito!')
        res.redirect("/projeto/sequencia")
        console.log(`${data} Cadastro foi pro BD`);


    })



})


//HISTORICO SEQUENCIA 

router.get("/historico_sequencia", (req, res) => {


    database.select("*").where({ id_perfil: req.user.id, ativo: 1 }).table("projeto").then(projeto => {

        if (projeto.length > 0) {
            console.log(projeto[0].id)

            database.select("*").where({ id_projeto: projeto[0].id }).table("sequencia").then(sequencia => {
                console.log(sequencia)

                database.select(database.raw("to_days(data_fim) - to_days(data_inicio) as dias")).where({ id_perfil: req.user.id, ativo: 1 }).table("projeto").then(dias => {
                    let tempo = 0

                    for (let i = 0; i < sequencia.length; i++) {
                        tempo += sequencia[i].tempo
                    }

                    console.log(tempo)

                    let dias_ = dias[0].dias


                    let horas = Math.ceil((60 / tempo) * 8) // quanto eu faço por dia
                    let valor_maximo = Math.ceil(horas * projeto[0].valor_peca) // valor por dia 

                    let por_dia = Math.ceil(projeto[0].quant_peca / dias[0].dias)
                    let valor_dia = Math.ceil(por_dia * projeto[0].valor_peca)


                    res.render("projeto/historico_sequencia", {
                        sequencia: sequencia, projeto: projeto, tempo: tempo, por_dia: por_dia, valor_dia: valor_dia,
                        horas: horas, valor_maximo: valor_maximo, dias_: dias_
                    })

                })




            })
        }

    })


})
// ATUALIZAR PROJETO

router.get("/atualizar", (req, res) => {
    database.select("*").where({ id_perfil: req.user.id }).table("membros").then(membros => {

        database.select("*").where({ id_perfil: req.user.id, ativo: 1 }).table("projeto").then(projeto => {

            res.render("projeto/atualiza_projeto", { membros: membros, projeto: projeto })
        })

    })

})

router.post("/atualizar", async (req, res) => {
    
    let erros = [];



    if (req.body.data > req.body.data_fim) {
        erros.push({ error: "Atualização após data de Finalização do Projeto!" })
    } if (req.body.data < req.body.data_inicio) {
        erros.push({ error: "Atualização anterior a data de Criação do Projeto!" })
    }

    if (erros.length > 0) res.render("projeto/atualiza_projeto", { erros: erros })

    else {

        if (req.body.finaliza == "sim") {

            await database.where({ id_perfil: req.user.id }, { ativo: 1 }).update({ ativo: 0 }).table("projeto").then(a => {
                console.log(a + "deu certo")
            })
        }

        const NovoHistorico = {

            id_projeto: req.body.projeto,
            observacao: req.body.observacao,
            data_his: req.body.data,
            custo_adicional: req.body.c_adc

        }

        await database.insert(NovoHistorico).into("historico").then(async (id) => {

            let a = [];
            a.push({ id: id });


            for (let campo in req.body) {
                if (campo.startsWith("membro_")) {
                    let idmembro = Number(campo.split("_")[1]);
                    const NovaAtualização = {

                        id_historico: a[0].id[0],
                        id_projeto: req.body.projeto,
                        id_membros: idmembro,
                        qnt_produzida: req.body[campo],

                    }

                    await database.insert(NovaAtualização).into("producao").then(at => {
                        req.flash('success_msg', 'Atualização Feita!')
                        res.set('Cache-Control', 'no-store')

                       
                        console.log(`${at} Cadastro foi pro BD`)
                    }).catch(err => {

                        console.log(err)
                    })
                }


            }
                res.redirect("/projeto")

        }).catch(err => {

            console.log(err)
        })



    }
})


// HISTORICO
router.get("/historico", async (req, res) => {

    let projeto = await database.select("*").where({ id_perfil: req.user.id, ativo: 0 }).table("projeto");
        
    for (let i = 0; i < projeto.length; i++) {

        let historico = await database.select("*").where({ id_projeto: projeto[i].id }).table("historico");
        
        let contador = 0
        for (let i = 0; i < historico.length; i++) {
            contador += Number(historico[i].custo_adicional);
        }

        let custo_total = contador + Number(projeto[i].custo)
        let valor_final = Number(projeto[i].valor_recebido) - custo_total
        
        await database.where({ id: projeto[i].id }).update({ valor_final: valor_final }).table("projeto")
        projeto[i].valor_final =  valor_final;

    }

    res.render("projeto/historico_projeto", { projeto: projeto })

})

// APAGAR PROJETO
router.post("/apagar", (req, res) => {

    console.log(req.body.id)

    database.where({ id_projeto: req.body.id }).delete().table("producao").then(b => {
        database.where({ id_projeto: req.body.id }).delete().table("historico").then(d => {
            database.where({ id_projeto: req.body.id }).delete().table("sequencia").then(c => {
                database.where({ id: req.body.id }).delete().table("projeto").then(a => {

                    req.flash('success_msg', ' Apagado com Sucesso!')
                    res.redirect("/projeto")
                    console.log(`${b} Apagado`)
                    console.log(`${d} Apagado`)
                    console.log(`${a} Apagado`)
                    console.log(`${c} Apagado`)
                }).catch(err => {

                    req.flash('error_msg', 'Não foi possivel apagar o ')
                    res.redirect("/projeto")

                    console.log(err)
                })

            }).catch(err => {

                req.flash('error_msg', 'Não foi possivel apagar o ')
                res.redirect("/projeto")

                console.log(err)
            })

        }).catch(err => {
            req.flash('error_msg', 'Não é possivel Apagar o Fornecedor associado a um Projeto!')
            res.redirect("/projeto")

            console.log(err)
        })
    })

})
export default router;
