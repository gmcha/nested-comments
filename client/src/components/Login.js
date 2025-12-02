import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"

export function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            await login({ email, password })
            navigate("/") // Requirement: redirect to main page
        } catch (err) {
            setError("잘못된 이메일 또는 비밀번호입니다.") // Requirement: generic error
        }
    }

    return (
        <div className="auth-container">
            <h1>로그인</h1>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>이메일</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>비밀번호</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="btn">로그인</button>
            </form>
            <p>계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
        </div>
    )
}


