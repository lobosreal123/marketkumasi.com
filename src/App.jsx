import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MarketplaceProvider } from './context/MarketplaceContext'
import MarketplaceHome from './pages/MarketplaceHome'
import CreateListing from './pages/CreateListing'
import ItemDetail from './pages/ItemDetail'
import MyItems from './pages/MyItems'
import Login from './pages/Login'
import Register from './pages/Register'
import MarketplaceAdmin from './pages/MarketplaceAdmin'
import EditItem from './pages/EditItem'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function App() {
  return (
    <Router>
      <AuthProvider>
        <MarketplaceProvider>
          <Routes>
            <Route path="/marketplace" element={<MarketplaceHome />} />
            <Route path="/marketplace/login" element={<Login />} />
            <Route path="/marketplace/register" element={<Register />} />
            <Route path="/marketplace/create" element={<CreateListing />} />
            <Route path="/marketplace/item/:itemId" element={<ItemDetail />} />
            <Route path="/marketplace/edit/:itemId" element={<EditItem />} />
            <Route path="/marketplace/my-items" element={<MyItems />} />
            <Route path="/marketplace/admin" element={<MarketplaceAdmin />} />
            <Route path="/marketplace/forgot-password" element={<ForgotPassword />} />
            <Route path="/marketplace/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/marketplace" replace />} />
            <Route path="*" element={<Navigate to="/marketplace" replace />} />
          </Routes>
        </MarketplaceProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

