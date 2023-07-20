const express = require('express')
const PetController = require("../controllers/PetController")
const JwtManager = require('../helpers/JwtManager')
const router = express.Router()
const { ImageUpload } = require('../helpers/ImageUpload')
const Constants = require('../Constants')

router.get('/', PetController.getAll)
router.get('/mypets', JwtManager.verifyToken, PetController.getAllUserPets)
router.get('/myadoptions', JwtManager.verifyToken, PetController.getAllUserAdoptions)
router.get('/:id', PetController.validate('byId'), PetController.getPetById)


router.delete('/:id',
    JwtManager.verifyToken,
    PetController.validate('byId'),
    PetController.deletePetById
)

router.patch('/:id',
    JwtManager.verifyToken,
    ImageUpload.array('images', Constants.IMAGE_LIMIT_FOR_PETS),
    PetController.validate('update'),
    PetController.update
)
router.patch('/schedule/:id',
    JwtManager.verifyToken,
    PetController.validate('schedule'),
    PetController.schedule
)

router.patch('/conclude/:id',
    JwtManager.verifyToken,
    PetController.validate('byId'),
    PetController.concludeAdoption
)

router.post('/register', JwtManager.verifyToken,
    ImageUpload.array('images', Constants.IMAGE_LIMIT_FOR_PETS),
    PetController.validate('register'),
    PetController.register
)

module.exports = router;