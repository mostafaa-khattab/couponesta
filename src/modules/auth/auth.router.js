import { Router } from "express";
import * as authController from './controller/registration.js'
import { validation } from "../../middleware/validation.js";
import * as validators from './auth.validation.js';

const router = Router()


router.post('/signupEmail',
    validation(validators.signUpValidationEmail),
    authController.signupEmail)

router.post('/signupPhone',
    validation(validators.signUpValidationPhone),
    authController.signupPhone)

router.get('/confirmAccount/:token',
    validation(validators.confirmAccountValidation),
    authController.confirmAccount)

router.get('/NewconfirmAccount/:token',
    validation(validators.confirmAccountValidation),
    authController.RequestNewconfirmAccount)

router.post('/loginEmail',
    validation(validators.loginValidation),
    authController.loginEmail)

router.post('/requestChangePassword',
    validation(validators.sendEmailToChangePasswordValidation),
    authController.sendEmailToChangePassword)

router.post('/forgetPassword',
    validation(validators.forgetPasswordValidation),
    authController.forgetPassword)


export default router