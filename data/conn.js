const mongoose = require('mongoose')

async function main() {
    await mongoose.connect('mongodb://localhost:27017/petfinder', {
        authSource: "admin",
        user: "root",
        pass: "example",
    })
}

main()
    .then(() => {
        console.log("Connected to database successfully")
    })
    .catch(err => {
        console.error(err)
    })

module.exports = mongoose;