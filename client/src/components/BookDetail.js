import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getBook } from "../services/books"

export function BookDetail() {
    const { id } = useParams()
    const [book, setBook] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        getBook(id)
            .then(data => {
                setBook(data)
                setLoading(false)
            })
            .catch(e => {
                setError(e)
                setLoading(false)
            })
    }, [id])

    if (loading) return <h1>Loading...</h1>
    if (error) return <h1 className="error-msg">{error}</h1>
    if (!book) return <h1>Book not found</h1>

    return (
        <div className="book-detail-container">
            <Link to="/" className="back-link">← 목록으로 돌아가기</Link>
            <h1 className="book-title">{book.title}</h1>
            <p className="book-author">저자: {book.author}</p>

            <div className="chapter-list">
                <h2>챕터 목록</h2>
                <ul>
                    {book.chapters && book.chapters.length > 0 ? (
                        book.chapters.map(chapter => (
                            <li key={chapter.id}>
                                <Link to={`/chapters/${chapter.id}`}>
                                    {chapter.title}
                                </Link>
                            </li>
                        ))
                    ) : (
                        <p>등록된 챕터가 없습니다.</p>
                    )}
                </ul>
            </div>
        </div>
    )
}


