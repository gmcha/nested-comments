import { makeRequest } from "./makeRequest"

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
