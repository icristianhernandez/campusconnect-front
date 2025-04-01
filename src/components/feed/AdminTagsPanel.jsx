import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import "./AdminTagsPanel.css";

function AdminTagsPanel() {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch all tags when component mounts
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("tag_name");
      
      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      setError(`Error al cargar los tags: ${error.message}`);
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Check if tag already exists
      const existingTag = tags.find(tag => 
        tag.tag_name.toLowerCase() === newTagName.trim().toLowerCase()
      );
      
      if (existingTag) {
        setError("Este tag ya existe");
        return;
      }
      
      // Insert new tag
      const { data, error } = await supabase
        .from("tags")
        .insert({ tag_name: newTagName.trim() })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setTags([...tags, data]);
      setNewTagName("");
      setSuccess("Tag creado correctamente");
    } catch (error) {
      setError(`Error al crear el tag: ${error.message}`);
      console.error("Error creating tag:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Check if it's the "anuncio" tag - we should not allow deletion of this special tag
      const tagToDelete = tags.find(tag => tag.id === tagId);
      if (tagToDelete && tagToDelete.tag_name.toLowerCase() === "anuncio") {
        setError("No se puede eliminar el tag 'anuncio'");
        return;
      }
      
      // Delete tag
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId);
      
      if (error) throw error;
      
      // Update local state
      setTags(tags.filter(tag => tag.id !== tagId));
      setSuccess("Tag eliminado correctamente");
    } catch (error) {
      setError(`Error al eliminar el tag: ${error.message}`);
      console.error("Error deleting tag:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-tags-panel">
      <h2>Administrar Tags</h2>
      
      <form onSubmit={handleCreateTag} className="create-tag-form">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Nombre del nuevo tag"
          disabled={loading}
          className="new-tag-input"
        />
        <button
          type="submit"
          disabled={loading || !newTagName.trim()}
          className="create-tag-button"
        >
          {loading ? "Creando..." : "Crear Tag"}
        </button>
      </form>
      
      {error && <p className="tags-error-message">{error}</p>}
      {success && <p className="tags-success-message">{success}</p>}
      
      <div className="tags-list">
        <h3>Tags existentes</h3>
        {loading && !tags.length ? (
          <p className="loading-message">Cargando tags...</p>
        ) : tags.length === 0 ? (
          <p className="no-tags-message">No hay tags disponibles</p>
        ) : (
          <ul>
            {tags.map(tag => (
              <li key={tag.id} className="tag-item">
                <span className="tag-name">{tag.tag_name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={loading || tag.tag_name.toLowerCase() === "anuncio"}
                  className={`delete-tag-button ${tag.tag_name.toLowerCase() === "anuncio" ? "disabled" : ""}`}
                >
                  {tag.tag_name.toLowerCase() === "anuncio" ? "Protegido" : "Eliminar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminTagsPanel;
