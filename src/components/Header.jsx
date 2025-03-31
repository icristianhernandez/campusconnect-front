import "./Header.css";

function Header() {
	return (
		<header className="Header">
			<div className="header-search">
				<img src="lupa.svg" alt="Search Icon" className="search-icon" />
				<input type="text" placeholder="Buscar..." />
			</div>
			<button className="apuntes-button">
				<img src="Inicio-color.png" alt="Apuntes Icon" />
				<span className="apuntes-tooltip">Apuntes</span>
			</button>
			<div className="header-logo">
				<img src="Símbolo.png" alt="App Logo" />
			</div>
			<button className="anuncios-button">
				<img src="Anuncios.svg" alt="Anuncios Icon" />
				<span className="anuncios-tooltip">Anuncios</span>
			</button>
		</header>
	);
}

export default Header;
