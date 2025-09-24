import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  // ObjectId connection to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  sessionId: {
    type: String,
    required: true,
    unique: true
  },

  user_context: {
    age: {
      type: Number,
      min: 0
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    has_emergency_contact: {
      type: Boolean,
      default: false
    }
  },

  analysis: {
    issues_detected: [{
      type: String,
      trim: true
    }],

    alert_level: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
      required: true
    },

    suggestions: [{
      type: String,
      trim: true
    }],

    emotion_analysis: [{
      label: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      }
    }],

    mental_bert_insights: [{
      token_str: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      }
    }],

    crisis_indicators: {
      detected: {
        type: Boolean,
        default: false
      },
      keywords_found: [{
        type: String
      }],
      severity_score: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      }
    },

    conversation_metrics: {
      total_messages: {
        type: Number,
        min: 0
      },
      user_messages_count: {
        type: Number,
        min: 0
      },
      total_words: {
        type: Number,
        min: 0
      },
      average_message_length: {
        type: Number,
        min: 0
      }
    }
  },

  mental_health_assessment: {
    detected_mood: {
      primary: {
        type: String,
        enum: ['happy', 'sad', 'anxious', 'angry', 'neutral', 'confused', 'excited', 'depressed', 'fear', 'joy'],
        default: 'neutral'
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      }
    },

    risk_factors: [{
      type: String,
      trim: true
    }],

    protective_factors: [{
      type: String,
      trim: true
    }],

    recommendations: [{
      type: String,
      trim: true
    }]
  },

  metadata: {
    analysis_timestamp: {
      type: Date,
      default: Date.now
    },
    processing_success: {
      type: Boolean,
      default: true
    },
    analysis_model_version: {
      type: String,
      default: 'v2.0'
    },
    ai_services_used: [{
      type: String,
      enum: ['huggingface_emotion', 'mental_bert', 'groq_llm', 'keyword_analysis']
    }],
    processing_time_ms: {
      type: Number,
      min: 0
    }
  },

  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'archived'],
    default: 'completed'
  },

  professional_review: {
    reviewed: {
      type: Boolean,
      default: false
    },
    // ObjectId connection to User (reviewer)
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    review_date: Date,
    review_notes: {
      type: String,
      trim: true
    },
    follow_up_required: {
      type: Boolean,
      default: false
    },
    follow_up_priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    }
  },

  privacy: {
    anonymized: {
      type: Boolean,
      default: false
    },
    data_retention_date: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    consent_given: {
      type: Boolean,
      default: true
    }
  }

}, {
  timestamps: true,
  collection: 'reports',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual ObjectId connection to User
reportSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to populate user context
reportSchema.pre('save', async function(next) {
  if (this.isNew && this.userId) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.userId).select('dob gender emergencyContact');
      
      if (user) {
        if (user.dob) {
          const today = new Date();
          const birthDate = new Date(user.dob);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          this.user_context.age = age;
        }
        
        this.user_context.gender = user.gender;
        this.user_context.has_emergency_contact = !!(user.emergencyContact && user.emergencyContact.name);
      }
    } catch (error) {
      console.error('Error populating user context:', error);
    }
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
