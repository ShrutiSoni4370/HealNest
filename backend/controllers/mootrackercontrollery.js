import MoodTrackerService from '../service/moodservice.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import MoodReport from '../models/moodanlysis.js';



class MoodTrackerController {
  
  // Get the fixed 20 questions
  async getQuestions(req, res) {
    try {
      const questions = MoodTrackerService.getFixedQuestions();
      
      res.status(200).json({
        success: true,
        message: 'Mood assessment questions retrieved successfully',
        data: questions
      });
      
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mood assessment questions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Analyze mood responses and generate report
  async analyzeMoodResponses(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { responses } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Validate responses array
      if (!Array.isArray(responses) || responses.length !== 20) {
        return res.status(400).json({
          success: false,
          message: 'Exactly 20 responses are required'
        });
      }

      // Validate each response value
      const validResponses = responses.every(response => 
        Number.isInteger(response) && response >= 1 && response <= 5
      );

      if (!validResponses) {
        return res.status(400).json({
          success: false,
          message: 'All responses must be integers between 1 and 5'
        });
      }

      // Generate mood report
      const result = await MoodTrackerService.generateMoodReport(responses, userId);
      
      res.status(201).json({
        success: true,
        message: 'Mood analysis completed successfully',
        data: result
      });

    } catch (error) {
      console.error('Mood analysis error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze mood responses',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get user's mood tracking history
  async getMoodHistory(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const history = await MoodTrackerService.getUserMoodHistory(userId, limit, skip);
      
      res.status(200).json({
        success: true,
        message: 'Mood history retrieved successfully',
        data: {
          reports: history,
          pagination: {
            page,
            limit,
            hasMore: history.length === limit
          }
        }
      });

    } catch (error) {
      console.error('Get mood history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mood history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get specific mood report by ID
  async getMoodReport(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      if (!reportId || !reportId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Valid report ID is required'
        });
      }

      const report = await MoodReport.findOne({ 
        _id: reportId, 
        userId: userId 
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Mood report not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Mood report retrieved successfully',
        data: report
      });

    } catch (error) {
      console.error('Get mood report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mood report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get mood analytics/insights
  async getMoodAnalytics(req, res) {
    try {
      const userId =  req.user?._id;
      const days = parseInt(req.query.days) || 30;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await MoodReport.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            avgWellness: { $avg: '$scores.overallWellness' },
            avgStress: { $avg: '$scores.stressManagement' },
            avgSocial: { $avg: '$scores.socialConnection' },
            totalReports: { $sum: 1 },
            moodTrends: { $push: '$aiAnalysis.moodTrend' },
            riskLevels: { $push: '$riskAssessment.level' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: 'Mood analytics retrieved successfully',
        data: analytics || {
          avgWellness: 0,
          avgStress: 0,
          avgSocial: 0,
          totalReports: 0,
          moodTrends: [],
          riskLevels: []
        }
      });

    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mood analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete mood report
  async deleteMoodReport(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const deletedReport = await MoodReport.findOneAndDelete({
        _id: reportId,
        userId: userId
      });

      if (!deletedReport) {
        return res.status(404).json({
          success: false,
          message: 'Mood report not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Mood report deleted successfully'
      });

    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete mood report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default new MoodTrackerController();
