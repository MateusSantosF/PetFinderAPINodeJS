const express = require('express')
const cors = require('cors')
const expressValidator = require('express-validator')

const app = express()
const PORT = process.env.PORT | 5000;

// Configs JSON
app.use(express.json())


// Cors
app.use(cors({credentials:true, origin: 'http:localhost:5000'}))

// static files
app.use(express.static('public'))


//Routes
const userRoutes = require('./routes/User.routes')
const petRoutes = require('./routes/Pet.routes')

app.use('/users', userRoutes)
app.use('/pets', petRoutes)

app.listen(PORT, ()=>{
    console.log(`API started in port ${PORT}`)
})