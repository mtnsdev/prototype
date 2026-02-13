"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Play,
    History,
    GitCompare,
    ListChecks,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    LayoutDashboard,
    Eye,
    X,
} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const API_BASE = "/api/admin/bulk-test";

const GEMINI_MODEL_OPTIONS = [
    { value: "gemini-2.5-pro", label: "gemini-2.5-pro" },
    { value: "gemini-2.0-flash", label: "gemini-2.0-flash" },
    { value: "gemini-3-pro-preview", label: "gemini-3-pro-preview"},
    { value: "gemini-3-flash-preview", label: "gemini-3-flash-preview"},
    { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    { value: "gemini-1.5-flash", label: "gemini-1.5-flash" },
] as const;

function getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
    };
}

type TabId = "run" | "history" | "compare" | "questions" | "dashboard";

type FeedbackSuggestion = {
    question_text: string;
    thumbs_up_pct: number;
    total_count: number;
    sample_message_id: number;
};

type BulkTestQuestion = {
    id: number;
    question: string;
    expected_answer: string | null;
    min_score: number;
    is_active: boolean;
    source: string | null;
    source_message_id: number | null;
    created_at: string;
    updated_at: string;
};

type BulkTestResult = {
    id: number;
    run_id: number;
    question_id: number;
    question_text?: string | null;
    answer?: string | null;
    citations?: unknown;
    can_answer?: boolean | null;
    response_time_ms?: number | null;
    quality_score?: number | null;
    score_breakdown?: Record<string, unknown> | null;
    passed: boolean;
    error?: string | null;
    regression_detected: boolean;
    previous_score?: number | null;
    created_at: string;
};

type BulkTestRun = {
    id: number;
    triggered_by_id: number | null;
    status: string;
    completed_count: number;
    total_count: number;
    rag_config_snapshot?: Record<string, unknown> | null;
    summary?: {
        passed?: number;
        failed?: number;
        avg_score?: number | null;
        duration_sec?: number;
        error?: string;
    } | null;
    task_id: string | null;
    model_name?: string | null;
    created_at: string;
    updated_at: string;
    results?: BulkTestResult[];
};

export default function BulkTestPage() {
    const [tab, setTab] = useState<TabId>("run");
    const [questions, setQuestions] = useState<BulkTestQuestion[]>([]);
    const [runs, setRuns] = useState<BulkTestRun[]>([]);
    const [runsTotal, setRunsTotal] = useState(0);
    const [runsPage, setRunsPage] = useState(1);
    const RUNS_PAGE_SIZE = 20;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Run test state
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState<{ completed_count: number; total_count: number; status: string } | null>(null);
    const [lastRun, setLastRun] = useState<BulkTestRun | null>(null);
    const [geminiModel, setGeminiModel] = useState("gemini-2.5-pro");

    // Compare state
    const [runA, setRunA] = useState<number | null>(null);
    const [runB, setRunB] = useState<number | null>(null);
    // Dashboard state
    const [dashboard, setDashboard] = useState<{
        latest_run: BulkTestRun | null;
        feedback_last_7_days: {
            total_with_feedback: number;
            thumbs_up_count: number;
            satisfaction_pct: number | null;
        } | null;
        divergence_alert: string | null;
        coverage: {
            feedback_questions_count: number;
            covered_count: number;
            coverage_pct: number | null;
        } | null;
    } | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    const [compareData, setCompareData] = useState<{
        run_a: BulkTestRun;
        run_b: BulkTestRun;
        rows: Array<{
            question_id: number;
            question_text?: string | null;
            expected_answer?: string | null;
            result_a?: BulkTestResult | null;
            result_b?: BulkTestResult | null;
        }>;
    } | null>(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareDetailRow, setCompareDetailRow] = useState<number | null>(null);
    const [runResultDetailId, setRunResultDetailId] = useState<number | null>(null);
    const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);

    // Question form
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formQuestion, setFormQuestion] = useState("");
    const [formExpected, setFormExpected] = useState("");
    const [formMinScore, setFormMinScore] = useState(7);
    const [saving, setSaving] = useState(false);
    const [suggestions, setSuggestions] = useState<FeedbackSuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [addingFromFeedback, setAddingFromFeedback] = useState<number | null>(null);

    const fetchQuestions = useCallback(async () => {
        try {
            const r = await fetch(`${API_BASE}/questions?active_only=false&limit=500`, { headers: getAuthHeaders() });
            if (!r.ok) throw new Error("Failed to fetch questions");
            const data = await r.json();
            setQuestions(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load questions");
        }
    }, []);

    const fetchSuggestions = useCallback(async () => {
        setSuggestionsLoading(true);
        try {
            const r = await fetch(`${API_BASE}/suggestions?min_total=5&max_satisfaction_pct=70&limit=20`, {
                headers: getAuthHeaders(),
            });
            if (!r.ok) throw new Error("Failed to fetch suggestions");
            const data = await r.json();
            setSuggestions(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load suggestions");
        } finally {
            setSuggestionsLoading(false);
        }
    }, []);

    const fetchRuns = useCallback(async (page: number, pageSize: number) => {
        try {
            const offset = (page - 1) * pageSize;
            const r = await fetch(`${API_BASE}/runs?limit=${pageSize}&offset=${offset}`, { headers: getAuthHeaders() });
            if (!r.ok) throw new Error("Failed to fetch runs");
            const data = await r.json();
            setRuns(data.runs ?? []);
            setRunsTotal(data.total ?? 0);
            setRunsPage(page);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load runs");
        }
    }, []);

    const fetchDashboard = useCallback(async () => {
        setDashboardLoading(true);
        try {
            const r = await fetch(`${API_BASE}/quality-dashboard`, { headers: getAuthHeaders() });
            if (!r.ok) throw new Error("Failed to fetch dashboard");
            const data = await r.json();
            setDashboard(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load dashboard");
        } finally {
            setDashboardLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "questions") {
            fetchQuestions();
            fetchSuggestions();
        }
        if (tab === "run") {
            fetchQuestions();
        }
        if (tab === "history") fetchRuns(runsPage, RUNS_PAGE_SIZE);
        if (tab === "run" || tab === "compare") fetchRuns(1, 100);
        if (tab === "dashboard") fetchDashboard();
    }, [tab, runsPage, fetchQuestions, fetchRuns, fetchDashboard, fetchSuggestions]);

    const startRun = async () => {
        setError(null);
        setRunning(true);
        setProgress(null);
        setLastRun(null);
        try {
            const r = await fetch(`${API_BASE}/runs`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ gemini_model: geminiModel }),
            });
            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to start run");
            }
            const data = await r.json();
            setProgress({ completed_count: 0, total_count: 0, status: "pending" });
            const poll = async () => {
                const pr = await fetch(`${API_BASE}/runs/${data.run_id}/progress`, { headers: getAuthHeaders() });
                if (!pr.ok) return;
                const prog = await pr.json();
                setProgress({
                    completed_count: prog.completed_count,
                    total_count: prog.total_count,
                    status: prog.status,
                });
                if (prog.status === "completed" || prog.status === "failed") {
                    setRunning(false);
                    const runDetail = await fetch(`${API_BASE}/runs/${data.run_id}`, { headers: getAuthHeaders() });
                    if (runDetail.ok) setLastRun(await runDetail.json());
                    fetchRuns(1, 100);
                    return;
                }
                setTimeout(poll, 2500);
            };
            setTimeout(poll, 1500);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to start run");
            setRunning(false);
        }
    };

    const loadCompare = async () => {
        if (runA == null || runB == null) return;
        console.log("type", typeof runA, typeof runB);
        setCompareLoading(true);
        setError(null);
        try {
            const r = await fetch(
                `${API_BASE}/runs/compare?run_a=${runA}&run_b=${runB}`,
                { headers: getAuthHeaders() }
            );
            if (!r.ok) throw new Error("Failed to load compare");
            const data = await r.json();
            setCompareData(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Compare failed");
        } finally {
            setCompareLoading(false);
        }
    };

    const saveQuestion = async () => {
        if (!formQuestion.trim()) return;
        setSaving(true);
        setError(null);
        try {
            if (editingId != null) {
                const r = await fetch(`${API_BASE}/questions/${editingId}`, {
                    method: "PATCH",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        question: formQuestion.trim(),
                        expected_answer: formExpected.trim() || null,
                        min_score: formMinScore,
                    }),
                });
                if (!r.ok) throw new Error("Update failed");
            } else {
                const r = await fetch(`${API_BASE}/questions`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        question: formQuestion.trim(),
                        expected_answer: formExpected.trim() || null,
                        min_score: formMinScore,
                    }),
                });
                if (!r.ok) throw new Error("Create failed");
            }
            setEditingId(null);
            setFormQuestion("");
            setFormExpected("");
            setFormMinScore(7);
            fetchQuestions();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const deleteQuestion = async (id: number): Promise<boolean> => {
        try {
            const r = await fetch(`${API_BASE}/questions/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!r.ok) throw new Error("Delete failed");
            setError(null);
            fetchQuestions();
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : "Delete failed");
            return false;
        }
    };

    const addFromFeedback = async (sampleMessageId: number) => {
        setAddingFromFeedback(sampleMessageId);
        setError(null);
        try {
            const r = await fetch(`${API_BASE}/questions/from-feedback`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ message_id: sampleMessageId }),
            });
            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to add from feedback");
            }
            fetchQuestions();
            setSuggestions((prev) => prev.filter((s) => s.sample_message_id !== sampleMessageId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Add from feedback failed");
        } finally {
            setAddingFromFeedback(null);
        }
    };

    const tabs: { id: TabId; label: string; icon: typeof Play }[] = [
        { id: "dashboard", label: "Quality Dashboard", icon: LayoutDashboard },
        { id: "run", label: "Run Test", icon: Play },
        { id: "history", label: "Run History", icon: History },
        { id: "compare", label: "Compare Runs", icon: GitCompare },
        { id: "questions", label: "Question Management", icon: ListChecks },
    ];

    return (
        <div className="space-y-6">
            <div className="flex gap-2 flex-wrap border-b border-[rgba(255,255,255,0.08)] pb-4">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={[
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all",
                                tab === t.id
                                    ? "bg-[rgba(255,255,255,0.08)] text-[#F5F5F5]"
                                    : "text-[rgba(245,245,245,0.5)] hover:bg-[rgba(255,255,255,0.04)]",
                            ].join(" ")}
                        >
                            <Icon size={16} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === "dashboard" && (
                <div className="space-y-6">
                    {dashboardLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                        </div>
                    ) : (
                        <>
                            {dashboard?.divergence_alert && (
                                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-amber-400 shrink-0" />
                                    <span className="text-[14px] text-amber-200">{dashboard.divergence_alert}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6">
                                    <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-4">Latest Bulk Test Run</h3>
                                    {dashboard?.latest_run ? (
                                        <div className="space-y-2 text-[14px]">
                                            <p className="text-[rgba(245,245,245,0.8)]">
                                                Run #{dashboard.latest_run.id} · {new Date(dashboard.latest_run.created_at).toLocaleString()}
                                                {dashboard.latest_run.model_name && (
                                                    <span className="text-[rgba(245,245,245,0.6)]"> · {dashboard.latest_run.model_name}</span>
                                                )}
                                            </p>
                                            <p>
                                                <span className="text-green-400">{dashboard.latest_run.summary?.passed ?? 0} passed</span>
                                                {" / "}
                                                <span className="text-red-400">{dashboard.latest_run.summary?.failed ?? 0} failed</span>
                                            </p>
                                            {dashboard.latest_run.summary?.avg_score != null && (
                                                <p className="text-[rgba(245,245,245,0.8)]">Average score: {dashboard.latest_run.summary.avg_score}/10</p>
                                            )}
                                            {dashboard.latest_run.summary?.duration_sec != null && (
                                                <p className="text-[rgba(245,245,245,0.6)]">Duration: {dashboard.latest_run.summary.duration_sec}s</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[14px] text-[rgba(245,245,245,0.5)]">No completed run yet.</p>
                                    )}
                                </div>
                                <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6">
                                    <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-4">User Feedback (last 7 days)</h3>
                                    {dashboard?.feedback_last_7_days ? (
                                        <div className="space-y-2 text-[14px]">
                                            <p className="text-[rgba(245,245,245,0.8)]">
                                                Responses with feedback: {dashboard.feedback_last_7_days.total_with_feedback}
                                            </p>
                                            <p className="text-[rgba(245,245,245,0.8)]">
                                                Thumbs up: {dashboard.feedback_last_7_days.thumbs_up_count}
                                            </p>
                                            <p>
                                                Satisfaction:{" "}
                                                {dashboard.feedback_last_7_days.satisfaction_pct != null
                                                    ? `${dashboard.feedback_last_7_days.satisfaction_pct}%`
                                                    : "—"}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[14px] text-[rgba(245,245,245,0.5)]">No feedback data.</p>
                                    )}
                                </div>
                                {dashboard?.coverage != null && (
                                    <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6 md:col-span-2">
                                        <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-4">Test coverage</h3>
                                        <p className="text-[14px] text-[rgba(245,245,245,0.8)]">
                                            {dashboard.coverage.covered_count} of {dashboard.coverage.feedback_questions_count} distinct user questions (with feedback) are covered by bulk tests
                                            {dashboard.coverage.coverage_pct != null && ` (${dashboard.coverage.coverage_pct}%)`}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.3)] p-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-400" />
                    <span className="text-[14px] text-[#C87A7A]">{error}</span>
                </div>
            )}

            {tab === "run" && (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6">
                        <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-2">Run Bulk Test</h3>
                        <p className="text-[14px] text-[rgba(245,245,245,0.6)] mb-4">
                            Execute all active questions through the RAG pipeline and score answers (1–10). Results are stored and regressions flagged.
                        </p>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <label className="text-[14px] font-medium text-[rgba(245,245,245,0.8)]">
                                Gemini model
                            </label>
                            <Select
                                value={geminiModel}
                                onValueChange={setGeminiModel}
                                disabled={running}
                            >
                                <SelectTrigger className="w-[200px] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F5F5] focus-visible:ring-amber-500/50">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GEMINI_MODEL_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <button
                            onClick={startRun}
                            disabled={running || questions.filter((q) => q.is_active).length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {running ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Running… {progress != null ? `${progress.completed_count}/${progress.total_count}` : ""}
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    Run Bulk Test
                                </>
                            )}
                        </button>
                        {running && progress != null && progress.total_count > 0 && (
                            <div className="mt-4">
                                <div className="h-2 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden max-w-xs">
                                    <div
                                        className="h-full bg-amber-500/60 transition-all duration-500"
                                        style={{
                                            width: `${(progress.completed_count / progress.total_count) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {lastRun && (
                        <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between flex-wrap gap-2">
                                <h3 className="text-[16px] font-semibold text-[#F5F5F5]">Last Run Results</h3>
                                <span className="text-[13px] text-[rgba(245,245,245,0.5)]">
                                    {lastRun.model_name && <span>{lastRun.model_name} · </span>}
                                    {lastRun.summary?.passed ?? 0} passed / {lastRun.summary?.failed ?? 0} failed
                                    {lastRun.summary?.avg_score != null && ` · Avg ${lastRun.summary.avg_score}/10`}
                                    {lastRun.summary?.duration_sec != null && ` · ${lastRun.summary.duration_sec}s`}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[14px]">
                                    <thead>
                                        <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Question</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-20">Score</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Status</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Regression</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(lastRun.results ?? []).map((res) => (
                                            <tr key={res.id} className="border-b border-[rgba(255,255,255,0.06)]">
                                                <td className="p-3 text-[#F5F5F5] max-w-md truncate">{res.question_text ?? `Q#${res.question_id}`}</td>
                                                <td className="p-3">{res.quality_score ?? "—"}</td>
                                                <td className="p-3">
                                                    {res.passed ? (
                                                        <span className="inline-flex items-center gap-1 text-green-400">
                                                            <CheckCircle2 size={14} /> Pass
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-400">
                                                            <XCircle size={14} /> Fail
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {res.regression_detected ? (
                                                        <span className="text-amber-400">Yes</span>
                                                    ) : (
                                                        <span className="text-[rgba(245,245,245,0.4)]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setRunResultDetailId(res.id)}
                                                        title="More detail"
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)]"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Run result detail modal */}
                    {lastRun && runResultDetailId !== null && (() => {
                        const res = (lastRun.results ?? []).find((r) => r.id === runResultDetailId);
                        if (!res) return null;
                        const reasoning = res.score_breakdown && typeof res.score_breakdown === "object" && "reasoning" in res.score_breakdown
                            ? String((res.score_breakdown as { reasoning?: string }).reasoning ?? "")
                            : "";
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setRunResultDetailId(null)}>
                                <div className="rounded-2xl bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
                                        <h4 className="text-[16px] font-semibold text-[#F5F5F5]">Test detail</h4>
                                        <button type="button" onClick={() => setRunResultDetailId(null)} className="p-1.5 rounded-lg text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#F5F5F5]">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 text-[14px]">
                                        <div>
                                            <div className="text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Question</div>
                                            <p className="text-[#F5F5F5] whitespace-pre-wrap">{res.question_text ?? `Q#${res.question_id}`}</p>
                                        </div>
                                        <div>
                                            <div className="text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Generated answer</div>
                                            <p className="text-[#F5F5F5] whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{res.answer ?? "—"}</p>
                                        </div>
                                        {reasoning && (
                                            <div>
                                                <div className="text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Reasoning</div>
                                                <p className="text-[rgba(245,245,245,0.8)] whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{reasoning}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-[13px]">
                                            <span className="text-[rgba(245,245,245,0.6)]">Score: <span className="text-[#F5F5F5]">{res.quality_score ?? "—"}</span></span>
                                            <span className="text-[rgba(245,245,245,0.6)]">Status: {res.passed ? <span className="text-green-400">Pass</span> : <span className="text-red-400">Fail</span>}</span>
                                            {res.regression_detected && res.previous_score != null && (
                                                <span className="text-amber-400">Regression (previous score: {res.previous_score})</span>
                                            )}
                                        </div>
                                        {res.error && (
                                            <p className="text-[#C87A7A] text-[13px]">{res.error}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {tab === "history" && (
                <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                    <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                        <h3 className="text-[16px] font-semibold text-[#F5F5F5]">Run History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[14px]">
                            <thead>
                                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Run #</th>
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Date</th>
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Model</th>
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Status</th>
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Passed / Failed</th>
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Avg Score</th>
                                    <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map((run) => (
                                    <tr
                                        key={run.id}
                                        className="border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                                    >
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                className="text-amber-400 hover:underline text-left"
                                                onClick={async () => {
                                                    try {
                                                        const r = await fetch(`${API_BASE}/runs/${run.id}`, {
                                                            headers: getAuthHeaders(),
                                                        });
                                                        if (r.ok) {
                                                            const data = await r.json();
                                                            setLastRun(data);
                                                            setTab("run");
                                                        }
                                                    } catch {
                                                        setError("Failed to load run details");
                                                    }
                                                }}
                                            >
                                                #{run.id}
                                            </button>
                                        </td>
                                        <td className="p-3 text-[rgba(245,245,245,0.8)]">
                                            {new Date(run.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-[rgba(245,245,245,0.7)]">
                                            {run.model_name ?? "—"}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={
                                                    run.status === "completed"
                                                        ? "text-green-400"
                                                        : run.status === "failed"
                                                          ? "text-red-400"
                                                          : "text-[rgba(245,245,245,0.7)]"
                                                }
                                            >
                                                {run.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {run.summary?.passed ?? 0} / {run.summary?.failed ?? 0}
                                        </td>
                                        <td className="p-3">{run.summary?.avg_score ?? "—"}</td>
                                        <td className="p-3">{run.summary?.duration_sec != null ? `${run.summary.duration_sec}s` : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {runs.length === 0 && (
                        <div className="p-8 text-center text-[rgba(245,245,245,0.5)] text-[14px]">No runs yet. Start one from the Run Test tab.</div>
                    )}
                    {runsTotal > 0 && (
                        <div className="p-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4 flex-wrap">
                            <span className="text-[13px] text-[rgba(245,245,245,0.6)]">
                                Showing {(runsPage - 1) * RUNS_PAGE_SIZE + 1}–{Math.min(runsPage * RUNS_PAGE_SIZE, runsTotal)} of {runsTotal}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRunsPage((p) => Math.max(1, p - 1))}
                                    disabled={runsPage <= 1}
                                    className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:pointer-events-none text-[13px]"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRunsPage((p) => p + 1)}
                                    disabled={runsPage * RUNS_PAGE_SIZE >= runsTotal}
                                    className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:pointer-events-none text-[13px]"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {tab === "compare" && (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6">
                        <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-4">Compare Two Runs</h3>
                        <div className="compare-runs-dropdowns flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Run A</label>
                                <Select
                                    value={runA != null ? String(runA) : "__none__"}
                                    onValueChange={(v) => setRunA(v === "__none__" ? null : Number(v))}
                                >
                                    <SelectTrigger className="min-w-[200px] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F5F5] focus-visible:ring-amber-500/50">
                                        <SelectValue placeholder="Select run" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Select run</SelectItem>
                                        {runs.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                #{r.id} – {new Date(r.created_at).toLocaleDateString()}
                                                {r.model_name ? ` (${r.model_name})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Run B</label>
                                <Select
                                    value={runB != null ? String(runB) : "__none__"}
                                    onValueChange={(v) => setRunB(v === "__none__" ? null : Number(v))}
                                >
                                    <SelectTrigger className="min-w-[200px] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F5F5] focus-visible:ring-amber-500/50">
                                        <SelectValue placeholder="Select run" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Select run</SelectItem>
                                        {runs.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                #{r.id} – {new Date(r.created_at).toLocaleDateString()}
                                                {r.model_name ? ` (${r.model_name})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <button
                                onClick={loadCompare}
                                disabled={compareLoading || runA == null || runB == null || runA === runB}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50"
                            >
                                {compareLoading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
                                Compare
                            </button>
                        </div>
                    </div>

                    {compareData && (
                        <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex flex-wrap gap-4 text-[14px]">
                                <span className="text-[rgba(245,245,245,0.6)]">
                                    Run A: #{compareData.run_a.id}
                                    {compareData.run_a.model_name ? ` (${compareData.run_a.model_name})` : ""}
                                    {" "}({compareData.run_a.summary?.passed ?? 0}/{compareData.run_a.summary?.failed ?? 0}, avg {compareData.run_a.summary?.avg_score ?? "—"})
                                </span>
                                <span className="text-[rgba(245,245,245,0.6)]">
                                    Run B: #{compareData.run_b.id}
                                    {compareData.run_b.model_name ? ` (${compareData.run_b.model_name})` : ""}
                                    {" "}({compareData.run_b.summary?.passed ?? 0}/{compareData.run_b.summary?.failed ?? 0}, avg {compareData.run_b.summary?.avg_score ?? "—"})
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[14px]">
                                    <thead>
                                        <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Question</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-20">Score A</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-20">Score B</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Pass A</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Pass B</th>
                                            <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compareData.rows.map((row, i) => (
                                            <tr key={row.question_id + "-" + i} className="border-b border-[rgba(255,255,255,0.06)]">
                                                <td className="p-3 text-[#F5F5F5] max-w-xs truncate">{row.question_text ?? `Q#${row.question_id}`}</td>
                                                <td className="p-3">{row.result_a?.quality_score ?? "—"}</td>
                                                <td className="p-3">{row.result_b?.quality_score ?? "—"}</td>
                                                <td className="p-3">
                                                    {row.result_a ? (row.result_a.passed ? "Pass" : "Fail") : "—"}
                                                </td>
                                                <td className="p-3">
                                                    {row.result_b ? (row.result_b.passed ? "Pass" : "Fail") : "—"}
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCompareDetailRow(i)}
                                                        title="More detail"
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)]"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Row detail modal */}
                    {compareData && compareDetailRow !== null && compareData.rows[compareDetailRow] && (() => {
                        const row = compareData.rows[compareDetailRow];
                        const reasoningA = row.result_a?.score_breakdown && typeof row.result_a.score_breakdown === "object" && "reasoning" in row.result_a.score_breakdown
                            ? String((row.result_a.score_breakdown as { reasoning?: string }).reasoning ?? "")
                            : "";
                        const reasoningB = row.result_b?.score_breakdown && typeof row.result_b.score_breakdown === "object" && "reasoning" in row.result_b.score_breakdown
                            ? String((row.result_b.score_breakdown as { reasoning?: string }).reasoning ?? "")
                            : "";
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setCompareDetailRow(null)}>
                                <div className="rounded-2xl bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
                                        <h4 className="text-[16px] font-semibold text-[#F5F5F5]">Test detail</h4>
                                        <button type="button" onClick={() => setCompareDetailRow(null)} className="p-1.5 rounded-lg text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#F5F5F5]">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 text-[14px]">
                                        <div>
                                            <div className="text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Question</div>
                                            <p className="text-[#F5F5F5] whitespace-pre-wrap">{row.question_text ?? `Q#${row.question_id}`}</p>
                                        </div>
                                        <div>
                                            <div className="text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Expected / sample answer</div>
                                            <p className="text-[#F5F5F5] whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{row.expected_answer ?? "—"}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                                                <div className="px-3 py-2 bg-[rgba(255,255,255,0.06)] text-[12px] font-medium text-[rgba(245,245,245,0.7)] border-b border-[rgba(255,255,255,0.08)]">
                                                    Run A {row.result_a != null && `· Score ${row.result_a.quality_score ?? "—"} · ${row.result_a.passed ? "Pass" : "Fail"}`}
                                                </div>
                                                <div className="p-3 space-y-3">
                                                    <div>
                                                        <div className="text-[11px] text-[rgba(245,245,245,0.5)] uppercase tracking-wide mb-1">Generated answer</div>
                                                        <p className="text-[#F5F5F5] whitespace-pre-wrap text-[13px]">{row.result_a?.answer ?? "—"}</p>
                                                    </div>
                                                    {reasoningA && (
                                                        <div>
                                                            <div className="text-[11px] text-[rgba(245,245,245,0.5)] uppercase tracking-wide mb-1">Reasoning</div>
                                                            <p className="text-[rgba(245,245,245,0.8)] whitespace-pre-wrap text-[13px]">{reasoningA}</p>
                                                        </div>
                                                    )}
                                                    {row.result_a?.error && (
                                                        <p className="text-[#C87A7A] text-[13px]">{row.result_a.error}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                                                <div className="px-3 py-2 bg-[rgba(255,255,255,0.06)] text-[12px] font-medium text-[rgba(245,245,245,0.7)] border-b border-[rgba(255,255,255,0.08)]">
                                                    Run B {row.result_b != null && `· Score ${row.result_b.quality_score ?? "—"} · ${row.result_b.passed ? "Pass" : "Fail"}`}
                                                </div>
                                                <div className="p-3 space-y-3">
                                                    <div>
                                                        <div className="text-[11px] text-[rgba(245,245,245,0.5)] uppercase tracking-wide mb-1">Generated answer</div>
                                                        <p className="text-[#F5F5F5] whitespace-pre-wrap text-[13px]">{row.result_b?.answer ?? "—"}</p>
                                                    </div>
                                                    {reasoningB && (
                                                        <div>
                                                            <div className="text-[11px] text-[rgba(245,245,245,0.5)] uppercase tracking-wide mb-1">Reasoning</div>
                                                            <p className="text-[rgba(245,245,245,0.8)] whitespace-pre-wrap text-[13px]">{reasoningB}</p>
                                                        </div>
                                                    )}
                                                    {row.result_b?.error && (
                                                        <p className="text-[#C87A7A] text-[13px]">{row.result_b.error}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {tab === "questions" && (
                <div className="space-y-6">
                    {suggestions.length > 0 && (
                        <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6">
                            <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-2">Suggestions from user feedback (&lt;70% satisfaction)</h3>
                            <p className="text-[14px] text-[rgba(245,245,245,0.6)] mb-4">
                                Add these real user questions to the bulk test suite with one click.
                            </p>
                            {suggestionsLoading ? (
                                <div className="flex items-center gap-2 text-[14px] text-[rgba(245,245,245,0.5)]">
                                    <Loader2 size={16} className="animate-spin" /> Loading suggestions…
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {suggestions.map((s) => (
                                        <li
                                            key={s.sample_message_id}
                                            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[14px] text-[#F5F5F5] truncate">{s.question_text}</p>
                                                <p className="text-[12px] text-[rgba(245,245,245,0.5)]">
                                                    {s.thumbs_up_pct}% thumbs up · {s.total_count} responses
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => addFromFeedback(s.sample_message_id)}
                                                disabled={addingFromFeedback === s.sample_message_id}
                                                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 text-[13px]"
                                            >
                                                {addingFromFeedback === s.sample_message_id ? "Adding…" : "Add to bulk test"}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-6">
                        <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-2">
                            {editingId != null ? "Edit Question" : "Add Question"}
                        </h3>
                        <div className="space-y-3 max-w-2xl">
                            <div>
                                <label className="block text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Question</label>
                                <input
                                    value={formQuestion}
                                    onChange={(e) => setFormQuestion(e.target.value)}
                                    placeholder="e.g. What is the policy on annual leave?"
                                    className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[14px] text-[#F5F5F5]"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Expected answer / criteria (optional)</label>
                                <textarea
                                    value={formExpected}
                                    onChange={(e) => setFormExpected(e.target.value)}
                                    placeholder="Optional: used by LLM to score the answer"
                                    rows={2}
                                    className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[14px] text-[#F5F5F5]"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] text-[rgba(245,245,245,0.5)] mb-1">Min score (1–10) to pass</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formMinScore}
                                    onChange={(e) => setFormMinScore(Number(e.target.value))}
                                    className="w-20 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[14px] text-[#F5F5F5]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={saveQuestion}
                                    disabled={saving || !formQuestion.trim()}
                                    className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50"
                                >
                                    {saving ? "Saving…" : editingId != null ? "Update" : "Add"}
                                </button>
                                {editingId != null && (
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormQuestion("");
                                            setFormExpected("");
                                            setFormMinScore(7);
                                        }}
                                        className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.8)]"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                            <h3 className="text-[16px] font-semibold text-[#F5F5F5]">Questions ({questions.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[14px]">
                                <thead>
                                    <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                        <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium">Question</th>
                                        <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-24">Min score</th>
                                        <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-20">Active</th>
                                        <th className="p-3 text-[rgba(245,245,245,0.5)] font-medium w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q) => (
                                        <tr key={q.id} className="border-b border-[rgba(255,255,255,0.06)]">
                                            <td className="p-3 text-[#F5F5F5] max-w-md">{q.question}</td>
                                            <td className="p-3">{q.min_score}</td>
                                            <td className="p-3">{q.is_active ? "Yes" : "No"}</td>
                                            <td className="p-3 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(q.id);
                                                        setFormQuestion(q.question);
                                                        setFormExpected(q.expected_answer ?? "");
                                                        setFormMinScore(q.min_score);
                                                    }}
                                                    className="text-amber-400 hover:underline text-[13px]"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteQuestionId(q.id)}
                                                    className="text-red-400 hover:underline text-[13px]"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {questions.length === 0 && (
                            <div className="p-8 text-center text-[rgba(245,245,245,0.5)] text-[14px]">
                                No questions yet. Add one above to get started.
                            </div>
                        )}
                    </div>

                    {/* Delete question confirmation modal */}
                    {deleteQuestionId !== null && (() => {
                        const q = questions.find((x) => x.id === deleteQuestionId);
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDeleteQuestionId(null)}>
                                <div className="rounded-2xl bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                                    <h4 className="text-[16px] font-semibold text-[#F5F5F5] mb-2">Delete question?</h4>
                                    {q && (
                                        <p className="text-[14px] text-[rgba(245,245,245,0.8)] mb-4 line-clamp-3">{q.question}</p>
                                    )}
                                    <p className="text-[13px] text-[rgba(245,245,245,0.5)] mb-4">This cannot be undone.</p>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteQuestionId(null)}
                                            className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)] text-[14px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const ok = await deleteQuestion(deleteQuestionId);
                                                if (ok) setDeleteQuestionId(null);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-[14px]"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
