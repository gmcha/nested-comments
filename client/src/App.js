import { Routes, Route, Link } from 'react-router-dom';
import { BookList } from "./components/BookList"
import { BookDetail } from "./components/BookDetail"
import { BookDiscussion } from "./components/BookDiscussion"
import { SubDiscussionDetail } from "./components/SubDiscussionDetail"
import { Login } from "./components/Login"
import { Signup } from "./components/Signup"
import { SubDiscussionProvider } from "./contexts/SubDiscussionContext"
import { BookProvider } from "./contexts/BookContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"

function Header() {
  const { user, logout } = useAuth()
  
  return (
    <header className="global-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>독서 토론 서비스</h1>
        </Link>
        <div className="user-info">
          {user ? (
            <>
              <span>안녕하세요, {user.nickname}님</span>
              <button onClick={logout} className="btn-white-outline">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-white">로그인</Link>
              <Link to="/signup" className="btn-white-outline">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function App() {
  return (
    <AuthProvider>
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/books/:id" 
            element={
              <BookProvider>
                <BookDetail />
              </BookProvider>
            } 
          />
          <Route 
            path="/books/:id/discussion" 
            element={
              <BookProvider>
                <BookDiscussion />
              </BookProvider>
            } 
          />
          <Route 
            path="/sub-discussions/:subDiscussionId" 
            element={
              <SubDiscussionProvider>
                <SubDiscussionDetail />
              </SubDiscussionProvider>
            } 
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App;
