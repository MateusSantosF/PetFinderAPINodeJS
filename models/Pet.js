const mongoose = require('../data/conn');

const { Schema } = mongoose;

const Pet = mongoose.model(
    'Pet',
    new Schema({
        name: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true
        },
        weigth: {
            type: Number,
            required: true
        },
        color: {
            type: String,
            required: true
        },
        images: {
            type: Array,
            required: true
        },
        user:{
            type: Object,
            required: true
        },
        adopter:{
            type:Object
        },
        available: {
            type: Boolean,
        }
    }, { timestamps: true })
);

module.exports = Pet