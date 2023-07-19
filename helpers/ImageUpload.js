const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        let folderName = ''
        if (req.baseUrl.includes('users')) {
            folderName = "users"
        } else {
            folderName = "pets"
        }

        cb(null, `public/images/${folderName}`)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
const ImageUpload = multer({
    storage: storage,
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
            return cb(new Error('Image extension invalid.'))
        }
        cb(undefined, true)
    }
})


module.exports = { ImageUpload }
