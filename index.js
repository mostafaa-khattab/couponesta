import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import i18n from 'i18n';
import cors from 'cors'
import cron from 'node-cron'


const app = express()
app.use(cors())

//set directory dirname 
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, './config/.env') })
import express from 'express'
import initApp from './src/index.router.js'


// i18n configuration
i18n.configure({
    locales: ['en', 'ar'], // Supported locales
    directory: `${__dirname}/locales`, // Directory where your localization files reside
    defaultLocale: 'en', // Default locale
    objectNotation: true, // Use object notation for translation strings
});

// Initialize i18n
app.use(i18n.init);

// Set the default locale for the app
app.use((req, res, next) => {
    const locale = req.params.locale || req?.i18n?.options?.defaultLocale;
    req.i18n?.setLocale(locale);
    next();
});


// Schedule a job to delete userModel older than 60 days
cron.schedule('*/15 * * * *', async () => {
    try {

        console.log('Waking up server...');

    } catch (error) {
        // new Error('Error deleting');
    }

});

// setup port and the baseUrl
const port = process.env.PORT || 5000
initApp(app, express)
app.listen(port, () => console.log(`Example app listening on port ${port}!`))