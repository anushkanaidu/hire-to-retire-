import {useState, useMemo} from 'react';
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
  Mail
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
  Line
} from 'recharts';
import {motion, AnimatePresence} from 'motion/react';
import {RAW_EMPLOYEES} from './data/mockData';
import {Employee, Country} from './types';
import {cn} from './lib/utils';
import {generateLifecycleSummary} from './services/gemini';
import { Sparkles, RefreshCw } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hiring' | 'onboarding' | 'production' | 'exit'>('overview');
  const [selectedCountry, setSelectedCountry] = useState<Country | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchAiReport = async () => {
    setIsAiLoading(true);
    const report = await generateLifecycleSummary(filteredData);
    setAiReport(report);
    setIsAiLoading(false);
  };

  const filteredData = useMemo(() => {
    return RAW_EMPLOYEES.filter(emp => {
      const countryMatch = selectedCountry === 'All' || emp.country === selectedCountry;
      const searchMatch = `${emp.firstname} ${emp.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
      return countryMatch && searchMatch;
    });
  }, [selectedCountry, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const bgvAtRisk = filteredData.filter(e => e.bgv_at_risk === 'Yes').length;
    const complianceAvg = filteredData.reduce((acc, curr) => acc + curr.compliance_pct, 0) / total;
    const pendingOnboarding = filteredData.filter(e => e.onboarding_complete === 'No').length;

    return { total, bgvAtRisk, complianceAvg, pendingOnboarding };
  }, [filteredData]);

  const countryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(e => counts[e.country] = (counts[e.country] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  return (
    <div className="flex h-screen bg-[#fcfcfd] overflow-hidden font-sans relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-100/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar - Floating Rail Design */}
      <aside className="w-20 lg:w-64 bg-slate-900 m-4 rounded-3xl text-white flex flex-col shadow-2xl z-20 transition-all duration-500">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">O</div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-white lg:block hidden">Opscore</h1>
          </div>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold lg:block hidden">Global HR Ops</p>
        </div>

        <nav className="flex-1 py-8 px-3 space-y-2">
          <SidebarLink icon={<LayoutDashboard className="w-5 h-5"/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarLink icon={<Users className="w-5 h-5"/>} label="Pipeline" active={activeTab === 'hiring'} onClick={() => setActiveTab('hiring')} />
          <SidebarLink icon={<ShieldAlert className="w-5 h-5"/>} label="Compliance" active={activeTab === 'onboarding'} onClick={() => setActiveTab('onboarding')} />
          <SidebarLink icon={<BarChart3 className="w-5 h-5"/>} label="Production" active={activeTab === 'production'} onClick={() => setActiveTab('production')} />
          <SidebarLink icon={<LogOut className="w-5 h-5"/>} label="Exits" active={activeTab === 'exit'} onClick={() => setActiveTab('exit')} />
        </nav>

        <div className="p-4 bg-white/5 m-3 rounded-2xl border border-white/5 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">AN</div>
            <div>
              <p className="text-xs font-bold">A. Naidu</p>
              <p className="text-[10px] text-slate-500">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header - Glass Effect */}
        <header className="h-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-200/50 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/50">
              {['All', 'US', 'UK', 'SG', 'IND'].map(c => (
                <button 
                  key={c}
                  onClick={() => setSelectedCountry(c as any)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wider",
                    selectedCountry === c || (selectedCountry === 'Singapore' && c === 'SG') || (selectedCountry === 'India' && c === 'IND')
                      ? "bg-white shadow-lg text-indigo-600" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-100 px-4 py-2 rounded-2xl flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-500/10"></div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{stats.bgvAtRisk} Critical Breaches</span>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-6 py-2.5 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              Daily Export
            </button>
          </div>
        </header>

        {/* Dashboard Surface */}
        <section className="flex-1 overflow-y-auto px-8 pb-8 pt-2 scroll-smooth">
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
              <span className="text-indigo-600 font-light italic mr-2">{activeTab.toUpperCase()}</span>
              Intelligence
            </h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring operational efficiency across global nodes.</p>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Total Headcount" 
              value={stats.total} 
              subValue="+12% from last month" 
            />
            <StatCard 
              label="BGV At Risk" 
              value={stats.bgvAtRisk} 
              subValue="Needs immediate action" 
              trend="down"
              isAlert={stats.bgvAtRisk > 0}
            />
            <StatCard 
              label="Compliance Pct" 
              value={`${Math.round(stats.complianceAvg)}%`} 
              subValue="Global training target: 95%" 
            />
            <StatCard 
              label="Days Since Intake" 
              value="14.2" 
              subValue="Avg. SLA: 10 days" 
              trend="up"
              isAlert={true}
            />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* AI Panel */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-[2.5rem] p-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden flex items-center gap-8 group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 group-hover:rotate-6 transition-transform duration-500">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="label-mono flex items-center gap-2 text-indigo-600">
                         AI Intelligence Hub
                      </h3>
                      <button 
                        onClick={fetchAiReport}
                        disabled={isAiLoading}
                        className="p-2 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50 text-slate-400 hover:text-indigo-600 border border-slate-100 group/btn"
                      >
                        <RefreshCw className={cn("w-4 h-4", isAiLoading && "animate-spin")} />
                      </button>
                    </div>
                    
                    {aiReport ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="text-sm text-slate-600 whitespace-pre-line leading-relaxed font-medium"
                      >
                        {aiReport}
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-sm font-medium">Global operational data ingested. Insights ready.</p>
                        <button 
                          onClick={fetchAiReport}
                          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95"
                        >
                          Run Full Audit
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Operational Distribution
                      </h3>
                      <div className="flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         <span className="label-mono text-[8px] text-slate-500">Current Load</span>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryDist}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontVariant="mono" />
                          <YAxis axisLine={false} tickLine={false} fontSize={10} fontVariant="mono" />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '11px' }}
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-8">System Pulse</h3>
                    <div className="space-y-4">
                      <AlertItem 
                        type="SLA" 
                        message="UK BGV SLA Breach" 
                        time="33 days in queue"
                        severity="high"
                      />
                      <AlertItem 
                        type="TRAINING" 
                        message="Onboarding Delay (India)" 
                        time="Orientation missed"
                        severity="medium"
                      />
                      <AlertItem 
                        type="RISK" 
                        message="High Flight Probability" 
                        time="ID: EMP0006"
                        severity="high"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-3 glass-card rounded-[2.5rem] overflow-hidden shadow-sm">
                     <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-bold tracking-tight">Node Topology</h3>
                        <button className="text-indigo-600 text-xs font-bold uppercase tracking-widest hover:underline px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all">Detailed View</button>
                     </div>
                     <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-4 label-mono">Entity</th>
                            <th className="px-8 py-4 label-mono">Zone</th>
                            <th className="px-8 py-4 label-mono">Status</th>
                            <th className="px-8 py-4 label-mono">Health</th>
                            <th className="px-8 py-4 label-mono text-center">Threat Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[12px]">
                          {filteredData.map(emp => (
                            <tr key={emp.employee_id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-200 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                                    {emp.firstname[0]}{emp.lastname[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 leading-none mb-1">{emp.firstname} {emp.lastname}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{emp.job_title}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="uppercase tracking-widest font-bold text-slate-400 text-[10px]">{emp.country}</span>
                              </td>
                              <td className="px-8 py-5">
                                <Badge status={emp.bgv_status} atRisk={emp.bgv_at_risk === 'Yes'} />
                              </td>
                              <td className="px-8 py-5">
                                 <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${emp.compliance_pct}%` }}
                                      className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        emp.compliance_pct === 100 ? "bg-emerald-500" : "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                      )}
                                    />
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <span className={cn(
                                   "text-[9px] uppercase font-black px-3 py-1 rounded-full border tracking-widest",
                                   emp.flight_risk === 'High Risk' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                   emp.flight_risk === 'Medium Risk' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                   "bg-emerald-50 text-emerald-600 border-emerald-100"
                                 )}>
                                   {emp.flight_risk}
                                 </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'hiring' && (
              <motion.div 
                key="hiring"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-12 gap-8"
              >
                <div className="col-span-12 bg-rose-50/50 border border-rose-100/50 rounded-3xl p-6 flex items-start gap-6 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 uppercase tracking-widest mb-1">Process Breach Alert</h4>
                    <p className="text-xs text-rose-800/80 leading-relaxed max-w-4xl">
                      Verification SLA thresholds exceeded in UK node. Impacting target production deployment for Q3. Regional Lead action required.
                    </p>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-7 glass-card rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Active Pipeline</h3>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                       <button className="px-4 py-1.5 text-[9px] font-bold bg-white shadow-sm rounded-lg text-slate-900 uppercase tracking-widest">Inflow</button>
                       <button className="px-4 py-1.5 text-[9px] font-bold text-slate-400 rounded-lg uppercase tracking-widest">Archive</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-6 mb-12">
                    <FunnelStep label="Screening" value="42" progress="100%" color="bg-indigo-500" />
                    <FunnelStep label="Technical" value="28" progress="66%" color="bg-indigo-400" />
                    <FunnelStep label="Culture Fit" value="14" progress="33%" color="bg-indigo-300" />
                    <FunnelStep label="Offer" value="06" progress="15%" color="bg-emerald-500" />
                  </div>
                  <div className="space-y-4 pt-10 border-t border-slate-100">
                     <p className="label-mono mb-4">Critical Tracking</p>
                     <div className="space-y-2">
                        {filteredData.slice(0, 3).map(emp => (
                          <div key={emp.employee_id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                            <span className="text-sm font-bold text-slate-900">{emp.firstname} {emp.lastname}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{emp.country}</span>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                emp.bgv_at_risk === 'Yes' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                              )}>
                                {emp.bgv_at_risk === 'Yes' ? 'Breach' : 'Secure'}
                              </span>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-8">
                  <div className="glass-card rounded-[2.5rem] p-8">
                     <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-8">Agency Throughput</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={filteredData.slice(0, 5).map(e => ({ name: e.bgv_agency, val: e.bgv_days_elapsed }))}>
                              <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={9} fontVariant="mono" />
                              <YAxis axisLine={false} tickLine={false} fontSize={9} fontVariant="mono" />
                              <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.03)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <p className="label-mono text-slate-500 mb-2">Network Insights</p>
                    <p className="text-base font-light leading-relaxed mb-6">
                      Average regional latency for BGV processing is <span className="text-indigo-400 font-bold italic">14.2 days</span>, trending 42% above SLA targets.
                    </p>
                    <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest transition-all">Audit Global Latency</button>
                    <Globe className="absolute -bottom-8 -right-8 w-32 h-32 text-indigo-500/10 opacity-50 group-hover:rotate-45 transition-transform duration-[2000ms]" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'onboarding' && (
              <motion.div 
                key="onboarding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-8"
              >
                <div className="col-span-12 lg:col-span-8 glass-card rounded-[2.5rem] shadow-sm flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Training Alignment</h3>
                    <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Audit Logs</button>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-4 label-mono">Identity</th>
                          <th className="px-8 py-4 label-mono text-center">AI Ethics</th>
                          <th className="px-8 py-4 label-mono text-center">Gemini</th>
                          <th className="px-8 py-4 label-mono text-center">Security</th>
                          <th className="px-8 py-4 label-mono text-center">Clearance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[12px]">
                        {filteredData.map(emp => (
                          <tr key={emp.employee_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5 font-bold text-slate-900">{emp.firstname} {emp.lastname}</td>
                            <td className="px-8 py-5 text-center"><ModuleBadge complete={emp.ai_ethics === 'Yes'} /></td>
                            <td className="px-8 py-5 text-center"><ModuleBadge complete={emp.gemini_training === 'Yes'} /></td>
                            <td className="px-8 py-5 text-center"><ModuleBadge complete={emp.harassment_policy === 'Yes'} /></td>
                            <td className="px-8 py-5 text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
                                emp.compliance_pct === 100 
                                  ? "bg-emerald-50 text-emerald-700" 
                                  : "bg-amber-50 text-amber-700"
                              )}>
                                {emp.compliance_pct === 100 ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <p className="label-mono text-indigo-300 mb-2">Aggregate Index</p>
                      <p className="text-6xl font-light mb-6 tracking-tighter">92.<span className="text-2xl font-bold opacity-60">4%</span></p>
                      <p className="text-indigo-100 text-xs leading-relaxed mb-8 font-medium">Compliance trajectory stable. Critical path clear for Q3 hiring cohorts.</p>
                      <div className="flex gap-2">
                        <div className="px-4 py-2 bg-white/10 rounded-2xl text-[9px] font-bold backdrop-blur-md border border-white/5 uppercase tracking-widest shadow-xl">Best Node: India</div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-8">
                    <h4 className="label-mono mb-8">Asset Deployment</h4>
                    <div className="space-y-6">
                      <ProgressItem label="Workstations" value={84} color="bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                      <ProgressItem label="Network Auth" value={100} color="bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      <ProgressItem label="Physical Access" value={62} color="bg-amber-500 shadow-sm shadow-amber-500/50" />
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 text-white text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <ShieldAlert className="w-5 h-5 text-indigo-400" />
                      <p className="label-mono text-slate-400">Security Audit</p>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">Regional biometric nodes in Singapore report 4 pending identities.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'exit' && (
              <motion.div 
                key="exit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-8"
              >
                 <div className="col-span-12 lg:col-span-4 glass-card p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
                        <LogOut className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Offboarding Matrix</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">Structured asset recovery and secure access revocation nodes.</p>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] mt-10 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                       <div className="flex justify-between items-center mb-4">
                          <span className="label-mono text-[8px]">Next LDW Node</span>
                          <span className="text-[8px] px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full font-black uppercase tracking-widest">Urgent: 3D</span>
                       </div>
                       <p className="font-bold text-base text-slate-900">Joseph Martins</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Zone: India • Unit: BPC</p>
                    </div>
                 </div>

                 <div className="col-span-12 lg:col-span-8 glass-card rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xl font-bold tracking-tight">Access Revocation Flow</h3>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <span className="label-mono text-[8px] text-slate-400">Revoked</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                           <span className="label-mono text-[8px] text-slate-400">Active Risk</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-8 py-4 label-mono">Identity</th>
                            <th className="px-8 py-4 label-mono">Zone</th>
                            <th className="px-8 py-4 label-mono text-center">LDW</th>
                            <th className="px-8 py-4 label-mono text-center">Credential</th>
                            <th className="px-8 py-4 label-mono text-center">Asset Node</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[12px]">
                          {filteredData.slice(0, 5).map((emp, i) => (
                            <tr key={emp.employee_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-5 font-bold text-slate-900">{emp.firstname} {emp.lastname}</td>
                              <td className="px-8 py-5 uppercase tracking-widest text-[10px] text-slate-400 font-bold">{emp.country}</td>
                              <td className="px-8 py-5 text-center font-mono text-slate-500 text-[11px]">OCT {24 + i} • 23</td>
                              <td className="px-8 py-5 text-center">
                                <span className={cn(
                                  "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-[0.1em]",
                                  i === 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                )}>
                                  {i === 0 ? 'Revoked' : 'Active'}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-center text-slate-400">
                                {i === 0 ? <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" /> : <Clock className="w-5 h-5 mx-auto text-slate-200 opacity-20" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'production' && (
              <motion.div 
                key="production"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-12 gap-8"
              >
                <div className="col-span-12 lg:col-span-8 glass-card p-10 rounded-[2.5rem] shadow-sm">
                   <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                       <TrendingUp className="w-6 h-6 text-indigo-500" />
                       Node Performance Matrix
                    </h3>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20"></div>
                        <span className="label-mono text-[10px]">Efficiency</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                        <span className="label-mono text-[10px]">Engagement</span>
                      </div>
                    </div>
                   </div>
                   <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="firstname" axisLine={false} tickLine={false} hide />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} fontVariant="mono" />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '11px' }} />
                            <Line type="stepAfter" dataKey="performance_score" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="engagement_score" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-8">
                   <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                          <Sparkles className="w-6 h-6 text-indigo-400" />
                          <h3 className="label-mono text-slate-400">AI Risk Forensics</h3>
                        </div>
                        <p className="text-base font-light text-slate-300 leading-relaxed mb-8 italic border-l-2 border-indigo-500/50 pl-6">
                          "UK deployment nodes exhibiting anomalous churn indicators. Regional retention workshops identified as critical path."
                        </p>
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                             <TrendingUp className="w-4 h-4 text-rose-400" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">High Volatility: London Node</span>
                           </div>
                           <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                             <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Optimized Node: Bangalore</span>
                           </div>
                        </div>
                      </div>
                      <Globe className="absolute -bottom-12 -right-12 w-48 h-48 text-indigo-500/10 opacity-40 group-hover:rotate-12 transition-transform duration-[3000ms]" />
                   </div>

                   <div className="glass-card rounded-[2.5rem] p-8">
                      <h4 className="label-mono mb-8">Unit Sentiment Score</h4>
                      <div className="space-y-4">
                        {['Content Strat.', 'UI/UX Lab', 'Ad Ops Hub'].map((unit, i) => (
                          <div key={unit} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                             <span className="text-xs font-bold text-slate-700">{unit}</span>
                             <span className={cn(
                               "text-xs font-black tracking-widest",
                               i === 1 ? "text-rose-500" : "text-emerald-500"
                             )}>{4.2 - i * 0.8} / 5.0</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 lg:px-4 rounded-xl transition-all group relative duration-300",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </div>
      <span className={cn("text-xs font-bold tracking-wider uppercase lg:block hidden", active ? "opacity-100" : "opacity-60 group-hover:opacity-100 transition-opacity")}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute inset-0 bg-indigo-600 rounded-xl -z-10"
        />
      )}
    </button>
  );
}

function StatCard({ label, value, subValue, trend, isAlert }: { 
  label: string, value: string | number, subValue: string, trend?: 'up' | 'down', isAlert?: boolean 
}) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "glass-card rounded-[2.5rem] p-8 relative overflow-hidden group",
        isAlert && "border-rose-200/50"
      )}
    >
      <p className={cn(
        "label-mono mb-2",
        isAlert ? "text-rose-500" : "text-slate-400"
      )}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-4xl font-semibold tracking-tight",
          isAlert ? "text-rose-700 font-bold" : "text-slate-900"
        )}>
          {value}
        </span>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-2 font-medium">{subValue}</p>
      
      {/* Decorative accent */}
      <div className={cn(
        "absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10",
        isAlert ? "bg-rose-500" : "bg-indigo-500"
      )} />
    </motion.div>
  );
}

function ProgressItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-400 font-bold">{value}%</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }} 
          className={cn("h-full rounded-full transition-all duration-1000", color)}
        ></motion.div>
      </div>
    </div>
  );
}

function Badge({ status, atRisk }: { status: string, atRisk: boolean }) {
  const styles = {
    Cleared: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    'In Progress': "bg-blue-50 text-blue-700 border-blue-100",
    Overdue: "bg-red-50 text-red-700 border-red-100",
  }[status] || "bg-slate-50 text-slate-600";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", styles)}>
        {status}
      </span>
      {atRisk && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></div>}
    </div>
  );
}

function ModuleBadge({ complete }: { complete: boolean }) {
  return complete ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
  ) : (
    <XCircle className="w-4 h-4 text-slate-200 mx-auto" />
  );
}

function CheckItem({ label, completed }: { label: string, completed: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={cn(
        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
        completed ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200"
      )}>
        {completed && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <span className={cn(completed ? "text-slate-400 line-through" : "text-slate-700")}>{label}</span>
    </div>
  );
}

function FunnelStep({ label, value, progress, color }: { label: string, value: string, progress: string, color: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-tighter">{label}</p>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
      <div className="h-12 w-1 mx-auto bg-slate-100 mt-2 relative overflow-hidden rounded-full">
          <div className={cn("absolute top-0 w-full transition-all duration-1000 origin-top", color)} style={{ height: progress }}></div>
      </div>
    </div>
  );
}
function AlertItem({ type, message, time, severity }: { type: string, message: string, time: string, severity: 'high' | 'medium' | 'low' }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
      <div className={cn(
        "absolute left-0 top-0 w-1 h-full transition-all group-hover:w-1.5",
        severity === 'high' ? "bg-rose-500" : severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
      )}></div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-widest",
            severity === 'high' ? "text-rose-600" : "text-slate-500"
          )}>{type}</span>
          <span className="text-[9px] text-slate-400 italic">| {time}</span>
        </div>
        <p className="text-[11px] font-medium text-slate-700 leading-tight">{message}</p>
      </div>
    </div>
  );
}

