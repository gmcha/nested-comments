import { Link } from "react-router-dom"
import { useBook } from "../contexts/BookContext"
import { FaComments } from "react-icons/fa"

export function BookDetail() {
    const { book } = useBook()

    // 토론방 목록 (전체 토론방 + 챕터별 토론방)
    const discussionRooms = [
        { id: "general", title: "전체 토론방", type: "general", path: `/books/${book.id}/discussion` },
        ...(book.chapters?.map(ch => ({ id: ch.id, title: ch.title, type: "chapter", path: `/chapters/${ch.id}` })) || [])
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

            <section className="discussion-rooms-section">
                <h2 className="section-title">토론방 선택</h2>
                <div className="discussion-rooms-grid">
                    {discussionRooms.map(room => (
                        <Link 
                            key={room.id}
                            to={room.path}
                            className="discussion-room-btn"
                        >
                            <FaComments className="room-icon" />
                            <span className="room-title">{room.title}</span>
                            {room.type === "general" && (
                                <span className="room-count">댓글 수: {book.comments?.length || 0}</span>
                            )}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
