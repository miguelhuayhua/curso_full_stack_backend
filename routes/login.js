import express from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, evaluarPassword } from '../helpers/auth.js';
import { generarAccesToken, generarRefreshToken } from '../helpers/tokens.js'
export const LOGIN_ROUTER = express.Router();


LOGIN_ROUTER.post("/signup", async (req, res) => {
    const { nombre, password, telefono, email } = req.body;
    let usuario = await prisma.usuario.findUnique({ where: { email: email } });
    if (usuario) {
        return res.json({ mensaje: "Credenciales inválidas" }).status(400)
    }
    await prisma.usuario.create({
        data: {
            nombre,
            email,
            telefono,
            password: hashPassword(password)
        }
    })
    return res.json({ mensaje: "Usuario creado" }).status(200)

})


LOGIN_ROUTER.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
        return res.json({ mensaje: "Credenciales inválidas", estado: 400 }).status(400)
    }

    if (evaluarPassword(password, usuario.password)) {
        const accessToken = generarAccesToken({ sub: usuario.id, rol: usuario.rol })
        const refreshToken = generarRefreshToken({ sub: usuario.id, rol: usuario.rol })
        await prisma.token_sis.create({
            data: {
                token: refreshToken, expira_en: new Date(), usuario_id: usuario.id
            }
        })
        res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "none", secure: true, maxAge: 60 * 60 * 24 * 7 });
        return res.json({ accessToken, estado: 200, mensaje: "Usuario logueado exitosamente" }).status(200);
    }
    else {
        return res.json({ mensaje: "Credenciales inválidas", estado: 401 }).status(401)
    }
})

