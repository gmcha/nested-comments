import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"

export function Signup() {
    const [nickname, setNickname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const { signup } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            await signup({ nickname, email, password })
            navigate("/login") // Requirement says: redirect to login after signup (or main if auto-login)
            // User prompt: "회원가입 후 로그인 창으로 리디렉팅한다."
        } catch (err) {
            setError(err) // Display error message
        }
    }

    return (
        <div className="auth-container">
            <h1>회원가입</h1>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>닉네임</label>
                    <input 
                        value={nickname} 
                        onChange={e => setNickname(e.target.value)} 
                        required 
                    />
                </div>
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
                <button type="submit" className="btn">가입하기</button>
            </form>
            <p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
        </div>
    )
}


