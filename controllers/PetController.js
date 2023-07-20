const GetUserByToken = require('../helpers/GetUserByToken');
const ObjectId = require('mongoose').Types.ObjectId
const Pet = require('../models/Pet')
const { body, param, check, validationResult } = require('express-validator')

module.exports = class PetController {

    static async getAll(req, res) {
        const pets = await Pet.find({ available: true }).sort('-createdAt');
        res.status(200).json({ pets })
    }

    static async getPetById(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return
        }

        res.status(200).json({ pet: req.pet })
    }

    static async deletePetById(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return
        }

        const pet = req.pet
        const petOwner = await GetUserByToken(req);

        if (!petOwner) {
            res.status(401);
            return
        }

        if (pet.user._id.toString() != petOwner._id.toString()) {
            res.status(422).json({
                erros: [{
                    type: "field",
                    msg: "An error occurred while processing your request"
                }]
            })
            return
        }

        await Pet.findByIdAndRemove(petId);
        res.status(200).json({ message: "Pet removed with sucess." })
    }

    static async getAllUserAdoptions(req, res) {
        const petOwner = await GetUserByToken(req);

        if (!petOwner) {
            res.status(401)
            return
        }

        const pets = await Pet.find({ "adopter._id": petOwner.id }).sort('-createdAt');

        res.status(200).json({ pets })
    }

    static async getAllUserPets(req, res) {
        const petOwner = await GetUserByToken(req)

        if (!petOwner) {
            res.status(401)
            return
        }

        const pets = await Pet.find({ "user._id": petOwner.id }).sort('-createdAt');

        res.status(200).json({ pets })
    }

    static async register(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return
        }

        const petOwner = await GetUserByToken(req);

        if (!petOwner) {
            res.status(401)
            return
        }

        const { name, age, weigth, color } = req.body;
        const images = req.files.map(file => {
            return file.filename
        });


        const pet = new Pet({
            name, age, weigth, color, images, available: true,
            user: {
                _id: petOwner.id,
                name: petOwner.name,
                phone: petOwner.phone
            }
        })

        try {
            const newPet = await pet.save()
            res.status(200).json({
                message: "Pet Cadastrado com sucesso",
                pet: newPet
            })
        } catch (error) {
            res.status(500)
            return
        }
    }

    static async update(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return
        }

        const pet = req.pet
        const { name, age, weigth, color } = req.body;
        const images = req.files.map(file => {
            return file.filename
        });

        const updatedPet = {
            name,
            age,
            weigth,
            color,
            images,
            user: {
                _id: req.petOwner.id,
                name: req.petOwner.name,
                phone: req.petOwner.phone
            }
        }

        await Pet.findByIdAndUpdate(pet._id, updatedPet)
        res.status(200).json({ message: "Pet updated with sucess" })
    }

    static async schedule(req, res) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return
        }

        const pet = req.pet;
        const { _id, name, image, phone } = req.user
        pet.adopter = {
            _id,
            name,
            image,
            phone
        }

        await Pet.findByIdAndUpdate(pet._id, pet)
        res.status(200).json({ message: `The visit has been successfully scheduled. Contact ${name} by phone ${phone}` })
    }

    static async concludeAdoption(req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return
        }
        const pet = req.pet;

        pet.available = false

        await Pet.findByIdAndUpdate(pet._id, pet)
        res.status(200).json({ message: `Pet adopted with sucess!` })
    }

    static validate(method) {
        switch (method) {
            case 'register': {
                return [
                    body('name').exists().notEmpty(),
                    body('age').exists().withMessage('Age is required.').isInt().withMessage('Invalid age.'),
                    body('weigth').exists().withMessage('Weight is required').isInt('Invalid age'),
                    body('color').exists().withMessage('Color is required').notEmpty(),
                    check('image').custom((_, { req }) => {
                        if (!req.files || req.files.length == 0) {
                            return false
                        }
                        return true
                    }).withMessage('Images is required')
                ]
            }
            case 'byId': {
                return [
                    param('id').custom(async (value, { req }) => {
                        if (!ObjectId.isValid(value)) {
                            throw new Error('Invalid pet id')
                        }
                        const pet = await Pet.findById(value)

                        if (!pet) {
                            throw new Error(`Not found pet with id ${value}`)
                        }
                        req.pet = pet
                        return true
                    })
                ]
            }
            case 'schedule': {
                return [
                    param('id').custom(async (value, { req }) => {
                        if (!ObjectId.isValid(value)) {
                            throw new Error('Invalid pet id')
                        }
                        const pet = await Pet.findById(value)

                        if (!pet) {
                            throw new Error(`Not found pet with id ${value}.`)
                        }
                        req.pet = pet

                        const user = await GetUserByToken(req);

                        if (!user) {
                            throw new Error(`Not authorized.`)
                        }

                        if (pet.user._id.toString() == user._id.toString()) {
                            throw new Error(`You cannot adopt your own pet.`)
                        }

                        if (pet.adopter) {
                            if (pet.adopter._id.toString() == user._id.toString()) {
                                throw new Error(`You cannot adopt the same pet again.`)
                            }
                        }

                        req.user = user
                        return true
                    })
                ]
            }
            case 'update': {
                return [
                    param('id').custom(async (value, { req }) => {

                        if (!ObjectId.isValid(value)) {
                            throw new Error('Invalid pet id')
                        }
                        const pet = await Pet.findById(value)

                        if (!pet) {
                            throw new Error(`Not found pet with id ${value}`)
                        }

                        const petOwner = await GetUserByToken(req);

                        if (!petOwner) {
                            throw new Error(`Not authorized.`)
                        }

                        if (pet.user._id.toString() !== petOwner._id.toString()) {
                            throw new Error(`An error occurred while processing your request`)
                        }
                        req.petOwner = petOwner
                        req.pet = pet
                        return true
                    }),
                    body('name').exists().notEmpty(),
                    body('age').exists().withMessage('Age is required.').isInt().withMessage('Invalid age.'),
                    body('weigth').exists().withMessage('Weight is required').isInt('Invalid age'),
                    body('color').exists().withMessage('Color is required').notEmpty(),
                    check('image').custom((_, { req }) => {

                        if (!req.files || !Array.isArray(req.files) || !req.files.length) {
                            return false
                        }
                        return true
                    }).withMessage('Images is required')
                ]
            }
        }
    }
}