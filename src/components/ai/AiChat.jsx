import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AiChat.css';

function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "¡Hola! Soy el asistente virtual de Campus Connect. ¿En qué puedo ayudarte hoy?", sender: "ai" }
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
  
  // Suggestion chips for common questions
  const suggestionChips = [
    { id: 1, text: "¿Cómo publicar?" },
    { id: 2, text: "¿Qué son los anuncios?" },
    { id: 3, text: "Información de cursos" },
    { id: 4, text: "Mi perfil" },
    { id: 5, text: "Comentar en posts" }
  ];
  
  // Determine if we're on the feed page (with header)
  const isFeedPage = location.pathname === '/feed';

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([
      { id: 1, text: "Conversación reiniciada. ¡Hola! Soy el asistente virtual de Campus Connect. ¿En qué puedo ayudarte hoy?", sender: "ai" }
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

  const generateAIResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    setIsTyping(true);
    setTimeout(() => {
      let response;
      if (lowerMsg.includes('hola') || lowerMsg.includes('hi') || lowerMsg.includes('buenos dias')) {
        response = "¡Hola! ¿En qué puedo ayudarte?";
      } else if (lowerMsg.includes('gracias')) {
        response = "¡De nada! Estoy aquí para ayudarte.";
      } else if (lowerMsg.includes('clase') || lowerMsg.includes('curso') || lowerMsg.includes('información de cursos')) {
        response = "Puedes encontrar información sobre tus cursos en la sección de 'Apuntes'. ¿Necesitas ayuda para acceder?";
      } else if (lowerMsg.includes('contraseña') || lowerMsg.includes('password') || lowerMsg.includes('olvidé')) {
        response = "Para restablecer tu contraseña, ve a la página de inicio de sesión y haz clic en '¿Has olvidado tu contraseña?'";
      } else if (lowerMsg.includes('publicar') || lowerMsg.includes('post') || lowerMsg.includes('cómo publicar')) {
        response = "Para crear una nueva publicación, haz clic en el botón 'Crear' que está en la parte superior del feed.";
      } else if (lowerMsg.includes('comentar') || lowerMsg.includes('comentarios') || lowerMsg.includes('comentar en posts')) {
        response = "Para comentar una publicación, escribe tu comentario en el cuadro de texto que aparece en la parte inferior de cada post y presiona enter.";
      } else if (lowerMsg.includes('usm') || lowerMsg.includes('universidad')) {
        response = "Campus Connect es la plataforma social oficial de la Universidad Santa María. Aquí puedes interactuar con otros estudiantes y profesores.";
      } else if (lowerMsg.includes('anuncio') || lowerMsg.includes('qué son los anuncios')) {
        response = "Los anuncios importantes de la universidad se publican en la sección 'Anuncios'. Puedes acceder haciendo clic en el botón de anuncios en la barra superior.";
      } else if (lowerMsg.includes('perfil') || lowerMsg.includes('mi perfil')) {
        response = "Puedes acceder a tu perfil desde el botón 'Perfil' en la columna izquierda del feed.";
      } else if (lowerMsg.includes('bye') || lowerMsg.includes('adios') || lowerMsg.includes('chao')) {
        response = "¡Hasta pronto! Si necesitas más ayuda, no dudes en volver a contactarme.";
      } else if (lowerMsg.includes('ayuda') || lowerMsg.includes('puedes hacer')) {
        response = "Puedo ayudarte con información sobre:\n- Cómo publicar contenido\n- Información sobre anuncios\n- Acceso a cursos y apuntes\n- Cómo acceder a tu perfil\n- Cómo comentar en publicaciones\n- Información general sobre Campus Connect";
      } else {
        response = "No estoy seguro de cómo ayudarte con eso. ¿Podrías reformular tu pregunta? Puedo ayudarte con información sobre clases, publicaciones, comentarios, perfil y funciones básicas de Campus Connect.";
      }
      setMessages(prev => [
        ...prev, 
        { id: prev.length + 2, text: response, sender: "ai" }
      ]);
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
        
        {/* Suggestion chips section */}
        {messages.length < 3 && (
          <div className="ai-chat-suggestions">
            <p className="suggestions-title">Puedo ayudarte con:</p>
            <div className="suggestions-container">
              {suggestionChips.map(chip => (
                <button 
                  key={chip.id} 
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(chip.text)}
                >
                  {chip.text}
                </button>
              ))}
            </div>
          </div>
        )}
        
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