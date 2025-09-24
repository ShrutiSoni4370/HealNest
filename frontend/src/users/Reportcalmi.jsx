import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getReportById } from '../services/authService';

const Reportcalmi = () => {
  const { reportId } = useParams(); // Get reportId from URL
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  // ✅ FIXED: Actually fetch data from backend instead of mock data
  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching report with ID:', reportId);
      
      // ✅ Call your actual API
      const response = await getReportById({ reportId });
      
      if (response.success) {
        setReport(response.data.report);
        console.log('✅ Report loaded successfully:', response.data.report);
      } else {
        throw new Error(response.error || 'Failed to fetch report');
      }
      
    } catch (error) {
      console.error('❌ Error fetching report:', error);
      setError(error.message || 'Failed to load report');
      
      // ✅ REMOVED: Don't set mock data on error, show error instead
      
    } finally {
      setLoading(false);
    }
  };

  // Download functionality (keep your existing functions)
  const downloadCSV = () => {
    if (!report) return;
    
    const csvData = [
      ['Category', 'Value', 'Score/Confidence', 'Details'],
      ['User Profile - Age', report.user_context?.age || 'N/A', '100%', `Gender: ${report.user_context?.gender || 'N/A'}`],
      ['Emergency Contact', report.user_context?.has_emergency_contact ? 'Available' : 'Not Available', '100%', 'Contact verification status'],
      ['Total Messages', report.analysis?.conversation_metrics?.total_messages || 0, '100%', `User: ${report.analysis?.conversation_metrics?.user_messages_count || 0}`],
      ['Total Words', report.analysis?.conversation_metrics?.total_words || 0, '100%', `Avg: ${report.analysis?.conversation_metrics?.average_message_length || 0} words/message`],
      ['Primary Mood', report.mental_health_assessment?.detected_mood?.primary || 'N/A', `${Math.round((report.mental_health_assessment?.detected_mood?.confidence || 0) * 100)}%`, 'AI-detected primary emotional state'],
      ...(report.analysis?.emotion_analysis || []).map(emotion => [`Emotion: ${emotion.label}`, emotion.label, `${Math.round(emotion.score * 100)}%`, 'Detected emotion confidence level']),
      ...(report.analysis?.mental_bert_insights || []).map(insight => [`Keyword: ${insight.token_str}`, insight.token_str, `${Math.round(insight.score * 100)}%`, 'Mental health keyword relevance']),
      ['Crisis Risk', report.analysis?.crisis_indicators?.detected ? 'Detected' : 'Not Detected', `${report.analysis?.crisis_indicators?.severity_score || 0}/10`, 'Crisis indicator assessment'],
      ['Alert Level', report.analysis?.alert_level || 'N/A', '100%', 'Overall risk assessment level'],
      ...(report.mental_health_assessment?.protective_factors || []).map(factor => ['Protective Factor', factor, '100%', 'Positive mental health indicator']),
      ...(report.analysis?.suggestions || []).map((suggestion, index) => [`Recommendation ${index + 1}`, suggestion, '100%', 'AI-generated recommendation']),
      ...(report.mental_health_assessment?.recommendations || []).map(rec => ['Professional Advice', rec, '100%', 'Clinical recommendation']),
      ...(report.metadata?.ai_services_used || []).map(service => ['AI Service', service, '100%', 'AI model used in analysis']),
      ['Processing Time', `${((report.metadata?.processing_time_ms || 0) / 1000).toFixed(2)}s`, '100%', 'Total analysis processing time'],
      ['Model Version', report.metadata?.analysis_model_version || 'N/A', '100%', 'AI analysis model version'],
      ['Processing Success', report.metadata?.processing_success ? 'Yes' : 'No', '100%', 'Analysis completion status']
    ];

    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mental_health_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (!report) return;
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mental Health Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; color: #333; }
          .item { margin-bottom: 8px; padding: 8px; border: 1px solid #ddd; }
          .item-title { font-weight: bold; }
          .meta { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HEALNEST - Mental Health Report</h1>
          <p>Generated on ${new Date(report.createdAt).toLocaleDateString()}</p>
          <p>Session: ${report.sessionId?.slice(-8) || 'N/A'} | Status: ${report.status || 'N/A'}</p>
        </div>
        
        <div class="section">
          <div class="section-title">User Profile</div>
          <div class="item">Age: ${report.user_context?.age || 'N/A'} | Gender: ${report.user_context?.gender || 'N/A'}</div>
          <div class="item">Emergency Contact: ${report.user_context?.has_emergency_contact ? 'Available' : 'Not Available'}</div>
        </div>

        <div class="section">
          <div class="section-title">Analysis Summary</div>
          <div class="item">Alert Level: ${report.analysis?.alert_level || 'N/A'}</div>
          <div class="item">Primary Mood: ${report.mental_health_assessment?.detected_mood?.primary || 'N/A'} (${Math.round((report.mental_health_assessment?.detected_mood?.confidence || 0) * 100)}% confidence)</div>
          <div class="item">Crisis Risk: ${report.analysis?.crisis_indicators?.detected ? 'Detected' : 'Not Detected'} (${report.analysis?.crisis_indicators?.severity_score || 0}/10)</div>
        </div>

        <div class="section">
          <div class="section-title">Conversation Metrics</div>
          <div class="item">Total Messages: ${report.analysis?.conversation_metrics?.total_messages || 0} (User: ${report.analysis?.conversation_metrics?.user_messages_count || 0})</div>
          <div class="item">Total Words: ${report.analysis?.conversation_metrics?.total_words || 0} (Average: ${report.analysis?.conversation_metrics?.average_message_length || 0} per message)</div>
        </div>

        <div class="section">
          <div class="section-title">Emotion Analysis</div>
          ${(report.analysis?.emotion_analysis || []).map(emotion => `
            <div class="item">${emotion.label}: ${Math.round(emotion.score * 100)}%</div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Mental Health Keywords</div>
          ${(report.analysis?.mental_bert_insights || []).map(insight => `
            <div class="item">${insight.token_str}: ${Math.round(insight.score * 100)}%</div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Protective Factors</div>
          ${(report.mental_health_assessment?.protective_factors || []).map(factor => `
            <div class="item">✓ ${factor}</div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Recommendations</div>
          ${(report.analysis?.suggestions || []).map((suggestion, index) => `
            <div class="item">${index + 1}. ${suggestion}</div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Professional Advice</div>
          ${(report.mental_health_assessment?.recommendations || []).map(rec => `
            <div class="item">• ${rec}</div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Emergency Resources</div>
          <div class="item">Crisis Hotline: 988</div>
          <div class="item">Crisis Text Line: Text 'HELLO' to 741741</div>
          <div class="item">Emergency: 911</div>
        </div>

        <div class="meta">
          <p>Processing Time: ${((report.metadata?.processing_time_ms || 0) / 1000).toFixed(2)} seconds</p>
          <p>Model Version: ${report.metadata?.analysis_model_version || 'N/A'}</p>
          <p>AI Services: ${(report.metadata?.ai_services_used || []).join(', ')}</p>
          <p>Report ID: ${reportId}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const downloadJSON = () => {
    if (!report) return;
    
    const jsonData = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mental_health_report_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ ADDED: Better loading state
  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading report...</p>
          <p className="text-gray-300 text-sm">Report ID: {reportId}</p>
        </div>
      </div>
    );
  }

  // ✅ ADDED: Error state
  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-700 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <i className="ri-error-warning-line text-6xl"></i>
          </div>
          <h2 className="text-white text-xl mb-2">Failed to Load Report</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchReportDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ ADDED: No report found state
  if (!report) {
    return (
      <div className="h-screen w-screen bg-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <i className="ri-file-search-line text-6xl"></i>
          </div>
          <p className="text-white mb-4">Report not found</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-700 flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-slate-800 font-bold text-sm">H</span>
            </div>
            <span className="text-white font-semibold text-lg">HEALNEST</span>
          </div>
          <div className="text-slate-400">|</div>
          <span className="text-slate-300">Mental Health Report</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm">
            {report.analysis?.alert_level || 'N/A'} Risk
          </span>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white px-3 py-1 rounded hover:bg-slate-600 transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
        <div className="h-full bg-white rounded border border-gray-200 overflow-hidden flex flex-col">
          
          {/* Title Section */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-800">Mental Health Report</h1>
              <div className="text-sm text-gray-600">
                Generated on {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Filter/Controls Section with Download Options */}
          <div className="bg-white px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  Session: ...{(report.sessionId || '').slice(-8)}
                </button>
                <button className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  Status: {report.status || 'N/A'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Hide Filters ∧</span>
                <span className="text-sm text-blue-600 cursor-pointer">Columns ▼</span>
                
                {/* Download Dropdown */}
                <div className="relative group">
                  <button className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 flex items-center">
                    Export ▼
                  </button>
                  <div className="absolute right-0 top-6 hidden group-hover:block bg-white border border-gray-200 rounded shadow-lg z-10 min-w-32">
                    <button 
                      onClick={downloadCSV}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Export CSV
                    </button>
                    <button 
                      onClick={downloadPDF}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📄 Export PDF
                    </button>
                    <button 
                      onClick={downloadJSON}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📋 Export JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Table */}
          <div className="flex-1 overflow-hidden">
            <table className="w-full h-full">
              <thead className="bg-slate-600 text-white">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-medium w-1/4">CATEGORY</th>
                  <th className="text-left px-4 py-2 text-sm font-medium w-1/4">VALUE</th>
                  <th className="text-left px-4 py-2 text-sm font-medium w-1/4">SCORE/CONFIDENCE ▲</th>
                  <th className="text-left px-4 py-2 text-sm font-medium w-1/4">DETAILS</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                
                {/* User Context */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">User Profile</td>
                  <td className="px-4 py-3 text-gray-600">Age: {report.user_context?.age || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">Gender: {report.user_context?.gender || 'N/A'}</td>
                </tr>
                
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Emergency Contact</td>
                  <td className="px-4 py-3 text-gray-600">{report.user_context?.has_emergency_contact ? 'Available' : 'Not Available'}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">Contact verification status</td>
                </tr>

                {/* Conversation Metrics */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Total Messages</td>
                  <td className="px-4 py-3 text-gray-600">{report.analysis?.conversation_metrics?.total_messages || 0}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">User: {report.analysis?.conversation_metrics?.user_messages_count || 0}</td>
                </tr>

                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Total Words</td>
                  <td className="px-4 py-3 text-gray-600">{report.analysis?.conversation_metrics?.total_words || 0}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">Avg: {report.analysis?.conversation_metrics?.average_message_length || 0} words/message</td>
                </tr>

                {/* Primary Mood */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Primary Mood</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{report.mental_health_assessment?.detected_mood?.primary || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">{Math.round((report.mental_health_assessment?.detected_mood?.confidence || 0) * 100)}%</td>
                  <td className="px-4 py-3 text-gray-600">AI-detected primary emotional state</td>
                </tr>

                {/* Emotion Analysis */}
                {(report.analysis?.emotion_analysis || []).map((emotion, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">Emotion: {emotion.label}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{emotion.label}</td>
                    <td className="px-4 py-3 text-gray-600">{Math.round(emotion.score * 100)}%</td>
                    <td className="px-4 py-3 text-gray-600">Detected emotion confidence level</td>
                  </tr>
                ))}

                {/* Mental Health Keywords */}
                {(report.analysis?.mental_bert_insights || []).map((insight, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">Keyword: {insight.token_str}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{insight.token_str}</td>
                    <td className="px-4 py-3 text-gray-600">{Math.round(insight.score * 100)}%</td>
                    <td className="px-4 py-3 text-gray-600">Mental health keyword relevance</td>
                  </tr>
                ))}

                {/* Crisis Assessment */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Crisis Risk</td>
                  <td className="px-4 py-3 text-gray-600">{report.analysis?.crisis_indicators?.detected ? 'Detected' : 'Not Detected'}</td>
                  <td className="px-4 py-3 text-gray-600">{report.analysis?.crisis_indicators?.severity_score || 0}/10</td>
                  <td className="px-4 py-3 text-gray-600">Crisis indicator assessment</td>
                </tr>

                {/* Alert Level */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Alert Level</td>
                  <td className="px-4 py-3 text-gray-600">{report.analysis?.alert_level || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">Overall risk assessment level</td>
                </tr>

                {/* Protective Factors */}
                {(report.mental_health_assessment?.protective_factors || []).map((factor, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">Protective Factor</td>
                    <td className="px-4 py-3 text-gray-600">{factor}</td>
                    <td className="px-4 py-3 text-gray-600">100%</td>
                    <td className="px-4 py-3 text-gray-600">Positive mental health indicator</td>
                  </tr>
                ))}

                {/* Recommendations */}
                {(report.analysis?.suggestions || []).map((suggestion, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">Recommendation {index + 1}</td>
                    <td className="px-4 py-3 text-gray-600">{suggestion}</td>
                    <td className="px-4 py-3 text-gray-600">100%</td>
                    <td className="px-4 py-3 text-gray-600">AI-generated recommendation</td>
                  </tr>
                ))}

                {/* Professional Recommendations */}
                {(report.mental_health_assessment?.recommendations || []).map((rec, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">Professional Advice</td>
                    <td className="px-4 py-3 text-gray-600">{rec}</td>
                    <td className="px-4 py-3 text-gray-600">100%</td>
                    <td className="px-4 py-3 text-gray-600">Clinical recommendation</td>
                  </tr>
                ))}

                {/* AI Services Used */}
                {(report.metadata?.ai_services_used || []).map((service, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">AI Service</td>
                    <td className="px-4 py-3 text-gray-600">{service}</td>
                    <td className="px-4 py-3 text-gray-600">100%</td>
                    <td className="px-4 py-3 text-gray-600">AI model used in analysis</td>
                  </tr>
                ))}

                {/* Processing Metadata */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Processing Time</td>
                  <td className="px-4 py-3 text-gray-600">{((report.metadata?.processing_time_ms || 0) / 1000).toFixed(2)}s</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">Total analysis processing time</td>
                </tr>

                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Model Version</td>
                  <td className="px-4 py-3 text-gray-600">{report.metadata?.analysis_model_version || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">AI analysis model version</td>
                </tr>

                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">Processing Success</td>
                  <td className="px-4 py-3 text-gray-600">{report.metadata?.processing_success ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-gray-600">100%</td>
                  <td className="px-4 py-3 text-gray-600">Analysis completion status</td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-slate-700 px-6 py-2 border-t border-gray-200 flex items-center justify-between">
            <span className="text-white text-sm">© 2025 HEALNEST • All Rights Reserved.</span>
            <span className="text-white text-sm">Report ID: {reportId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportcalmi;
