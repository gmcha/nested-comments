import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useAsync } from "../hooks/useAsync"
import { getBook } from "../services/books"
import { CommentContext, useCommentContext } from "./CommentContext"

export function useBook() {
    return useCommentContext()
}

export function BookProvider({ children }) {
    const { id } = useParams()
    const [sortBy, setSortBy] = useState("newest")
    const { loading, error, value: book } = useAsync(() => getBook(id, sortBy), [id, sortBy])
    const [comments, setComments] = useState([])
    
    const commentsByParentId = useMemo(() => {
        const group = {}
        comments.forEach(comment => {
            group[comment.parentId] ||= []
            group[comment.parentId].push(comment)
        })
        return group
    }, [comments])

    useEffect(() => {
        if (book?.comments == null) return
        setComments(book.comments)
    }, [book?.comments])

    function getReplies(parentId) {
        return commentsByParentId[parentId]
    }

    function createLocalComment(comment) {
        setComments(prevComments => {
            return [comment, ...prevComments]
        })
    }

    function updateLocalComment(id, message) {
        setComments(prevComments => {
            return prevComments.map(comment => {
                if (comment.id === id) {
                    return { ...comment, message }
                } else {
                    return comment
                }
            })
        })
    }

    function deleteLocalComment(id) {
        setComments(prevComments => {
            return prevComments.filter(comment => comment.id !== id)
        })
    }

    function toggleLocalCommentLike(id, addLike) {
        setComments(prevComments => {
            return prevComments.map(comment => {
                if (id === comment.id) {
                    if (addLike) {
                        return {
                            ...comment,
                            likeCount: comment.likeCount + 1,
                            likedByMe: true,
                        }
                    } else {
                        return {
                            ...comment,
                            likeCount: comment.likeCount - 1,
                            likedByMe: false,
                        }
                    }
                } else {
                    return comment
                }
            })
        })
    } 
    
    return (<CommentContext.Provider 
        value={{
            book: { id, ...book },
            chapter: null,
            contextType: "book",
            rootComments: commentsByParentId[null],
            getReplies,
            createLocalComment,
            updateLocalComment,
            deleteLocalComment,
            toggleLocalCommentLike,
            sortBy,
            setSortBy
        }}
    >
        {loading ? (
            <h1>Loading</h1>
        ) : error ? (
            <h1 className="error-msg">{error}</h1>
        ) : (
            children
        )}
        </CommentContext.Provider>
    )
}

