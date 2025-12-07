import { useSubDiscussion } from "../contexts/SubDiscussionContext"
import { CommentList } from "./CommentList"
import { CommentForm } from "./CommentForm"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useAsyncFn } from "../hooks/useAsync"
import { createComment } from "../services/comments"

export function SubDiscussionDetail() {
    const { subDiscussion, rootComments, createLocalComment, sortBy, setSortBy } = useSubDiscussion()
    const { user } = useAuth()
    const { loading, error, execute: createCommentFn } = useAsyncFn(createComment)

    function onCommentCreate(message) {
        return createCommentFn({ subDiscussionId: subDiscussion.id, message })
            .then(createLocalComment)
    }

    return (
        <>
            <div className="chapter-header">
                <Link to={`/books/${subDiscussion.bookId}`} className="back-link">← 책으로 돌아가기</Link>
                <h1>{subDiscussion.title}</h1>
                <h3>{subDiscussion.book?.title}</h3>
            </div>
            
            <section>
                <div className="comments-header">
                    <h3 className="comments-title">토론 ({subDiscussion.comments?.length || 0})</h3>
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

