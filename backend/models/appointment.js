// models/appointmentModel.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true,
    default: () => `apt_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Core appointment data
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor', // Assuming you have a Doctor model
    required: true
  },
  
  // Appointment details
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 45
  },
  appointmentType: {
    type: String,
    enum: ['initial', 'followup', 'emergency', 'consultation'],
    default: 'consultation'
  },
  
  // Patient's concerns and symptoms
  appointmentDetails: {
    concern: {
      type: String,
      required: true
    },
    symptoms: {
      type: String
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    additionalNotes: String
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  
  // Communication & follow-up
  communicationHistory: [{
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['message', 'call', 'video_call', 'email'] },
    content: String,
    sentBy: { type: String, enum: ['patient', 'doctor', 'system'] }
  }],
  
  // Payment & billing
  payment: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    paymentMethod: String,
    transactionId: String
  },
  
  // Medical records
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  medicalNotes: String,
  diagnosis: String,
  
  // Technical data
  videoCallData: {
    roomId: String,
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    recordingUrl: String
  },
  
  // Metadata
  createdBy: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  lastModified: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Indexes for better query performance
appointmentSchema.index({ patient: 1, scheduledTime: 1 });
appointmentSchema.index({ doctor: 1, scheduledTime: 1 });
appointmentSchema.index({ status: 1, scheduledTime: 1 });
appointmentSchema.index({ appointmentId: 1 }, { unique: true });
appointmentSchema.index({ createdAt: 1 });

// ✅ Virtual fields
appointmentSchema.virtual('isUpcoming').get(function() {
  return this.scheduledTime > new Date() && ['pending', 'confirmed'].includes(this.status);
});

appointmentSchema.virtual('formattedScheduledTime').get(function() {
  return this.scheduledTime.toLocaleString();
});

// ✅ Middleware for data validation and cleanup
appointmentSchema.pre('save', function(next) {
  this.lastModified = new Date();
  this.version += 1;
  next();
});

appointmentSchema.statics.findUpcoming = function(userId, userType) {
  const field = userType === 'patient' ? 'patient' : 'doctor';
  return this.find({
    [field]: userId,
    scheduledTime: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  }).populate(userType === 'patient' ? 'doctor' : 'patient').sort({ scheduledTime: 1 });
};

export default mongoose.model('Appointment', appointmentSchema);
