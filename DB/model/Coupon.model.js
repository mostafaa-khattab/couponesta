import mongoose, { Schema, Types, model } from "mongoose";


const couponSchema = new Schema({

    code: {
        type: String,
        required: [true, 'code is required'],
        trim: true,
        lower: true
    },

    amount: {
        type: Number,
        default: 1,
    },

    description: {
        type: {
            en: String,
            ar: String
        },
        trim: true
    },

    status: {
        type: {
            en: { type: String, enum: ['discount', 'cashback'], default: "discount", required: true },
            ar: { type: String, enum: ['خصم', 'كاش باك'], default: "خصم", required: true }
        },
        required: true,
        trim: true
    },

    expire: Date,

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
            required: [true, 'Location is required'],
        }
    ],

    category: [
        {
            type: Types.ObjectId,
            ref: 'Category',
            required: [true, 'category is required'],
        }
    ],

    brand: [
        {
            type: Types.ObjectId,
            ref: 'Brand',
            required: [true, 'brand is required'],
        }
    ],

    qrCode: {
        type: String,
        // required: [true, 'qrCode is required'],
        trim: true,
    },

    usedCount: { type: Number, default: 0 },

    // like
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },

    isDeleted: {
        type: Boolean,
        default: false
    },

}, {
    timestamps: true,
})

couponSchema.pre(/^find/, function () {

    this.populate('createdBy', 'fullName')
        .populate('updatedBy', 'fullName')
        .populate('location', 'name locationCode')
        .populate('category', 'name slug ')
        .populate('brand' , 'name slug link')
        
})

const couponModel = mongoose.models.Coupon || model("Coupon", couponSchema)
export default couponModel