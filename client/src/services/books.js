import { makeRequest } from "./makeRequest"

export function getBooks(query) {
    return makeRequest(`/books`, {
        params: { q: query }
    })
}

export function getBook(id, sortBy = "newest") {
    return makeRequest(`/books/${id}`, {
        params: { sortBy }
    })
}

export function getChapter(id, sortBy = "newest") {
    return makeRequest(`/chapters/${id}`, {
        params: { sortBy }
    })
}

export function createChapter({ bookId, title }) {
    return makeRequest(`/books/${bookId}/chapters`, {
        method: "POST",
        data: { title }
    })
}


