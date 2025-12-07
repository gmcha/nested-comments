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

export function getSubDiscussion(id, sortBy = "newest") {
    return makeRequest(`/sub-discussions/${id}`, {
        params: { sortBy }
    })
}

export function createSubDiscussion({ bookId, title }) {
    return makeRequest(`/books/${bookId}/sub-discussions`, {
        method: "POST",
        data: { title }
    })
}


