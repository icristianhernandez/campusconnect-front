import './App.css';
import Landing from './components/landing/Landing.jsx';
import Feed from './components/feed/Feed.jsx';
import ErrorPage from './components/ErrorPage.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { MyProvider } from './context/context.jsx';
import Header from './components/Header'; // Import the new Header component

function App() {
  return (
    <MyProvider>
        <Router>
            <div className="App">
                <Header /> {/* Add the Header component */}
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/feed" element={<Feed />} />
                    <Route path="*" element={<ErrorPage />} />
                </Routes>
            </div>
        </Router>
    </MyProvider>
  );
}

export default App;
