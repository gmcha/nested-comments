import { makeRequest } from "./makeRequest"

export function signup({ nickname, email, password }) {
    return makeRequest("/signup", {
        method: "POST",
        data: { nickname, email, password }
    })
}

export function login({ email, password }) {
    return makeRequest("/login", {
        method: "POST",
        data: { email, password }
    })
}

export function logout() {
    return makeRequest("/logout", {
        method: "POST"
    })
}

export function getMe() {
    return makeRequest("/me", {
        method: "GET"
    }).catch(() => null) // If error, return null (not logged in)
}


