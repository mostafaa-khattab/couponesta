import joi from 'joi'
import { generalFields } from '../../middleware/validation.js'


export const signUpValidationEmail = joi.object({
    fullName: joi.string().min(2).max(50).required(),
    email: generalFields.email,
    password: generalFields.password,
}).required()

export const signUpValidationPhone = joi.object({
    fullName: joi.string().min(2).max(50).required(),
    password: generalFields.password,
    phoneNumber: joi.string().required(),
    countryCode: joi.string().required(),
}).required()

export const loginEmailValidation = joi.object({
    email: generalFields.email,
    password: generalFields.password,
}).required()

export const loginPhoneValidation = joi.object({
    phoneNumber: joi.string().required(),
    countryCode: joi.string().required(),
    password: generalFields.password,
}).required()

export const confirmAccountValidation = joi.object({

    token: generalFields.token,
}).required()

export const sendEmailToChangePasswordValidation = joi.object({
    email: generalFields.email,
}).required()

export const forgetPasswordValidation = joi.object({
    email: generalFields.email,
    password: generalFields.password,
    cPassword: joi.string().valid(joi.ref('password')).required().messages({
        'any.only': 'Repeat confirm password must match new password',
    }),
}).required()