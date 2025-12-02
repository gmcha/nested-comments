import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getBooks } from "../services/books"
import { useAuth } from "../contexts/AuthContext"

export function BookList() {
    const [books, setBooks] = useState([])
    const [query, setQuery] = useState("")
    const { user, logout } = useAuth()

    useEffect(() => {
        getBooks().then(setBooks)
    }, [])

    function handleSearch(e) {
        e.preventDefault()
        console.log("Searching for:", query);
        getBooks(query)
            .then(data => {
                console.log("Search results:", data);
                setBooks(data);
            })
            .catch(err => console.error("Search error:", err));
    }

    return (
        <div>
            <header className="main-header">
                <h1>독서 토론 서비스</h1>
                <div className="user-info">
                    {user ? (
                        <>
                            <span>안녕하세요, {user.nickname}님</span>
                            <button onClick={logout} className="btn-white-outline">로그아웃</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-white">로그인</Link>
                            <Link to="/signup" className="btn-white-outline">회원가입</Link>
                        </>
                    )}
                </div>
            </header>

            <div className="search-bar">
                <form onSubmit={handleSearch}>
                    <input 
                        type="text" 
                        placeholder="도서 제목 또는 저자 검색..." 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button type="submit" className="btn">검색</button>
                </form>
            </div>

            <div className="book-list">
                {books.map(book => (
                    <div key={book.id} className="book-card">
                        <Link to={`/books/${book.id}`}>
                            {book.image && (
                                <div className="book-cover">
                                    <img src={book.image} alt={book.title} />
                                </div>
                            )}
                            <div className="book-info">
                                <h2>{book.title}</h2>
                                <p className="author">저자: {book.author}</p>
                            </div>
                        </Link>
                    </div>
                ))}
                {books.length === 0 && <p>검색 결과가 없습니다.</p>}
            </div>
        </div>
    )
}
