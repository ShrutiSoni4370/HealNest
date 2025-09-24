import { aicalmiservice, analyzeAndSaveReport } from "../service/aiservices.js";
import Report from "../models/aiCalmimodel.js"; // ADD THIS IMPORT

export const aiCalmiController = async (req, res) => {
  try {
    const { message } = req.body;
    const aiResponse = await aicalmiservice(message);
    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("Error in aiCalmiController:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Generate report and save to database
export const endChatSession = async (req, res) => {
  try {
    const { userId, chatHistory, sessionId } = req.body;

    // Validate required data
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({
        success: false,
        error: "Valid chatHistory array is required"
      });
    }

    console.log(`Generating report for user: ${userId}`);

    // Analyze chat and automatically save report to database
    const analysisResult = await analyzeAndSaveReport(chatHistory, userId, sessionId);

    if (analysisResult.error) {
      return res.status(500).json({
        success: false,
        error: analysisResult.error,
        details: analysisResult.details
      });
    }

    // Enhanced response with more details
    res.json({
      success: true,
      message: "Report generated and saved successfully",
      data: {
        report_id: analysisResult.database_save?.report_id,
        session_id: analysisResult.database_save?.session_id,
        alert_level: analysisResult.alert_level,
        crisis_detected: analysisResult.crisis_indicators?.detected || false,
        analysis_summary: {
          issues_count: analysisResult.issues_detected?.length || 0,
          primary_mood: analysisResult.mental_health_assessment?.detected_mood?.primary || 'neutral',
          mood_confidence: analysisResult.mental_health_assessment?.detected_mood?.confidence || 0.5,
          suggestions_count: analysisResult.suggestions?.length || 0,
          protective_factors: analysisResult.mental_health_assessment?.protective_factors?.length || 0
        }
      },
      report_saved: analysisResult.database_save?.success || false,
      processing_time: analysisResult.processing_metadata?.total_processing_time_ms
    });

  } catch (error) {
    console.error("Error in endChatSession:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze chat and save report",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enhanced fetch reports controller
export const fetchreportcontroller = async (req, res) => {
  try {
    // ✅ FIXED: Change req.body to req.query for GET requests
    const { userId } = req.query; // GET requests use query parameters

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    console.log(`Fetching reports for user: ${userId}`);

    // Fetch reports with sorting and basic population
    const reports = await Report.find({ userId })
      .populate('user', 'firstName lastName email') // Populate user info
      .sort({ createdAt: -1 }) // Most recent first
      .select('sessionId analysis.alert_level analysis.crisis_indicators mental_health_assessment.detected_mood createdAt status metadata.processing_time_ms'); // Select specific fields for performance

    // Enhanced response with summary statistics
    const reportStats = {
      total_reports: reports.length,
      alert_levels: {
        critical: reports.filter(r => r.analysis?.alert_level === 'Critical').length,
        high: reports.filter(r => r.analysis?.alert_level === 'High').length,
        medium: reports.filter(r => r.analysis?.alert_level === 'Medium').length,
        low: reports.filter(r => r.analysis?.alert_level === 'Low').length
      },
      crisis_reports: reports.filter(r => r.analysis?.crisis_indicators?.detected).length,
      latest_report_date: reports.length > 0 ? reports[0].createdAt : null
    };

    res.status(200).json({
      success: true,
      message: `Found ${reports.length} reports`,
      data: {
        reports: reports,
        statistics: reportStats
      }
    });

  } catch (error) {
    console.error("Error in fetchreportcontroller:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reports",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In your aicontrollers.js file, add this new controller

export const getReportByIdController = async (req, res) => {
  try {
    // ✅ CHANGED: Get reportId from request body for POST request
    console.log('🔍 Backend - Request method:', req.method);
    console.log('🔍 Backend - Request body:', req.body);
    console.log('🔍 Backend - Request query:', req.query);

    // ✅ FIXED: Get reportId from request body for POST request
    const { reportId } = req.body; // Changed from req.query to req.body

    // ✅ FIXED: Remove undefined 'data' variable
    console.log('🔍 Backend - extracted reportId:', reportId);
    console.log('🔍 Backend - typeof reportId:', typeof reportId);

     if (!reportId) {
      console.log('❌ Backend - No reportId found');
      return res.status(400).json({
        success: false,
        error: "reportId is required",
        received: req.body, // Changed from req.query to req.body
        debug: {
          body: req.body,
          query: req.query
        }
      });
    }

    console.log(`Fetching report with ID: ${reportId}`);

    // Validate if reportId is a valid MongoDB ObjectId
    if (!reportId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid report ID format"
      });
    }

    // Fetch the complete report with all fields
    const report = await Report.findById(reportId)
      .populate('user', 'firstName lastName email username')
      .lean();

    // Check if report exists
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found"
      });
    }

    // Verify the report belongs to the authenticated user (security check)
    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own reports."
      });
    }

    // Add some computed fields for better frontend usage
    const enrichedReport = {
      ...report,
      computed: {
        total_emotions: report.analysis?.emotion_analysis?.length || 0,
        total_keywords: report.analysis?.mental_bert_insights?.length || 0,
        total_suggestions: report.analysis?.suggestions?.length || 0,
        total_recommendations: report.mental_health_assessment?.recommendations?.length || 0,
        has_crisis_indicators: report.analysis?.crisis_indicators?.detected || false,
        processing_time_seconds: report.metadata?.processing_time_ms ?
          (report.metadata.processing_time_ms / 1000).toFixed(2) : 0,
        created_date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : null,
        created_time: report.createdAt ? new Date(report.createdAt).toLocaleTimeString() : null
      }
    };

    res.status(200).json({
      success: true,
      message: "Report fetched successfully",
      data: {
        report: enrichedReport
      }
    });

  } catch (error) {
    console.error("Error in getReportByIdController:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: "Invalid report ID format"
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch report",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Get single report details
export const getReportDetails = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "reportId is required"
      });
    }

    const report = await Report.findById(reportId)
      .populate('user', 'firstName lastName email age')
      .populate('professional_review.reviewer_id', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found"
      });
    }

    res.json({
      success: true,
      data: {
        report: report
      }
    });

  } catch (error) {
    console.error("Error in getReportDetails:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch report details"
    });
  }
};

// Get user report statistics
export const getUserReportStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    const stats = await Report.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$analysis.alert_level',
          count: { $sum: 1 },
          latestReport: { $max: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          alertLevels: {
            $push: {
              level: '$_id',
              count: '$count',
              latest: '$latestReport'
            }
          },
          totalReports: { $sum: '$count' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics: stats[0] || { alertLevels: [], totalReports: 0 }
      }
    });

  } catch (error) {
    console.error("Error in getUserReportStats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics"
    });
  }
};


