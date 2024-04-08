import mongoose, { Schema, Types, model } from "mongoose";


const locationSchema = new Schema({

    name: {
        type: String,
        required: [true, 'name is required'],
        unique: [true, 'name is unique'],
        trim: true,
        lower: true
    },

    locationCode: {
        type: String,
        required: [true, 'code is required'],
        unique: [true, 'code is unique'],
        trim: true,
        lower: true
    },

    image: String,

    createdBy: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },

    updatedBy: {
        type: Types.ObjectId,
        ref: 'User',
    },
    
    isDeleted: {
        type: Boolean,
        default: false
    },

}, {
    timestamps: true,

})

const locationModel = mongoose.models.Location || model("Location", locationSchema)
export default locationModel