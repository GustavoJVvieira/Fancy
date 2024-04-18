import express from "express"
import database from "../database/database.js"
import bcrypt from "bcrypt"

const router = express.Router()

router.get("/", (req, res) => {
    
    database.select("*").where({id : req.user.id}).table("perfil").then(perfil => {
        database.select("*").where({id_perfil : req.user.id}).table("membros").then(membros => {
            database.select("*").where({id_perfil : req.user.id}).table("fornecedor").then(fornecedor => {
                database.select("*").where({ id_perfil: req.user.id , ativo: 1 }).table("projeto").then(projeto =>{
                   
                    res.render("usuario/index", {perfil : perfil, membros : membros, fornecedor : fornecedor, projeto : projeto})
            })
            });
         
        });
    });
})

// CADASTRO PERFIL

router.get("/cadastro_perfil", (req, res) => {
    res.render("usuario/cadastro_perfil")
})

router.post("/cadastro_perfil", (req, res) => {

    let erros = []

    if (!req.body.nome || req.body.nome == undefined || req.body.nome == null) {
        erros.push({ error: "Nome Invalido" })
    }
    if (!req.body.senha || req.body.senha == undefined || req.body.senha == null) {
        erros.push({ error: "Senha Invalida" })
    }

    if (!req.body.email || req.body.email == undefined || req.body.email == null) {
        erros.push({ error: "Email Invalido" })
    }
    if (req.body.senha !== req.body.senha2) {
        erros.push({ error: "Senhas não Semelhantes" })
    }


    if (erros.length > 0) {

        res.render("usuario/cadastro_perfil", { erros: erros })
    }

    else {

        const NovoPerfil = {

            nome: req.body.nome,
            senha: req.body.senha,
            email: req.body.email
        }
    
        database.select("email").where({ email: NovoPerfil.email }).table("perfil").then((email) => {
            if (email.length > 0) {

                console.log(email)
                req.flash('error_msg', 'Email já Cadastrado!')
                res.redirect("/usuario/cadastro_perfil")

            } else {

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(NovoPerfil.senha, salt, (err, hash) => {

                        NovoPerfil.senha = hash;
                        console.log(hash)
                        database.insert(NovoPerfil).into("perfil").then(data => {

                            req.flash('success_msg', 'Cadastro Feito!')
                            res.redirect("/")
                            console.log(`${data} Cadastro foi pro BD`)

                        }).catch(err => {
                            req.flash('error_msg', 'deu pau')
                            erros.push({ error: "Ops, Algo deu Errado!" })
                            res.render("usuario/cadastro_perfil", { erros: erros })

                            console.log(err)
                        })
                    })
                })
            }
        })
    }
})


//CADASTRO MEMBROS
router.get("/cadastro_membros", (req, res) => {
    res.render("usuario/cadastro_membros")
   
})

router.post("/cadastro_membros", (req, res) => {
    let erros = [];

    if (!req.body.nome_membros || req.body.nome_membros == undefined || req.body.nome_membros == null) {
        erros.push({ error: "Nome Invalido" })
    }
    if (!req.body.endereco_membro || req.body.endereco_membro == undefined || req.body.endereco_membro == null) {
        erros.push({ error: "Endereço Invalido" })
    }

    if (erros.length > 0) res.render("usuario/cadastro_membros", { erros: erros })

    else {
       

        const NovoMembro = {

            id_perfil: req.user.id,
            nome_membros: req.body.nome_membros,
            endereco_membros: req.body.endereco_membro

        }

        database.insert(NovoMembro).into("membros").then(data => {
            
            let teste = [ ]

            teste.push({data : data})
            console.log(teste[0].data[0]);


            req.flash('success_msg', 'Cadastro Feito!')
            res.redirect("/usuario")
            console.log(`${data} Cadastro foi pro BD`)

        }).catch(err => {
            req.flash('error_msg', 'deu pau')
            erros.push({ error: "Ops, Algo deu Errado!" })
            res.render("usuario/cadastro_membros", { erros: erros })

            console.log(err)
        })

    }

})

// CADASTRO FORNECEDORES 

router.get("/cadastro_fornecedor", (req, res) => {
    res.render("usuario/cadastro_fornecedor");
})

router.post("/cadastro_fornecedor", (req, res) => {

    let erros = [];

    if (!req.body.nome_fornecedor || req.body.nome_fornecedor == undefined || req.body.nome_fornecedor == null) {
        erros.push({ error: "Nome Invalido" })
    }
    if (!req.body.desc_fornecedor || req.body.desc_fornecedor == undefined || req.body.desc_fornecedor == null) {
        erros.push({ error: "Descrição Invalida" })
    }

    if (erros.length > 0) res.render("usuario/cadastro_fornecedor", { erros: erros })

    else {
        const NovoFornecedor = {
            id_perfil: req.user.id,
            nome: req.body.nome_fornecedor,
            desc_fornecedor: req.body.desc_fornecedor
        }

        // joga pro banco de dados
        database.insert(NovoFornecedor).into("fornecedor").then(data => {

            req.flash('success_msg', 'Cadastro Feito!')
            res.redirect("/usuario")
            console.log(`${data} Cadastro foi pro BD`)

        }).catch(err => {
            req.flash('error_msg', 'deu pau')
            erros.push({ error: "Ops, Algo deu Errado!" })
            res.render("usuario/cadastro_perfil", { erros: erros })

            console.log(err)
        })
    }
})

//DELETAR MEMBROS

router.post("/deletar_membro", (req, res) => {
    console.log(req.body.membro)


   database.where({id_membros : req.body.membro }).delete().table("membros").then(d => {
    req.flash('success_msg', 'Usuario Apagado com Sucesso!')
    res.redirect("/usuario")
    console.log(`${d} Apagado`)

   }).catch(err => {
            req.flash('error_msg', 'Ops! Houve um Erro.')
            res.redirect("/usuario")
            
   console.log(err)
   })
})

//DELETAR FORNECEDOR

router.post("/deletar_fornecedor", (req, res) => {
    console.log(req.body.fornecedor)


   database.where({id : req.body.fornecedor }).delete().table("fornecedor").then(d => {
    req.flash('success_msg', 'Fornecedor Apagado com Sucesso!')
    res.redirect("/usuario")
    console.log(`${d} Apagado`)

   }).catch(err => {
            req.flash('error_msg', 'Não é possivel Apagar o Fornecedor associado a um Projeto!')
            res.redirect("/usuario")
            
   console.log(err)
   })
})




router.get("/logout", (req, res) =>{
    req.logout()
    res.redirect("/")
})
export default router;