const jwt = require('jsonwebtoken')
const Constants = require('../Constants')
const TOKEN_SECRET = "supersecret";

const createUserToken = async (user, req, res) => {

    const token = jwt.sign({
        name: user.name,
        id: user._id
    }, TOKEN_SECRET, {
        expiresIn: '1h'
    })

    res.status(200).json({
        message: "Você está autenticado",
        token,
        userId: user._id
    })
}

const getTokenFromHeader = (req) => {

    const authHeader = req.headers.authorization
    const token = authHeader.split(Constants.BLANK_SPACE)[1]

    return token
}
const getDecodedToken = (token) => {
    return jwt.verify(token, TOKEN_SECRET)
}

const verifyToken = (req, res, next) => {

    if (!req.headers.authorization) {
        return res.status(401).json({ message: "Não autorizado." })
    }

    const token = getTokenFromHeader(req);

    if (!token) {
        return res.status(401).json({ message: "Não autorizado." })
    }

    try {
        const userVerified = getDecodedToken(token)
        req.user = userVerified
        next()
    } catch (err) {
        return res.status(401).json({ message: "Token inválido" })
    }
}

module.exports = {
    createUserToken,
    getTokenFromHeader,
    getDecodedToken,
    verifyToken
}