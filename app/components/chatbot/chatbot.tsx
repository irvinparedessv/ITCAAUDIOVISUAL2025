import { useState, useEffect, useRef } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?', sender: 'bot' },
    { id: 2, text: 'Puedes preguntarme sobre nuestros servicios o cualquier duda que tengas.', sender: 'bot' }
  ]);

  const chatRef = useRef<HTMLDivElement>(null);


  // Detecta el modo oscuro de Bootstrap
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = document.documentElement.getAttribute('data-bs-theme') === 'dark';
      setIsDarkMode(darkModeEnabled);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Detecta clics fuera del modal para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && chatRef.current && !chatRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user'
    };
    setMessages([...messages, userMessage]);
    setInputMessage('');

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: `Recibí tu mensaje: "${inputMessage}". Estoy procesando tu solicitud...`,
        sender: 'bot'
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div ref={chatRef} className={`chatbot-container ${isOpen ? 'open' : ''}`}>
  {isOpen ? (
    <div className={`chat-window ${isDarkMode ? 'dark-mode' : ''}`}>

          <div className={`chat-window ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="chat-header">
              <h3>Asistente Virtual</h3>
              <button className="close-btn" onClick={toggleChat}>
                ×
              </button>
            </div>
            <div className="chat-messages">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender} ${isDarkMode ? 'dark-mode' : ''}`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Escribe tu mensaje..." 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className={isDarkMode ? 'dark-mode' : ''}
              />
              <button 
                onClick={handleSendMessage}
                className={isDarkMode ? 'dark-mode' : ''}
                disabled={!inputMessage.trim()}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className={`chatbot-button ${isDarkMode ? 'dark-mode' : ''}`} onClick={toggleChat}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
