import { NextResponse } from "next/server";
import { isServerAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const isAuth = await isServerAdminAuthenticated();

    if (!isAuth) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin authentication required." },
        { status: 401 }
      );
    }

    // Query users table from Supabase using supabaseAdmin or standard client
    let rawUsers: any[] | null = null;
    let error: any = null;

    const resAdmin = await supabaseAdmin.from("users").select("*");
    rawUsers = resAdmin.data;
    error = resAdmin.error;

    if (error || !rawUsers || rawUsers.length === 0) {
      const resStandard = await supabase.from("users").select("*");
      if (resStandard.data && resStandard.data.length > 0) {
        rawUsers = resStandard.data;
        error = null;
      }
    }

    if (error) {
      console.error("Supabase leaderboard query error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    const usersList = rawUsers || [];

    // Process scores and status for leaderboard
    const processed = usersList.map((u: any) => {
      const r1Score = typeof u.round1_score === "number" ? u.round1_score : 0;
      const r2Score = typeof u.round2_score === "number" ? u.round2_score : 0;

      const r3Answer = u.round3_answer || "";
      const isCompleted = Boolean(r3Answer && !r3Answer.startsWith("__PROGRESS__:"));

      // Round 3 score: 20 points if progressed past round 3 or completed
      let r3Score = 0;
      if (isCompleted || r3Answer.includes("round4") || r3Answer.includes("completed")) {
        r3Score = 20;
      }

      // Round 4 score resolution
      let r4Score = typeof u.round4_score === "number" && u.round4_score > 0 ? u.round4_score : 0;

      // Parse SCORE: XX/25 from formatted round3_answer string if column is missing/zero
      if (!r4Score && r3Answer) {
        const scoreMatch = r3Answer.match(/SCORE:\s*(\d+)/i);
        if (scoreMatch) {
          r4Score = parseInt(scoreMatch[1], 10);
        }
      }

      // Dynamic deduction accuracy evaluation from string or columns if score not yet extracted
      if (!r4Score && (isCompleted || u.round4_report)) {
        if (u.primary_suspect === "Sara Khan" || r3Answer.includes("PRIMARY: Sara Khan")) r4Score += 10;
        else if (u.primary_suspect === "Kabir Malhotra" || r3Answer.includes("PRIMARY: Kabir Malhotra")) r4Score += 5;

        if (u.secondary_suspect === "Kabir Malhotra" || r3Answer.includes("SECONDARY: Kabir Malhotra")) r4Score += 5;
        else if (u.secondary_suspect === "Sara Khan" || r3Answer.includes("SECONDARY: Sara Khan")) r4Score += 3;

        if (r3Answer.toLowerCase().includes("espionage") || (u.primary_motive && u.primary_motive.toLowerCase().includes("espionage"))) r4Score += 3;
        if (r3Answer.toLowerCase().includes("ethics") || (u.secondary_motive && u.secondary_motive.toLowerCase().includes("ethics"))) r4Score += 2;
        if (r3Answer.toLowerCase().includes("voice") || r3Answer.toLowerCase().includes("ssd") || r3Answer.toLowerCase().includes("log")) r4Score += 3;

        r4Score = Math.min(25, r4Score);
      }

      // Default minimum completed score fallback
      if (!r4Score && isCompleted) {
        r4Score = 15;
      }

      const totalScore = r1Score + r2Score + r3Score + r4Score;

      // Status resolution
      let status = "Registered";
      let statusStep = 0;

      if (isCompleted) {
        status = "Completed";
        statusStep = 4;
      } else if (r3Answer === "__PROGRESS__:round4") {
        status = "Round 4";
        statusStep = 3;
      } else if (r3Answer === "__PROGRESS__:round3") {
        status = "Round 3";
        statusStep = 2;
      } else if (r3Answer === "__PROGRESS__:round2") {
        status = "Round 2";
        statusStep = 1;
      } else if (r3Answer === "__PROGRESS__:round1") {
        status = "Round 1";
        statusStep = 0;
      }

      // Robust extraction of Round 4 deduction fields (reads DB columns OR parses round3_answer string)
      let primarySuspect = u.primary_suspect || null;
      let primaryMotive = u.primary_motive || null;
      let secondarySuspect = u.secondary_suspect || null;
      let secondaryMotive = u.secondary_motive || null;
      let method = u.round4_method || null;
      let evidence = Array.isArray(u.round4_evidence) ? u.round4_evidence : (u.round4_evidence ? [u.round4_evidence] : null);
      let report = u.round4_report || null;

      if (r3Answer) {
        // Extract PRIMARY suspect & motive
        const primMatch = r3Answer.match(/\[PRIMARY:\s*([^()\]]+?)(?:\s*\(MOTIVE:\s*([^)]+)\))?\]/i);
        if (primMatch) {
          if (!primarySuspect && primMatch[1]) primarySuspect = primMatch[1].trim();
          if (!primaryMotive && primMatch[2]) primaryMotive = primMatch[2].trim();
        }

        // Extract SECONDARY suspect & motive
        const secMatch = r3Answer.match(/\[SECONDARY:\s*([^()\]]+?)(?:\s*\(MOTIVE:\s*([^)]+)\))?\]/i);
        if (secMatch) {
          if (!secondarySuspect && secMatch[1]) secondarySuspect = secMatch[1].trim();
          if (!secondaryMotive && secMatch[2]) secondaryMotive = secMatch[2].trim();
        }

        // Extract METHOD
        if (!method) {
          const methodMatch = r3Answer.match(/\[METHOD:\s*([^\]]+)\]/i);
          if (methodMatch && methodMatch[1]) method = methodMatch[1].trim();
        }

        // Extract EVIDENCE
        if (!evidence || evidence.length === 0) {
          const evMatch = r3Answer.match(/\[EVIDENCE:\s*([^\]]+)\]/i);
          if (evMatch && evMatch[1]) {
            evidence = evMatch[1].split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }

        // Extract WRITTEN REPORT / ANALYSIS
        if (!report) {
          const reportMatch = r3Answer.match(/\|\s*ANALYSIS:\s*(.*)/i);
          if (reportMatch && reportMatch[1]) {
            report = reportMatch[1].trim();
          }
        }
      }

      return {
        id: u.id,
        name: u.name || "Anonymous Investigator",
        email: u.email || "",
        round1_score: r1Score,
        round2_score: r2Score,
        round3_score: r3Score,
        round4_score: r4Score,
        total_score: totalScore,
        status,
        statusStep,
        primary_suspect: primarySuspect,
        primary_motive: primaryMotive,
        secondary_suspect: secondarySuspect,
        secondary_motive: secondaryMotive,
        round4_motive: primaryMotive ? `Primary: ${primaryMotive}${secondaryMotive ? ` | Secondary: ${secondaryMotive}` : ""}` : null,
        round4_method: method,
        round4_evidence: evidence,
        round4_report: report,
        created_at: u.created_at || null,
      };
    });

    // Sort by total_score descending
    processed.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      if (b.statusStep !== a.statusStep) {
        return b.statusStep - a.statusStep;
      }
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

    // Assign rank
    const leaderboard = processed.map((u, idx) => ({
      rank: idx + 1,
      ...u,
    }));

    // Stats calculations
    const totalUsers = leaderboard.length;
    const completedCount = leaderboard.filter((u) => u.status === "Completed").length;
    const inProgressCount = totalUsers - completedCount;
    const avgScore =
      totalUsers > 0
        ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.total_score, 0) / totalUsers)
        : 0;

    return NextResponse.json({
      users: leaderboard,
      stats: {
        totalUsers,
        completedCount,
        inProgressCount,
        avgScore,
      },
    });
  } catch (err) {
    console.error("Leaderboard route error:", err);
    return NextResponse.json(
      { error: "Failed to load admin leaderboard data." },
      { status: 500 }
    );
  }
}
