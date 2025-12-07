import { makeRequest } from "./makeRequest"

// SubDiscussion Comments
export function createComment({ subDiscussionId, message, parentId }) {
    return makeRequest(`sub-discussions/${subDiscussionId}/comments`, {
        method: "POST",
        data: { message, parentId },
    })
}

export function updateComment({ subDiscussionId, message, id }) {
    return makeRequest(`sub-discussions/${subDiscussionId}/comments/${id}`, {
        method: "PUT",
        data: { message },
    })
}

export function deleteComment({ subDiscussionId, id }) {
    return makeRequest(`sub-discussions/${subDiscussionId}/comments/${id}`, {
        method: "DELETE",
    })
}

export function toggleCommentLike({ subDiscussionId, id }) {
    return makeRequest(`sub-discussions/${subDiscussionId}/comments/${id}/toggleLike`, {
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
