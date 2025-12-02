import { makeRequest } from "./makeRequest"

export function getBooks(query) {
    return makeRequest(`/books`, {
        params: { q: query }
    })
}

export function getBook(id) {
    return makeRequest(`/books/${id}`)
}

export function getChapter(id) {
    return makeRequest(`/chapters/${id}`)
}


