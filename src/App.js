import "./App.css";
import Landing from "./components/landing/Landing.jsx";
import Feed from "./components/feed/Feed.jsx";
import ErrorPage from "./components/ErrorPage.jsx";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { MyProvider } from "./context/context.jsx";
import Header from "./components/Header";
import AiChat from "./components/ai/AiChat.jsx"; // Renamed for clarity

// Wrapper component to provide location context to AiChat
function AppContent() {
	const location = useLocation();
	
	return (
		<div className={`App ${location.pathname === '/feed' ? 'with-header' : ''}`}>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route
					path="/feed"
					element={
						<>
							<Header />
							<Feed />
						</>
					}
				/>
				<Route path="*" element={<ErrorPage />} />
			</Routes>
			<AiChat />
		</div>
	);
}

function App() {
	return (
		<MyProvider>
			<Router>
				<AppContent />
			</Router>
		</MyProvider>
	);
}

export default App;
