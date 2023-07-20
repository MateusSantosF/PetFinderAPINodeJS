const { createUserToken, getTokenFromHeader, getDecodedToken } = require('../helpers/JwtManager')
const { body, header, check, param, validationResult } = require('express-validator')

const User = require('../models/User')
const bcrypt = require('bcrypt')
const GetUserByToken = require('../helpers/GetUserByToken')

module.exports = class UserController {

    static async register(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        const { name, email, password, phone } = req.body


        const hashPassword = await generateHashedPasswordAsync(password);
        const user = new User({ name, email, password: hashPassword, phone });
        try {
            const newUser = await user.save()
            await createUserToken(newUser, req, res)
        } catch (error) {
            res.status(500).json({ message: "Erro ao criar usuário" })
        }
    }

    static async login(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        await createUserToken(user, req, res)
    }

    static async checkUser(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(401).json({ errors: errors.array() });
            return;
        }

        res.status(200).send(req.currentUser)
    }

    static async getUserById(req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(401).json({ errors: errors.array() });
            return;
        }
        res.status(200).json({ user: req.user })
    }

    static async editUser(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        if (req.file) {
            req.user.image = req.file.filename;
        }
        const { name, email, password, phone } = req.body;

        if (req.updatePassword) {
            const hashedPassword = await generateHashedPasswordAsync(password);
            req.user.password = hashedPassword
        }

        req.user.name = name
        req.user.email = email
        req.user.phone = phone

        try {
            await User.findByIdAndUpdate(
                { _id: req.user.id },
                { $set: req.user },
                { new: true }
            )
            res.status(200).json({ message: "Usuário atualizado com sucesso!" })
        } catch (error) {
            res.status(500).send({ message: error });
        }

    }
    static validate(method) {

        switch (method) {
            case 'createUser': {
                return [
                    body('name',).exists().withMessage('name is required')
                        .isLength({ min: 3 }).withMessage('min length for name is 3'),
                    body('email').exists().withMessage('E-mail is required.').isEmail().withMessage('Invalid email.').custom(async (value) => {

                        const userExists = await User.findOne({ email: value })
                        if (userExists) {
                            throw new Error('Email already in use.')
                        }

                        return true;
                    }),
                    body('phone').exists().withMessage('Phone is required'),
                    body('confirmPassword').isLength({ min: 6 }).withMessage('Min length is 6 chars')
                        .exists().withMessage('confirmPassword is required'),
                    body('password').isLength({ min: 6 }).withMessage('Min length for password is 6 chars').custom(async (value, { req }) => {

                        if (value !== req.body.confirmPassword) {
                            throw new Error('Password\'s dont match')
                        }

                        return true;
                    })
                ]
            }
            case 'login': {
                return [
                    body('email', 'Invalid email')
                        .exists()
                        .isEmail()
                        .custom(async (value, { req }) => {
                            const userExists = await User.findOne({ email: value })

                            if (!userExists || userExists == null) {
                                throw new Error('User not found')
                            }
                            req.user = userExists;
                            return true;
                        }),
                    body('password', 'Invalid password.').exists().isLength({ min: 5 })
                        .custom(async (value, { req }) => {

                            if (!req.user) {
                                return false
                            }
                            const checkedPassword = await checkPassword(value, req.user.password)

                            if (!checkedPassword) {
                                throw new Error('Invalid password')
                            }
                            return true;
                        })
                ]
            }
            case 'checkUser': {
                return [
                    header('Authorization').custom(async (_, { req }) => {

                        if (!req.headers.authorization) {
                            req.currentUser = null;
                            return true;
                        }
                        const token = getTokenFromHeader(req)
                        if (!token) {
                            throw new Error('Check the authentication method.')
                        }
                        const decoded = getDecodedToken(token)
                        const currentUser = await User.findById(decoded.id).select('-password')

                        req.currentUser = currentUser;
                        return true;
                    })
                ]
            }
            case 'getUserById': {
                return [
                    param('id').exists().withMessage("Id is required.")
                        .custom(async (value, { req }) => {
                            let user;
                            try {
                                user = await User.findById(value).select('-password');
                            } catch (error) {
                                throw new Error(`Could not find a user with id ${value}`)
                            }

                            if (!user) {
                                throw new Error('User not found.')
                            }
                            req.user = user;
                        })]
            }
            case 'edit': {
                return [
                    header('authorization')
                        .custom(async (value, { req }) => {
                            const user = await GetUserByToken(req);
                            if (!user) {
                                throw new Error(`Não foi possível encontrar um usuário com id ${user.id}`)
                            }
                            req.user = user;
                        }),
                    body('name').exists().withMessage('name is required')
                        .isLength({ min: 3 }).withMessage('min length for name is 3')
                        .custom((value, { req }) => {

                            return true;
                        }),
                    body('email', 'Invalid email').exists().isEmail()
                        .custom(async (value, { req }) => {


                            const userExists = await User.findOne({ email: value })
                            if (userExists && value != userExists.email) {
                                throw new Error('Email already in use.')
                            }
                            return true;
                        }),
                    body('phone')
                        .exists().notEmpty().withMessage('Phone is required')
                        .isMobilePhone('pt-BR')
                        .custom((value, { req }) => {
                            return true;
                        }),
                    check('password').custom((value, { req }) => {
                        const password = req.body.password;
                        const confirmPassword = req.body.confirmPassword;

                        if (password) {
                          
                            if (confirmPassword) {               
                                if (password.length < 6 || confirmPassword.length < 6) {
                                    throw new Error('Password\'s length invalid.')
                                }
                                if (password !== confirmPassword) {
                                    throw new Error('Password\'s dont match')
                                }
                                req.updatePassword = true;
                                return true;
                            }
                            else {
                                throw new Error('ConfirmPassword is required.')
                            }
                        }
                        req.updatePassword = false;
                        return true;
                    })
                ]
            }
        }
    }
}


async function generateHashedPasswordAsync(password) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

async function checkPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword)
}
