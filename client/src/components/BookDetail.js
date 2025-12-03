import { useState } from "react"
import { Link } from "react-router-dom"
import { useBook } from "../contexts/BookContext"
import { CommentList } from "./CommentList"
import { CommentForm } from "./CommentForm"
import { useAuth } from "../contexts/AuthContext"
import { useAsyncFn } from "../hooks/useAsync"
import { createBookComment } from "../services/comments"
import { FaComments, FaArrowLeft } from "react-icons/fa"

export function BookDetail() {
    const { book, rootComments, createLocalComment, sortBy, setSortBy } = useBook()
    const { user } = useAuth()
    const { loading, error, execute: createCommentFn } = useAsyncFn(createBookComment)
    const [selectedRoom, setSelectedRoom] = useState(null)

    function onCommentCreate(message) {
        return createCommentFn({ bookId: book.id, message })
            .then(createLocalComment)
    }

    // 토론방 목록 (전체 토론방 + 챕터별 토론방)
    const discussionRooms = [
        { id: "general", title: "전체 토론방", type: "general" },
        ...(book.chapters?.map(ch => ({ id: ch.id, title: ch.title, type: "chapter" })) || [])
    ]

    return (
        <div className="book-detail-container">
            <div className="book-detail-header">
                {book.image && (
                    <div className="book-cover-large">
                        <img src={book.image} alt={book.title} />
                    </div>
                )}
                <div className="book-meta">
                    <h1 className="book-title">{book.title}</h1>
                    <p className="book-author">저자: {book.author}</p>
                    {book.isbn && <p className="book-isbn">ISBN: {book.isbn}</p>}
                    {book.description && <p className="book-desc">{book.description}</p>}
                </div>
            </div>

            {/* 토론방 선택 또는 토론 내용 표시 */}
            {selectedRoom === null ? (
                <section className="discussion-rooms-section">
                    <h2 className="section-title">토론방 선택</h2>
                    <div className="discussion-rooms-grid">
                        {discussionRooms.map(room => (
                            <button 
                                key={room.id}
                                className="discussion-room-btn"
                                onClick={() => {
                                    if (room.type === "chapter") {
                                        // 챕터 토론방은 ChapterDetail 페이지로 이동
                                        window.location.href = `/chapters/${room.id}`
                                    } else {
                                        setSelectedRoom(room)
                                    }
                                }}
                            >
                                <FaComments className="room-icon" />
                                <span className="room-title">{room.title}</span>
                                {room.type === "general" && (
                                    <span className="room-count">댓글 수: {book.comments?.length || 0}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="book-comments-section">
                    <div className="discussion-header">
                        <button 
                            className="back-to-rooms-btn"
                            onClick={() => setSelectedRoom(null)}
                        >
                            <FaArrowLeft /> 토론방 목록
                        </button>
                        <h2 className="current-room-title">{selectedRoom.title}</h2>
                    </div>

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
            )}
        </div>
    )
}
