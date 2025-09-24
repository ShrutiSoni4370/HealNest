import mongoose from 'mongoose';

const moodReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  responses: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 20 && arr.every(val => val >= 1 && val <= 5);
      },
      message: 'Must have exactly 20 responses, each between 1 and 5'
    }
  },
  questionMapping: [{
    questionId: Number,
    question: String,
    category: String,
    response: Number,
    responseLabel: String
  }],
  scores: {
    positiveWellbeing: { type: Number, min: 0, max: 100 },
    socialConnection: { type: Number, min: 0, max: 100 },
    physicalHealth: { type: Number, min: 0, max: 100 },
    mentalClarity: { type: Number, min: 0, max: 100 },
    stressManagement: { type: Number, min: 0, max: 100 },
    overallWellness: { type: Number, min: 0, max: 100 }
  },
  aiAnalysis: {
    summary: String,
    fullAnalysis: String,
    keyInsights: [String],
    moodTrend: {
      type: String,
      enum: ['positive', 'stable', 'needs_attention']
    },
    analysisDate: { type: Date, default: Date.now },
    source: { type: String, default: 'Rule-Based Analysis' }
  },
  recommendations: [{
    category: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    suggestion: String,
    timeframe: String
  }],
  riskAssessment: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    factors: [String],
    needsAttention: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  // Optimize for frequent queries
  indexes: [
    { userId: 1, timestamp: -1 },
    { 'aiAnalysis.moodTrend': 1 },
    { 'riskAssessment.level': 1 },
    { 'scores.overallWellness': 1 }
  ]
});

// Add compound index for user mood history queries
moodReportSchema.index({ userId: 1, timestamp: -1 });

const MoodReport = mongoose.model('MoodReport', moodReportSchema);

export default MoodReport;
