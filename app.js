import express from "express"
import handlebars from "express-handlebars"
import bodyParser from "body-parser"
import session from "express-session"
import flash from "connect-flash"

// pro __dirname funcionar com type module
import path from "path"
import { fileURLToPath } from 'url';

//import de routes do projeto
import usuario from "./routes/usuario.js"
import projeto from "./routes/projeto.js"

//autenticação de Login
import passport from "passport"
import config from "./config/auth.js" 
config(passport)

const app = express();


    // Configs
// Sessions

app.use(session({
    secret : "tccfancy",
    resave: true,
    saveUninitialized : true,
        
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())


//Middleware
app.use((req,res, next) =>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash("error");
    
    next()
})


//body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//Handlebars
app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }));
app.set("view engine", "handlebars")

// Public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/public", express.static(path.join(__dirname,"/public")));


// Rotas
app.use("/usuario", usuario)
app.use("/projeto", projeto)

app.get("/", (req, res) =>{
    res.render("login/inicio")

})


app.post("/", (req, res, next) =>{

passport.authenticate("local", {
    successRedirect: "/usuario",
    failureRedirect : "/",
    failureFlash : true,
})(req,res,next)

})


// porta do servidor
app.listen(8085, () => console.log(" Ta rodando"))