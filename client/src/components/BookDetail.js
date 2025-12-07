import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useBook } from "../contexts/BookContext"
import { useAuth } from "../contexts/AuthContext"
import { useAsyncFn } from "../hooks/useAsync"
import { createSubDiscussion } from "../services/books"
import { FaComments, FaPlus } from "react-icons/fa"

export function BookDetail() {
    const { book } = useBook()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newRoomTitle, setNewRoomTitle] = useState("")
    const { loading, error, execute: createSubDiscussionFn } = useAsyncFn(createSubDiscussion)

    // 토론방 목록 (전체 토론방 + 하위 토론방)
    const discussionRooms = [
        { id: "general", title: "전체 토론방", type: "general", path: `/books/${book.id}/discussion`, commentCount: book.comments?.length || 0 },
        ...(book.subDiscussions?.map(sd => ({ 
            id: sd.id, 
            title: sd.title, 
            type: "subDiscussion", 
            path: `/sub-discussions/${sd.id}`,
            commentCount: sd._count?.comments || 0
        })) || [])
    ]

    function handleCreateRoom(e) {
        e.preventDefault()
        if (!newRoomTitle.trim()) return

        createSubDiscussionFn({ bookId: book.id, title: newRoomTitle.trim() })
            .then(subDiscussion => {
                setNewRoomTitle("")
                setShowCreateForm(false)
                // 새로 생성된 토론방으로 이동
                navigate(`/sub-discussions/${subDiscussion.id}`)
            })
    }

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

            <section className="discussion-rooms-section">
                <div className="section-header">
                    <h2 className="section-title">토론방 선택</h2>
                    {user && (
                        <button 
                            className="btn create-room-btn"
                            onClick={() => setShowCreateForm(prev => !prev)}
                        >
                            <FaPlus /> 토론방 만들기
                        </button>
                    )}
                </div>

                {showCreateForm && (
                    <form className="create-room-form" onSubmit={handleCreateRoom}>
                        <input
                            type="text"
                            placeholder="토론방 제목을 입력하세요"
                            value={newRoomTitle}
                            onChange={e => setNewRoomTitle(e.target.value)}
                            autoFocus
                        />
                        <div className="form-buttons">
                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? "생성 중..." : "생성"}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowCreateForm(false)
                                    setNewRoomTitle("")
                                }}
                            >
                                취소
                            </button>
                        </div>
                        {error && <div className="error-msg">{error}</div>}
                    </form>
                )}

                <div className="discussion-rooms-grid">
                    {discussionRooms.map(room => (
                        <Link 
                            key={room.id}
                            to={room.path}
                            className="discussion-room-btn"
                        >
                            <FaComments className="room-icon" />
                            <span className="room-title">{room.title}</span>
                            <span className="room-count">댓글 수: {room.commentCount}</span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
