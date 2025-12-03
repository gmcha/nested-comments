import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getBooks } from "../services/books"

export function BookList() {
    const [books, setBooks] = useState([])
    const [query, setQuery] = useState("")

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
