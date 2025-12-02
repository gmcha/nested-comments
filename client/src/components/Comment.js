import { IconBtn } from './IconBtn.js'
import { FaHeart, FaReply, FaEdit, FaTrash, FaRegHeart } from "react-icons/fa"
import { useChapter } from "../contexts/ChapterContext"
import { CommentList } from "./CommentList"
import { useState } from "react"
import { useAsyncFn } from "../hooks/useAsync"
import { createComment, updateComment, deleteComment, toggleCommentLike } from "../services/comments"
import { CommentForm } from "./CommentForm"
import { useAuth } from "../contexts/AuthContext"


const dateFormatter = new Intl.DateTimeFormat(undefined, { 
    dateStyle: "medium", 
    timeStyle: "short"
})

export function Comment({ id, message, user, createdAt, likeCount, likedByMe }){
    const [areChildrenHidden, setAreChildrenHidden] = useState(false)
    const [isReplying, setIsReplying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const { chapter, getReplies, createLocalComment, updateLocalComment, deleteLocalComment, toggleLocalCommentLike } = useChapter()
    const createCommentFn = useAsyncFn(createComment)
    const updateCommentFn = useAsyncFn(updateComment)
    const deleteCommentFn = useAsyncFn(deleteComment)
    const toggleCommentLikeFn = useAsyncFn(toggleCommentLike)
    const childComments = getReplies(id)
    const { user: currentUser } = useAuth()

    function onCommentReply(message){
        return createCommentFn
            .execute({ chapterId: chapter.id, message, parentId: id })
            .then(comment => {
                setIsReplying(false)
                createLocalComment(comment)
            })
    }

    function onCommentUpdate(message){
        return updateCommentFn
            .execute({ chapterId: chapter.id, message, id })
            .then(comment => {
                setIsEditing(false)
                updateLocalComment( id, comment.message )
            })
    }

    function onCommentDelete(message){
        return deleteCommentFn
            .execute({ chapterId: chapter.id, id })
            .then(comment => deleteLocalComment(comment.id))
    }

    function onToggleCommentLike() {
        return toggleCommentLikeFn
        .execute({ id, chapterId: chapter.id })
        .then(({ addLike }) => toggleLocalCommentLike(id, addLike))
    }

    return (
        <>
            <div className="comment">
                <div className="header">
                    <span className="name">{user.nickname}</span>
                    <span className="date">{dateFormatter.format(Date.parse(createdAt))}</span>
                </div>
                {isEditing ? (
                    <CommentForm
                        autoFocus 
                        initialValue={message}
                        onSubmit={onCommentUpdate}
                        loading={updateCommentFn.loading}
                        error={updateCommentFn.error}
                    />
                ) : (<div className="message">{message}</div>
                )}
                <div className="footer">
                    <IconBtn 
                        onClick={onToggleCommentLike}
                        disabled={toggleCommentLikeFn.loading || !currentUser}
                        Icon={likedByMe ? FaHeart : FaRegHeart} 
                        aria-label={likedByMe ? "Unlike" : "Like"} 
                    >
                        {likeCount}
                    </IconBtn>
                    {currentUser && (
                        <IconBtn
                            onClick={() => {setIsReplying(prev => !prev)}}
                            isActive={isReplying}
                            Icon={FaReply} 
                            aria-label={isReplying ? "Cancel Reply" : "Reply"} 
                        />
                    )}
                    {currentUser && user.id === currentUser.id && (
                        <>
                            <IconBtn
                                onClick={() => {setIsEditing(prev => !prev)}}
                                isActive={isEditing}
                                Icon={FaEdit} 
                                aria-label={isEditing ? "Cancel Edit" : "Edit"} 
                            />
                            <IconBtn 
                                disabled={deleteCommentFn.loading}
                                onClick={onCommentDelete}
                                Icon={FaTrash} 
                                aria-label="Delete" 
                                color="danger" 
                            />
                        </>
                    )}
                </div>
                {deleteCommentFn.error && (
                    <div className="error-msg mt-1">{deleteCommentFn.error}</div>
                )}
            </div>
            {isReplying && (
                <div className="mt-1 ml-3">
                    <CommentForm
                        autoFocus 
                        onSubmit={onCommentReply} 
                        loading={createCommentFn.loading} 
                        error={createCommentFn.error} 
                    />
                </div>
            )}
            {childComments?.length > 0 && (
                <>
                    <div className={`nested-comments-stack ${areChildrenHidden ? "hide": ""}`}>
                        <button 
                            className="collapse-line" 
                            aria-label="Hide Replies" 
                            onClick={() => setAreChildrenHidden(true)} 
                        />
                        <div className="nested-comments">
                            <CommentList comments={childComments} />
                        </div>
                    </div>
                    <button 
                        className={`btn mt-1 ${!areChildrenHidden ? "hide" : ""}`} 
                        onClick={() => setAreChildrenHidden(false)}
                    >
                        Show Replies
                    </button>
                </>
            )}
        </>
    )
}
