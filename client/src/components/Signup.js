import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { checkNickname } from "../services/auth"

export function Signup() {
    const [nickname, setNickname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [nicknameStatus, setNicknameStatus] = useState({ checked: false, available: false, message: "" })
    const [checkingNickname, setCheckingNickname] = useState(false)
    const { signup } = useAuth()
    const navigate = useNavigate()

    async function handleCheckNickname() {
        if (!nickname.trim()) {
            setNicknameStatus({ checked: true, available: false, message: "닉네임을 입력해주세요." })
            return
        }

        setCheckingNickname(true)
        setError("") // 에러 메시지 초기화
        try {
            const result = await checkNickname(nickname.trim())
            setNicknameStatus({ checked: true, available: result.available, message: result.message })
        } catch (err) {
            setNicknameStatus({ checked: true, available: false, message: "확인 중 오류가 발생했습니다." })
        } finally {
            setCheckingNickname(false)
        }
    }

    function handleNicknameChange(e) {
        setNickname(e.target.value)
        // 닉네임이 변경되면 확인 상태 초기화
        setNicknameStatus({ checked: false, available: false, message: "" })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        
        if (!nicknameStatus.checked || !nicknameStatus.available) {
            setError("닉네임 중복 확인을 해주세요.")
            return
        }

        try {
            await signup({ nickname, email, password })
            navigate("/login")
        } catch (err) {
            setError(err)
        }
    }

    return (
        <div className="auth-container">
            <h1>회원가입</h1>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>닉네임</label>
                    <div className="nickname-input-group">
                        <input 
                            value={nickname} 
                            onChange={handleNicknameChange} 
                            required 
                            placeholder="사용할 닉네임 입력"
                        />
                        <button 
                            type="button" 
                            className="btn btn-check"
                            onClick={handleCheckNickname}
                            disabled={checkingNickname}
                        >
                            {checkingNickname ? "확인 중..." : "중복 확인"}
                        </button>
                    </div>
                    {nicknameStatus.message && (
                        <p className={`nickname-status ${nicknameStatus.available ? "success" : "error"}`}>
                            {nicknameStatus.message}
                        </p>
                    )}
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


