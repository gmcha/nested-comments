import { Routes, Route } from 'react-router-dom';
import { BookList } from "./components/BookList"
import { BookDetail } from "./components/BookDetail"
import { ChapterDetail } from "./components/ChapterDetail"
import { Login } from "./components/Login"
import { Signup } from "./components/Signup"
import { ChapterProvider } from "./contexts/ChapterContext"
import { AuthProvider } from "./contexts/AuthContext"

function App() {
  return (
    <div className="container">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route 
            path="/chapters/:chapterId" 
            element={
              <ChapterProvider>
                <ChapterDetail />
              </ChapterProvider>
            } 
          />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App;
