import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useAsync } from "../hooks/useAsync"
import { getSubDiscussion } from "../services/books"
import { CommentContext, useCommentContext } from "./CommentContext"

export function useSubDiscussion() {
    return useCommentContext()
}

export function SubDiscussionProvider({ children }) {
    const { subDiscussionId } = useParams()
    const [sortBy, setSortBy] = useState("likes")
    const { loading, error, value: subDiscussion } = useAsync(() => getSubDiscussion(subDiscussionId, sortBy), [subDiscussionId, sortBy])
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
        if (subDiscussion?.comments == null) return
        setComments(subDiscussion.comments)
    }, [subDiscussion?.comments])

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
            subDiscussion: {id: subDiscussionId, ...subDiscussion},
            book: null,
            contextType: "subDiscussion",
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


