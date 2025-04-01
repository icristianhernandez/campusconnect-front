import React from "react";
import "./Header.css";

function Header() {
  return (
    <div className="Header">
      {/* La barra de búsqueda ha sido eliminada */}

      <button className="apuntes-button">
        <img src="/Inicio-color.png" alt="Apuntes" /> {/* Make sure this path is correct */}
        <span className="apuntes-tooltip">Apuntes</span>
      </button>

      <div className="header-logo">
        <img src="/Símbolo.png" alt="Campus Connect" /> {/* Make sure this path is correct */}
      </div>

      <button className="anuncios-button">
        <img src="/Anuncios.svg" alt="Anuncios" /> {/* Make sure this path is correct */}
        <span className="anuncios-tooltip">Anuncios</span>
      </button>

      {/* El botón de logout ha sido eliminado */}
    </div>
  );
}

export default Header;
