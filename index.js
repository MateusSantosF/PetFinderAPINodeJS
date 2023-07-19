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
const userRouters = require('./routes/User.routes')

app.use('/users', userRouters)


app.listen(PORT, ()=>{
    console.log(`API started in port ${PORT}`)
})