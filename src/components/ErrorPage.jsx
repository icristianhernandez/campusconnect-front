import React from "react";
import { useNavigate } from "react-router-dom";
import "./ErrorPage.css";

function ErrorPage() {
	const navigate = useNavigate();

	return (
		<div className="ErrorPage">
			<h1>Ha ocurrido un error</h1>
			<p>Ha ocurrido un problema. La página que buscas no existe.</p>
			<button onClick={() => navigate("/feed")}>Volver al Feed</button>
		</div>
	);
}

export default ErrorPage;
