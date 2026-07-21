import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, User, Share2, Mail, Cake, PartyPopper, Trophy, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/ui/avatar";
import { cn, getLocationFlag } from "@/lib/utils";
import { useToggleLike, useRecognitionComments, useAddComment, useEditComment, useDeleteComment } from "@/hooks/useApiData";
import { useAuth } from "@/contexts/AuthContext";

export interface WallOfFameCardData {
  id: string;
  date: string;
  name: string;
  avatar?: string | null;
  location?: string;
  company: string;
  title: string;
  fromLabel: string;
  fromHref?: string;
  message: string;
  kind: "award" | "birthday" | "anniversary";
  profileHref?: string;
  // Only set for kind === "award" (a real Recognition row) — enables the
  // functional like/comment reactions. Birthday/anniversary cards are
  // announcements, not recognitions, so they stay decorative.
  recognitionId?: number;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
}

const IMAGE_THEME: Record<WallOfFameCardData["kind"], { gradient: string; Icon: typeof Trophy; label: string }> = {
  award: {
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    Icon: Trophy,
    label: "Award",
  },
  birthday: {
    gradient: "from-pink-400 via-rose-400 to-amber-300",
    Icon: Cake,
    label: "Birthday",
  },
  anniversary: {
    gradient: "from-rose-600 via-red-600 to-rose-800",
    Icon: PartyPopper,
    label: "Work Anniversary",
  },
};

export default function WallOfFameCard({ item }: { item: WallOfFameCardData }) {
  const { user } = useAuth();
  const flag = getLocationFlag(item.location);
  const theme = IMAGE_THEME[item.kind];

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const toggleLike = useToggleLike();
  const { data: comments = [], isLoading: commentsLoading } = useRecognitionComments(
    commentsOpen ? item.recognitionId ?? null : null
  );
  const addComment = useAddComment();
  const editCommentMutation = useEditComment();
  const deleteCommentMutation = useDeleteComment();

  const canReact = typeof item.recognitionId === "number";

  const handleLike = () => {
    if (!canReact) return;
    toggleLike.mutate(item.recognitionId!);
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const wordCount = getWordCount(commentText);
  const editWordCount = getWordCount(editText);

  const handleAddComment = () => {
    if (!canReact || !commentText.trim() || wordCount > 100) return;
    addComment.mutate(
      { recognitionId: item.recognitionId!, message: commentText.trim() },
      { onSuccess: () => setCommentText("") }
    );
  };

  const handleSaveEdit = (commentId: number) => {
    if (!editText.trim() || editWordCount > 100) return;
    editCommentMutation.mutate(
      { commentId, message: editText.trim() },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditText("");
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (deletingCommentId === null) return;
    deleteCommentMutation.mutate(
      { commentId: deletingCommentId, recognitionId: item.recognitionId! },
      {
        onSuccess: () => {
          setDeletingCommentId(null);
        },
      }
    );
  };

  const startEdit = (commentId: number, message: string) => {
    setEditingCommentId(commentId);
    setEditText(message);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{item.date}</p>

          <div className="mt-2 flex items-center gap-2.5">
            <UserAvatar name={item.name} avatar={item.avatar} size="h-9 w-9" fallbackClassName="text-xs font-bold" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {item.name}
                {flag && <span className="text-sm leading-none">{flag}</span>}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.company}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>From:</span>
            {item.fromHref ? (
              <Link to={item.fromHref} className="font-semibold text-blue-600 hover:underline dark:text-sky-400">
                {item.fromLabel}
              </Link>
            ) : (
              <span className="font-semibold text-blue-600 dark:text-sky-400">{item.fromLabel}</span>
            )}
          </div>

          <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {item.message}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="text-xs font-semibold text-blue-600 dark:text-sky-400 sm:text-right">{item.title}</span>
          <div
            className={`flex h-24 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br sm:h-20 sm:w-32 ${theme.gradient}`}
          >
            <theme.Icon className="h-6 w-6 text-white/90" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          onClick={handleLike}
          disabled={!canReact || toggleLike.isPending}
          aria-label="Like"
          className={`flex items-center gap-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            item.likedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${item.likedByMe ? "fill-rose-500" : ""}`} />
          {(item.likeCount ?? 0) > 0 && <span>{item.likeCount}</span>}
        </button>

        <button
          onClick={() => canReact && setCommentsOpen((o) => !o)}
          disabled={!canReact}
          aria-label="Comments"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageSquare className="h-4 w-4" />
          {(item.commentCount ?? 0) > 0 && <span>{item.commentCount}</span>}
        </button>

        {item.profileHref ? (
          <Link to={item.profileHref}>
            <User className="h-4 w-4 text-slate-400 transition hover:text-blue-500" />
          </Link>
        ) : (
          <User className="h-4 w-4 text-slate-400 transition hover:text-blue-500" />
        )}
        <Share2 className="h-4 w-4 text-slate-400 transition hover:text-blue-500" />
      </div>

      <AnimatePresence>
        {commentsOpen && canReact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              {commentsLoading ? (
                <p className="text-xs text-slate-400">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400">No comments yet. Be the first to say something.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <UserAvatar name={c.employee.name} avatar={c.employee.avatar} size="h-7 w-7" fallbackClassName="text-[10px] font-bold" />
                    <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.employee.name}</p>
                      {editingCommentId === c.id ? (
                        <div className="mt-1 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-between">
                            <div className={cn("text-[10px]", editWordCount > 100 ? "text-rose-500 font-medium" : editWordCount > 80 ? "text-amber-500 font-medium" : "text-slate-400")}>
                              {editWordCount} / 100 words
                              {editWordCount > 100 && <span className="ml-1.5">Comments cannot exceed 100 words.</span>}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(c.id)}
                                disabled={!editText.trim() || editWordCount > 100 || editCommentMutation.isPending}
                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300 font-bold disabled:opacity-40"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{c.message}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                            {c.employee.id === user?.id && (
                              <div className="flex gap-2.5">
                                <button
                                  onClick={() => startEdit(c.id, c.message)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-300 transition"
                                >
                                  ✏ Edit
                                </button>
                                <button
                                  onClick={() => setDeletingCommentId(c.id)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
                                >
                                  🗑 Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <UserAvatar name={user?.name} avatar={user?.avatar} size="h-7 w-7" fallbackClassName="text-[10px] font-bold" />
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || wordCount > 100 || addComment.isPending}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-950"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                {commentText && (
                  <div className={cn("text-[10px] mt-1 pl-10", wordCount > 100 ? "text-rose-500 font-medium" : wordCount > 80 ? "text-amber-500 font-medium" : "text-slate-400")}>
                    {wordCount} / 100 words
                    {wordCount > 100 && (
                      <span className="ml-2 font-semibold">Comments cannot exceed 100 words.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deletingCommentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-950 border dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Comment?</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingCommentId(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
