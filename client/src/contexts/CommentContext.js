import React, { useContext } from "react"

const CommentContext = React.createContext()

export function useCommentContext() {
    return useContext(CommentContext)
}

export { CommentContext }




