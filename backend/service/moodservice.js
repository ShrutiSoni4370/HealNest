import axios from 'axios';
import dotenv from 'dotenv';
import MoodReport from '../models/moodanlysis.js';

dotenv.config();

// FIXED 20 STANDARDIZED MOOD ASSESSMENT QUESTIONS
const FIXED_MOOD_QUESTIONS = [
  {
    id: 1,
    question: "How would you rate your overall mood today?",
    type: "scale",
    category: "general_mood",
    labels: ["Very Poor", "Poor", "Neutral", "Good", "Excellent"]
  },
  {
    id: 2,
    question: "How energetic do you feel right now?",
    type: "scale", 
    category: "energy",
    labels: ["Very Low", "Low", "Moderate", "High", "Very High"]
  },
  {
    id: 3,
    question: "How well did you sleep last night?",
    type: "scale",
    category: "sleep",
    labels: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
  },
  {
    id: 4,
    question: "How stressed do you feel today?",
    type: "scale",
    category: "stress",
    labels: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 5,
    question: "How satisfied are you with your social interactions today?",
    type: "scale",
    category: "social",
    labels: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"]
  },
  {
    id: 6,
    question: "How confident do you feel about handling challenges today?",
    type: "scale",
    category: "confidence",
    labels: ["Not Confident", "Slightly Confident", "Moderately Confident", "Confident", "Very Confident"]
  },
  {
    id: 7,
    question: "How would you describe your anxiety level?",
    type: "scale",
    category: "anxiety",
    labels: ["None", "Mild", "Moderate", "High", "Severe"]
  },
  {
    id: 8,
    question: "How motivated do you feel to accomplish your goals?",
    type: "scale",
    category: "motivation",
    labels: ["Not Motivated", "Slightly Motivated", "Moderately Motivated", "Motivated", "Highly Motivated"]
  },
  {
    id: 9,
    question: "How comfortable do you feel expressing your emotions?",
    type: "scale",
    category: "emotional_expression",
    labels: ["Very Uncomfortable", "Uncomfortable", "Neutral", "Comfortable", "Very Comfortable"]
  },
  {
    id: 10,
    question: "How hopeful do you feel about your future?",
    type: "scale",
    category: "hope",
    labels: ["Not Hopeful", "Slightly Hopeful", "Moderately Hopeful", "Hopeful", "Very Hopeful"]
  },
  {
    id: 11,
    question: "How well are you able to concentrate on tasks?",
    type: "scale",
    category: "concentration",
    labels: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
  },
  {
    id: 12,
    question: "How satisfied are you with your physical health?",
    type: "scale",
    category: "physical_health",
    labels: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"]
  },
  {
    id: 13,
    question: "How often did you experience negative thoughts today?",
    type: "scale",
    category: "negative_thoughts",
    labels: ["Never", "Rarely", "Sometimes", "Often", "Very Often"]
  },
  {
    id: 14,
    question: "How well did you manage your emotions today?",
    type: "scale",
    category: "emotional_regulation",
    labels: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
  },
  {
    id: 15,
    question: "How connected do you feel to others?",
    type: "scale",
    category: "social_connection",
    labels: ["Very Disconnected", "Disconnected", "Neutral", "Connected", "Very Connected"]
  },
  {
    id: 16,
    question: "How satisfied are you with your work/daily activities?",
    type: "scale",
    category: "work_satisfaction",
    labels: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"]
  },
  {
    id: 17,
    question: "How often did you feel overwhelmed today?",
    type: "scale",
    category: "overwhelm",
    labels: ["Never", "Rarely", "Sometimes", "Often", "Very Often"]
  },
  {
    id: 18,
    question: "How well did you take care of yourself today?",
    type: "scale",
    category: "self_care",
    labels: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
  },
  {
    id: 19,
    question: "How positive do you feel about your relationships?",
    type: "scale",
    category: "relationships",
    labels: ["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"]
  },
  {
    id: 20,
    question: "How would you rate your overall life satisfaction today?",
    type: "scale",
    category: "life_satisfaction",
    labels: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
  }
];

class MoodTrackerService {
  
  // Return the fixed 20 questions
  getFixedQuestions() {
    return {
      success: true,
      questions: FIXED_MOOD_QUESTIONS,
      totalQuestions: 20,
      note: "Standardized psychological mood assessment questions"
    };
  }

  // AI Analysis of user responses to generate mood report
  async generateMoodReport(responses, userId) {
    try {
      // Validate responses
      if (!Array.isArray(responses) || responses.length !== 20) {
        throw new Error('Exactly 20 responses required');
      }

      // Calculate numerical scores
      const scores = this.calculateMoodScores(responses);
      
      // Generate AI-powered psychological analysis using direct axios request
      const aiAnalysis = await this.performDirectAIAnalysis(responses, scores);
      
      // Create comprehensive report
      const reportData = {
        userId,
        timestamp: new Date(),
        responses,
        questionMapping: this.mapResponsesToQuestions(responses),
        scores,
        aiAnalysis,
        recommendations: this.generateRecommendations(scores, aiAnalysis),
        riskAssessment: this.assessRisk(scores, responses)
      };

      // Save to database
      const savedReport = await this.saveToDB(reportData);
      
      return {
        success: true,
        reportId: savedReport._id,
        report: {
          scores,
          analysis: aiAnalysis,
          recommendations: reportData.recommendations,
          riskLevel: reportData.riskAssessment.level,
          timestamp: reportData.timestamp
        }
      };

    } catch (error) {
      console.error('Mood analysis error:', error);
      throw error;
    }
  }

  // Map responses to question categories for analysis
  mapResponsesToQuestions(responses) {
    return responses.map((response, index) => ({
      questionId: FIXED_MOOD_QUESTIONS[index].id,
      question: FIXED_MOOD_QUESTIONS[index].question,
      category: FIXED_MOOD_QUESTIONS[index].category,
      response: response,
      responseLabel: FIXED_MOOD_QUESTIONS[index].labels[response - 1]
    }));
  }

  // Calculate mood scores across different categories
  calculateMoodScores(responses) {
    const categoryMappings = {
      // Positive indicators (higher = better)
      positiveWellbeing: [0, 1, 7, 9, 13, 17, 18, 19], // mood, energy, motivation, hope, emotional_reg, self_care, relationships, life_sat
      socialConnection: [4, 14, 18], // social interactions, social connection, relationships  
      physicalHealth: [2, 11], // sleep, physical health
      mentalClarity: [10, 13], // concentration, emotional regulation
      
      // Negative indicators (need to be reversed - lower = better)
      stressFactors: [3, 6, 12, 16], // stress, anxiety, negative thoughts, overwhelm
    };

    const scores = {};
    
    // Calculate positive categories
    ['positiveWellbeing', 'socialConnection', 'physicalHealth', 'mentalClarity'].forEach(category => {
      const indices = categoryMappings[category];
      const sum = indices.reduce((acc, i) => acc + responses[i], 0);
      scores[category] = Math.round((sum / (indices.length * 5)) * 100);
    });

    // Calculate stress factors (reversed scoring)
    const stressIndices = categoryMappings.stressFactors;
    const stressSum = stressIndices.reduce((acc, i) => acc + (6 - responses[i]), 0); // Reverse score
    scores.stressManagement = Math.round((stressSum / (stressIndices.length * 5)) * 100);

    // Overall wellness score
    scores.overallWellness = Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
    );

    return scores;
  }

  // Direct axios AI analysis - Multiple options provided
  async performDirectAIAnalysis(responses, scores) {
    try {

      // Option 1: Fallback to rule-based analysis
      return this.generateFallbackAnalysis(scores);
      
    } catch (error) {
      console.error('All AI analysis methods failed:', error);
      return this.generateFallbackAnalysis(scores);
    }
  }


  // Alternative free AI service (Groq, Together AI, etc.)
  async tryAlternativeAIAnalysis(responses, scores) {
    try {
      // Example using Groq (free tier available)
      const prompt = this.buildAnalysisPrompt(responses, scores);
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are a mental health professional providing mood analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 600,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return this.structureAIResponse(response.data.choices[0].message.content, scores);
      }

      return null;
    } catch (error) {
      console.error('Alternative AI API error:', error);
      return null;
    }
  }

  buildAnalysisPrompt(responses, scores) {
    const responseDetails = responses.map((response, index) => {
      const question = FIXED_MOOD_QUESTIONS[index];
      return `${question.category}: ${question.labels[response - 1]} (${response}/5)`;
    }).join('\n');

    return `
As a mental health professional, analyze this mood assessment data and provide insights:

RESPONSES:
${responseDetails}

CALCULATED SCORES:
- Overall Wellness: ${scores.overallWellness}%
- Positive Wellbeing: ${scores.positiveWellbeing}%
- Social Connection: ${scores.socialConnection}%
- Stress Management: ${scores.stressManagement}%
- Physical Health: ${scores.physicalHealth}%
- Mental Clarity: ${scores.mentalClarity}%

Please provide a professional psychological analysis covering:
1. Current emotional state summary (2-3 sentences)
2. Key behavioral patterns identified (2-3 key points)
3. Areas of strength and resilience (1-2 strengths)
4. Concerns or areas needing attention (if any)
5. Brief psychological insights about mood trends

Keep the analysis empathetic, professional, and actionable. Limit response to 400 words.
`;
  }

  structureAIResponse(aiText, scores) {
    return {
      summary: aiText.length > 200 ? aiText.substring(0, 200) + '...' : aiText,
      fullAnalysis: aiText,
      keyInsights: this.extractKeyInsights(scores),
      moodTrend: this.determineMoodTrend(scores),
      analysisDate: new Date().toISOString(),
      source: 'AI-Generated Analysis'
    };
  }

  extractKeyInsights(scores) {
    const insights = [];
    
    if (scores.overallWellness >= 75) {
      insights.push("Strong overall emotional wellbeing indicators");
    } else if (scores.overallWellness <= 40) {
      insights.push("Current wellness levels suggest need for support");
    }

    if (scores.stressManagement <= 50) {
      insights.push("Stress management techniques may be beneficial");
    }

    if (scores.socialConnection <= 40) {
      insights.push("Social connections could be strengthened");
    }

    if (scores.physicalHealth <= 45) {
      insights.push("Physical health factors affecting mood");
    }

    if (scores.mentalClarity >= 70) {
      insights.push("Good mental clarity and focus");
    }

    return insights;
  }

  determineMoodTrend(scores) {
    if (scores.overallWellness >= 70) return 'positive';
    if (scores.overallWellness >= 45) return 'stable';
    return 'needs_attention';
  }

  generateRecommendations(scores, analysis) {
    const recommendations = [];

    // Stress management
    if (scores.stressManagement < 60) {
      recommendations.push({
        category: 'Stress Management',
        priority: 'high',
        suggestion: 'Practice daily relaxation techniques like deep breathing, meditation, or progressive muscle relaxation',
        timeframe: 'immediate'
      });
    }

    // Social connection
    if (scores.socialConnection < 50) {
      recommendations.push({
        category: 'Social Wellness',
        priority: 'medium',
        suggestion: 'Schedule regular social activities, reach out to friends and family, or join community groups',
        timeframe: 'this_week'
      });
    }

    // Physical health
    if (scores.physicalHealth < 50) {
      recommendations.push({
        category: 'Physical Health',
        priority: 'medium', 
        suggestion: 'Focus on sleep hygiene (7-9 hours), regular physical activity, and balanced nutrition',
        timeframe: 'ongoing'
      });
    }

    // Mental clarity
    if (scores.mentalClarity < 50) {
      recommendations.push({
        category: 'Mental Focus',
        priority: 'medium',
        suggestion: 'Try mindfulness practices, limit distractions, and break tasks into smaller manageable chunks',
        timeframe: 'this_week'
      });
    }

    // Professional support
    if (scores.overallWellness < 40) {
      recommendations.push({
        category: 'Professional Support',
        priority: 'high',
        suggestion: 'Consider speaking with a mental health professional, counselor, or therapist for additional support',
        timeframe: 'immediate'
      });
    }

    // Positive reinforcement
    if (scores.overallWellness >= 70) {
      recommendations.push({
        category: 'Maintenance',
        priority: 'low',
        suggestion: 'Continue current positive habits and consider helping others or engaging in meaningful activities',
        timeframe: 'ongoing'
      });
    }

    return recommendations;
  }

  assessRisk(scores, responses) {
    let riskLevel = 'low';
    const riskFactors = [];

    if (scores.overallWellness < 30) {
      riskLevel = 'high';
      riskFactors.push('Very low overall wellness score');
    } else if (scores.overallWellness < 50) {
      riskLevel = 'medium';
      riskFactors.push('Below average wellness indicators');
    }

    // Check for concerning response patterns (negative thoughts question is index 12)
    if (responses[12] >= 4) { // High negative thoughts
      riskFactors.push('Frequent negative thought patterns reported');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }

    // Check stress levels (stress question is index 3)
    if (responses[3] >= 4) { // High stress
      riskFactors.push('High stress levels reported');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // Check anxiety levels (anxiety question is index 6)
    if (responses[6] >= 4) { // High anxiety
      riskFactors.push('High anxiety levels reported');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      needsAttention: riskLevel !== 'low'
    };
  }

  generateFallbackAnalysis(scores) {
    let emotionalState = 'stable';
    let stateDescription = '';

    if (scores.overallWellness >= 70) {
      emotionalState = 'positive';
      stateDescription = 'showing strong emotional resilience and overall wellbeing';
    } else if (scores.overallWellness < 40) {
      emotionalState = 'concerning';
      stateDescription = 'indicating areas that may benefit from additional support and attention';
    } else {
      stateDescription = 'showing a balanced mix of strengths and areas for improvement';
    }

    const analysis = `Current mood assessment indicates ${emotionalState} emotional patterns, ${stateDescription}. Key areas of focus include stress management (${scores.stressManagement}%), social connections (${scores.socialConnection}%), and physical health (${scores.physicalHealth}%). Regular mood tracking can provide valuable insights for maintaining mental wellness and identifying patterns over time.`;

    return {
      summary: analysis.substring(0, 200) + '...',
      fullAnalysis: analysis,
      keyInsights: this.extractKeyInsights(scores),
      moodTrend: this.determineMoodTrend(scores),
      analysisDate: new Date().toISOString(),
      source: 'Rule-Based Analysis'
    };
  }

  async saveToDB(reportData) {
    const report = new MoodReport(reportData);
    return await report.save();
  }

  // Get user's mood tracking history
  async getUserMoodHistory(userId, limit = 10) {
    return await MoodReport.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('timestamp scores aiAnalysis.moodTrend riskAssessment.level');
  }
}

export default new MoodTrackerService();
