import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getBooks } from "../services/books"

export function BookList() {
    const [books, setBooks] = useState([])
    const [query, setQuery] = useState("")
    const [isSearchResult, setIsSearchResult] = useState(false)

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
                setIsSearchResult(query.trim() !== "");
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
                <p className="search-hint">
                    {isSearchResult 
                        ? "토론하고 싶은 책을 선택하세요. 클릭하면 토론방으로 이동합니다."
                        : "읽은 책이 목록에 없나요? 검색창에서 바로 토론을 열 수 있습니다."
                    }
                </p>
            </div>

            <h2 className="section-title">
                {isSearchResult ? `'${query}' 검색 결과` : "토론이 진행중인 책들"}
            </h2>
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
