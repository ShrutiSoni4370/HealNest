import express from 'express';
import { registerUserController, loginUserController , sendOTPEmailcontrollers ,verifyOTPPhone , verifyOTPEmail, sendOTPPhonecontrollers , getAllUsersController , getAllOnlineUsersController , getuserbyidcontroller} from '../controllers/usercontrollers.js';
import { authMiddleware , trackUserActivity} from '../middlewares/authMiddleware.js';

const router = express.Router();



router.post('/register', registerUserController);

router.post('/login', loginUserController);

// OTP generation & verification for email
router.post('/generate-email-otp', sendOTPEmailcontrollers);
router.post('/verify-email-otp', verifyOTPEmail);

// OTP generation & verification for phone
router.post('/generate-phone-otp', sendOTPPhonecontrollers);
router.post('/verify-phone-otp', verifyOTPPhone);


router.use(authMiddleware, trackUserActivity); // Apply to all routes below


router.post('/getallusers',  getAllUsersController); 

router.post('/getonlineusers' ,  getAllOnlineUsersController);

router.get('/getuserbyid/:id' , getuserbyidcontroller)

export default router;
