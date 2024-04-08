import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const createCouponValidation = joi.object({

    code: joi.string().min(1).max(50).required(),
    en_description: joi.string().trim().allow('').max(1000), // Optional
    ar_description: joi.string().trim().allow('').max(1000),
    en_status: joi.string().valid('discount', 'cashback').default('discount').required(),
    ar_status: joi.string().valid('خصم', 'كاش باك').default('خصم').required(),
    amount: joi.number().positive().min(1).max(100).required(),
    expire: joi.string(),
    usedCount: joi.number().min(0).integer(),
    likeCount: joi.number().min(0).integer(),
    dislikeCount: joi.number().min(0).integer(),
    expire: joi.date().required(),
    category: joi.alternatives().try(
        generalFields.id.required(), // Single ID
        generalFields.idArray.required() // Array of IDs
    ).required(),
    brand: joi.alternatives().try(
        generalFields.id.required(), // Single ID
        generalFields.idArray.required() // Array of IDs
    ).required(),
    location: joi.alternatives().try(
        generalFields.id.required(), // Single ID
        generalFields.idArray.required() // Array of IDs
    ).required(),
}).required()

export const updateCouponValidation = joi.object({

    couponId: generalFields.id,
    code: joi.string().min(1).max(50),
    en_description: joi.string().trim().allow('').max(1000), // Optional
    ar_description: joi.string().trim().allow('').max(1000),
    en_status: joi.string().valid('discount', 'cashback').default('discount'),
    ar_status: joi.string().valid('خصم', 'كاش باك').default('خصم'),
    amount: joi.number().positive().min(1).max(100),
    expire: joi.date(),
    usedCount: joi.number().min(0).integer(),
    likeCount: joi.number().min(0).integer(),
    dislikeCount: joi.number().min(0).integer(),
    category: joi.alternatives().try(
        generalFields.idUpdate, // Single ID
        generalFields.idArrayUpdate // Array of IDs
    ),
    brand: joi.alternatives().try(
        generalFields.idUpdate, // Single ID
        generalFields.idArrayUpdate // Array of IDs
    ),
    location: joi.alternatives().try(
        generalFields.idUpdate, // Single ID
        generalFields.idArrayUpdate // Array of IDs
    ),
    isDeleted: joi.boolean(),

}).required()

export const getAllCouponValidation = joi.object({

    location: generalFields.idUpdate,
    locale: joi.string().valid('en', 'ar')
}).required()

export const deleteCouponValidation = joi.object({

    couponId: generalFields.id,

}).required()

export const getOneCouponValidation = joi.object({

    couponId: generalFields.id,
    location: generalFields.idUpdate,
    locale: joi.string().valid('en', 'ar')
}).required()

export const favoriteValidation = joi.object({

    couponId: joi.string().hex().length(24).required().trim(),
}).required()