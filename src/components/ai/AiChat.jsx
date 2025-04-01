import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AiChat.css';

// Define topics and responses in a structured way
const aiResponses = {
  greeting: {
    patterns: ['hola', 'hi', 'buenos dias', 'saludos', 'qué tal'],
    response: "¡Hola! ¿En qué puedo ayudarte?",
    followUpSuggestions: ['¿Cómo publicar?', 'Información de cursos', 'Anuncios importantes']
  },
  thanks: {
    patterns: ['gracias', 'agradecido', 'muchas gracias', 'thank you'],
    response: "¡De nada! Estoy aquí para ayudarte.",
    followUpSuggestions: ['Necesito más ayuda', '¿Qué puedes hacer?', 'Información de cursos']
  },
  courses: {
    patterns: ['clase', 'curso', 'información de cursos', 'apuntes', 'materias'],
    response: "Puedes encontrar información sobre tus cursos en la sección de 'Apuntes'. ¿Necesitas ayuda para acceder?",
    followUpSuggestions: ['¿Cómo accedo a mis apuntes?', '¿Dónde veo mis cursos?', 'Buscar cursos']
  },
  password: {
    patterns: ['contraseña', 'password', 'olvidé', 'recuperar cuenta', 'no puedo entrar'],
    response: "Para restablecer tu contraseña, ve a la página de inicio de sesión y haz clic en '¿Has olvidado tu contraseña?'",
    followUpSuggestions: ['Problemas con el login', '¿Cómo cambiar contraseña?', 'Contactar soporte']
  },
  posting: {
    patterns: ['publicar', 'post', 'cómo publicar', 'crear publicación', 'compartir'],
    response: "Para crear una nueva publicación, haz clic en el botón 'Crear' que está en la parte superior del feed.",
    followUpSuggestions: ['¿Qué tipo de contenido puedo publicar?', '¿Cómo añadir imágenes?', 'Política de publicaciones']
  },
  commenting: {
    patterns: ['comentar', 'comentarios', 'comentar en posts', 'responder'],
    response: "Para comentar una publicación, escribe tu comentario en el cuadro de texto que aparece en la parte inferior de cada post y presiona enter.",
    followUpSuggestions: ['¿Cómo eliminar un comentario?', 'Notificaciones de comentarios', 'Mencionar usuarios']
  },
  university: {
    patterns: ['usm', 'universidad', 'santa maría', 'utem', 'campus connect'],
    response: "Campus Connect es la plataforma social oficial de la Universidad Santa María. Aquí puedes interactuar con otros estudiantes y profesores.",
    followUpSuggestions: ['Historia de la USM', 'Contacto de la universidad', 'Servicios estudiantiles']
  },
  announcements: {
    patterns: ['anuncio', 'qué son los anuncios', 'comunicados', 'noticias'],
    response: "Los anuncios importantes de la universidad se publican en la sección 'Anuncios'. Puedes acceder haciendo clic en el botón de anuncios en la barra superior.",
    followUpSuggestions: ['Anuncios recientes', '¿Quién puede crear anuncios?', 'Notificaciones de anuncios']
  },
  profile: {
    patterns: ['perfil', 'mi perfil', 'configuración de cuenta', 'mis datos'],
    response: "Puedes acceder a tu perfil desde el botón 'Perfil' en la columna izquierda del feed.",
    followUpSuggestions: ['Editar mi perfil', 'Cambiar foto de perfil', 'Privacidad del perfil']
  },
  goodbye: {
    patterns: ['bye', 'adios', 'chao', 'hasta luego', 'nos vemos'],
    response: "¡Hasta pronto! Si necesitas más ayuda, no dudes en volver a contactarme.",
    followUpSuggestions: ['Iniciar nueva conversación', 'Volver al inicio', 'Valorar asistente']
  },
  help: {
    patterns: ['ayuda', 'puedes hacer', 'qué haces', 'funciones', 'capacidades'],
    response: "Puedo ayudarte con información sobre:\n- Cómo publicar contenido\n- Información sobre anuncios\n- Acceso a cursos y apuntes\n- Cómo acceder a tu perfil\n- Cómo comentar en publicaciones\n- Información general sobre Campus Connect",
    followUpSuggestions: ['¿Cómo publicar?', 'Información de cursos', 'Mi perfil', 'Anuncios importantes']
  }
};

// Default response when no match is found
const defaultResponse = {
  response: "No estoy seguro de cómo ayudarte con eso. ¿Podrías reformular tu pregunta? Puedo ayudarte con información sobre clases, publicaciones, comentarios, perfil y funciones básicas de Campus Connect.",
  followUpSuggestions: ['¿Qué puedes hacer?', '¿Cómo publicar?', 'Información de cursos', 'Anuncios importantes']
};

// Generate all available topic suggestions
const allTopicSuggestions = Object.keys(aiResponses).map(key => {
  // Take the first follow-up suggestion from each topic as a representative
  return aiResponses[key].followUpSuggestions[0];
}).filter(suggestion => suggestion !== undefined);

function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "¡Hola! Soy el asistente virtual de Campus Connect. ¿En qué puedo ayudarte hoy?", 
      sender: "ai",
      suggestions: allTopicSuggestions.slice(0, 5) // Show only first 5 suggestions initially
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('medium');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const location = useLocation();
  
  // Determine if we're on the feed page (with header)
  const isFeedPage = location.pathname === '/feed';

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([
      { 
        id: 1, 
        text: "Conversación reiniciada. ¡Hola! Soy el asistente virtual de Campus Connect. ¿En qué puedo ayudarte hoy?", 
        sender: "ai",
        suggestions: allTopicSuggestions.slice(0, 5) // Show only first 5 suggestions after reset
      }
    ]);
  };

  // Check screen size and if device is mobile on mount
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      
      if (width >= 1200) {
        setScreenSize('large');
      } else if (width >= 768) {
        setScreenSize('medium');
      } else if (width >= 480) {
        setScreenSize('small');
      } else {
        setScreenSize('xsmall');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Detect keyboard opening on mobile devices
  useEffect(() => {
    if (!isMobile) return;
    
    const detectKeyboard = () => {
      // On most mobile devices, the keyboard reduces the viewport height
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const windowHeight = window.innerHeight;
      
      // If viewport height is significantly smaller than window height, keyboard is likely open
      const keyboardOpen = viewportHeight < windowHeight * 0.8;
      setIsKeyboardOpen(keyboardOpen);
    };
    
    // Use visualViewport API if available for better accuracy
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
      return () => window.visualViewport.removeEventListener('resize', detectKeyboard);
    } else {
      window.addEventListener('resize', detectKeyboard);
      return () => window.removeEventListener('resize', detectKeyboard);
    }
  }, [isMobile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  // Add resize handler to adjust chat container on viewport changes
  useEffect(() => {
    const handleResize = () => {
      if (chatContainerRef.current && isOpen) {
        // Ensure chat is properly sized after resize
        scrollToBottom();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    const newUserMessage = {
      id: messages.length + 1,
      text: suggestion,
      sender: "user"
    };
    setMessages(prev => [...prev, newUserMessage]);
    generateAIResponse(suggestion);
  };

  const findMatchingTopic = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Check each topic's patterns for a match
    for (const [topic, data] of Object.entries(aiResponses)) {
      if (data.patterns.some(pattern => lowerInput.includes(pattern))) {
        return { topic, ...data };
      }
    }
    
    // No match found, return default
    return defaultResponse;
  };

  const generateAIResponse = (userMessage) => {
    setIsTyping(true);
    
    setTimeout(() => {
      // Find the matching topic or get default response
      const matchedResponse = findMatchingTopic(userMessage);
      
      // Create the AI message with text and follow-up suggestions
      const newAiMessage = {
        id: messages.length + 2,
        text: matchedResponse.response,
        sender: "ai",
        suggestions: matchedResponse.followUpSuggestions || defaultResponse.followUpSuggestions
      };
      
      setMessages(prev => [...prev, newAiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    const newUserMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user"
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    generateAIResponse(inputValue);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // If closing chat on mobile with keyboard open, need to blur input
    if (isOpen && isMobile && isKeyboardOpen && inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Determine chat button text based on screen size
  const getChatButtonText = () => {
    if (isOpen) return '×';
    if (screenSize === 'xsmall') return 'AI';
    return 'Asistente';
  };

  return (
    <>
      <button 
        className={`ai-chat-floating-button ${isOpen ? 'open' : ''} ${screenSize}`} 
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {getChatButtonText()}
      </button>
      <div 
        ref={chatContainerRef}
        className={`ai-chat-container ${isOpen ? 'open' : ''} ${isFeedPage ? 'feed-page' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''}`}
        style={{ zIndex: 9999 }}
      >
        <div className="ai-chat-header">
          <h3>Asistente Virtual</h3>
          <div className="ai-chat-header-actions">
            <button 
              className="ai-chat-clear" 
              onClick={clearChatHistory} 
              aria-label="Limpiar historial"
              title="Limpiar historial"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" height="18" width="18">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z"></path>
              </svg>
            </button>
            <button className="ai-chat-close" onClick={toggleChat} aria-label="Close chat">×</button>
          </div>
        </div>
        <div className="ai-chat-messages">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`ai-chat-message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              {message.sender === 'ai' && (
                <div className="ai-avatar">AI</div>
              )}
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
          
          {/* Add suggestion chips after the most recent AI message */}
          {messages.length > 0 && messages[messages.length - 1].sender === 'ai' && (
            <div className="message-suggestions">
              <div className="suggestions-container">
                {messages[messages.length - 1].suggestions?.map((suggestion, index) => (
                  <button 
                    key={index} 
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {isTyping && (
            <div className="ai-chat-message ai-message">
              <div className="ai-avatar">AI</div>
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="ai-chat-input-container" onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Escribe tu mensaje..."
            className="ai-chat-input"
            onFocus={() => isMobile && scrollToBottom()}
          />
          <button 
            type="submit" 
            className="ai-chat-send-button"
            disabled={inputValue.trim() === ''}
            aria-label="Enviar mensaje"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}

export default AiChat;