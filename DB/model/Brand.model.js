import mongoose, { Schema, Types, model } from "mongoose";


const brandSchema = new Schema({

    name: {
        en: {
            type: String,
            // required: [true, 'English name is required'],
            // unique: [true, 'English name must be unique'],
            trim: true
        },
        ar: {
            type: String,
            // required: [true, 'Arabic name is required'],
            // unique: [true, 'Arabic name must be unique'],
            trim: true
        }
    },

    slug: {
        type: String,
        required: [true, 'Slug is required']
    },

    description: {
        type: {
            en: String,
            ar: String
        },
        trim: true
    },

    link: {
        type: String,
        required: [true, 'store link is required'],
        trim: true
    },

    image: String,

    category: [
        {
            type: Types.ObjectId,
            ref: 'Category',
            required: true
        }
    ],

    createdBy: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },

    updatedBy: {
        type: Types.ObjectId,
        ref: 'User',
    },

    location: [
        {
            type: Types.ObjectId,
            ref: 'Location',
            required: true
        }
    ],

    isDeleted: {
        type: Boolean,
        default: false
    },

}, {
    timestamps: true,
})

brandSchema.pre(/^find/, function () {

    this.populate('createdBy', 'fullName')
        .populate('updatedBy', 'fullName')
        .populate('location', 'name locationCode')
        .populate('category', 'name slug ')
})

const brandModel = mongoose.models.Brand || model("Brand", brandSchema)
export default brandModel