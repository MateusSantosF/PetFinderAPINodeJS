const express = require('express')
const UserController = require("../controllers/UserController")
const JwtManager = require('../helpers/JwtManager')
const { ImageUpload } = require('../helpers/ImageUpload')
const router = express.Router()

router.get('/checkuser', JwtManager.verifyToken, UserController.validate('checkUser'), UserController.checkUser)
router.get('/:id', JwtManager.verifyToken, UserController.validate('getUserById'), UserController.getUserById)

router.patch('/edit/:id',
    JwtManager.verifyToken,
    ImageUpload.single('image'),
    UserController.validate('edit'),
    UserController.editUser
)

router.post('/login', UserController.validate('login'), UserController.login)
router.post('/register',  UserController.validate('createUser'), UserController.register)

module.exports = router;