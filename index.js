import express from 'express';
import PROVEEDORES_ROUTER from './routes/proveedores.js';
import { LOGIN_ROUTER } from './routes/login.js';
import AUTH_INDEX_ROUTER from './auth/index.js';
import path from 'path'
import { prisma } from './lib/prisma.js';
import { verificarToken } from './helpers/tokens.js';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { REFRESH_ROUTER } from './routes/refresh_token.js';
const server = express();

server.use(express.json())

server.use(morgan("dev"))
server.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}))
server.use(cookieParser())
server.use("/api/proveedores", PROVEEDORES_ROUTER);

//RUTAS PARA EL LOGIN 
server.use("/api/login", LOGIN_ROUTER);

const middleware = (req, res, next) => {
    let token = req.headers.authorization;
    console.log(token)
    token = token.split(" ")[1]
    const payload = verificarToken(token, "access");
    if (payload) next()
    else {
        res.json({ mensaje: "No autorizado" }).status(401)
    }
}

//RUTA PARA REFRESCAR Y VERIFICAR EL TOKEN

server.use("/api/refresh_token", REFRESH_ROUTER)

server.get("/prueba", async (req, res) => {
    let productos = await prisma.producto.findMany();
    return res.json(productos)

})

//RUTA INDEX PROTEGIDA 
server.use("/api/auth", middleware, AUTH_INDEX_ROUTER)

server.use("/uploads", express.static("upload"))

server.listen(8000, () => {
    console.log("Servidor corriendo en el puerto 8000")
})


