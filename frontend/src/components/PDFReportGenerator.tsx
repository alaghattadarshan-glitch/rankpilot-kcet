import { useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PDFReportGenerator() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const generateReport = async () => {
    setIsGenerating(true);
    setStatus('idle');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      // 1. Log report generation start
      await apiClient.post('/reports/log', { action: 'generate' });

      // 2. Fetch all necessary data for report
      const [recsRes, prefsRes] = await Promise.all([
        apiClient.get('/recommendations'),
        apiClient.get('/users/me')
      ]);

      const recommendations = recsRes.data.all_recommendations || [];
      const studentPrefs = prefsRes.data.preferences || {};
      const studentName = prefsRes.data.full_name || user?.email?.split('@')[0] || 'Student';

      // 3. Initialize jsPDF
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [37, 99, 235]; // Indigo Blue
      const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
      
      // Page 1: Premium Title Page
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.rect(0, 0, 210, 297, 'F');

      // Decorative gradient line
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 100, 210, 8, 'F');

      // Title & Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(38);
      doc.text("RankPilot", 25, 90);
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'normal');
      doc.text("AI-Powered Counselling Intelligence Report", 25, 125);
      
      doc.setFontSize(14);
      doc.setTextColor(156, 163, 175);
      doc.text("Personalized KCET Strategy, Branch Suitability, and Options Guide", 25, 137);

      // Student metadata card on Title Page
      doc.setFillColor(30, 41, 59);
      doc.rect(25, 170, 160, 85, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("STUDENT PROFILE METRICS", 35, 185);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(209, 213, 219);
      doc.text(`Full Name:  ${studentName}`, 35, 200);
      doc.text(`Registered Email:  ${user?.email || 'N/A'}`, 35, 208);
      doc.text(`KCET All-India Rank:  #${studentPrefs.kcet_rank?.toLocaleString() || 'Pending'}`, 35, 216);
      doc.text(`Reservation Category:  ${studentPrefs.category || 'General Merit (GM)'}`, 35, 224);
      doc.text(`Target Counselling Round:  ${studentPrefs.counselling_round || 'Mock Round'}`, 35, 232);
      doc.text(`Report Generated On:  ${new Date().toLocaleDateString()}`, 35, 240);

      // Footer
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(10);
      doc.text("RankPilot SaaS © 2026. Confidential analysis prepared exclusively for candidate.", 25, 280);

      // Page 2: Analytics & Admission Probability
      doc.addPage();
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text("Counselling Strategy & Admissions Dashboard", 15, 20);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text("Below is a summarized distribution of your target options segmented by historical KEA cutoff drift and AI predictability bounds.", 15, 28);

      // Draw safe/moderate/dream summary boxes
      const safes = recommendations.filter((r: any) => r.type === 'safe');
      const moderates = recommendations.filter((r: any) => r.type === 'moderate');
      const dreams = recommendations.filter((r: any) => r.type === 'dream');

      doc.setFillColor(240, 253, 244); // light green
      doc.rect(15, 35, 55, 30, 'F');
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`${safes.length}`, 20, 48);
      doc.setFontSize(10);
      doc.text("Safe Options", 20, 56);

      doc.setFillColor(254, 253, 222); // light yellow
      doc.rect(78, 35, 55, 30, 'F');
      doc.setTextColor(133, 77, 14);
      doc.setFontSize(16);
      doc.text(`${moderates.length}`, 83, 48);
      doc.setFontSize(10);
      doc.text("Moderate Options", 83, 56);

      doc.setFillColor(255, 241, 242); // light red
      doc.rect(140, 35, 55, 30, 'F');
      doc.setTextColor(159, 18, 57);
      doc.setFontSize(16);
      doc.text(`${dreams.length}`, 145, 48);
      doc.setFontSize(10);
      doc.text("Dream Options", 145, 56);

      // Section: Recommended Action Table
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Optimized Option Entry Matrix", 15, 82);

      const tableRows = recommendations.slice(0, 15).map((r: any, index: number) => [
        `#${index + 1}`,
        r.college_code,
        r.college_name.substring(0, 40) + (r.college_name.length > 40 ? '...' : ''),
        r.branch_code,
        r.district,
        r.type.toUpperCase(),
        `#${r.latest_cutoff?.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 88,
        head: [['Priority', 'Code', 'College Name', 'Branch', 'District', 'Chance', 'Cutoff Prediction']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9, cellPadding: 2.5 }
      });

      // Page 3: Career Roadmaps & Mentorship Guidance
      doc.addPage();
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text("AI Career Roadmap & Mentorship Insights", 15, 20);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text("Our Branch Suitability model recommends computer science and communication engineering tracks for your profile.", 15, 28);

      // Core branch scopes summary
      const branchesData = [
        ["CSE / AIML", "Software Developer, ML Engineer, AI researcher. Highest global starting packages."],
        ["ECE / EEE", "VLSI designer, hardware Grid specialist, IoT device engineer."],
        ["Mech / Civil", "Product structural designer, automotive consultant, construction grid supervisor."]
      ];

      autoTable(doc, {
        startY: 38,
        head: [['Target Engineering Track', 'Recommended Career & Growth Roadmaps']],
        body: branchesData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Mentorship checklist card
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 95, 180, 75, 'F');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("KEA COUNSELLING CHECKLIST & RULES SUMMARY", 25, 110);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("1. Make sure to download and print the KEA Verification Slip before round 1.", 25, 122);
      doc.text("2. Verify that all category claims (rural, Kannada medium, defense, etc.) are correctly logged.", 25, 130);
      doc.text("3. Place 'Dream' colleges first; they act as aspirational targets. Safe options must follow.", 25, 138);
      doc.text("4. If allocated a seat, choice 2 allows you to participate in the next round while holding.", 25, 146);
      doc.text("5. Always pay attention to SNQ options; they waive 100% of your tuition fees.", 25, 154);

      // Page numbers on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages}`, 180, 288);
      }

      // Save PDF report
      doc.save(`RankPilot_Counselling_Report_${studentName.replace(/\s+/g, '_')}.pdf`);

      // 4. Log report download success
      await apiClient.post('/reports/log', { action: 'download' });
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || "An error occurred compiling dataset components.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rankpilot-card bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/20 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
      <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-start gap-4 z-10">
        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30 shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wide">Premium Report</span>
            <span className="text-xs text-slate-400">PDF download enabled</span>
          </div>
          <h3 className="text-lg font-bold">Personalized AI Counselling Report</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Download a professional PDF compiling your rank analysis, category metrics, option entry priority strategy, branch suitability matching, and career roadmaps.
          </p>
        </div>
      </div>

      <div className="shrink-0 z-10 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2">
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling Report Data...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate PDF Report</span>
            </>
          )}
        </button>

        {status === 'success' && (
          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Downloaded successfully!</span>
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-rose-400 font-bold flex items-center gap-1 justify-center" title={errorMessage}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed. Hover to view error.</span>
          </p>
        )}
      </div>
    </div>
  );
}
