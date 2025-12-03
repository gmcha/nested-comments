import { makeRequest } from "./makeRequest"

// Chapter Comments
export function createComment({ chapterId, message, parentId }) {
    return makeRequest(`chapters/${chapterId}/comments`, {
        method: "POST",
        data: { message, parentId },
    })
}

export function updateComment({ chapterId, message, id }) {
    return makeRequest(`chapters/${chapterId}/comments/${id}`, {
        method: "PUT",
        data: { message },
    })
}

export function deleteComment({ chapterId, id }) {
    return makeRequest(`chapters/${chapterId}/comments/${id}`, {
        method: "DELETE",
    })
}

export function toggleCommentLike({ chapterId, id }) {
    return makeRequest(`chapters/${chapterId}/comments/${id}/toggleLike`, {
        method: "POST",
    })
}

// Book Comments
export function createBookComment({ bookId, message, parentId }) {
    return makeRequest(`books/${bookId}/comments`, {
        method: "POST",
        data: { message, parentId },
    })
}

export function updateBookComment({ bookId, message, id }) {
    return makeRequest(`books/${bookId}/comments/${id}`, {
        method: "PUT",
        data: { message },
    })
}

export function deleteBookComment({ bookId, id }) {
    return makeRequest(`books/${bookId}/comments/${id}`, {
        method: "DELETE",
    })
}

export function toggleBookCommentLike({ bookId, id }) {
    return makeRequest(`books/${bookId}/comments/${id}/toggleLike`, {
        method: "POST",
    })
}
