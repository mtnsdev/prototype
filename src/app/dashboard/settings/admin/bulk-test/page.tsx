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
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    listTableClass,
    listTheadRowClass,
    listTbodyRowClass,
    listThClass,
} from "@/lib/list-ui";

const API_BASE = "/api/admin/bulk-test";

const GEMINI_MODEL_OPTIONS = [
    { value: "gemini-2.5-pro", label: "gemini-2.5-pro" },
    { value: "gemini-2.5-flash", label: "gemini-2.5-flash" },
    { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite" },
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

type TabId = "run" | "history" | "compare" | "questions" | "dashboard" | "chat-history";

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

type ChatMessagePair = {
    user_message_id: number;
    assistant_message_id: number;
    question: string;
    answer: string;
    feedback_rating: number | null;
    feedback_comment: string | null;
    citations: unknown;
    conflicts: unknown;
    can_answer: boolean | null;
    session_id: number;
    user_email: string | null;
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
    const [error, setError] = useState<string | null>(null);

    // Run test state
    const [running, setRunning] = useState(false);
    const [, _setCurrentRunId] = useState<number | null>(null);
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
    const [latestRunForQuestions, setLatestRunForQuestions] = useState<BulkTestRun | null>(null);
    const [questionDetailId, setQuestionDetailId] = useState<number | null>(null);

    // Chat History state
    const [chatMessages, setChatMessages] = useState<ChatMessagePair[]>([]);
    const [chatMessagesLoading, setChatMessagesLoading] = useState(false);
    const [chatMessagesPage, setChatMessagesPage] = useState(1);
    const [chatMessagesTotal, setChatMessagesTotal] = useState(0);
    const CHAT_MESSAGES_PAGE_SIZE = 50;
    const [chatMessageDetailIndex, setChatMessageDetailIndex] = useState<number | null>(null);

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

    const fetchLatestRunForQuestions = useCallback(async () => {
        try {
            const listRes = await fetch(`${API_BASE}/runs?limit=1&offset=0`, { headers: getAuthHeaders() });
            if (!listRes.ok) return;
            const listData = await listRes.json();
            const runs = listData.runs ?? [];
            const latest = runs.find((r: BulkTestRun) => r.status === "completed");
            if (!latest) return;
            const detailRes = await fetch(`${API_BASE}/runs/${latest.id}`, { headers: getAuthHeaders() });
            if (!detailRes.ok) return;
            const runDetail = await detailRes.json();
            setLatestRunForQuestions(runDetail);
        } catch {
            // Ignore - latest run is optional for questions tab
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

    const fetchChatMessages = useCallback(async (page: number) => {
        setChatMessagesLoading(true);
        try {
            const skip = (page - 1) * CHAT_MESSAGES_PAGE_SIZE;
            const r = await fetch(`${API_BASE}/chat-messages?skip=${skip}&limit=${CHAT_MESSAGES_PAGE_SIZE}`, {
                headers: getAuthHeaders(),
            });
            if (!r.ok) throw new Error("Failed to fetch chat messages");
            const data = await r.json();
            setChatMessages(data.items ?? []);
            setChatMessagesTotal(data.total ?? 0);
            setChatMessagesPage(page);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load chat messages");
        } finally {
            setChatMessagesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "questions") {
            fetchQuestions();
            fetchSuggestions();
            fetchLatestRunForQuestions();
        }
        if (tab === "run") {
            fetchQuestions();
        }
        if (tab === "chat-history") {
            fetchChatMessages(1);
        }
        if (tab === "history") fetchRuns(runsPage, RUNS_PAGE_SIZE);
        if (tab === "run" || tab === "compare") fetchRuns(1, 100);
        if (tab === "dashboard") fetchDashboard();
    }, [tab, runsPage, fetchQuestions, fetchRuns, fetchDashboard, fetchSuggestions, fetchLatestRunForQuestions, fetchChatMessages]);

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
        { id: "chat-history", label: "Chat History", icon: MessageSquare },
    ];

    return (
        <div className="space-y-6">
            <div className="flex gap-2 flex-wrap border-b border-border pb-4">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <Button
                            key={t.id}
                            variant="ghost"
                            onClick={() => setTab(t.id)}
                            className={`gap-2 font-medium ${tab === t.id ? "bg-[rgba(255,255,255,0.08)] text-foreground" : "text-muted-foreground/75 hover:bg-[rgba(255,255,255,0.04)]"}`}
                        >
                            <Icon size={16} />
                            {t.label}
                        </Button>
                    );
                })}
            </div>

            {tab === "dashboard" && (
                <div className="space-y-6">
                    {dashboardLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-muted-foreground/55" />
                        </div>
                    ) : (
                        <>
                            {dashboard?.divergence_alert && (
                                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-[var(--color-warning)] shrink-0" />
                                    <span className="text-base text-amber-200">{dashboard.divergence_alert}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-2xl bg-card border border-border p-6">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Latest Bulk Test Run</h3>
                                    {dashboard?.latest_run ? (
                                        <div className="space-y-2 text-base">
                                            <p className="text-muted-foreground">
                                                Run #{dashboard.latest_run.id} · {new Date(dashboard.latest_run.created_at).toLocaleString()}
                                                {dashboard.latest_run.model_name && (
                                                    <span className="text-muted-foreground"> · {dashboard.latest_run.model_name}</span>
                                                )}
                                            </p>
                                            <p>
                                                <span className="text-green-400">{dashboard.latest_run.summary?.passed ?? 0} passed</span>
                                                {" / "}
                                                <span className="text-red-400">{dashboard.latest_run.summary?.failed ?? 0} failed</span>
                                            </p>
                                            {dashboard.latest_run.summary?.avg_score != null && (
                                                <p className="text-muted-foreground">Average score: {dashboard.latest_run.summary.avg_score}/10</p>
                                            )}
                                            {dashboard.latest_run.summary?.duration_sec != null && (
                                                <p className="text-muted-foreground">Duration: {dashboard.latest_run.summary.duration_sec}s</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-base text-muted-foreground/75">No completed run yet.</p>
                                    )}
                                </div>
                                <div className="rounded-2xl bg-card border border-border p-6">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">User Feedback (last 7 days)</h3>
                                    {dashboard?.feedback_last_7_days ? (
                                        <div className="space-y-2 text-base">
                                            <p className="text-muted-foreground">
                                                Responses with feedback: {dashboard.feedback_last_7_days.total_with_feedback}
                                            </p>
                                            <p className="text-muted-foreground">
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
                                        <p className="text-base text-muted-foreground/75">No feedback data.</p>
                                    )}
                                </div>
                                {dashboard?.coverage != null && (
                                    <div className="rounded-2xl bg-card border border-border p-6 md:col-span-2">
                                        <h3 className="text-lg font-semibold text-foreground mb-4">Test coverage</h3>
                                        <p className="text-base text-muted-foreground">
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
                    <span className="text-base text-[var(--color-error)]">{error}</span>
                </div>
            )}

            {tab === "run" && (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-card border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Run Bulk Test</h3>
                        <p className="text-base text-muted-foreground mb-4">
                            Execute all active questions through the RAG pipeline and score answers (1–10). Results are stored and regressions flagged.
                        </p>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <label className="text-base font-medium text-muted-foreground">
                                Gemini model
                            </label>
                            <Select
                                value={geminiModel}
                                onValueChange={setGeminiModel}
                                disabled={running}
                            >
                                <SelectTrigger className="w-[200px] bg-[rgba(255,255,255,0.06)] border-input text-foreground focus-visible:ring-amber-500/50">
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
                        <Button
                            onClick={startRun}
                            disabled={running || questions.filter((q) => q.is_active).length === 0}
                            className="gap-2 bg-amber-500/20 text-[var(--color-warning)] border-amber-500/30 hover:bg-amber-500/30"
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
                        </Button>
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
                        <div className="rounded-2xl bg-card border border-border overflow-hidden">
                            <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                                <h3 className="text-lg font-semibold text-foreground">Last Run Results</h3>
                                <span className="text-compact text-muted-foreground/75">
                                    {lastRun.model_name && <span>{lastRun.model_name} · </span>}
                                    {lastRun.summary?.passed ?? 0} passed / {lastRun.summary?.failed ?? 0} failed
                                    {lastRun.summary?.avg_score != null && ` · Avg ${lastRun.summary.avg_score}/10`}
                                    {lastRun.summary?.duration_sec != null && ` · ${lastRun.summary.duration_sec}s`}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className={cn(listTableClass(), "text-left text-base")}>
                                    <thead>
                                        <tr className={listTheadRowClass}>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Question</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Score</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Status</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Regression</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(lastRun.results ?? []).map((res) => (
                                            <tr key={res.id} className={listTbodyRowClass}>
                                                <td className="p-3 text-foreground max-w-md truncate">{res.question_text ?? `Q#${res.question_id}`}</td>
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
                                                        <span className="text-[var(--color-warning)]">Yes</span>
                                                    ) : (
                                                        <span className="text-muted-foreground/55">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setRunResultDetailId(res.id)}
                                                        title="More detail"
                                                        className="bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border-0"
                                                    >
                                                        <Eye size={18} />
                                                    </Button>
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
                                <div className="rounded-2xl bg-accent border border-input shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between p-4 border-b border-border">
                                        <h4 className="text-lg font-semibold text-foreground">Test detail</h4>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setRunResultDetailId(null)} className="p-1.5 text-muted-foreground hover:text-foreground">
                                            <X size={20} />
                                        </Button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 text-base">
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Question</div>
                                            <p className="text-foreground whitespace-pre-wrap">{res.question_text ?? `Q#${res.question_id}`}</p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Generated answer</div>
                                            <p className="text-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{res.answer ?? "—"}</p>
                                        </div>
                                        {reasoning && (
                                            <div>
                                                <div className="text-sm text-muted-foreground/75 mb-1">Reasoning</div>
                                                <p className="text-muted-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{reasoning}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-compact">
                                            <span className="text-muted-foreground">Score: <span className="text-foreground">{res.quality_score ?? "—"}</span></span>
                                            <span className="text-muted-foreground">Status: {res.passed ? <span className="text-green-400">Pass</span> : <span className="text-red-400">Fail</span>}</span>
                                            {res.regression_detected && res.previous_score != null && (
                                                <span className="text-[var(--color-warning)]">Regression (previous score: {res.previous_score})</span>
                                            )}
                                        </div>
                                        {res.error && (
                                            <p className="text-[var(--color-error)] text-compact">{res.error}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {tab === "history" && (
                <div className="rounded-2xl bg-card border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h3 className="text-lg font-semibold text-foreground">Run History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className={cn(listTableClass(), "text-left text-base")}>
                            <thead>
                                <tr className={listTheadRowClass}>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Run #</th>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Date</th>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Model</th>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Status</th>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Passed / Failed</th>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Avg Score</th>
                                    <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map((run) => (
                                    <tr
                                        key={run.id}
                                        className={cn(listTbodyRowClass, "hover:bg-white/[0.03]")}
                                    >
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                className="text-[var(--color-warning)] hover:underline text-left"
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
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(run.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {run.model_name ?? "—"}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={
                                                    run.status === "completed"
                                                        ? "text-green-400"
                                                        : run.status === "failed"
                                                          ? "text-red-400"
                                                          : "text-muted-foreground"
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
                        <div className="p-8 text-center text-muted-foreground/75 text-base">No runs yet. Start one from the Run Test tab.</div>
                    )}
                    {runsTotal > 0 && (
                        <div className="p-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
                            <span className="text-compact text-muted-foreground">
                                Showing {(runsPage - 1) * RUNS_PAGE_SIZE + 1}–{Math.min(runsPage * RUNS_PAGE_SIZE, runsTotal)} of {runsTotal}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRunsPage((p) => Math.max(1, p - 1))}
                                    disabled={runsPage <= 1}
                                    className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:pointer-events-none text-compact"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRunsPage((p) => p + 1)}
                                    disabled={runsPage * RUNS_PAGE_SIZE >= runsTotal}
                                    className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:pointer-events-none text-compact"
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
                    <div className="rounded-2xl bg-card border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Compare Two Runs</h3>
                        <div className="compare-runs-dropdowns flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-sm text-muted-foreground/75 mb-1">Run A</label>
                                <Select
                                    value={runA != null ? String(runA) : "__none__"}
                                    onValueChange={(v) => setRunA(v === "__none__" ? null : Number(v))}
                                >
                                    <SelectTrigger className="min-w-[200px] bg-[rgba(255,255,255,0.06)] border-input text-foreground focus-visible:ring-amber-500/50">
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
                                <label className="block text-sm text-muted-foreground/75 mb-1">Run B</label>
                                <Select
                                    value={runB != null ? String(runB) : "__none__"}
                                    onValueChange={(v) => setRunB(v === "__none__" ? null : Number(v))}
                                >
                                    <SelectTrigger className="min-w-[200px] bg-[rgba(255,255,255,0.06)] border-input text-foreground focus-visible:ring-amber-500/50">
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
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50"
                            >
                                {compareLoading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
                                Compare
                            </button>
                        </div>
                    </div>

                    {compareData && (
                        <div className="rounded-2xl bg-card border border-border overflow-hidden">
                            <div className="p-4 border-b border-border flex flex-wrap gap-4 text-base">
                                <span className="text-muted-foreground">
                                    Run A: #{compareData.run_a.id}
                                    {compareData.run_a.model_name ? ` (${compareData.run_a.model_name})` : ""}
                                    {" "}({compareData.run_a.summary?.passed ?? 0}/{compareData.run_a.summary?.failed ?? 0}, avg {compareData.run_a.summary?.avg_score ?? "—"})
                                </span>
                                <span className="text-muted-foreground">
                                    Run B: #{compareData.run_b.id}
                                    {compareData.run_b.model_name ? ` (${compareData.run_b.model_name})` : ""}
                                    {" "}({compareData.run_b.summary?.passed ?? 0}/{compareData.run_b.summary?.failed ?? 0}, avg {compareData.run_b.summary?.avg_score ?? "—"})
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className={cn(listTableClass(), "text-left text-base")}>
                                    <thead>
                                        <tr className={listTheadRowClass}>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Question</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Score A</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Score B</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Pass A</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Pass B</th>
                                            <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compareData.rows.map((row, i) => (
                                            <tr key={row.question_id + "-" + i} className={listTbodyRowClass}>
                                                <td className="p-3 text-foreground max-w-xs truncate">{row.question_text ?? `Q#${row.question_id}`}</td>
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
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)]"
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
                                <div className="rounded-2xl bg-accent border border-input shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between p-4 border-b border-border">
                                        <h4 className="text-lg font-semibold text-foreground">Test detail</h4>
                                        <button type="button" onClick={() => setCompareDetailRow(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 text-base">
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Question</div>
                                            <p className="text-foreground whitespace-pre-wrap">{row.question_text ?? `Q#${row.question_id}`}</p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Expected / sample answer</div>
                                            <p className="text-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{row.expected_answer ?? "—"}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-xl border border-border overflow-hidden">
                                                <div className="px-3 py-2 bg-[rgba(255,255,255,0.06)] text-sm font-medium text-muted-foreground border-b border-border">
                                                    Run A {row.result_a != null && `· Score ${row.result_a.quality_score ?? "—"} · ${row.result_a.passed ? "Pass" : "Fail"}`}
                                                </div>
                                                <div className="p-3 space-y-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground/75 uppercase tracking-wide mb-1">Generated answer</div>
                                                        <p className="text-foreground whitespace-pre-wrap text-compact">{row.result_a?.answer ?? "—"}</p>
                                                    </div>
                                                    {reasoningA && (
                                                        <div>
                                                            <div className="text-xs text-muted-foreground/75 uppercase tracking-wide mb-1">Reasoning</div>
                                                            <p className="text-muted-foreground whitespace-pre-wrap text-compact">{reasoningA}</p>
                                                        </div>
                                                    )}
                                                    {row.result_a?.error && (
                                                        <p className="text-[var(--color-error)] text-compact">{row.result_a.error}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-border overflow-hidden">
                                                <div className="px-3 py-2 bg-[rgba(255,255,255,0.06)] text-sm font-medium text-muted-foreground border-b border-border">
                                                    Run B {row.result_b != null && `· Score ${row.result_b.quality_score ?? "—"} · ${row.result_b.passed ? "Pass" : "Fail"}`}
                                                </div>
                                                <div className="p-3 space-y-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground/75 uppercase tracking-wide mb-1">Generated answer</div>
                                                        <p className="text-foreground whitespace-pre-wrap text-compact">{row.result_b?.answer ?? "—"}</p>
                                                    </div>
                                                    {reasoningB && (
                                                        <div>
                                                            <div className="text-xs text-muted-foreground/75 uppercase tracking-wide mb-1">Reasoning</div>
                                                            <p className="text-muted-foreground whitespace-pre-wrap text-compact">{reasoningB}</p>
                                                        </div>
                                                    )}
                                                    {row.result_b?.error && (
                                                        <p className="text-[var(--color-error)] text-compact">{row.result_b.error}</p>
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

            {tab === "chat-history" && (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-card border border-border overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">Chat History</h3>
                            <p className="text-sm text-muted-foreground/75 mt-1">
                                All user questions from chat_messages with answers and feedback
                            </p>
                        </div>
                        {chatMessagesLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={28} className="animate-spin text-muted-foreground/55" />
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className={cn(listTableClass(), "text-left text-base")}>
                                        <thead>
                                            <tr className={listTheadRowClass}>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Question</th>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Answer</th>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-24")}>Feedback</th>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Can Answer</th>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-28")}>User</th>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-36")}>Date</th>
                                                <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chatMessages.map((pair, i) => {
                                                const truncate = (s: string | null | undefined, max: number) =>
                                                    s && s.length > max ? s.slice(0, max) + "…" : s ?? "—";
                                                const feedbackLabel =
                                                    pair.feedback_rating === 1
                                                        ? "Up"
                                                        : pair.feedback_rating === -1
                                                          ? "Down"
                                                          : "—";
                                                return (
                                                    <tr
                                                        key={pair.assistant_message_id}
                                                        className={cn(listTbodyRowClass, "hover:bg-white/[0.02]")}
                                                    >
                                                        <td className="p-3 text-foreground max-w-[220px]">
                                                            {truncate(pair.question, 80)}
                                                        </td>
                                                        <td className="p-3 text-muted-foreground max-w-[220px]">
                                                            {truncate(pair.answer, 80)}
                                                        </td>
                                                        <td className="p-3">
                                                            {pair.feedback_rating === 1 ? (
                                                                <span className="text-green-400 inline-flex items-center gap-1">
                                                                    <ThumbsUp size={14} /> {feedbackLabel}
                                                                </span>
                                                            ) : pair.feedback_rating === -1 ? (
                                                                <span className="text-red-400 inline-flex items-center gap-1">
                                                                    <ThumbsDown size={14} /> {feedbackLabel}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground/55">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            {pair.can_answer === true ? (
                                                                <span className="text-green-400">Yes</span>
                                                            ) : pair.can_answer === false ? (
                                                                <span className="text-red-400">No</span>
                                                            ) : (
                                                                <span className="text-muted-foreground/55">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-sm text-muted-foreground">
                                                            {pair.user_email ?? "—"}
                                                        </td>
                                                        <td className="p-3 text-sm text-muted-foreground">
                                                            {new Date(pair.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="p-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setChatMessageDetailIndex(i)}
                                                                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline text-compact"
                                                                title="View full details"
                                                            >
                                                                <Eye size={14} /> View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {chatMessages.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground/75 text-base">
                                        No chat messages yet.
                                    </div>
                                )}
                                {chatMessagesTotal > 0 && (
                                    <div className="p-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
                                        <span className="text-compact text-muted-foreground">
                                            Showing {(chatMessagesPage - 1) * CHAT_MESSAGES_PAGE_SIZE + 1}–
                                            {Math.min(chatMessagesPage * CHAT_MESSAGES_PAGE_SIZE, chatMessagesTotal)} of {chatMessagesTotal}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fetchChatMessages(chatMessagesPage - 1)}
                                                disabled={chatMessagesPage <= 1}
                                                className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:pointer-events-none text-compact"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fetchChatMessages(chatMessagesPage + 1)}
                                                disabled={chatMessagesPage * CHAT_MESSAGES_PAGE_SIZE >= chatMessagesTotal}
                                                className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-50 disabled:pointer-events-none text-compact"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Chat message detail modal */}
                    {chatMessageDetailIndex !== null && chatMessages[chatMessageDetailIndex] && (() => {
                        const pair = chatMessages[chatMessageDetailIndex];
                        const citations = Array.isArray(pair.citations) ? pair.citations : [];
                        const conflicts = Array.isArray(pair.conflicts) ? pair.conflicts : [];
                        return (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                                onClick={() => setChatMessageDetailIndex(null)}
                            >
                                <div
                                    className="rounded-2xl bg-accent border border-input shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-border">
                                        <h4 className="text-lg font-semibold text-foreground">Chat message details</h4>
                                        <button
                                            type="button"
                                            onClick={() => setChatMessageDetailIndex(null)}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 text-base">
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Question</div>
                                            <p className="text-foreground whitespace-pre-wrap">{pair.question}</p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Answer</div>
                                            <p className="text-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">
                                                {pair.answer}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Feedback</div>
                                            <p className="text-foreground">
                                                {pair.feedback_rating === 1 && (
                                                    <span className="text-green-400 inline-flex items-center gap-1">
                                                        <ThumbsUp size={16} /> Thumbs up
                                                    </span>
                                                )}
                                                {pair.feedback_rating === -1 && (
                                                    <span className="text-red-400 inline-flex items-center gap-1">
                                                        <ThumbsDown size={16} /> Thumbs down
                                                    </span>
                                                )}
                                                {pair.feedback_rating == null && (
                                                    <span className="text-muted-foreground/75">—</span>
                                                )}
                                                {pair.feedback_comment && (
                                                    <span className="block mt-2 text-muted-foreground">
                                                        Comment: {pair.feedback_comment}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Can answer</div>
                                            <p className="text-foreground">
                                                {pair.can_answer === true ? "Yes" : pair.can_answer === false ? "No" : "—"}
                                            </p>
                                        </div>
                                        {citations.length > 0 && (
                                            <div>
                                                <div className="text-sm text-muted-foreground/75 mb-1">Citations</div>
                                                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3 max-h-40 overflow-y-auto">
                                                    {JSON.stringify(citations, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {conflicts.length > 0 && (
                                            <div>
                                                <div className="text-sm text-muted-foreground/75 mb-1">Conflicts</div>
                                                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3 max-h-40 overflow-y-auto">
                                                    {JSON.stringify(conflicts, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        <div className="text-sm text-muted-foreground/75">
                                            User: {pair.user_email ?? "—"} · Session #{pair.session_id} ·{" "}
                                            {new Date(pair.created_at).toLocaleString()}
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
                        <div className="rounded-2xl bg-card border border-border p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-2">Suggestions from user feedback (&lt;70% satisfaction)</h3>
                            <p className="text-base text-muted-foreground mb-4">
                                Add these real user questions to the bulk test suite with one click.
                            </p>
                            {suggestionsLoading ? (
                                <div className="flex items-center gap-2 text-base text-muted-foreground/75">
                                    <Loader2 size={16} className="animate-spin" /> Loading suggestions…
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {suggestions.map((s) => (
                                        <li
                                            key={s.sample_message_id}
                                            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-border"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base text-foreground truncate">{s.question_text}</p>
                                                <p className="text-sm text-muted-foreground/75">
                                                    {s.thumbs_up_pct}% thumbs up · {s.total_count} responses
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => addFromFeedback(s.sample_message_id)}
                                                disabled={addingFromFeedback === s.sample_message_id}
                                                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 text-[var(--color-warning)] border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 text-compact"
                                            >
                                                {addingFromFeedback === s.sample_message_id ? "Adding…" : "Add to bulk test"}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    <div className="rounded-2xl bg-card border border-border p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {editingId != null ? "Edit Question" : "Add Question"}
                        </h3>
                        <div className="space-y-3 max-w-2xl">
                            <div>
                                <Label className="text-sm text-muted-foreground/75 mb-1">Question</Label>
                                <Input
                                    value={formQuestion}
                                    onChange={(e) => setFormQuestion(e.target.value)}
                                    placeholder="e.g. What is the policy on annual leave?"
                                    className="w-full bg-[rgba(255,255,255,0.06)] border-input rounded-lg"
                                />
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground/75 mb-1">Expected answer / criteria (optional)</Label>
                                <textarea
                                    value={formExpected}
                                    onChange={(e) => setFormExpected(e.target.value)}
                                    placeholder="Optional: used by LLM to score the answer"
                                    rows={2}
                                    className="w-full bg-[rgba(255,255,255,0.06)] border border-input rounded-lg px-3 py-2 text-base text-foreground"
                                />
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground/75 mb-1">Min score (1–10) to pass</Label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formMinScore}
                                    onChange={(e) => setFormMinScore(Number(e.target.value))}
                                    className="w-20 bg-[rgba(255,255,255,0.06)] border border-input rounded-lg px-3 py-2 text-base text-foreground"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={saveQuestion}
                                    disabled={saving || !formQuestion.trim()}
                                    className="bg-amber-500/20 text-[var(--color-warning)] border-amber-500/30 hover:bg-amber-500/30"
                                >
                                    {saving ? "Saving…" : editingId != null ? "Update" : "Add"}
                                </Button>
                                {editingId != null && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormQuestion("");
                                            setFormExpected("");
                                            setFormMinScore(7);
                                        }}
                                        className="bg-[rgba(255,255,255,0.06)] text-muted-foreground"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-card border border-border overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">Questions ({questions.length})</h3>
                            {latestRunForQuestions && (
                                <p className="text-sm text-muted-foreground/75 mt-1">
                                    Latest answers/scores from Run #{latestRunForQuestions.id} ({latestRunForQuestions.model_name ?? "—"})
                                </p>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className={cn(listTableClass(), "text-left text-base")}>
                                <thead>
                                    <tr className={listTheadRowClass}>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium")}>Question</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium min-w-[120px]")}>Expected answer</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium min-w-[120px]")}>Latest answer</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-16")}>Score</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-16")}>Pass</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Source</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-20")}>Min</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-16")}>Active</th>
                                        <th className={cn(listThClass, "text-muted-foreground/75 font-medium w-32")}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q) => {
                                        const latestResult = (latestRunForQuestions?.results ?? []).find(
                                            (r: BulkTestResult) => r.question_id === q.id
                                        );
                                        const truncate = (s: string | null | undefined, max: number) =>
                                            s && s.length > max ? s.slice(0, max) + "…" : s ?? "—";
                                        return (
                                            <tr key={q.id} className={cn(listTbodyRowClass, "hover:bg-white/[0.02]")}>
                                                <td className="p-3 text-foreground max-w-[200px]">{truncate(q.question, 60)}</td>
                                                <td className="p-3 text-muted-foreground max-w-[150px]" title={q.expected_answer ?? undefined}>
                                                    {truncate(q.expected_answer, 50)}
                                                </td>
                                                <td className="p-3 text-muted-foreground max-w-[150px]" title={latestResult?.answer ?? undefined}>
                                                    {truncate(latestResult?.answer, 50)}
                                                </td>
                                                <td className="p-3">{latestResult?.quality_score ?? "—"}</td>
                                                <td className="p-3">
                                                    {latestResult != null ? (
                                                        latestResult.passed ? (
                                                            <span className="text-green-400">Yes</span>
                                                        ) : (
                                                            <span className="text-red-400">No</span>
                                                        )
                                                    ) : (
                                                        <span className="text-muted-foreground/55">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {q.source === "user_feedback" ? "Feedback" : q.source ?? "Manual"}
                                                </td>
                                                <td className="p-3">{q.min_score}</td>
                                                <td className="p-3">{q.is_active ? "Yes" : "No"}</td>
                                                <td className="p-3 flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => setQuestionDetailId(q.id)}
                                                        className="text-muted-foreground hover:text-foreground hover:underline text-compact inline-flex items-center gap-1"
                                                        title="View full details"
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(q.id);
                                                            setFormQuestion(q.question);
                                                            setFormExpected(q.expected_answer ?? "");
                                                            setFormMinScore(q.min_score);
                                                        }}
                                                        className="text-[var(--color-warning)] hover:underline text-compact"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteQuestionId(q.id)}
                                                        className="text-red-400 hover:underline text-compact"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {questions.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground/75 text-base">
                                No questions yet. Add one above to get started.
                            </div>
                        )}
                    </div>

                    {/* Question detail modal */}
                    {questionDetailId !== null && (() => {
                        const q = questions.find((x) => x.id === questionDetailId);
                        if (!q) return null;
                        const latestResult = (latestRunForQuestions?.results ?? []).find(
                            (r: BulkTestResult) => r.question_id === q.id
                        );
                        const reasoning = latestResult?.score_breakdown && typeof latestResult.score_breakdown === "object" && "reasoning" in latestResult.score_breakdown
                            ? String((latestResult.score_breakdown as { reasoning?: string }).reasoning ?? "")
                            : "";
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setQuestionDetailId(null)}>
                                <div className="rounded-2xl bg-accent border border-input shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between p-4 border-b border-border">
                                        <h4 className="text-lg font-semibold text-foreground">Question details</h4>
                                        <button type="button" onClick={() => setQuestionDetailId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 text-base">
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Question</div>
                                            <p className="text-foreground whitespace-pre-wrap">{q.question}</p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Expected answer / criteria</div>
                                            <p className="text-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">
                                                {q.expected_answer ?? "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Source</div>
                                            <p className="text-muted-foreground">
                                                {q.source === "user_feedback" ? (
                                                    <span>From user feedback {q.source_message_id && `(message #${q.source_message_id})`}</span>
                                                ) : (
                                                    q.source ?? "Manual"
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground/75 mb-1">Latest generated answer {latestRunForQuestions && `(Run #${latestRunForQuestions.id})`}</div>
                                            <p className="text-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">
                                                {latestResult?.answer ?? "— No run result yet —"}
                                            </p>
                                        </div>
                                        {reasoning && (
                                            <div>
                                                <div className="text-sm text-muted-foreground/75 mb-1">Scoring reasoning</div>
                                                <p className="text-muted-foreground whitespace-pre-wrap bg-[rgba(255,255,255,0.04)] rounded-lg p-3">{reasoning}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-compact pt-2 border-t border-border">
                                            <span className="text-muted-foreground">Min score: <span className="text-foreground">{q.min_score}/10</span></span>
                                            <span className="text-muted-foreground">Active: <span className="text-foreground">{q.is_active ? "Yes" : "No"}</span></span>
                                            {latestResult != null && (
                                                <>
                                                    <span className="text-muted-foreground">Latest score: <span className="text-foreground">{latestResult.quality_score ?? "—"}/10</span></span>
                                                    <span className="text-muted-foreground">Pass: {latestResult.passed ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</span>
                                                    {latestResult.regression_detected && latestResult.previous_score != null && (
                                                        <span className="text-[var(--color-warning)]">Regression (previous: {latestResult.previous_score})</span>
                                                    )}
                                                    {latestResult.response_time_ms != null && (
                                                        <span className="text-muted-foreground">Response: {latestResult.response_time_ms}ms</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {latestResult?.error && (
                                            <p className="text-[var(--color-error)] text-compact">{latestResult.error}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Delete question confirmation modal */}
                    {deleteQuestionId !== null && (() => {
                        const q = questions.find((x) => x.id === deleteQuestionId);
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDeleteQuestionId(null)}>
                                <div className="rounded-2xl bg-accent border border-input shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                                    <h4 className="text-lg font-semibold text-foreground mb-2">Delete question?</h4>
                                    {q && (
                                        <p className="text-base text-muted-foreground mb-4 line-clamp-3">{q.question}</p>
                                    )}
                                    <p className="text-compact text-muted-foreground/75 mb-4">This cannot be undone.</p>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteQuestionId(null)}
                                            className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.08)] text-foreground hover:bg-[rgba(255,255,255,0.12)] text-base"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const ok = await deleteQuestion(deleteQuestionId);
                                                if (ok) setDeleteQuestionId(null);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-base"
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
