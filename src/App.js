import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [city, setCity] = useState('');
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    setLoading(true);
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const cityName = await fetchCityFromCoordinates(latitude, longitude);
          if (cityName) {
            setCity(cityName);
            fetchBands(cityName);
          }
        },
        async () => {
          const response = await axios.get('https://get.geojs.io/v1/ip/geo.json');
          setCity(response.data.city);
          fetchBands(response.data.city);
        }
      );
    } else {
      const response = await axios.get('https://get.geojs.io/v1/ip/geo.json');
      setCity(response.data.city);
      fetchBands(response.data.city);
    }
  };

  const fetchCityFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: { lat: latitude, lon: longitude, format: 'json' },
      });
      return response.data.address.city || response.data.address.town || response.data.address.village;
    } catch (error) {
      console.error('Error fetching city name from coordinates:', error);
      return null;
    }
  };

  const fetchBands = async (cityName) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `https://musicbrainz.org/ws/2/artist/?query=area:${cityName}%20AND%20type:group&fmt=json&limit=50`
      );
      const recentBands = response.data.artists.filter((artist) => {
        const beginYear = parseInt(artist['life-span']?.begin?.slice(0, 4));
        return beginYear && new Date().getFullYear() - beginYear <= 10;
      });
      setBands(recentBands.length ? recentBands : setError('No results found'));
    } catch (error) {
      console.error('Error fetching bands:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (city) fetchBands(city);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>City Bands Finder</h1>
      <form onSubmit={handleCitySearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter a city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            width: '200px',
            marginRight: '10px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
      </form>

      {loading ? (
        <p style={{ color: '#666' }}>Loading bands...</p>
      ) : error ? (
        <p style={{ color: '#ff4d4f' }}>{error}</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {bands.map((band) => (
            <li key={band.id} style={{
              padding: '10px',
              borderBottom: '1px solid #eee',
              maxWidth: '300px',
              margin: '0 auto',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '5px 0', color: '#007bff' }}>{band.name}</h3>
              <p style={{ margin: '5px 0', color: '#555' }}>Location: {band.area?.name}</p>
              <p style={{ margin: '5px 0', color: '#555' }}>Formed: {band['life-span']?.begin}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
