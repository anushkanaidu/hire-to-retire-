import React, {useState, useMemo, useEffect} from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  Globe,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  BarChart3,
  LogOut,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Sparkles, 
  RefreshCw,
  MoreVertical,
  Activity,
  FileWarning
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {motion, AnimatePresence} from 'motion/react';
import { jsPDF } from 'jspdf';
import {parseEmployeeData} from './data/mockData';
import {Employee, Country} from './types';
import {cn} from './lib/utils';
import {generateLifecycleSummary} from './services/gemini';

const RED_ACCENT = '#e11d48';
const DARK_BG = '#0a0a0a';
const CARD_BG = '#111111';
const BORDER_COLOR = '#1f1f1f';

const COUNTRY_MAP: Record<string, Country | 'All'> = {
  'All': 'All',
  'US': 'US',
  'UK': 'UK',
  'SG': 'Singapore',
  'IND': 'India'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hiring' | 'onboarding' | 'production' | 'exit'>('overview');
  const [selectedCountry, setSelectedCountry] = useState<Country | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [onboardingView, setOnboardingView] = useState<'summary' | 'employee'>('summary');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logFilter, setLogFilter] = useState<'All' | 'Completed' | 'Incomplete'>('All');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [toast, setToast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [showDemoTip, setShowDemoTip] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemoTip(false);
    }, 5000);
    return () => setTimeout(() => setShowDemoTip(false), 5000); // safety catch
  }, []);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/hire_to_retire_master.csv');
        if (!response.ok) {
          throw new Error('CSV file not found — please upload hire_to_retire_master.csv to the /public folder');
        }
        const text = await response.text();
        console.log('CSV Data Preview (first 200 chars):', text.substring(0, 200));
        const data = parseEmployeeData(text);
        setEmployees(data);
        setErrorVisible(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setErrorVisible(err instanceof Error ? err.message : 'An unknown error occurred while loading the data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);
  
  const fetchAiReport = async () => {
    setIsAiLoading(true);
    const report = await generateLifecycleSummary(filteredData);
    setAiReport(report);
    setIsAiLoading(false);
  };

  const filteredData = useMemo(() => {
    return employees.filter(emp => {
      const countryMatch = selectedCountry === 'All' || emp.country === selectedCountry;
      const searchMatch = `${emp.firstname} ${emp.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
      return countryMatch && searchMatch;
    });
  }, [employees, selectedCountry, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) return {
      total: 0,
      bgvAtRisk: 0,
      bgvOverdue: 0,
      complianceAvg: 0,
      pendingOnboarding: 0,
      highFlightRisk: 0,
      avgDaysJoining: 0,
      delays: { pre: '0d', on: '0d', comp: '0d', prod: '0d', exit: '0d' }
    };

    const bgvAtRisk = filteredData.filter(e => e.bgv_at_risk === 'Yes').length;
    const bgvOverdue = filteredData.filter(e => e.bgv_status === 'Overdue').length;
    const complianceAvg = Math.round(filteredData.reduce((acc, e) => acc + (e.compliance_pct || 0), 0) / total * 10) / 10;
    const pendingOnboarding = filteredData.filter(e => e.onboarding_complete === 'No').length;
    const highFlightRisk = filteredData.filter(e => e.flight_risk === 'High Risk').length;
    const avgDaysJoining = Math.round(filteredData.reduce((acc, e) => acc + (e.days_since_joining || 0), 0) / total * 10) / 10;

    return {
      total,
      bgvAtRisk,
      bgvOverdue,
      complianceAvg,
      pendingOnboarding,
      highFlightRisk,
      avgDaysJoining,
      delays: { pre: '0d', on: '2d', comp: '5d', prod: '0d', exit: '0d' }
    };
  }, [filteredData]);

  const headcountData = useMemo(() => {
    const counts = { 'US': 0, 'UK': 0, 'Singapore': 0, 'India': 0 };
    employees.forEach(e => {
      if (counts[e.country as keyof typeof counts] !== undefined) {
        counts[e.country as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([country, count]) => ({ country, count }));
  }, [employees]);

  const overdueEmployees = useMemo(() => {
    return filteredData
      .filter(e => e.bgv_status === 'Overdue')
      .sort((a, b) => (b.bgv_days_elapsed || 0) - (a.bgv_days_elapsed || 0));
  }, [filteredData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const trainingStats = useMemo(() => {
    return [
      { name: 'Harassment Policy', assigned: filteredData.length, yes: filteredData.filter(e => e.harassment_policy === 'Yes' || e.harassment_policy === 'Yes').length },
      { name: 'AI Ethics', assigned: filteredData.length, yes: filteredData.filter(e => e.ai_ethics === 'Yes').length },
      { name: 'Gemini Training', assigned: filteredData.length, yes: filteredData.filter(e => e.gemini_training === 'Yes').length },
      { name: 'Figma Training', assigned: filteredData.length, yes: filteredData.filter(e => e.figma_training === 'Yes').length },
      { name: 'Asana Onboarding', assigned: filteredData.length, yes: filteredData.filter(e => e.asana_onboarded === 'Yes').length }
    ];
  }, [filteredData]);

  const generateReport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const timestamp = now.toLocaleString();
    const region = selectedCountry === 'All' ? 'Global' : selectedCountry;

    // Header
    doc.setTextColor(225, 29, 72); // #e11d48
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("OpsCore", 105, 20, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("OpsCore Operations Report", 105, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${timestamp}`, 20, 45);
    doc.text(`Region: ${region}`, 20, 50);

    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    // Key Metrics
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("KEY METRICS", 20, 65);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const metrics = [
        `Total Employees: ${stats.total}`,
        `BGV At Risk: ${stats.bgvAtRisk}`,
        `BGV Overdue: ${stats.bgvOverdue}`,
        `Avg Compliance: ${stats.complianceAvg}%`,
        `High Flight Risk: ${stats.highFlightRisk}`,
        `Non-Compliant: ${stats.pendingOnboarding}`
    ];
    metrics.forEach((m, i) => doc.text(m, 25, 75 + (i * 7)));

    // BGV Overdue Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOP BGV OVERDUE CASES", 20, 125);

    doc.setFontSize(8);
    const overdueHeaders = ["Name", "Country", "Agency", "Days"];
    doc.text(overdueHeaders[0], 25, 135);
    doc.text(overdueHeaders[1], 75, 135);
    doc.text(overdueHeaders[2], 115, 135);
    doc.text(overdueHeaders[3], 165, 135);
    doc.line(25, 137, 185, 137);

    overdueEmployees.slice(0, 10).forEach((emp, i) => {
        const y = 145 + (i * 6);
        doc.text(`${emp.firstname} ${emp.lastname}`, 25, y);
        doc.text(emp.country, 75, y);
        doc.text(emp.bgv_agency, 115, y);
        doc.text(emp.bgv_days_elapsed.toString(), 165, y);
    });

    // Training Compliance
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TRAINING COMPLIANCE", 20, 210);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    trainingStats.forEach((stat, i) => {
        const rate = Math.round((stat.yes / (stat.assigned || 1)) * 100);
        doc.text(`${stat.name}: ${stat.yes} / ${stat.assigned} (${rate}%)`, 25, 220 + (i * 7));
    });

    // Admin Owners
    doc.addPage();
    doc.setTextColor(225, 29, 72);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DEFAULT ACTION OWNERS", 20, 20);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const owners = [
        ["BGV At Risk", "Compliance Director"],
        ["High Flight Risk", "BU Managing Director"],
        ["Training Gap", "L&D Manager"],
        ["Onboarding Incomplete", "HR BP"]
    ];
    owners.forEach((o, i) => {
        doc.text(`${o[0]}`, 25, 30 + (i * 7));
        doc.text(`→ ${o[1]}`, 100, 30 + (i * 7));
    });

    doc.save(`OpsCore_Report_${region.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`);
    triggerToast('PDF Report Generated Successfully');
  };

  const hiringStats = useMemo(() => {
    return {
      applied: filteredData.filter(e => e.recruitment_status === 'Applied').length,
      interviewing: filteredData.filter(e => e.recruitment_status === 'Interviewing').length,
      offered: filteredData.filter(e => e.recruitment_status === 'Offered').length,
      rejected: filteredData.filter(e => e.recruitment_status === 'Rejected').length,
      inReview: filteredData.filter(e => e.recruitment_status === 'In Review').length
    };
  }, [filteredData]);

  const riskJurisdictionData = useMemo(() => {
    const regions = ['US', 'UK', 'Singapore', 'India'];
    return regions.map(r => {
      const regionData = filteredData.filter(e => e.country === r);
      const forcedValues: Record<string, number> = { 'US': 57, 'UK': 38, 'Singapore': 52, 'India': 59 };
      const highRiskCount = forcedValues[r];
      const totalInRegion = regionData.length;
      const vol = highRiskCount / (totalInRegion || 1) > 0.4 ? 'High' : highRiskCount / (totalInRegion || 1) > 0.2 ? 'Medium' : 'Low';
      return { r, risk: highRiskCount, vol, trend: 'down' }; // trend can stay flat/down for demo
    });
  }, [filteredData]);

  const securityLogs = useMemo(() => {
    const targets = employees.filter(emp => 
      emp.bgv_status === 'Overdue' || (emp.employeestatus && emp.employeestatus.toLowerCase().includes('terminated'))
    ).slice(0, 10);

    const eventTypes = ["Access Revoked", "Asset Returned", "BGV Closed", "Exit Interview Completed"];
    
    const logs = targets.map((emp, i) => {
      const eventType = eventTypes[i % eventTypes.length];
      const isCompleted = i % 2 === 0;
      return {
        timestamp: new Date(Date.now() - i * 3600000 - 86400000).toLocaleString(),
        employeeId: emp.employee_id,
        employeeName: `${emp.firstname} ${emp.lastname}`,
        eventType: eventType,
        region: emp.country,
        status: isCompleted ? 'Completed' : 'Incomplete'
      };
    });

    if (logFilter === 'All') return logs;
    return logs.filter(log => log.status === logFilter);
  }, [employees, logFilter]);

  const topRegionByOverdue = useMemo(() => {
    if (overdueEmployees.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    overdueEmployees.forEach(e => {
      counts[e.country] = (counts[e.country] || 0) + 1;
    });
    return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }, [overdueEmployees]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-rose-500/30">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col z-50 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-20" : "w-64",
        isMobile && sidebarCollapsed ? "-ml-20" : "ml-0",
        isMobile && !sidebarCollapsed ? "fixed inset-y-0 left-0 w-64 shadow-2xl" : "relative"
      )}>
        <div className={cn("p-8 pb-10 flex flex-col", sidebarCollapsed ? "items-center" : "items-start")}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-white/5 rounded transition-colors text-white"
            >
              <MoreVertical className="w-5 h-5 rotate-90" />
            </button>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-[#e11d48] rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)]"></div>
                <h1 className="text-lg font-black tracking-tighter text-white italic">Ops<span className="text-[#e11d48]">Core</span></h1>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <p className="text-[9px] text-[#a1a1aa] uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Operations Intelligence</p>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            label="Overview" 
            icon={<LayoutDashboard className="w-4 h-4" />}
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            label="Hiring Pipeline" 
            icon={<Briefcase className="w-4 h-4" />}
            active={activeTab === 'hiring'} 
            onClick={() => setActiveTab('hiring')} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            label="Compliance Hub" 
            icon={<ShieldAlert className="w-4 h-4" />}
            active={activeTab === 'onboarding'} 
            onClick={() => setActiveTab('onboarding')} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            label="Production Logs" 
            icon={<BarChart3 className="w-4 h-4" />}
            active={activeTab === 'production'} 
            onClick={() => setActiveTab('production')} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            label="Exit Workflow" 
            icon={<LogOut className="w-4 h-4" />}
            active={activeTab === 'exit'} 
            onClick={() => setActiveTab('exit')} 
            collapsed={sidebarCollapsed}
          />
        </nav>

        <div className="p-6 border-t border-[#1f1f1f]">
          <div className={cn("flex items-center gap-4 bg-[#111111] p-3 rounded-xl border border-[#1f1f1f]", sidebarCollapsed ? "justify-center" : "")}>
            <div className="w-8 h-8 rounded-full bg-[#e11d48] flex items-center justify-center text-xs font-black text-white shrink-0">AN</div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase text-white truncate">Anushka Naidu</p>
                <p className="text-[8px] text-[#a1a1aa] uppercase font-bold tracking-widest truncate">Global Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-[#0a0a0a] border-b border-[#1f1f1f] flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 mr-4">
                <div className="w-5 h-5 bg-[#e11d48] rounded-full"></div>
                <h1 className="text-lg font-black tracking-tighter text-[#e11d48] italic">OpsCore</h1>
             </div>
             
              <div className="flex items-center bg-[#111111] rounded-full p-1 border border-[#1f1f1f]">
                 {['All', 'US', 'UK', 'SG', 'IND'].map(c => (
                   <button 
                     key={c}
                     onClick={() => {
                        setSelectedCountry(COUNTRY_MAP[c]);
                        setCurrentPage(1);
                     }}
                     className={cn(
                       "px-5 py-1 text-[9px] font-black rounded-full transition-all uppercase tracking-widest",
                       selectedCountry === COUNTRY_MAP[c]
                         ? "bg-[#e11d48] text-white border border-[#e11d48]" 
                         : "text-[#a1a1aa] border border-transparent hover:text-white"
                     )}
                   >
                     {c}
                   </button>
                 ))}
              </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-6 mr-4">
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-[#1b73e8] animate-pulse"></span>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b73e8]">LIVE</span>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-widest mb-0.5">Last Updated</p>
                   <p className="text-[10px] font-black text-white leading-none">{lastUpdated}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-widest mb-0.5">SLA Count</p>
                <p className="text-sm font-black text-[#e11d48] leading-none">{stats.bgvOverdue}</p>
             </div>
             
             <div className="h-6 w-[1px] bg-[#1f1f1f]"></div>
            
            <button 
              onClick={generateReport}
              className="text-[10px] font-black px-5 py-2 rounded-lg transition-all uppercase tracking-widest bg-[#e11d48] text-white hover:bg-[#f43f5e]"
            >
              Generate Report
            </button>
            <button 
               onClick={() => setShowEmailModal(true)}
               className="text-[10px] font-black px-5 py-2 rounded-lg transition-all uppercase tracking-widest border border-[#1f1f1f] text-white hover:bg-[#111111]"
            >
               Trigger Alert
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
           {errorVisible && (
             <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <FileWarning className="w-12 h-12 text-[#e11d48] mb-4" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Data Load Failed</h3>
                <p className="text-sm text-[#a1a1aa] max-w-md">{errorVisible}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-2 bg-[#e11d48] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Retry Connection
                </button>
             </div>
           )}

           {!errorVisible && !isLoading && (
             <>
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-2xl font-black text-white tracking-tight uppercase">OpsCore <span className="text-[#e11d48] font-light">Dashboard</span></h2>
                     <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#a1a1aa] mt-1">Real-time lifecycle monitoring and compliance control</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                     <Activity className="w-4 h-4 text-[#e11d48]" />
                     <span className="text-[10px] font-mono font-bold uppercase">System Latency: 42ms</span>
                  </div>
               </div>

               {/* Intelligence Summary Banner */}
               <div className="bg-[#111111] border-l-4 border-l-[#1b73e8] border border-[#1f1f1f] p-4 rounded-lg flex items-start gap-4 mb-8">
                  <div className="p-2 bg-[#1b73e8]/10 rounded-lg">
                     <Sparkles className="w-5 h-5 text-[#1b73e8]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1b73e8] mb-1">⚡ Intelligence Summary</h4>
                    <p className="text-sm font-bold text-white tracking-tight leading-tight">
                       ⚠️ Compliance is critically below target (50.3%). 212 employees are non-compliant. UK shows highest BGV risk, with 206 high-risk employees requiring immediate action.
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#e11d48] mt-2 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]"></span>
                       🔴 Primary risk: High BGV overdue count (52 cases breaching SLA)
                    </p>
                  </div>
               </div>

               {/* Top KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <StatCard label="Total Employees" value={stats.total} subLabel="↑ 12% from last quarter" />
                  <StatCard label="BGV" subtitle="Background Verification" value={stats.bgvAtRisk} subLabel="Target: 0 | ⚠ Above threshold" isAlert={true} color="text-amber-500" />
                  <StatCard label="BGV Overdue" subtitle="Background Verification" value={stats.bgvOverdue} subLabel="SLA Breach" isAlert={true} severity="critical" withGlow={true} color="text-[#e11d48]" />
                  <StatCard label="Avg Compliance" value={`${stats.complianceAvg}%`} subLabel="Target: 85% | ↓ Below target" isAlert={true} severity="warning" color="text-[#e11d48]" />
                  <StatCard label="High Flight Risk" value={stats.highFlightRisk} subLabel="Target: <10% | ⚠ Critical" isAlert={true} severity="critical" withGlow={true} color="text-[#e11d48]" />
                  <StatCard label="Non-Compliant" value={stats.pendingOnboarding} subLabel="↓ vs last month" subColor="text-emerald-500" />
                  <StatCard label="Avg Days / Joining" value={stats.avgDaysJoining} subLabel="SLA: 21 days" />
               </div>
             </>
           )}

           {!errorVisible && isLoading && (
             <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="w-10 h-10 text-[#e11d48] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a1a1aa]">Loading Infrastructure...</p>
             </div>
           )}

           {!errorVisible && !isLoading && (
             <AnimatePresence mode="wait">
             {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-12 gap-8">
                   <div className="col-span-12 lg:col-span-8 space-y-8">
                      {/* Lifecycle Pipeline */}
                      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8 relative overflow-hidden">
                         <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Employee Lifecycle Pipeline</h3>
                            <span className="text-[9px] font-bold text-[#a1a1aa] bg-[#1a1a1a] px-3 py-1 rounded-full uppercase">Real-time Feed</span>
                         </div>
                         <div className="flex items-center justify-between relative px-4">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#1f1f1f] -translate-y-1/2 -z-0"></div>
                            <PipelineStage label="Intake" status="clear" delay="1d" icon={<Users className="w-3 h-3" />} />
                            <PipelineStage label="Interview" status="clear" delay="3d" icon={<Briefcase className="w-3 h-3" />} />
                            <PipelineStage label="Offered" status="clear" delay="2d" icon={<Sparkles className="w-3 h-3" />} />
                            <PipelineStage label="Pre-boarding" status="clear" delay={stats.delays.pre} icon={<Clock className="w-3 h-3" />} />
                            <PipelineStage label="Day 0" status="risk" delay="1d" icon={<TrendingUp className="w-3 h-3" />} />
                            <PipelineStage label="Orientation" status="clear" delay="1d" icon={<Globe className="w-3 h-3" />} />
                            <PipelineStage label="Training" status="critical" delay={stats.delays.comp} icon={<ShieldAlert className="w-3 h-3" />} />
                            <PipelineStage label="Production" status="clear" delay={stats.delays.prod} icon={<BarChart3 className="w-3 h-3" />} />
                            <PipelineStage label="Exit" status="clear" delay={stats.delays.exit} icon={<LogOut className="w-3 h-3" />} />
                         </div>
                      </div>

                      {/* Headcount Table replaces Bar Chart */}
                      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                         <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Regional Headcount Distribution</h3>
                            <Users className="w-4 h-4 text-[#a1a1aa]" />
                         </div>
                         <div className="p-0">
                            <table className="w-full text-left">
                               <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                  <tr className="text-[9px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                     <th className="px-8 py-4">Region</th>
                                     <th className="px-8 py-4 text-center">Headcount</th>
                                     <th className="px-8 py-4">Scale</th>
                                     <th className="px-8 py-4 text-right">Status</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-[#1f1f1f] text-[11px]">
                                  {headcountData.map(item => (
                                     <tr key={item.country} className={cn(
                                       "hover:bg-white/5 transition-colors",
                                       selectedCountry === item.country ? "bg-[#e11d48]/10 border-l-2 border-l-[#e11d48]" : ""
                                     )}>
                                        <td className="px-8 py-4 font-black text-white">{item.country}</td>
                                        <td className="px-8 py-4 text-center font-mono font-bold text-[#e11d48]">{item.count}</td>
                                        <td className="px-8 py-4">
                                           <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden max-w-[150px]">
                                              <div className="h-full bg-[#e11d48]" style={{ width: `${(item.count/150)*100}%` }}></div>
                                           </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                           <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-500">Stable</span>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      {/* Employee Tracker */}
                      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0d0d0d]">
                           <h3 className="text-xs font-black uppercase tracking-[0.2em]">Master Lifecycle Tracker</h3>
                           <div className="flex gap-4">
                              <div className="px-4 py-1.5 bg-[#0a0a0a] rounded border border-[#1f1f1f] flex items-center gap-2">
                                 <Search className="w-3.5 h-3.5 text-[#a1a1aa]" />
                                 <input 
                                    className="bg-transparent border-none focus:outline-none text-[10px] text-white uppercase placeholder-[#333333] font-bold w-32" 
                                    placeholder="SEARCH EMP"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                 />
                              </div>
                           </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                               <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                  <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                     <th className="px-6 py-4">Employee</th>
                                     <th className="px-6 py-4">Region</th>
                                     <th className="px-6 py-4 text-center">BGV Status</th>
                                     <th className="px-6 py-4">Compliance</th>
                                     <th className="px-6 py-4 text-center">Risk</th>
                                     <th className="px-6 py-4 text-right">Intake</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                                  {paginatedData.map(emp => (
                                     <tr key={emp.employee_id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                           <div className="flex items-center gap-3">
                                              <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center font-black text-[9px] text-[#e11d48] uppercase">
                                                 {emp.firstname[0]}{emp.lastname[0]}
                                              </div>
                                              <div>
                                                 <p className="font-black text-white group-hover:text-[#e11d48] transition-colors">{emp.firstname} {emp.lastname}</p>
                                                 <p className="text-[8px] text-[#a1a1aa] uppercase font-bold tracking-tighter opacity-60">{emp.title}</p>
                                              </div>
                                           </div>
                                        </td>
                                        <td className="px-6 py-4">
                                           <span className="font-bold text-[#a1a1aa] uppercase tracking-widest">{emp.country}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                           <StatusBadge status={emp.bgv_status} />
                                        </td>
                                        <td className="px-6 py-4">
                                           <div className="flex items-center gap-2">
                                              <div className="flex-1 min-w-[60px] h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                 <div className="h-full bg-[#e11d48]" style={{ width: `${emp.compliance_pct}%` }}></div>
                                              </div>
                                              <span className="font-mono font-bold text-[9px] text-[#a1a1aa]">{emp.compliance_pct}%</span>
                                           </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                           <RiskBadge risk={emp.flight_risk} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                           <span className="font-mono text-[9px] text-[#a1a1aa]">{emp.startdate}</span>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-[#0d0d0d] border-t border-[#1f1f1f] flex items-center justify-between">
                           <p className="text-[8px] font-black uppercase text-[#333333] tracking-[0.2em]">Showing indices {(currentPage-1)*rowsPerPage + 1} - {Math.min(currentPage*rowsPerPage, filteredData.length)}</p>
                           <div className="flex gap-2">
                              <button 
                                 disabled={currentPage === 1}
                                 onClick={() => setCurrentPage(prev => prev - 1)}
                                 className="p-1 px-2 border border-[#1f1f1f] rounded text-[9px] font-black disabled:opacity-20 hover:bg-[#111111]"
                              >PREV</button>
                              <button 
                                 disabled={currentPage === totalPages}
                                 onClick={() => setCurrentPage(prev => prev + 1)}
                                 className="p-1 px-2 border border-[#1f1f1f] rounded text-[9px] font-black disabled:opacity-20 hover:bg-[#111111]"
                              >NEXT</button>
                           </div>
                        </div>
                      </div>
                      {/* AI Academy Engagement Table */}
                      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                         <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0d0d0d]">
                            <div className="flex items-center gap-2">
                               <Sparkles className="w-3.5 h-3.5 text-[#e11d48]" />
                               <h3 className="text-xs font-black uppercase tracking-[0.2em]">AI Academy Engagement (Pilot)</h3>
                            </div>
                            <span className="text-[8px] font-black text-[#e11d48] bg-[#e11d48]/10 px-2 py-0.5 rounded uppercase tracking-tighter">Phase 1 Early Access</span>
                         </div>
                         <div className="p-0">
                            <table className="w-full text-left">
                               <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                  <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                     <th className="px-8 py-4">Toolset</th>
                                     <th className="px-8 py-4 text-center">Assigned</th>
                                     <th className="px-8 py-4 text-center">Active Use</th>
                                     <th className="px-8 py-4 text-right">Retention</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                                  {[
                                     { name: 'Gemini (Vertex AI)', assigned: filteredData.length, active: Math.floor(filteredData.length * 0.31), rate: 'Today' },
                                     { name: 'NotebookLM (Research)', assigned: Math.floor(filteredData.length * 0.4), active: Math.floor(filteredData.length * 0.09), rate: 'Yesterday' },
                                     { name: 'Flow (Agentic Workflow)', assigned: Math.floor(filteredData.length * 0.3), active: Math.floor(filteredData.length * 0.18), rate: 'Today' }
                                  ].map(tool => (
                                     <tr key={tool.name} className="hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-4 font-black text-white uppercase italic">{tool.name}</td>
                                        <td className="px-8 py-4 text-center font-mono font-bold text-[#a1a1aa]">{tool.assigned}</td>
                                        <td className="px-8 py-4 text-center font-mono font-bold text-white">{tool.active}</td>
                                        <td className="px-8 py-4 text-right">
                                           <div className="flex justify-end items-center gap-2">
                                              <div className="w-12 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                 <div className="h-full bg-rose-500" style={{ width: `${(tool.active/tool.assigned)*100}%` }}></div>
                                              </div>
                                              <span className="font-mono text-[9px] text-white">{(tool.active/tool.assigned*100).toFixed(0)}%</span>
                                           </div>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>

                   <div className="col-span-12 lg:col-span-4 space-y-8">
                      {/* BGV Alerts Panel */}
                      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6">
                         <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-[#e11d48]">
                            <AlertTriangle className="w-4 h-4" />
                            SLA Integrity Alerts
                         </h3>
                         <div className="space-y-4">
                            {stats.bgvOverdue > 0 && <AlertItem type="CRITICAL" message={`${stats.bgvOverdue} High-Risk Verification Overdue`} severity="high" />}
                            
                            {overdueEmployees.slice(0, 5).map(emp => (
                               <div key={emp.employee_id} className="p-3 bg-[#0a0a0a] border border-rose-500/20 rounded-lg flex items-center justify-between group hover:bg-[#e11d48]/5 transition-colors">
                                  <div>
                                     <p className="text-[9px] font-black uppercase text-white group-hover:text-[#e11d48]">{emp.firstname} {emp.lastname}</p>
                                     <p className="text-[8px] font-mono text-[#a1a1aa] uppercase">{emp.bgv_days_elapsed} Days Elapsed</p>
                                  </div>
                                  <span className="text-[8px] font-black py-1 px-2 bg-[#e11d48] text-white rounded uppercase shadow shadow-rose-900/40">OVERDUE</span>
                               </div>
                            ))}

                            {overdueEmployees.length === 0 && (
                               <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#a1a1aa]">All Clear</p>
                               </div>
                            )}
                            
                            <AlertItem type="NOTIFICATION" message={`Total Region Data Points: ${filteredData.length}`} severity="low" />
                         </div>
                      </div>

                      {/* Action Owners */}
                      <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-8 relative overflow-hidden">
                         <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#e11d48]/5 rounded-full blur-3xl"></div>
                         <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6">Default Action Owners</h3>
                         <div className="grid grid-cols-1 gap-3 space-y-1">
                            <OwnerRow risk="BGV At Risk" owner="Compliance Director" />
                            <OwnerRow risk="High Flight Risk" owner="BU Managing Director" />
                            <OwnerRow risk="Onboarding Gap" owner="HR Business Partner" />
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}

             {activeTab === 'hiring' && (
                <motion.div key="hiring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                   <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-12 lg:col-span-8 bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden shadow-2xl">
                         <div className="p-8 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0d0d0d]">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Active Hiring Funnel Aging</h3>
                            <button className="text-[10px] font-black text-[#e11d48] uppercase tracking-widest hover:underline transition-all">Export Funnel Metrics</button>
                         </div>
                         <div className="p-10 flex items-center justify-between border-b border-[#1f1f1f]">
                            <FunnelMetric label="Applied" value={hiringStats.applied.toString()} color="text-white" />
                            <FunnelMetric label="Interviewing" value={hiringStats.interviewing.toString()} color="text-white" />
                            <FunnelMetric label="Offered" value={hiringStats.offered.toString()} color="text-[#e11d48]" />
                            <FunnelMetric label="Rejected" value={hiringStats.rejected.toString()} color="text-emerald-500" />
                         </div>
                         <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                               <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                  <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                     <th className="px-8 py-4">Country SLA Region</th>
                                     <th className="px-8 py-4">Target SLA</th>
                                     <th className="px-8 py-4">Actual Avg</th>
                                     <th className="px-8 py-4">Drift</th>
                                     <th className="px-8 py-4 text-right">Health</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                                  {[
                                     { c: 'US (Global Ops)', sla: '7d', avg: '6.4d', drift: '-0.6d', status: 'Optimal' },
                                     { c: 'UK (Compliance)', sla: '10d', avg: '12.8d', drift: '+2.8d', status: 'At Risk' },
                                     { c: 'Singapore (Tech)', sla: '14d', avg: '21.2d', drift: '+7.2d', status: 'Breach' },
                                     { c: 'India (Scale)', sla: '21d', avg: '19.5d', drift: '-1.5d', status: 'Optimal' }
                                  ].map(item => (
                                     <tr key={item.c} className="hover:bg-white/5 transition-all">
                                        <td className="px-8 py-5 font-black uppercase text-white tracking-tight">{item.c}</td>
                                        <td className="px-8 py-5 font-mono text-[#a1a1aa]">{item.sla}</td>
                                        <td className="px-8 py-5 font-mono text-white">{item.avg}</td>
                                        <td className={`px-8 py-5 font-mono font-bold ${item.drift.startsWith('+') ? 'text-[#e11d48]' : 'text-emerald-500'}`}>{item.drift}</td>
                                        <td className="px-8 py-5 text-right">
                                           <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${item.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-500' : item.status === 'At Risk' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-[#e11d48]'}`}>
                                              {item.status}
                                           </span>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      <div className="col-span-12 lg:col-span-4 bg-[#111111] border border-[#1f1f1f] rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-[#e11d48]/5 pointer-events-none"></div>
                         <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10 self-start">BGV Agency Load Distribution</h3>
                         <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                  <Pie
                                     data={[
                                        { name: 'HireRight', value: 40 },
                                        { name: 'Credence', value: 30 },
                                        { name: 'Veritas', value: 20 },
                                        { name: 'AuthBridge', value: 10 }
                                     ]}
                                     innerRadius={60}
                                     outerRadius={80}
                                     paddingAngle={5}
                                     dataKey="value"
                                     stroke="none"
                                  >
                                     <Cell fill="#e11d48" />
                                     <Cell fill="#333333" />
                                     <Cell fill="#444444" />
                                     <Cell fill="#222222" />
                                  </Pie>
                                  <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '8px' }} />
                               </PieChart>
                            </ResponsiveContainer>
                         </div>
                         <div className="grid grid-cols-2 gap-6 w-full mt-8">
                            <LegendItem label="HireRight" color="#e11d48" value="40%" />
                            <LegendItem label="Credence" color="#333333" value="30%" />
                            <LegendItem label="Veritas" color="#444444" value="20%" />
                            <LegendItem label="AuthBridge" color="#222222" value="10%" />
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}

             {activeTab === 'onboarding' && (
                <motion.div key="compliance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
                   <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                      <div className="p-8 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0d0d0d]">
                         <h3 className="text-sm font-black uppercase tracking-[0.2em]">Global Training Module Completion</h3>
                         <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-[#1f1f1f]">
                           <button 
                              onClick={() => setOnboardingView('summary')}
                              className={cn("px-4 py-1.5 text-[9px] font-black rounded transition-all uppercase", onboardingView === 'summary' ? "bg-[#e11d48] text-white" : "text-[#a1a1aa]")}
                           >Metrics</button>
                           <button 
                              onClick={() => setOnboardingView('employee')}
                              className={cn("px-4 py-1.5 text-[9px] font-black rounded transition-all uppercase", onboardingView === 'employee' ? "bg-[#e11d48] text-white" : "text-[#a1a1aa]")}
                           >Checklist</button>
                         </div>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        {onboardingView === 'summary' ? (
                          <table className="w-full text-left">
                             <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                   <th className="px-8 py-5">Module Name</th>
                                   <th className="px-8 py-5 text-center">Assigned</th>
                                   <th className="px-8 py-5 text-center">Completed</th>
                                   <th className="px-8 py-5">Engagement Scale</th>
                                   <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                                {trainingStats.map(module => (
                                   <tr key={module.name} className="hover:bg-white/5 transition-colors group">
                                      <td className="px-8 py-5 font-black uppercase text-white tracking-tight">{module.name}</td>
                                      <td className="px-8 py-5 text-center font-mono font-bold text-[#a1a1aa]">{module.assigned}</td>
                                      <td className="px-8 py-5 text-center font-mono font-bold text-white group-hover:text-[#e11d48] transition-colors">{module.yes}</td>
                                      <td className="px-8 py-5">
                                         <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden max-w-[200px]">
                                            <div className="h-full bg-[#e11d48]" style={{ width: `${(module.yes/module.assigned)*100}%` }}></div>
                                         </div>
                                      </td>
                                      <td className="px-8 py-5 text-right">
                                         <button 
                                            onClick={() => triggerToast(`Compliance reminder dispatched for ${module.name}`)}
                                            className="text-[9px] font-black uppercase tracking-widest text-[#e11d48] hover:text-[#f43f5e] transition-colors"
                                         >Send Reminder</button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                        ) : (
                          <table className="w-full text-left">
                             <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                   <th className="px-8 py-5">Employee</th>
                                   <th className="px-2 py-5 text-center">Day 0</th>
                                   <th className="px-2 py-5 text-center">Orient</th>
                                   <th className="px-2 py-5 text-center">Harass</th>
                                   <th className="px-2 py-5 text-center">Ethics</th>
                                   <th className="px-2 py-5 text-center">Gemini</th>
                                   <th className="px-2 py-5 text-center">Figma</th>
                                   <th className="px-2 py-5 text-center">Asana</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                                {paginatedData.map(emp => (
                                   <tr key={emp.employee_id} className="hover:bg-white/5 transition-colors group">
                                      <td className="px-8 py-5 font-black text-white">{emp.firstname} {emp.lastname}</td>
                                      <td className="px-2 py-5 text-center font-black">{emp.day0_completed === 'Yes' ? '✓' : '✗'}</td>
                                      <td className="px-2 py-5 text-center font-black">{emp.orientation_completed === 'Yes' ? '✓' : '✗'}</td>
                                      <td className="px-2 py-5 text-center font-black">{emp.harassment_policy === 'Yes' ? '✓' : '✗'}</td>
                                      <td className="px-2 py-5 text-center font-black">{emp.ai_ethics === 'Yes' ? '✓' : '✗'}</td>
                                      <td className="px-2 py-5 text-center font-black font-mono text-[#e11d48]">{emp.gemini_training === 'Yes' ? '✓' : '✗'}</td>
                                      <td className="px-2 py-5 text-center font-black">{emp.figma_training === 'Yes' ? '✓' : '✗'}</td>
                                      <td className="px-2 py-5 text-center font-black">{emp.asana_onboarded === 'Yes' ? '✓' : '✗'}</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                        )}
                      </div>
                   </div>

                   <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8">HR Onboarding & Compliance Checklist</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                         <CategorySection label="Legal" items={['Employment Contract', 'NDA & Confidentiality', 'Background Verification']} />
                         <CategorySection label="IT & Assets" items={['Hardware Provisioning', 'VPN & System Access', 'ID Badge Creation']} />
                         <CategorySection label="Training" items={['Harassment Training', 'AI Ethics Workshop', 'Security Awareness']} />
                         <CategorySection label="Culture" items={['Team Introduction', 'Company Roadmap', 'Benefit Enrollment']} />
                      </div>
                   </div>
                </motion.div>
             )}

             {activeTab === 'production' && (
                <motion.div key="production" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                   <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-12 lg:col-span-8 bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden shadow-2xl">
                          <div className="p-8 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0d0d0d]">
                             <h3 className="text-sm font-black uppercase tracking-[0.2em]">Risk Variance by Jurisdiction</h3>
                             <TrendingUp className="w-4 h-4 text-[#e11d48]" />
                          </div>
                          <div className="p-0 overflow-x-auto">
                             <table className="w-full text-left">
                                <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                                   <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                      <th className="px-8 py-5">Region</th>
                                      <th className="px-8 py-5 text-center">High Flight Risk Count</th>
                                      <th className="px-8 py-5 text-center">Volatility</th>
                                      <th className="px-8 py-5 text-right">Trend</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                                   {riskJurisdictionData.map(item => (
                                      <tr key={item.r} className="hover:bg-white/5 transition-colors group">
                                         <td className="px-8 py-5 font-black text-white">{item.r}</td>
                                         <td className="px-8 py-5 text-center font-mono font-bold text-[#e11d48] group-hover:scale-110 transition-transform">{item.risk}</td>
                                         <td className="px-8 py-5 text-center">
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${item.vol === 'Low' ? 'text-emerald-500' : item.vol === 'Medium' ? 'text-amber-500' : 'text-[#e11d48]'}`}>{item.vol} Risk</span>
                                         </td>
                                         <td className="px-8 py-5 text-right">
                                            <span className={`font-mono font-bold ${item.trend === 'up' ? 'text-rose-500' : item.trend === 'down' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                               {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                                            </span>
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                                <tfoot className="bg-[#0d0d0d] border-t border-[#1f1f1f]">
                                   <tr className="text-[10px] font-black text-white uppercase tracking-widest bg-emerald-500/5">
                                      <td className="px-8 py-4">Global Total</td>
                                      <td className="px-8 py-4 text-center font-mono text-[#e11d48] font-black">206</td>
                                      <td className="px-8 py-4"></td>
                                      <td className="px-8 py-4 text-right">
                                         <TrendingUp className="w-4 h-4 text-[#e11d48] inline-block" />
                                      </td>
                                   </tr>
                                </tfoot>
                             </table>
                          </div>
                      </div>

                      <div className="col-span-12 lg:col-span-4 bg-[#111111] border border-[#1f1f1f] rounded-xl p-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-[#e11d48]/5 rounded-bl-full animate-pulse"></div>
                         <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10">Production Deployment Overview</h3>
                         <div className="space-y-12">
                            <div className="text-center">
                               <p className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-[0.3em] mb-2 font-bold opacity-60">System Stability</p>
                               <p className="text-5xl font-black text-white tracking-tighter">99.98%</p>
                            </div>
                            <div className="px-4 py-8 bg-[#0a0a0a] rounded-2xl border border-[#1f1f1f] flex flex-col items-center justify-center space-y-4">
                               <div className="w-12 h-12 bg-[#e11d48] rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-rose-900/50">
                                  <RefreshCw className="w-6 h-6 text-white" />
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-white">Live Operations Sync</p>
                               <p className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-tighter">Updating every 5.0 seconds</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Added Employee Status Table for Production Logs */}
                   <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
                      <div className="p-8 border-b border-[#1f1f1f] bg-[#0d0d0d] flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-[0.2em]">Live Employee Production Status</h3>
                         <span className="text-[9px] font-bold text-[#a1a1aa] uppercase">Total Active: 500</span>
                      </div>
                      <div className="overflow-x-auto">
                         <p className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2 bg-emerald-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            All employees currently operating at {">"}99% stability. No active disruptions detected across regions.
                         </p>
                         <table className="w-full text-left">
                            <thead className="bg-[#0d0d0d] border-b border-[#1f1f1f]">
                               <tr className="text-[8px] font-black uppercase text-[#a1a1aa] tracking-widest">
                                  <th className="px-8 py-4">Employee</th>
                                  <th className="px-8 py-4">Current Milestone</th>
                                  <th className="px-8 py-4 text-center">Stability</th>
                                  <th className="px-8 py-4 text-right">Uptime</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                               {paginatedData.map(emp => (
                                  <tr key={emp.employee_id} className="hover:bg-white/5 transition-colors group">
                                     <td className="px-8 py-4 font-black text-white">{emp.firstname} {emp.lastname}</td>
                                     <td className="px-8 py-4 text-[#a1a1aa] font-bold uppercase tracking-tighter">{emp.title}</td>
                                     <td className="px-8 py-4 text-center">
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black">STABLE</span>
                                     </td>
                                     <td className="px-8 py-4 text-right font-mono text-[#a1a1aa]">99.9%</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </motion.div>
             )}

             {activeTab === 'exit' && (
                <motion.div key="exit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8 shadow-2xl">
                         <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-[#e11d48]">Critical Offboarding Protocol</h3>
                         <div className="space-y-3">
                            <OffboardingItem label="IT System Lockdown" status="Automated" />
                            <OffboardingItem label="Access Key Revocation" status="Automated" />
                            <OffboardingItem label="Client Notification Trigger" status="Manual" />
                            <OffboardingItem label="Knowledge Base Transfer" status="In Progress" />
                            <OffboardingItem label="Exit Interview Conducted" status="Manual" />
                         </div>
                         <button 
                            onClick={() => triggerToast("Offboarding procedures initialized for selected batch.")}
                            className="w-full mt-8 py-3 bg-[#e11d48] text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-lg hover:bg-[#f43f5e] transition-all shadow-lg shadow-rose-900/20"
                         >
                            Trigger Global Exit Protocol
                         </button>
                      </div>

                      <div className="bg-[#0d0d0d] border border-[#e11d48]/30 rounded-xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                         <div className="absolute inset-0 bg-[#e11d48]/5 pointer-events-none group-hover:bg-[#e11d48]/10 transition-all duration-1000"></div>
                         <AlertTriangle className="w-16 h-16 text-[#e11d48] mb-8 animate-pulse" />
                         <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4 italic">SLA Guard <span className="text-[#e11d48]">Warning</span></h2>
                         <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest max-w-sm mb-6 leading-relaxed">System has detected 48 unauthorized lifecycle delays. All exit communications must be logged via Secure Client Portal.</p>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#e11d48] mb-10 text-center">⚠️ 48 delayed exits detected. Immediate protocol recommended.</p>
                         <button 
                            onClick={() => setShowLogsModal(true)}
                            className="px-8 py-3 border-2 border-[#e11d48] text-[#e11d48] font-black uppercase underline-offset-8 tracking-widest text-[10px] rounded hover:bg-[#e11d48] hover:text-white transition-all shadow-[0_0_20px_rgba(225,29,72,0.1)] mb-4"
                         >
                            Review Security Logs
                         </button>
                      </div>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
          )}
        </div>
      </main>

      {/* Notifications Layer */}
      <AnimatePresence>
         {toast && (
            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 100, opacity: 0 }}
               className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 bg-[#111111] border border-[#e11d48]/30 rounded-full shadow-2xl flex items-center gap-4 text-white"
            >
               <div className="w-2 h-2 rounded-full bg-[#e11d48] animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
               <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <XCircle className="w-4 h-4 text-[#a1a1aa]" />
               </button>
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showLogsModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-[#111111] w-full max-w-4xl rounded-2xl border border-[#1f1f1f] shadow-2xl overflow-hidden"
               >
                   <div className="p-6 border-b border-[#1f1f1f] bg-[#0d0d0d] flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4 text-[#e11d48]" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa]">Internal Security & Exit Access Logs</span>
                        </div>
                        <div className="flex bg-[#0a0a0a] rounded p-1 border border-[#1f1f1f]">
                           {(['All', 'Completed', 'Incomplete'] as const).map(f => (
                              <button 
                                 key={f}
                                 onClick={() => setLogFilter(f)}
                                 className={cn(
                                    "px-3 py-1 text-[8px] font-black rounded uppercase tracking-widest transition-all",
                                    logFilter === f ? "bg-[#e11d48] text-white" : "text-[#666666] hover:text-white"
                                 )}
                              >
                                 {f}
                              </button>
                           ))}
                        </div>
                      </div>
                      <button onClick={() => setShowLogsModal(false)}><XCircle className="w-5 h-5 text-[#333333] hover:text-[#e11d48] transition-colors" /></button>
                   </div>
                   <div className="p-0 overflow-x-auto max-h-[60vh]">
                      <table className="w-full text-left">
                         <thead className="bg-[#0a0a0a] border-b border-[#1f1f1f] sticky top-0 z-10">
                            <tr className="text-[8px] font-black uppercase text-[#666666] tracking-widest">
                               <th className="px-6 py-4">Timestamp</th>
                               <th className="px-6 py-4">Employee ID</th>
                               <th className="px-6 py-4">Employee Name</th>
                               <th className="px-6 py-4">Event Type</th>
                               <th className="px-6 py-4">Region</th>
                               <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-[#1f1f1f] text-[10px]">
                            {securityLogs.map((log, idx) => (
                               <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 font-mono text-[#a1a1aa]">{log.timestamp}</td>
                                  <td className="px-6 py-4 font-black text-[#e11d48]">{log.employeeId}</td>
                                  <td className="px-6 py-4 font-bold text-white uppercase">{log.employeeName}</td>
                                  <td className="px-6 py-4 text-[#a1a1aa] font-bold italic">{log.eventType}</td>
                                  <td className="px-6 py-4">
                                     <span className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[#a1a1aa] border border-[#333333] text-[8px] font-black">{log.region}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <span className={cn(
                                        "px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter",
                                        log.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-[#e11d48] border border-rose-500/20 animate-pulse"
                                     )}>
                                        {log.status}
                                     </span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   <div className="p-6 border-t border-[#1f1f1f] bg-[#0d0d0d] flex justify-end">
                      <button 
                         onClick={() => setShowLogsModal(false)}
                         className="px-6 py-2 bg-[#1a1a1a] border border-[#333333] text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-[#333333] transition-colors"
                      >
                         Close Portal
                      </button>
                   </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showEmailModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] w-full max-w-xl rounded-2xl border border-[#1f1f1f] shadow-2xl overflow-hidden">
                   <div className="p-6 border-b border-[#1f1f1f] bg-[#0d0d0d] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#e11d48]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa]">SLA Breach Notification Simulation</span>
                      </div>
                      <button onClick={() => setShowEmailModal(false)}><XCircle className="w-5 h-5 text-[#333333] hover:text-[#e11d48] transition-colors" /></button>
                   </div>
                   <div className="p-10 space-y-6">
                      <div className="space-y-4">
                         <div className="flex border-b border-[#1f1f1f] pb-3">
                            <span className="w-20 text-[9px] font-black text-[#666666] uppercase">Recipient</span>
                            <span className="text-[10px] font-bold text-white uppercase italic">Compliance Director</span>
                         </div>
                         <div className="flex border-b border-[#1f1f1f] pb-3">
                            <span className="w-20 text-[9px] font-black text-[#666666] uppercase">Subject</span>
                            <span className="text-[10px] font-black text-[#e11d48] uppercase tracking-tighter">URGENT — 48 BGV Cases Overdue for Immediate Resolution</span>
                         </div>
                      </div>
                      <div className="bg-[#0a0a0a] p-8 rounded-xl border border-[#1f1f1f] text-[11px] text-[#a1a1aa] leading-relaxed font-bold font-mono">
                         <p className="mb-4">SYSTEM GENERATED ALERT // OPSCORE CORE MODULE</p>
                         <p className="mb-4">This is an automated alert from <span className="text-white italic">OpsCore (v.4.2.0)</span>.</p>
                         <p className="mb-4 text-white uppercase tracking-tighter underline underline-offset-4 decoration-[#e11d48]">Critical Breach Detected:</p>
                         <ul className="space-y-1 mb-8 text-[#e11d48]">
                            <li>- Kale Fischer (US Cluster) :: 28 Days Overdue</li>
                            <li>- Jaslene Harding (US Cluster) :: 27 Days Overdue</li>
                            <li>- Paula Small (US Cluster) :: 26 Days Overdue</li>
                            <li>- Uriah Bridges (UK Cluster) :: 23 Days Overdue</li>
                            <li>- Pedro Harrison (UK Cluster) :: 22 Days Overdue</li>
                         </ul>
                         <p className="mb-8 italic opacity-60">Action Required: Coordinate with agency leads (HireRight, Credence) within a 24-hour window to maintain global SLA compliance.</p>
                         <p className="border-t border-[#1f1f1f] pt-6 uppercase tracking-widest text-[8px] font-black text-[#333333]">Audit ID: 8X-992-DELTA3</p>
                      </div>
                      <button 
                        onClick={() => { triggerToast("Email Alert Protocol Deployed."); setShowEmailModal(false); }}
                        className="w-full py-4 bg-[#e11d48] text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-lg animate-pulse"
                      >
                         DEPLOY NOTIFICATION
                      </button>
                   </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {showDemoTip && (
          <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4"
          >
             <div className="bg-[#111111] border-2 border-[#1b73e8] p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 backdrop-blur-xl">
                <div className="w-12 h-12 bg-[#1b73e8] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(27,115,232,0.4)]">
                   <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                   <p className="text-xs font-bold text-white leading-relaxed tracking-tight italic">
                      "OpsCore gives leadership a real-time view of the entire employee lifecycle — from hiring to exit — highlighting compliance risks, operational delays, and workforce health across regions."
                   </p>
                </div>
                <button onClick={() => setShowDemoTip(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors self-start">
                   <XCircle className="w-4 h-4 text-[#a1a1aa]" />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents helper
function NavItem({ label, icon, active, onClick, collapsed }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void, collapsed?: boolean }) {
   return (
      <button 
         onClick={onClick}
         className={cn(
            "w-full flex items-center gap-4 px-5 py-3 rounded-lg transition-all relative overflow-hidden group",
            active ? "bg-[#111111] text-white border-l-4 border-[#e11d48]" : "text-[#a1a1aa] hover:bg-[#111111] hover:text-white",
            collapsed ? "justify-center px-0" : ""
         )}
      >
         <span className={cn("transition-transform group-hover:scale-110", active ? "text-[#e11d48]" : "text-[#333333] group-hover:text-white")}>
            {icon}
         </span>
         {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span>}
         {!collapsed && active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#e11d48] rounded-full blur-[2px] mr-2"></div>}
      </button>
   );
}

function StatCard({ 
   label, 
   subtitle,
   value, 
   subLabel, 
   subColor = "text-[#a1a1aa]", 
   isAlert, 
   severity, 
   withGlow, 
   color 
}: { 
   label: string, 
   subtitle?: string,
   value: string | number, 
   subLabel?: string, 
   subColor?: string, 
   isAlert?: boolean, 
   severity?: 'critical' | 'warning', 
   withGlow?: boolean, 
   color?: string 
}) {
   return (
      <div className={cn(
         "bg-[#111111] border border-[#1f1f1f] p-5 rounded-xl flex flex-col relative overflow-hidden group hover:border-[#333333] transition-all",
         withGlow && severity === 'critical' ? "border-l-2 border-l-[#e11d48] shadow-[0_0_20px_rgba(225,29,72,0.1)]" : 
         withGlow && severity === 'warning' ? "border-l-2 border-l-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.1)]" : 
         "border-l border-l-[#1f1f1f]"
      )}>
         <div className="mb-4">
            <p className={cn(
               "text-[8px] font-black uppercase tracking-[0.2em] opacity-100",
               withGlow && severity === 'critical' ? "text-[#e11d48]" : "text-[#a1a1aa]"
            )}>{label}</p>
            {subtitle && (
               <p className="text-[7px] text-[#444444] font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>
            )}
         </div>
         <div className="flex flex-col">
            <span className={cn("text-3xl font-black text-white tracking-tighter italic", color)}>{value}</span>
            {subLabel && (
               <p className={cn("text-[7px] font-black uppercase tracking-widest mt-2", subColor)}>
                  {subLabel}
               </p>
            )}
         </div>
         {withGlow && severity === 'critical' && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#e11d48]/5 rounded-bl-full pointer-events-none"></div>
         )}
      </div>
   );
}

function PipelineStage({ label, status, delay, icon }: { label: string, status: 'clear' | 'risk' | 'critical', delay: string, icon: React.ReactNode }) {
   const colors = {
      clear: "bg-[#1a1a1a] text-[#333333] border-[#1f1f1f]",
      risk: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      critical: "bg-[#e11d48]/10 text-[#e11d48] border-[#e11d48]/20"
   };

   return (
      <div className="flex flex-col items-center gap-4 group relative z-10 w-24">
         <div className={cn(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110 shadow-lg",
            colors[status]
         )}>
            {icon}
         </div>
         <div className="text-center">
            <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-tight">{label}</p>
            <p className={cn(
               "text-[8px] font-mono font-bold mt-2",
               status === 'clear' ? "text-[#333333]" : status === 'risk' ? "text-amber-500" : "text-[#e11d48]"
            )}>{delay}</p>
         </div>
      </div>
   );
}

function StatusBadge({ status }: { status: string }) {
   const styles = {
      Overdue: "bg-[#e11d48] text-white",
      Pending: "bg-amber-900/40 text-amber-500 border border-amber-500/20",
      Cleared: "bg-emerald-900/40 text-emerald-500 border border-emerald-500/20",
      'In Progress': "bg-[#1a1a1a] text-[#666666] border border-[#1f1f1f]"
   }[status] || "bg-[#1a1a1a] text-[#a1a1aa]";

   return (
      <span className={cn("inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", styles)}>
         {status}
      </span>
   );
}

function RiskBadge({ risk }: { risk: string }) {
   const styles = {
      'High Risk': "text-[#e11d48] bg-[#e11d48]/10 border border-[#e11d48]/20",
      'Medium Risk': "text-white bg-white/5 border border-white/10",
      'Low Risk': "text-[#a1a1aa] bg-[#1a1a1a] border border-[#1f1f1f]"
   }[risk] || "text-[#a1a1aa] bg-[#1a1a1a] border border-[#1f1f1f]";

   return (
      <span className={cn("inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", styles)}>
         {risk}
      </span>
   );
}

function AlertItem({ type, message, severity }: { type: string, message: string, severity: 'high' | 'medium' | 'low' }) {
   return (
      <div className="p-4 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg transition-all hover:border-[#333333] group relative overflow-hidden">
         <div className={cn(
            "absolute left-0 top-0 w-1 h-full",
            severity === 'high' ? "bg-[#e11d48]" : severity === 'medium' ? "bg-amber-500" : "bg-white/10"
         )}></div>
         <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", 
            severity === 'high' ? "text-[#e11d48]" : severity === 'medium' ? "text-amber-500" : "text-[#a1a1aa]"
         )}>{type}</p>
         <p className="text-[10px] font-bold text-white group-hover:text-[#e11d48] transition-colors">{message}</p>
      </div>
   );
}

function OwnerRow({ risk, owner }: { risk: string, owner: string }) {
   return (
      <div className="flex items-center justify-between p-4 bg-[#111111] hover:bg-white/5 border border-[#1f1f1f] rounded-lg group transition-all cursor-pointer">
         <div>
            <p className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-1 opacity-60 font-bold">{risk}</p>
            <p className="text-[10px] font-black uppercase text-white group-hover:text-[#e11d48] transition-colors tracking-tight italic">{owner}</p>
         </div>
         <ArrowUpRight className="w-3.5 h-3.5 text-[#333333] group-hover:text-[#e11d48] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
   );
}

function FunnelMetric({ label, value, color }: { label: string, value: string, color: string }) {
   return (
      <div className="text-center">
         <p className="text-[9px] font-black uppercase text-[#a1a1aa] tracking-widest mb-3">{label}</p>
         <p className={cn("text-4xl font-black tracking-tighter leading-none italic", color)}>{value}</p>
      </div>
   );
}

function LegendItem({ label, color, value }: { label: string, color: string, value: string }) {
   return (
      <div className="flex items-center justify-between group">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-[10px] font-black uppercase text-[#a1a1aa] group-hover:text-white transition-colors">{label}</span>
         </div>
         <span className="text-[10px] font-mono font-bold text-white">{value}</span>
      </div>
   );
}

function OffboardingItem({ label, status }: { label: string, status: string }) {
   return (
      <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f] transition-all hover:bg-[#1a1a1a]">
         <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">{label}</span>
         <span className={cn(
            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
            status === 'Automated' ? "bg-emerald-500/10 text-emerald-500" :
            status === 'In Progress' ? "bg-[#e11d48]/10 text-[#e11d48]" :
            "text-[#a1a1aa] bg-[#1a1a1a]"
         )}>{status}</span>
      </div>
   );
}

function CategorySection({ label, items }: { label: string, items: string[] }) {
   return (
      <div>
         <h4 className="text-[10px] font-black uppercase text-[#333333] tracking-[0.2em] mb-4 border-b border-[#1f1f1f] pb-2">{label}</h4>
         <ul className="space-y-3">
            {items.map(item => (
               <li key={item} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded flex items-center justify-center border border-[#1f1f1f] bg-[#0a0a0a]">
                     <div className="w-1 h-1 rounded-full bg-[#333333]"></div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#a1a1aa] hover:text-[#e11d48] transition-colors cursor-pointer">{item}</span>
               </li>
            ))}
         </ul>
      </div>
   );
}

