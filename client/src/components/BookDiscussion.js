import { Link } from "react-router-dom"
import { useBook } from "../contexts/BookContext"
import { CommentList } from "./CommentList"
import { CommentForm } from "./CommentForm"
import { useAuth } from "../contexts/AuthContext"
import { useAsyncFn } from "../hooks/useAsync"
import { createBookComment } from "../services/comments"
import { FaArrowLeft } from "react-icons/fa"

export function BookDiscussion() {
    const { book, rootComments, createLocalComment, sortBy, setSortBy } = useBook()
    const { user } = useAuth()
    const { loading, error, execute: createCommentFn } = useAsyncFn(createBookComment)

    function onCommentCreate(message) {
        return createCommentFn({ bookId: book.id, message })
            .then(createLocalComment)
    }

    return (
        <div className="discussion-page-container">
            <div className="discussion-page-header">
                <Link to={`/books/${book.id}`} className="back-to-book-btn">
                    <FaArrowLeft /> 책으로 돌아가기
                </Link>
                <div className="discussion-book-info">
                    <h1 className="discussion-title">전체 토론방</h1>
                    <p className="discussion-book-name">{book.title}</p>
                </div>
            </div>

            <section className="discussion-content">
                <div className="comments-header">
                    <h3 className="comments-title">토론 ({book.comments?.length || 0})</h3>
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
        </div>
    )
}





