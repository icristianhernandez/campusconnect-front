import './Header.css';

function Header() {
    return (
        <header className="Header">
            <div className="header-search">
                <input type="text" placeholder="Buscar..." />
            </div>
            <div className="header-logo">
                <img src="simbolo.png" alt="App Logo" />
            </div>
        </header>
    );
}

export default Header;
