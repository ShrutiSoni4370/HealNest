import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import Report from '../models/aiCalmimodel.js'; // Fixed import path

dotenv.config();

// Mental health keywords and patterns for comprehensive analysis
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end it all', 'want to die',
  'can\'t go on', 'no point living', 'better off dead', 'harm myself',
  'self harm', 'cut myself', 'hurt myself', 'end my life', 'not worth living'
];

const DEPRESSION_KEYWORDS = [
  'depressed', 'hopeless', 'worthless', 'empty', 'numb', 'sad',
  'crying', 'tears', 'lonely', 'isolated', 'dark thoughts', 'despair',
  'no energy', 'can\'t sleep', 'tired all the time', 'nothing matters'
];

const ANXIETY_KEYWORDS = [
  'anxious', 'worried', 'panic', 'fear', 'scared', 'nervous',
  'stress', 'overwhelmed', 'can\'t breathe', 'heart racing', 'trembling',
  'panic attack', 'constant worry', 'can\'t stop thinking'
];

const POSITIVE_KEYWORDS = [
  'happy', 'good', 'better', 'improving', 'grateful', 'hopeful',
  'excited', 'calm', 'peaceful', 'confident', 'motivated', 'optimistic'
];

// Enhanced MentalBERT analysis with fallback models
async function analyzeMentalHealthWithMentalBERT(text) {
  const mentalModels = [
    "mental/mental-bert-base-uncased",
    "j-hartmann/emotion-english-distilroberta-base",
    "bert-base-uncased"
  ];

  for (const modelName of mentalModels) {
    try {
      const apiUrl = `https://api-inference.huggingface.co/models/${modelName}`;

      const prompts = [
        `${text} I feel [MASK].`,
        `When I think about this, I am [MASK].`,
        `My mental state is [MASK].`
      ];

      const results = [];

      for (const prompt of prompts) {
        try {
          const response = await axios.post(
            apiUrl,
            {
              inputs: prompt,
              options: { wait_for_model: true }
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.HF_API_KEY1}`,
                "Content-Type": "application/json",
              },
              timeout: 30000,
            }
          );

          if (response.data && Array.isArray(response.data)) {
            results.push(...response.data.slice(0, 3));
          }
        } catch (promptError) {
          console.error(`Error with prompt "${prompt}" on model ${modelName}:`, promptError.response?.status);
          continue;
        }
      }

      if (results.length > 0) {
        console.log(`Successfully used mental model: ${modelName}`);
        return results.sort((a, b) => b.score - a.score).slice(0, 5);
      }

    } catch (error) {
      console.error(`Mental model ${modelName} failed:`, error.response?.status);
      continue;
    }
  }

  console.log("All MentalBERT models failed, returning empty array");
  return [];
}

// Enhanced mental health classification with fallback models
async function classifyMentalHealth(text) {
  const emotionModels = [
    "cardiffnlp/twitter-roberta-base-emotion",
    "j-hartmann/emotion-english-distilroberta-base",
    "nateraw/bert-base-uncased-emotion"
  ];

  for (const modelName of emotionModels) {
    try {
      const apiUrl = `https://api-inference.huggingface.co/models/${modelName}`;

      const response = await axios.post(
        apiUrl,
        { inputs: text, options: { wait_for_model: true } },
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY1}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      console.log(`Successfully used emotion model: ${modelName}`);
      return response.data;

    } catch (error) {
      console.error(`Emotion model ${modelName} failed:`, error.response?.status, error.message);

      if (modelName === emotionModels[emotionModels.length - 1]) {
        console.log("All emotion models failed, using keyword-based analysis");
        return performKeywordBasedEmotionAnalysis(text);
      }
      continue;
    }
  }
}

// Fallback emotion analysis using keywords
function performKeywordBasedEmotionAnalysis(text) {
  const lowerText = text.toLowerCase();
  const emotions = [];

  let sadnessScore = 0;
  let fearScore = 0;
  let joyScore = 0;
  let angerScore = 0;

  DEPRESSION_KEYWORDS.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    sadnessScore += matches * 0.3;
  });

  ANXIETY_KEYWORDS.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    fearScore += matches * 0.3;
  });

  POSITIVE_KEYWORDS.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    joyScore += matches * 0.3;
  });

  const angerKeywords = ['angry', 'mad', 'furious', 'rage', 'hate', 'frustrated'];
  angerKeywords.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    angerScore += matches * 0.3;
  });

  const maxScore = Math.max(sadnessScore, fearScore, joyScore, angerScore, 0.1);

  if (sadnessScore > 0) emotions.push({ label: 'sadness', score: Math.min(sadnessScore / maxScore, 1) });
  if (fearScore > 0) emotions.push({ label: 'fear', score: Math.min(fearScore / maxScore, 1) });
  if (joyScore > 0) emotions.push({ label: 'joy', score: Math.min(joyScore / maxScore, 1) });
  if (angerScore > 0) emotions.push({ label: 'anger', score: Math.min(angerScore / maxScore, 1) });

  return emotions.length > 0 ? emotions.sort((a, b) => b.score - a.score) : [{ label: 'neutral', score: 0.5 }];
}

// FIXED: Enhanced Groq API with proper response handling
async function generateWithGroq(systemPrompt, userMessage) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].message &&
      response.data.choices[0].message.content) {

      return response.data.choices[0].message.content;
    } else {
      console.error("Groq response structure unexpected:", JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error("Groq Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

// FIXED: Enhanced system prompt generation
function generateSystemPrompt(emotionAnalysis, mentalBertAnalysis, riskLevel = 'low') {
  let prompt = `You are Calmi, a compassionate mental health support AI assistant. You provide empathetic, supportive responses while being professional and caring. `;

  if (riskLevel === 'crisis') {
    prompt += `CRITICAL: The user may be in crisis. Your response must include immediate crisis resources and encourage professional help. `;
  } else if (riskLevel === 'high') {
    prompt += `The user appears to be struggling significantly. Provide extra support and gently suggest professional resources. `;
  }

  if (emotionAnalysis && Array.isArray(emotionAnalysis) && emotionAnalysis.length > 0) {
    const topEmotion = emotionAnalysis[0];

    if (topEmotion.label === "sadness" && topEmotion.score > 0.6) {
      prompt += `The user is expressing sadness or depression. Provide gentle validation, empathy, and hope. `;
    } else if (topEmotion.label === "fear" && topEmotion.score > 0.6) {
      prompt += `The user may be experiencing anxiety or fear. Offer calming reassurance and grounding techniques. `;
    } else if (topEmotion.label === "anger" && topEmotion.score > 0.6) {
      prompt += `The user seems frustrated or angry. Acknowledge their feelings without judgment and help them process. `;
    } else if (topEmotion.label === "joy" && topEmotion.score > 0.6) {
      prompt += `The user is expressing positive emotions. Celebrate with them while staying supportive. `;
    }
  }

  if (mentalBertAnalysis && Array.isArray(mentalBertAnalysis)) {
    const topPredictions = mentalBertAnalysis.slice(0, 3).map(p => p.token_str);
    if (topPredictions.length > 0) {
      prompt += `Context analysis suggests emotional themes: ${topPredictions.join(", ")}. `;
    }
  }

  prompt += `Guidelines for your response:
- Always validate their feelings and show empathy
- Use "I" statements to show you're listening ("I hear that...", "I understand...")
- Ask gentle follow-up questions to encourage sharing
- Provide practical coping strategies when appropriate
- Keep responses warm but concise (2-4 sentences)
- Include crisis resources if ANY risk is detected
- Never diagnose or provide medical advice
- Encourage professional help when needed`;

  return prompt;
}

// Risk assessment function
function assessRiskLevel(text) {
  const lowerText = text.toLowerCase();

  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'crisis';
    }
  }

  const highRiskIndicators = ['self harm', 'hurt myself', 'can\'t take it', 'give up', 'no hope'];
  for (const indicator of highRiskIndicators) {
    if (lowerText.includes(indicator)) {
      return 'high';
    }
  }

  let riskScore = 0;
  [...DEPRESSION_KEYWORDS, ...ANXIETY_KEYWORDS].forEach(keyword => {
    if (lowerText.includes(keyword)) riskScore++;
  });

  if (riskScore >= 3) return 'medium';
  return 'low';
}

// FIXED: Enhanced fallback response generator
function generateFallbackResponse(message, riskLevel, emotions) {
  const lowerMessage = message.toLowerCase();

  if (riskLevel === 'crisis') {
    return "I'm very concerned about you right now. Your life has value and meaning, even when it doesn't feel that way. Please reach out for immediate help: Call or text 988 for the Suicide & Crisis Lifeline, or text 'HELLO' to 741741. You deserve support and care. 💜";
  }

  if (riskLevel === 'high') {
    return "I can hear that you're really struggling right now, and I want you to know that your feelings are valid. It takes courage to reach out. Have you been able to talk to a counselor or therapist about what you're experiencing? Professional support can make a real difference. 🤗";
  }

  if (emotions && Array.isArray(emotions) && emotions.length > 0) {
    const topEmotion = emotions[0];

    if (topEmotion.label === 'sadness') {
      return "I hear the sadness in your words, and I want you to know that what you're feeling is completely valid. Difficult emotions can feel overwhelming, but they don't last forever. What's been weighing most heavily on your heart lately? 💙";
    } else if (topEmotion.label === 'fear') {
      return "It sounds like you might be feeling anxious or worried about something. Those feelings can be really intense and uncomfortable. Take a deep breath with me - what's one thing that's been on your mind that I can help you talk through? 🫂";
    } else if (topEmotion.label === 'anger') {
      return "I can sense some frustration or anger in what you're sharing. Those are completely normal feelings, and it's okay to experience them. Sometimes talking through what's bothering us can help. What's been the most frustrating part of your situation? 💚";
    } else if (topEmotion.label === 'joy') {
      return "I can hear some positive energy in your message! That's wonderful. It's great that you're sharing good news. What's been bringing you joy lately? 😊";
    }
  }

  if (lowerMessage.includes('job') || lowerMessage.includes('new job')) {
    return "Congratulations on your new job! That's such exciting news! 🎉 Starting a new job can bring a mix of emotions - excitement, nervousness, hope. How are you feeling about this new opportunity? I'd love to hear more about it! 🌟";
  } else if (lowerMessage.includes('depress') || lowerMessage.includes('sad')) {
    return "Thank you for trusting me with these difficult feelings. Depression can make everything feel heavier and more challenging. You're not alone in this, and reaching out shows real strength. How long have you been feeling this way? 🌟";
  } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worry')) {
    return "Anxiety can feel overwhelming, like your mind is racing and you can't find peace. I want you to know that these feelings, while uncomfortable, are temporary. Let's take this one step at a time - what's one thing that's worrying you most right now? 🕊️";
  } else if (lowerMessage.includes('stress')) {
    return "Stress can really take a toll on both our minds and bodies. It sounds like you're carrying a heavy load right now. Remember, it's okay to take breaks and ask for help. What's been the biggest source of stress for you lately? 🌱";
  }

  const generalResponses = [
    "Thank you for sharing this with me. I'm here to listen and support you through whatever you're facing. What's been on your mind that you'd like to talk about? 💜",
    "I appreciate you opening up to me. Your feelings and experiences matter, and I want to understand better. How can I best support you right now? 🤗",
    "I'm glad you reached out. Sometimes just talking about what we're going through can help us feel less alone. What would be most helpful for you in this moment? 💙",
    "Your willingness to share shows real courage. I'm here to listen without judgment and offer support. What's been weighing most heavily on your heart? 🌟"
  ];

  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// Emergency response for critical errors
function getEmergencyResponse() {
  return "I'm experiencing some technical difficulties, but I want you to know that I care about your wellbeing. If you're in crisis, please don't hesitate to reach out for immediate help: 988 Suicide & Crisis Lifeline or text 'HELLO' to 741741. You matter, and support is available. 💜";
}

// Main AI service for Calmi responses
export const aicalmiservice = async (message) => {
  try {
    console.log("Processing message:", message.substring(0, 100) + "...");

    const riskLevel = assessRiskLevel(message);
    console.log("Risk level:", riskLevel);

    const [emotionAnalysis, mentalBertAnalysis] = await Promise.allSettled([
      classifyMentalHealth(message),
      analyzeMentalHealthWithMentalBERT(message)
    ]);

    const emotions = emotionAnalysis.status === 'fulfilled' ? emotionAnalysis.value : null;
    const mentalBert = mentalBertAnalysis.status === 'fulfilled' ? mentalBertAnalysis.value : null;

    console.log("Emotion analysis:", emotions ? emotions.slice(0, 2) : "Failed");
    console.log("MentalBERT analysis:", mentalBert ? mentalBert.slice(0, 2) : "Failed");

    const systemPrompt = generateSystemPrompt(emotions, mentalBert, riskLevel);
    let response = await generateWithGroq(systemPrompt, message);

    if (!response) {
      response = generateFallbackResponse(message, riskLevel, emotions);
    }

    if (riskLevel === 'crisis' && response && !response.includes('988')) {
      response += "\n\n🚨 IMMEDIATE HELP: Please contact 988 Suicide & Crisis Lifeline (call or text 988) or go to your nearest emergency room. You don't have to go through this alone.";
    }

    console.log("Generated response length:", response ? response.length : 0);
    return response;

  } catch (error) {
    console.error("Error in aicalmiservice:", error);
    return getEmergencyResponse();
  }
};

// UPDATED: Enhanced chat analysis service with DATABASE SAVE
export const analyzeChatService = async (chatHistory, userId = null, sessionId = null, saveToDatabase = true) => {
  const processingStartTime = Date.now();

  try {
    console.log("Starting comprehensive chat analysis...");

    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
      return { error: "Invalid chat history - must be a non-empty array" };
    }

    const userMessages = chatHistory
      .filter(msg => (msg.role === "user" || msg.sender === "patient") && (msg.content || msg.text))
      .map(msg => msg.content || msg.text)
      .filter(text => text && text.trim().length > 0)
      .join(" ");

    if (!userMessages.trim()) {
      return { error: "No valid user messages found to analyze" };
    }

    console.log(`Analyzing ${userMessages.length} characters from ${chatHistory.length} messages`);

    const [emotionResult, mentalBertResult] = await Promise.allSettled([
      classifyMentalHealth(userMessages),
      analyzeMentalHealthWithMentalBERT(userMessages)
    ]);

    const emotionAnalysis = emotionResult.status === 'fulfilled' ? emotionResult.value : null;
    const mentalBertAnalysis = mentalBertResult.status === 'fulfilled' ? mentalBertResult.value : null;

    const aiProcessingTime = Date.now() - processingStartTime;

    const aiServicesUsed = [];
    if (emotionAnalysis?.length > 0) aiServicesUsed.push('huggingface_emotion');
    if (mentalBertAnalysis?.length > 0) aiServicesUsed.push('mental_bert');
    aiServicesUsed.push('keyword_analysis');

    // Initialize comprehensive report
    const report = {
      issues_detected: [],
      alert_level: "Low",
      suggestions: [],
      emotion_analysis: emotionAnalysis || [],
      mental_bert_insights: mentalBertAnalysis || [],
      crisis_indicators: {
        detected: false,
        keywords_found: [],
        severity_score: 0
      },
      conversation_metrics: {
        total_messages: chatHistory.length,
        user_messages_count: chatHistory.filter(msg => msg.role === "user" || msg.sender === "patient").length,
        total_words: userMessages.split(/\s+/).length,
        average_message_length: 0
      },
      mental_health_assessment: {
        detected_mood: { primary: 'neutral', confidence: 0.5 },
        risk_factors: [],
        protective_factors: [],
        recommendations: []
      },
      analysis_timestamp: new Date().toISOString(),
      processing_success: true
    };

    // Calculate conversation metrics
    const userMessagesList = chatHistory.filter(msg => msg.role === "user" || msg.sender === "patient");
    if (userMessagesList.length > 0) {
      const totalWords = userMessagesList.reduce((sum, msg) => {
        const text = msg.content || msg.text || '';
        return sum + text.split(/\s+/).length;
      }, 0);
      report.conversation_metrics.average_message_length = Math.round(totalWords / userMessagesList.length);
    }

    // Crisis detection - HIGHEST PRIORITY
    const lowerText = userMessages.toLowerCase();
    const foundCrisisKeywords = CRISIS_KEYWORDS.filter(keyword => lowerText.includes(keyword));

    if (foundCrisisKeywords.length > 0) {
      report.alert_level = "Critical";
      report.crisis_indicators.detected = true;
      report.crisis_indicators.keywords_found = foundCrisisKeywords;
      report.crisis_indicators.severity_score = Math.min(foundCrisisKeywords.length * 2, 10);
      report.issues_detected.push(`🚨 CRISIS INDICATORS: ${foundCrisisKeywords.join(', ')}`);
      report.mental_health_assessment.risk_factors.push("Suicidal ideation expressed");

      report.suggestions = [
        "🚨 IMMEDIATE: Contact 988 Suicide & Crisis Lifeline (call or text 988)",
        "🏥 Seek emergency help at nearest hospital or call 911",
        "👥 Don't isolate - reach out to trusted friend or family member NOW",
        "📞 Crisis Text Line: Text 'HELLO' to 741741",
        "🔒 Remove access to means of self-harm if possible"
      ];

      console.log("CRISIS DETECTED - Keywords found:", foundCrisisKeywords);
    }

    // Self-harm detection
    const selfHarmKeywords = ['self harm', 'cut myself', 'hurt myself', 'harm myself'];
    const foundSelfHarmKeywords = selfHarmKeywords.filter(keyword => lowerText.includes(keyword));

    if (foundSelfHarmKeywords.length > 0 && report.alert_level !== "Critical") {
      report.alert_level = "High";
      report.issues_detected.push("Self-harm indicators detected");
      report.mental_health_assessment.risk_factors.push("Self-harm behaviors mentioned");

      if (!report.crisis_indicators.detected) {
        report.suggestions = [
          "🆘 Consider contacting a crisis helpline: 988 or text 'HELLO' to 741741",
          "🏥 Speak with a mental health professional immediately",
          "👥 Reach out to a trusted friend, family member, or counselor",
          "🔧 Consider removing or securing items that could be used for self-harm",
          "📱 Download a safety app like 'MY3' for crisis planning"
        ];
      }
    }

    // FIXED: Emotion analysis processing
    if (emotionAnalysis && Array.isArray(emotionAnalysis) && emotionAnalysis.length > 0) {
      const topEmotion = emotionAnalysis[0];

      if (topEmotion && topEmotion.score > 0.6) {
        report.mental_health_assessment.detected_mood.primary = topEmotion.label;
        report.mental_health_assessment.detected_mood.confidence = topEmotion.score;

        report.issues_detected.push(`${topEmotion.label.toUpperCase()} detected (${Math.round(topEmotion.score * 100)}% confidence)`);

        if (topEmotion.label === "sadness" && report.alert_level === "Low") {
          report.alert_level = "Medium";
          report.mental_health_assessment.risk_factors.push("Depressive symptoms identified");

          report.suggestions = [
            "🗣️ Consider speaking with a mental health counselor or therapist",
            "🚶‍♀️ Engage in gentle physical activities like walking or yoga",
            "👥 Connect with supportive friends or family members",
            "📝 Try journaling to express and process your feelings",
            "🎵 Listen to uplifting music or engage in creative activities",
            "😴 Maintain a regular sleep schedule and practice good sleep hygiene"
          ];

        } else if (topEmotion.label === "fear" && report.alert_level === "Low") {
          report.alert_level = "Medium";
          report.mental_health_assessment.risk_factors.push("Anxiety symptoms identified");

          report.suggestions = [
            "🧘‍♀️ Practice deep breathing exercises (try the 4-7-8 technique)",
            "🧠 Try mindfulness meditation apps like Headspace or Calm",
            "📚 Learn about anxiety management and coping techniques",
            "💪 Consider gradual exposure to feared situations with support",
            "🏥 Speak with a healthcare provider about anxiety resources",
            "🏃‍♀️ Regular exercise can help reduce anxiety symptoms"
          ];

        } else if (topEmotion.label === "anger" && report.alert_level === "Low") {
          report.mental_health_assessment.risk_factors.push("Elevated anger/frustration");

          report.suggestions.push(
            "😤 Practice anger management techniques like counting to 10",
            "🥊 Find healthy outlets for anger like exercise or journaling",
            "🗣️ Consider talking to someone about what's frustrating you"
          );
        }
      }
    }

    // MentalBERT insights processing
    if (mentalBertAnalysis && Array.isArray(mentalBertAnalysis)) {
      const topPredictions = mentalBertAnalysis
        .filter(prediction => prediction.score > 0.1)
        .slice(0, 5)
        .map(p => `${p.token_str} (${Math.round(p.score * 100)}%)`);

      if (topPredictions.length > 0) {
        report.issues_detected.push(`Mental state indicators: ${topPredictions.join(', ')}`);
      }
    }

    // Keyword-based risk assessment
    let depressionScore = 0;
    let anxietyScore = 0;

    DEPRESSION_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) depressionScore++;
    });

    ANXIETY_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) anxietyScore++;
    });

    if (depressionScore >= 3 && report.alert_level === "Low") {
      report.alert_level = "Medium";
      report.issues_detected.push(`Multiple depression indicators (${depressionScore} keywords)`);
      report.mental_health_assessment.risk_factors.push("Multiple depressive symptoms mentioned");
    }

    if (anxietyScore >= 3 && report.alert_level === "Low") {
      report.alert_level = "Medium";
      report.issues_detected.push(`Multiple anxiety indicators (${anxietyScore} keywords)`);
      report.mental_health_assessment.risk_factors.push("Multiple anxiety symptoms mentioned");
    }

    // Identify protective factors
    POSITIVE_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        report.mental_health_assessment.protective_factors.push(`Mentions of ${keyword}`);
      }
    });

    const supportIndicators = ['family', 'friends', 'therapist', 'counselor', 'support group', 'help'];
    supportIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        report.mental_health_assessment.protective_factors.push(`Has ${indicator} support`);
      }
    });

    // Default suggestions if none set
    if (report.suggestions.length === 0) {
      report.suggestions = [
        "🧘‍♀️ Continue practicing self-care and mindfulness",
        "😴 Maintain regular sleep schedule (7-9 hours)",
        "🏃‍♀️ Stay active with regular exercise",
        "👥 Keep strong connections with friends and family",
        "📚 Consider reading about mental wellness strategies",
        "🍎 Focus on balanced nutrition and healthy habits"
      ];
    }

    // Generate professional recommendations
    if (report.alert_level === "Critical" || report.alert_level === "High") {
      report.mental_health_assessment.recommendations.push(
        "Immediate professional intervention required",
        "Crisis safety planning needed",
        "Consider inpatient or intensive outpatient treatment"
      );
    } else if (report.alert_level === "Medium") {
      report.mental_health_assessment.recommendations.push(
        "Professional counseling or therapy recommended",
        "Regular mental health check-ins advised",
        "Consider medication evaluation if symptoms persist"
      );
    } else {
      report.mental_health_assessment.recommendations.push(
        "Continue monitoring mental health",
        "Maintain healthy coping strategies",
        "Seek support if symptoms worsen"
      );
    }

    console.log(`Analysis complete - Alert level: ${report.alert_level}, Issues: ${report.issues_detected.length}`);


    // DATABASE SAVE SECTION - FIXED DATA STRUCTURE
    let savedReport = null;
    if (saveToDatabase && userId) {
      try {
        console.log("Saving report to database...");

        const reportSessionId = sessionId || `analysis_${Date.now()}_${uuidv4().slice(0, 8)}`;
        const totalProcessingTime = Date.now() - processingStartTime;

        // FIX: Flatten and validate emotion analysis data
        let processedEmotionAnalysis = [];
        if (emotionAnalysis && Array.isArray(emotionAnalysis)) {
          // Check if it's nested array (like your log shows)
          const flatEmotions = Array.isArray(emotionAnalysis[0]) ? emotionAnalysis[0] : emotionAnalysis;

          processedEmotionAnalysis = flatEmotions
            .filter(emotion => emotion && emotion.label && typeof emotion.score === 'number')
            .map(emotion => ({
              label: emotion.label,
              score: emotion.score
            }));
        }

        // FIX: Flatten and validate mental BERT data
        let processedMentalBertInsights = [];
        if (mentalBertAnalysis && Array.isArray(mentalBertAnalysis)) {
          // Flatten nested arrays and convert to expected format
          const flatMentalBert = mentalBertAnalysis.flat();

          processedMentalBertInsights = flatMentalBert
            .filter(item => item && item.label && typeof item.score === 'number')
            .slice(0, 10) // Limit to prevent too much data
            .map(item => ({
              token_str: item.label || item.token_str, // Use label if token_str doesn't exist
              score: item.score
            }));
        }

        console.log('Processed emotion analysis:', processedEmotionAnalysis.length, 'items');
        console.log('Processed mental bert insights:', processedMentalBertInsights.length, 'items');

        const reportData = {
          userId: userId,
          sessionId: reportSessionId,
          analysis: {
            issues_detected: report.issues_detected,
            alert_level: report.alert_level,
            suggestions: report.suggestions,
            emotion_analysis: processedEmotionAnalysis, // Use processed data
            mental_bert_insights: processedMentalBertInsights, // Use processed data
            crisis_indicators: report.crisis_indicators,
            conversation_metrics: report.conversation_metrics
          },
          mental_health_assessment: report.mental_health_assessment,
          metadata: {
            analysis_timestamp: new Date(),
            processing_success: true,
            analysis_model_version: 'v2.0',
            ai_services_used: aiServicesUsed,
            processing_time_ms: totalProcessingTime
          },
          status: 'completed',
          privacy: {
            anonymized: false,
            consent_given: true,
            data_retention_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        };

        // Validate data before saving
        if (processedEmotionAnalysis.length === 0) {
          console.log('No valid emotion analysis data, using default');
          reportData.analysis.emotion_analysis = [{ label: 'neutral', score: 0.5 }];
        }

        if (processedMentalBertInsights.length === 0) {
          console.log('No valid mental bert data, using empty array');
          reportData.analysis.mental_bert_insights = [];
        }

        const reportDoc = new Report(reportData);
        savedReport = await reportDoc.save();

        console.log(`✅ Report saved successfully with ID: ${savedReport._id}`);

        report.database_save = {
          success: true,
          report_id: savedReport._id,
          session_id: reportSessionId,
          saved_at: savedReport.createdAt
        };

      } catch (saveError) {
        console.error("❌ Error saving report to database:", saveError.message);

        report.database_save = {
          success: false,
          error: saveError.message,
          attempted_at: new Date().toISOString()
        };
      }
    } else if (saveToDatabase && !userId) {
      console.log("Database save requested but no userId provided - skipping save");
      report.database_save = {
        success: false,
        error: "No userId provided for database save",
        skipped: true
      };
    }


    // Add processing metadata to response
    report.processing_metadata = {
      total_processing_time_ms: Date.now() - processingStartTime,
      ai_processing_time_ms: aiProcessingTime,
      services_used: aiServicesUsed,
      database_save_attempted: saveToDatabase,
      timestamp: new Date().toISOString()
    };

    return report;

  } catch (error) {
    console.error("Comprehensive analysis error:", error);

    return {
      error: "Analysis failed",
      details: error.message,
      issues_detected: ["Analysis system temporarily unavailable"],
      alert_level: "Low",
      suggestions: [
        "Please try the analysis again in a few moments",
        "If you're in crisis, contact 988 Suicide & Crisis Lifeline immediately",
        "Consider speaking with a mental health professional"
      ],
      analysis_timestamp: new Date().toISOString(),
      processing_success: false,
      database_save: {
        success: false,
        error: "Analysis failed before database save could be attempted"
      }
    };
  }
};

// Convenience function for analyzing and saving reports
export const analyzeAndSaveReport = async (chatHistory, userId, sessionId = null) => {
  return await analyzeChatService(chatHistory, userId, sessionId, true);
};

// Function to analyze without saving
export const analyzeOnly = async (chatHistory) => {
  return await analyzeChatService(chatHistory, null, null, false);
};

// Enhanced health check function
export const healthCheck = async () => {
  try {
    const results = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Test Emotion Classification
    try {
      const emotionTest = await classifyMentalHealth("I am feeling happy today");
      results.services.emotion_classification = {
        status: "healthy",
        model: emotionTest?.length > 0 ? "working" : "fallback"
      };
    } catch (error) {
      results.services.emotion_classification = {
        status: "degraded",
        error: error.message
      };
    }

    // Test MentalBERT
    try {
      const mentalBertTest = await analyzeMentalHealthWithMentalBERT("I feel good");
      results.services.mental_bert = {
        status: mentalBertTest?.length > 0 ? "healthy" : "degraded",
        predictions: mentalBertTest?.length || 0
      };
    } catch (error) {
      results.services.mental_bert = {
        status: "degraded",
        error: error.message
      };
    }

    // Test Groq
    try {
      const groqTest = await generateWithGroq("You are a helpful assistant.", "Say hello");
      results.services.groq_api = {
        status: groqTest ? "healthy" : "degraded",
        response_length: groqTest?.length || 0
      };
    } catch (error) {
      results.services.groq_api = {
        status: "degraded",
        error: error.message
      };
    }

    // Check environment variables
    results.environment = {
      hf_api_key: !!process.env.HF_API_KEY1,
      groq_api_key: !!process.env.GROQ_API_KEY
    };

    // Overall status
    const allHealthy = Object.values(results.services).every(service =>
      service.status === "healthy"
    );

    results.status = allHealthy ? "healthy" : "degraded";

    return results;

  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

export default {
  aicalmiservice,
  analyzeChatService,
  analyzeAndSaveReport,
  analyzeOnly,
  healthCheck
};
