import jwt from 'jsonwebtoken'


export const generateToken = ({ payload = {}, signature = `${process.env.EMAIL_TOKEN}` || "saving-coupons-signature by khattab@gmail.com", expiresIn = 60 * 60 } = {}) => {
    const token = jwt.sign(payload, signature, { expiresIn: parseInt(expiresIn) });
    return token
}

export const verifyToken = ({ token, signature = `${process.env.EMAIL_TOKEN}` || "saving-coupons-signature by khattab@gmail.com" } = {}) => {
    const decoded = jwt.verify(token, signature);
    return decoded
}