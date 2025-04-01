import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase"; // Ensure this import is correct
import "./Header.css";

function Header({ onSearch }) {
  const navigate = useNavigate();

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error logging out:", error);
        alert("Error al cerrar sesión. Por favor intente nuevamente.");
      } else {
        // Redirect to login page after successful logout
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      alert("Error inesperado al cerrar sesión.");
    }
  };

  return (
    <div className="Header">
      <div className="header-search">
        <img
          src="/Lupa.svg" // Make sure this path is correct
          alt="Search"
          className="search-icon"
        />
        <input
          type="text"
          placeholder="Buscar..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

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

      {/* New Logout Button */}
      <button className="logout-button" onClick={handleLogout}>
        <img src="/log_out.png" alt="Cerrar sesión" />
        <span className="logout-tooltip">Cerrar sesión</span>
      </button>
    </div>
  );
}

export default Header;
