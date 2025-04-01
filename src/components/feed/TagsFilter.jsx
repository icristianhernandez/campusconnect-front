import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import "./TagsFilter.css";

function TagsFilter({ onFilterChange }) {
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use a special ID for the "General" filter option
  const GENERAL_TAG_ID = -1;

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    // Notify parent component when selected tags change
    onFilterChange(selectedTags);
  }, [selectedTags, onFilterChange]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

  const toggleTagSelection = (tagId) => {
    setSelectedTags(prevSelectedTags => {
      if (prevSelectedTags.includes(tagId)) {
        return prevSelectedTags.filter(id => id !== tagId);
      } else {
        return [...prevSelectedTags, tagId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="tags-filter">
      <h3>Filtrar por Tags</h3>
      
      {loading ? (
        <p className="tags-loading">Cargando tags...</p>
      ) : error ? (
        <p className="tags-error">{error}</p>
      ) : (
        <>
          <div className="tags-list">
            {/* Add the General filter option at the top */}
            <div 
              className={`filter-tag-option ${selectedTags.includes(GENERAL_TAG_ID) ? 'selected' : ''}`}
              onClick={() => toggleTagSelection(GENERAL_TAG_ID)}
            >
              <span className="filter-tag-name">General</span>
              {selectedTags.includes(GENERAL_TAG_ID) && (
                <span className="tag-selected-indicator">✓</span>
              )}
            </div>
            
            {/* Divider between General and other tags */}
            <div className="tags-divider"></div>
            
            {tags.length === 0 ? (
              <p className="no-tags">No hay tags disponibles</p>
            ) : (
              tags.map(tag => (
                <div 
                  key={tag.id}
                  className={`filter-tag-option ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                  onClick={() => toggleTagSelection(tag.id)}
                >
                  <span className="filter-tag-name">{tag.tag_name}</span>
                  {selectedTags.includes(tag.id) && (
                    <span className="tag-selected-indicator">✓</span>
                  )}
                </div>
              ))
            )}
          </div>
          
          {selectedTags.length > 0 && (
            <button 
              className="clear-filters-button"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default TagsFilter;
