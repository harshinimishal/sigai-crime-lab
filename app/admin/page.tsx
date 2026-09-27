"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Trophy,
  Clock,
  Search,
  Filter,
  LogOut,
  RefreshCw,
  Eye,
  X,
  Lock,
  User,
  AlertTriangle,
  Award,
  CheckCircle2,
} from "lucide-react";

type LeaderboardUser = {
  rank: number;
  id: string;
  name: string;
  email: string;
  round1_score: number;
  round2_score: number;
  round3_score: number;
  round4_score: number;
  total_score: number;
  status: string;
  statusStep: number;
  primary_suspect: string | null;
  primary_motive: string | null;
  secondary_suspect: string | null;
  secondary_motive: string | null;
  round4_motive: string | null;
  round4_method: string | null;
  round4_evidence: string[] | null;
  round4_report: string | null;
  created_at: string | null;
};

type Stats = {
  totalUsers: number;
  completedCount: number;
  inProgressCount: number;
  avgScore: number;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    completedCount: 0,
    inProgressCount: 0,
    avgScore: 0,
  });

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Leaderboard filters & state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS">("ALL");
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check auth and fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch("/api/admin/leaderboard");
      if (res.status === 401) {
        setIsAuthenticated(false);
        setUsers([]);
      } else if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(
          data.stats || {
            totalUsers: 0,
            completedCount: 0,
            inProgressCount: 0,
            avgScore: 0,
          }
        );
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Authentication failed.");
      } else {
        setIsAuthenticated(true);
        setPassword("");
        fetchLeaderboard();
      }
    } catch (err) {
      setLoginError("Network error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAuthenticated(false);
      setSelectedUser(null);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "COMPLETED") {
      return user.status === "Completed";
    }
    if (statusFilter === "IN_PROGRESS") {
      return user.status !== "Completed";
    }

    return true;
  });

  // Initial loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen bg-black items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#d01f5b] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Authenticating Admin Terminal...
          </p>
        </div>
      </div>
    );
  }

  // 1. UNAUTHENTICATED ADMIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen bg-black text-white items-center justify-center p-6 relative select-none overflow-hidden">
        {/* Subtle background ambient gradient */}
        <div className="absolute inset-0 bg-radial-gradient opacity-30 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d01f5b]/10 border border-[#d01f5b]/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#d01f5b] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#d01f5b] uppercase tracking-widest">
                Master Control Access
              </span>
            </div>
            
            <h1
              className="text-4xl font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: "var(--font-league-gothic)" }}
            >
              Admin Authorization
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Chimera Labs Restricted Forensic Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-white transition font-sans"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 font-bold mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-white transition font-sans"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 font-sans"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-white text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer shadow-lg mt-2"
            >
              {isLoggingIn ? "Authenticating..." : "Authorize Admin Access"}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-zinc-900 text-center">
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-zinc-600" />
              Restricted Area — Authorized Personnel Only
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. AUTHENTICATED LEADERBOARD DASHBOARD
  return (
    <div className="flex flex-col min-h-screen w-screen bg-black text-white select-none overflow-x-hidden">
      {/* Top Admin Navigation */}
      <header className="w-full bg-zinc-950 border-b border-zinc-800 px-8 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d01f5b] animate-pulse" />
              <p className="text-xs font-mono font-bold text-[#d01f5b] uppercase tracking-widest">
                Chimera Labs Master Control
              </p>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                SEC-LEVEL 4
              </span>
            </div>
            <h1
              className="text-4xl font-bold uppercase tracking-wider text-white mt-1"
              style={{ fontFamily: "var(--font-league-gothic)" }}
            >
              Investigator Leaderboard & Analytics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchLeaderboard}
              disabled={isLoadingData}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-xs font-bold text-red-300 hover:bg-red-900/80 transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8 space-y-8">
        
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Registered */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                Total Registered
              </p>
              <h3
                className="text-4xl font-bold text-white mt-1"
                style={{ fontFamily: "var(--font-league-gothic)" }}
              >
                {stats.totalUsers}
              </h3>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Investigators Enrolled</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Users className="w-6 h-6 text-[#d01f5b]" />
            </div>
          </div>

          {/* Completed Investigations */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                Completed Cases
              </p>
              <h3
                className="text-4xl font-bold text-emerald-400 mt-1"
                style={{ fontFamily: "var(--font-league-gothic)" }}
              >
                {stats.completedCount}
              </h3>
              <p className="text-[10px] text-emerald-500/80 font-sans mt-0.5">Final Reports Submitted</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                Active In-Progress
              </p>
              <h3
                className="text-4xl font-bold text-amber-400 mt-1"
                style={{ fontFamily: "var(--font-league-gothic)" }}
              >
                {stats.inProgressCount}
              </h3>
              <p className="text-[10px] text-amber-500/80 font-sans mt-0.5">Currently Investigating</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                Avg Total Score
              </p>
              <h3
                className="text-4xl font-bold text-white mt-1"
                style={{ fontFamily: "var(--font-league-gothic)" }}
              >
                {stats.avgScore} <span className="text-sm font-sans text-zinc-500 font-normal">pts</span>
              </h3>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Across All Investigators</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xl">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search investigator name or email..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-white transition font-sans placeholder:text-zinc-600"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "ALL" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "COMPLETED" ? "bg-emerald-500 text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Completed ({stats.completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === "IN_PROGRESS" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              In Progress ({stats.inProgressCount})
            </button>
          </div>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-4 px-5">Rank</th>
                  <th className="py-4 px-5">Investigator</th>
                  <th className="py-4 px-4 text-center">R1 Clues</th>
                  <th className="py-4 px-4 text-center">R2 Suspects</th>
                  <th className="py-4 px-4 text-center">R3 Analysis</th>
                  <th className="py-4 px-4 text-center">R4 Report</th>
                  <th className="py-4 px-5 text-center">Total Score</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Dossier Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-600 italic">
                      No investigators found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isTop3 = user.rank <= 3;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-zinc-900/60 transition group cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        {/* Rank */}
                        <td className="py-4 px-5 font-mono">
                          <div className="flex items-center gap-2">
                            {user.rank === 1 && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded font-bold text-[10px]">
                                🥇 1st
                              </span>
                            )}
                            {user.rank === 2 && (
                              <span className="px-2 py-0.5 bg-zinc-300/20 text-zinc-200 border border-zinc-400/40 rounded font-bold text-[10px]">
                                🥈 2nd
                              </span>
                            )}
                            {user.rank === 3 && (
                              <span className="px-2 py-0.5 bg-amber-700/20 text-amber-500 border border-amber-700/40 rounded font-bold text-[10px]">
                                🥉 3rd
                              </span>
                            )}
                            {!isTop3 && (
                              <span className="text-zinc-500 font-bold">#{user.rank}</span>
                            )}
                          </div>
                        </td>

                        {/* Investigator Name & Email */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-white group-hover:text-[#d01f5b] transition">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {user.email || "No email"}
                          </div>
                        </td>

                        {/* Round Scores */}
                        <td className="py-4 px-4 text-center font-mono text-zinc-300">
                          {user.round1_score}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-zinc-300">
                          {user.round2_score}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-zinc-300">
                          {user.round3_score}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-zinc-300">
                          {user.round4_score}
                        </td>

                        {/* Total Score */}
                        <td className="py-4 px-5 text-center font-mono">
                          <span className="px-2.5 py-1 rounded-full bg-[#d01f5b]/10 text-[#d01f5b] border border-[#d01f5b]/30 font-bold text-xs">
                            {user.total_score} pts
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {user.status === "Completed" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold">
                              <Clock className="w-3 h-3" /> {user.status}
                            </span>
                          )}
                        </td>

                        {/* View Action */}
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Investigator Detail Modal */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#d01f5b] font-bold tracking-widest">
                      Investigator Dossier #{selectedUser.rank}
                    </span>
                    <h2
                      className="text-3xl font-bold uppercase text-white mt-0.5"
                      style={{ fontFamily: "var(--font-league-gothic)" }}
                    >
                      {selectedUser.name}
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">{selectedUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Score Summary Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center text-xs">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-[9px] text-zinc-500 uppercase block">R1 Clues</span>
                    <span className="font-bold text-white">{selectedUser.round1_score} pts</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-[9px] text-zinc-500 uppercase block">R2 Suspects</span>
                    <span className="font-bold text-white">{selectedUser.round2_score} pts</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-[9px] text-zinc-500 uppercase block">R3 Analysis</span>
                    <span className="font-bold text-white">{selectedUser.round3_score} pts</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-[9px] text-zinc-500 uppercase block">R4 Report</span>
                    <span className="font-bold text-white">{selectedUser.round4_score} pts</span>
                  </div>
                  <div className="p-2.5 bg-[#d01f5b]/10 border border-[#d01f5b]/40 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-[#d01f5b] uppercase block font-bold">Total Score</span>
                    <span className="font-bold text-[#d01f5b] text-sm">{selectedUser.total_score} pts</span>
                  </div>
                </div>

                {/* Round 4 Deduction Data */}
                <div className="space-y-4 text-xs font-sans">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
                    Round 4 Deduction Breakdown
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-mono text-[#d01f5b] font-bold uppercase block">Primary Accused:</span>
                      <span className="font-bold text-white block mt-0.5">
                        {selectedUser.primary_suspect || "Not Recorded"}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block mt-2">Primary Motive:</span>
                      <span className="text-zinc-300 block mt-0.5">
                        {selectedUser.primary_motive || selectedUser.round4_motive || "Not Recorded"}
                      </span>
                    </div>

                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-mono text-amber-500 font-bold uppercase block">Secondary Accused:</span>
                      <span className="font-bold text-zinc-200 block mt-0.5">
                        {selectedUser.secondary_suspect || "Not Recorded"}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block mt-2">Secondary Motive:</span>
                      <span className="text-zinc-300 block mt-0.5">
                        {selectedUser.secondary_motive || "Not Recorded"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Suspected Execution Method:</span>
                    <span className="text-zinc-200 font-medium block mt-0.5">
                      {selectedUser.round4_method || "Not Recorded"}
                    </span>
                  </div>

                  {selectedUser.round4_evidence && selectedUser.round4_evidence.length > 0 && (
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Supporting Evidence:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.round4_evidence.map((ev, i) => (
                          <span key={i} className="text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-md font-mono">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.round4_report && (
                    <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Written Investigation Report:</span>
                      <p className="text-zinc-300 leading-relaxed font-sans font-light italic">
                        &quot;{selectedUser.round4_report}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-2 border-t border-zinc-900 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
