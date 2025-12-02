import React, { createContext, useContext, useEffect, useState } from "react"
import { getMe, login as loginApi, logout as logoutApi, signup as signupApi } from "../services/auth"

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMe().then(user => {
            setUser(user)
            setLoading(false)
        })
    }, [])

    async function signup(details) {
        const user = await signupApi(details)
        setUser(user)
    }

    async function login(details) {
        const user = await loginApi(details)
        setUser(user)
    }

    async function logout() {
        await logoutApi()
        setUser(null)
    }

    const value = {
        user,
        signup,
        login,
        logout,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}


