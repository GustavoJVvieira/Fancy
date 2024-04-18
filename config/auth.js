import localStrategy from "passport-local"
localStrategy.Strategy

import database from "../database/database.js"
import bcrypt, { hash } from "bcrypt"
import passport from "passport"

passport.serializeUser((user, done) =>{
    
    done(null, user[0].id)

    
})

passport.deserializeUser((id , done) => {
    

    database.select("id").where({id : id}).table("perfil").then(user =>{
        done(null,user[0])
        
    })
    

    
    
})

export default  function (passport ){

    passport.use(new localStrategy({usernameField : "email_login", passwordField : "senha_login"}, (email,senha, done) => {

        database.select("*").where({email : email}).table("perfil").then(usuario =>{
           

            if(usuario.length > 0){

                bcrypt.compare(senha, usuario[0].senha, (erro, res) =>{
                    
                    if(res) {
                        
                     
                        return done(null, usuario)

                    }else{
                        console.log("erro")
                        console.log(erro)
                        return done(null, false, {message : "Senha Incorreta"})
                    }
    
                })
                
            } else {
                return done(null, false, {message : "Conta Inexistente"})
            }

        })

    }))
}

