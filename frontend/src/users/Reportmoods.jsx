import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getmoodreport } from "../services/authService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// PDF Export Function
const exportToPDF = (report) => {
  const doc = new jsPDF("p", "pt", "a4");
  doc.setFontSize(16);
  doc.text("Mood Report", 40, 40);

  const addTable = (title, body, head, yOffset) => {
    doc.text(title, 40, yOffset);
    autoTable(doc, {
      startY: yOffset + 5,
      head: [head],
      body,
      theme: "grid",
      fontSize: 9,
      styles: { cellPadding: 2 },
      margin: { left: 40, right: 40 },
    });
    return doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : yOffset + 30;
  };

  let y = 50;

  y = addTable(
    "Scores",
    Object.entries(report.scores || {}).map(([k, v]) => [k, v]),
    ["Parameter", "Value"],
    y
  );

  y = addTable(
    "Mood Analysis",
    [
      ["Summary", report.aiAnalysis?.summary],
      ["Trend", report.aiAnalysis?.moodTrend],
      ["Date", report.aiAnalysis?.analysisDate],
      ["Source", report.aiAnalysis?.source],
    ],
    ["Metric", "Value"],
    y
  );

  y = addTable(
    "Key Insights",
    (report.aiAnalysis?.keyInsights || []).map((x, i) => [i + 1, x]),
    ["#", "Insight"],
    y
  );

  y = addTable(
    "Recommendations",
    (report.recommendations || []).map((rec, i) => [
      i + 1,
      `${rec.category}: ${rec.suggestion} (${rec.priority}${
        rec.timeframe ? `, ${rec.timeframe}` : ""
      })`,
    ]),
    ["#", "Recommendation"],
    y
  );

  y = addTable(
    "Risk Assessment",
    [
      ["Level", report.riskAssessment?.level ?? "-"],
      ["Needs Attention", report.riskAssessment?.needsAttention ? "Yes" : "No"],
      ...(report.riskAssessment?.factors?.map((factor, i) => [
        `Factor ${i + 1}`,
        factor,
      ]) || []),
    ],
    ["Metric", "Value"],
    y
  );

  // Split Questions dynamically into chunks of 10
  const chunkArray = (arr, size) =>
    arr.reduce(
      (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
      []
    );

  const questionChunks = chunkArray(report.questionMapping || [], 10);

  questionChunks.forEach((chunk, idx) => {
    const qs = chunk.map((q, i) => [
      `${idx * 10 + i + 1}. ${q.question}`,
      `${q.responseLabel} (${q.response}/5)`,
    ]);
    y = addTable(
      `Questions & Answers ${idx * 10 + 1}-${idx * 10 + chunk.length}`,
      qs,
      ["Question", "Response"],
      y
    );
  });

  doc.save("mood-report.pdf");
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not set";

// Compact Table Component
const CompactTable = ({ title, head, body }) => (
  <div className="bg-white rounded-md shadow-sm border border-gray-100 p-2 mb-1 flex-1 min-w-0">
    <div className="text-xs font-bold text-gray-600 mb-1">{title}</div>
    <table className="w-full text-[11px] table-fixed">
      <thead>
        <tr className="bg-gray-50">
          {head.map((h, i) => (
            <th key={i} className="px-2 py-1 font-semibold border-b">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, i) => (
          <tr key={i} className="border-t">
            {row.map((cell, j) => (
              <td
                key={j}
                className="px-2 py-1 border-b truncate max-w-[220px]"
              >
                {cell || "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Reportmoods = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getmoodreport(reportId)
      .then((data) => {
        setReport(data.data || data.report || data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load mood report.");
        setLoading(false);
      });

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [reportId]);

  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );

  if (!report)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">No report found.</div>
      </div>
    );

  // Split Questions dynamically
  const chunkArray = (arr, size) =>
    arr.reduce(
      (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
      []
    );
  const questionChunks = chunkArray(report.questionMapping || [], 10);

  return (
    <div className="h-screen w-screen font-manrope bg-gray-50 overflow-hidden flex flex-row">
      {/* Sidebar */}
      <div className="bg-[#3A53A4] h-screen w-[70px] flex flex-col items-center py-6 shadow-md">
        <div className="mb-12 w-7 h-7 rounded bg-blue-200"></div>
        <nav className="flex flex-col gap-7">
          <span className="text-[12px] opacity-80 text-white">R</span>
          <span className="text-[12px] opacity-80 text-white">D</span>
          <span className="text-[12px] opacity-80 text-white">S</span>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-3">
        {/* Header / Buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600 font-bold">
            Mood Report · {formatDate(report.aiAnalysis?.analysisDate)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportToPDF(report)}
              className="bg-blue-100 text-blue-700 px-3 py-1 text-xs rounded border border-blue-200 font-medium"
              disabled={!report}
            >
              Download PDF
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-100 text-gray-700 px-3 py-1 text-xs rounded font-medium border border-gray-200"
            >
              &larr; Back
            </button>
          </div>
        </div>

        {/* Data Tables - grid layout */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <CompactTable
            title="Scores"
            head={["Parameter", "Value"]}
            body={Object.entries(report.scores || {}).map(([k, v]) => [k, v])}
          />
          <CompactTable
            title="Mood Analysis"
            head={["Metric", "Value"]}
            body={[
              ["Summary", report.aiAnalysis?.summary],
              ["Trend", report.aiAnalysis?.moodTrend],
              ["Source", report.aiAnalysis?.source],
            ]}
          />
          <CompactTable
            title="Risk Assessment"
            head={["Metric", "Value"]}
            body={[
              ["Level", report.riskAssessment?.level ?? "-"],
              [
                "Needs Attention",
                report.riskAssessment?.needsAttention ? "Yes" : "No",
              ],
              ...(report.riskAssessment?.factors?.map((factor, i) => [
                `Factor ${i + 1}`,
                factor,
              ]) || []),
            ]}
          />
      </div>

        <div className="grid grid-cols-2 gap-4 mt-2 w-full">
          <CompactTable
            title="Key Insights"
            head={["#", "Insight"]}
            body={(report.aiAnalysis?.keyInsights || []).map((x, i) => [
              i + 1,
              x,
            ])}
          />
          <CompactTable
            title="Recommendations"
            head={["#", "Recommendation"]}
            body={(report.recommendations || []).map((rec, i) => [
              i + 1,
              `${rec.category}: ${rec.suggestion} (${rec.priority}${
                rec.timeframe ? `, ${rec.timeframe}` : ""
              })`,
            ])}
          />
        </div>

       {/* Partitioned Q&As dynamically */}
<div className="grid  h-2/6 grid-cols-2 gap-4 mt-2 w-full overflow-y-auto">
  {questionChunks.map((chunk, idx) => (
    <CompactTable
      key={idx}
      title={`Questions & Answers ${idx * 10 + 1}-${
        idx * 10 + chunk.length
      }`}
      head={["Question", "Response"]}
      body={chunk.map((q, i) => [
        `${idx * 10 + i + 1}. ${q.question}`,
        `${q.responseLabel} (${q.response}/5)`,
      ])}
    />
  ))}
</div>


        <div className="mt-2">
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-2 w-full">
            <div className="text-xs font-bold text-gray-600 mb-1">
              Full Analysis
            </div>
            <div className="text-[11px] text-gray-800">
              {report.aiAnalysis?.fullAnalysis || "No analysis available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportmoods;
