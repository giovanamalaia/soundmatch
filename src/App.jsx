import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [allSongs, setAllSongs] = useState([]); 
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    async function fetchAllSongs() {
      try {
        const response = await fetch("https://giovanamalaia.pythonanywhere.com/all_songs");
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllSongs(data);
        }
      } catch (err) {
        console.error("Erro ao carregar lista de músicas:", err);
      }
    }
    fetchAllSongs();
  }, []);

  async function handleSearch(term) {
    const searchTerm = term || input; 
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setRecommendations([]);
    setShowSuggestions(false); 

    try {
      const url = `https://giovanamalaia.pythonanywhere.com/recommend/${encodeURIComponent(searchTerm)}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Música não encontrada. Tente outra!");
      }

      setRecommendations(data);
      if (term) setInput(term); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.length > 1) {
      const filtered = allSongs.filter((song) => 
        song.track_name.toLowerCase().includes(value.toLowerCase()) ||
        song.track_artist.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); 

      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (songName) => {
    setInput(songName);
    handleSearch(songName);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="container">

      <div className="header">
        <h1 className="title">SoundMatch 🎧</h1>
        <p className="subtitle">
          Digite uma música que você gosta e sugerimos <span className="highlight">5 parecidas</span>.
        </p>
      </div>
      
      <div className="search-wrapper" ref={wrapperRef}>
        <div className="search-box">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => input.length > 1 && setShowSuggestions(true)}
            placeholder="Ex: Shape of You..."
            autoComplete="off"
          />
          <button onClick={() => handleSearch()} disabled={loading}>
            {loading ? "..." : "Buscar"}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((song, index) => (
              <li 
                key={index} 
                onClick={() => handleSuggestionClick(song.track_name)}
                className="suggestion-item"
              >
                <span className="sug-name">{song.track_name}</span>
                <span className="sug-artist"> • {song.track_artist}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="error-msg">⚠️ {error}</div>}

      <div className="results-list">
        {recommendations.map((song) => (
          <div key={song.track_id} className="song-card">
            <div className="song-info">
              <h3>{song.track_name}</h3>
              <p>{song.track_artist}</p>
            </div>
            
            <a 
              href={`https://open.spotify.com/track/${song.track_id}`} 
              target="_blank" 
              rel="noreferrer"
              className="spotify-link"
            >
              Ouvir no Spotify
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;