const express=require('express');
const { postFeedback, getAllFeedback,getOnlyValidFeedbacks, updateFeedbackValidation } = require('../controllers/feedback-controller');
const { authenticateRequest ,verifyToken} = require('../middleware/authMiddleware');

const router=express.Router();

router.post('/post-feedback',postFeedback);
router.get('/get-allfeedback',getAllFeedback);
router.get('/get-validFeedback',getOnlyValidFeedbacks);
router.put('/update-feedbackstatus/:id',updateFeedbackValidation)
module.exports=router;