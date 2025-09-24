import express from 'express';
import { body, param, query , validationResult} from 'express-validator';
import MoodTrackerController from '../controllers/mootrackercontrollery.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const router = express.Router();

// GET /api/mood/questions - Get fixed 20 mood assessment questions
router.get('/questions', 
  MoodTrackerController.getQuestions
);

// POST /api/mood/analyze - Submit responses and get mood analysis
router.post('/analyze',
  authMiddleware,
  [
    body('responses')
      .isArray({ min: 20, max: 20 })
      .withMessage('Exactly 20 responses are required'),
    body('responses.*')
      .isInt({ min: 1, max: 5 })
      .withMessage('Each response must be a number between 1 and 5')
  ],
  MoodTrackerController.analyzeMoodResponses
);

// GET /api/mood/history - Get user's mood tracking history
router.get('/history',
  authMiddleware,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
  ],
  MoodTrackerController.getMoodHistory
);

// GET /api/mood/report/:reportId - Get specific mood report
router.get('/report/:reportId',
  authMiddleware,
  [
    param('reportId')
      .isMongoId()
      .withMessage('Valid report ID is required')
  ],
  MoodTrackerController.getMoodReport
);

// GET /api/mood/analytics - Get mood analytics/insights


router.get('/analytics',
  authMiddleware,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365'),
  ],
  validateRequest,
  MoodTrackerController.getMoodAnalytics
);

// DELETE /api/mood/report/:reportId - Delete mood report

router.delete('/report/:reportId',
  authMiddleware,
  [
    param('reportId')
      .isMongoId()
      .withMessage('Valid report ID is required')
  ],
  MoodTrackerController.deleteMoodReport
);

export default router;
