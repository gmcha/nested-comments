import { useChapter } from "../contexts/ChapterContext"
import { CommentList } from "./CommentList"
import { CommentForm } from "./CommentForm"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useAsyncFn } from "../hooks/useAsync"
import { createComment } from "../services/comments"

export function ChapterDetail() {
    const { chapter, rootComments, createLocalComment, sortBy, setSortBy } = useChapter()
    const { user } = useAuth()
    const { loading, error, execute: createCommentFn } = useAsyncFn(createComment)

    function onCommentCreate(message) {
        return createCommentFn({ chapterId: chapter.id, message })
            .then(createLocalComment)
    }

    return (
        <>
            <div className="chapter-header">
                <Link to={`/books/${chapter.bookId}`} className="back-link">← 책으로 돌아가기</Link>
                <h1>{chapter.title}</h1>
                <h3>{chapter.book?.title}</h3>
            </div>
            
            <section>
                <div className="comments-header">
                    <h3 className="comments-title">토론 ({chapter.comments?.length || 0})</h3>
                    <div className="sort-buttons">
                        <button 
                            className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
                            onClick={() => setSortBy("newest")}
                        >
                            최신순
                        </button>
                        <button 
                            className={`sort-btn ${sortBy === 'likes' ? 'active' : ''}`}
                            onClick={() => setSortBy("likes")}
                        >
                            좋아요순
                        </button>
                    </div>
                </div>

                {user ? (
                    <CommentForm 
                        loading={loading} 
                        error={error} 
                        onSubmit={onCommentCreate} 
                    />
                ) : (
                    <div className="login-prompt">
                        토론에 참여하려면 <Link to="/login">로그인</Link>해주세요.
                    </div>
                )}
                {rootComments != null && rootComments.length > 0 && (
                    <div className="mt-4">
                        <CommentList comments={rootComments} />
                    </div>
                )}
            </section>
        </>
    )
}
