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
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
})


// locationSchema.virtual('category', {
//     ref: 'Category',
//     localField: '_id', // بتاع الموديل الل location
//     foreignField: 'location', // بتاع ال category
//     // justOne: true
// });

// locationSchema.virtual('brand', {
//     ref: 'Brand',
//     localField: '_id', // بتاع الموديل الل location
//     foreignField: 'location', // بتاع ال category
//     // justOne: true
// });

// locationSchema.pre(/^find/ , function(){
//     this.populate('category')
//         .populate('brand')
// })

// let initialized = false;

// locationSchema.post('init', function (doc) {
//     if (!initialized) {
//         doc.image = process.env.BASE_URL + doc.image;
//         initialized = true;
//     }
// });

const locationModel = mongoose.models.Location || model("Location", locationSchema)
export default locationModel