// ===============================
// Configuration
// ===============================

const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY_HERE";


// Base URLs
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEODB_BASE_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";

// ===============================
// DOM Elements
// ===============================
const cityInput = document.getElementById("city-input");
const suggestionsList = document.getElementById("suggestions");
const searchBtn = document.getElementById("search-btn");
const errorMessage = document.getElementById("error-message");

const weatherCard = document.getElementById("weather-card");
const weatherCity = document.getElementById("weather-city");
const weatherDescription = document.getElementById("weather-description");
const weatherTemp = document.getElementById("weather-temp");
const weatherHumidity = document.getElementById("weather-humidity");
const weatherFeels = document.getElementById("weather-feels");
const weatherIcon = document.getElementById("weather-icon");

// ===============================
// Utility: Debounce
// ===============================

/**
 * Creates a debounced version of a function that delays its execution
 * until after `delay` milliseconds have passed since the last call.
 * @param {Function} fn - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ===============================
// Error Handling Helpers
// ===============================

/**
 * Displays an error message to the user.
 * @param {string} message - Error message to show.
 */
function showError(message) {
  errorMessage.textContent = message;
}

/**
 * Clears any existing error message.
 */
function clearError() {
  errorMessage.textContent = "";
}

// ===============================
// Weather API Logic
// ===============================

/**
 * Fetches weather data for a given city from the OpenWeatherMap API.
 * @param {string} cityName - Name of the city.
 * @returns {Promise<object>} - Weather data JSON.
 */
async function fetchWeather(cityName) {
  const url = `${OPENWEATHER_BASE_URL}?q=${encodeURIComponent(
    cityName
  )}&appid=${OPENWEATHER_API_KEY}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("City not found or API error.");
  }
  return response.json();
}

/**
 * Renders weather data into the weather card section.
 * @param {object} data - Weather data from OpenWeatherMap.
 */
function renderWeather(data) {
  const city = `${data.name}, ${data.sys.country}`;
  const description = data.weather[0].description;
  const temp = Math.round(data.main.temp);
  const humidity = data.main.humidity;
  const feelsLike = Math.round(data.main.feels_like);
  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  weatherCity.textContent = city;
  weatherDescription.textContent = description;
  weatherTemp.textContent = temp;
  weatherHumidity.textContent = humidity;
  weatherFeels.textContent = feelsLike;
  weatherIcon.src = iconUrl;
  weatherIcon.alt = description;

  weatherCard.classList.remove("hidden");
}

/**
 * Handles the main flow: read input, fetch weather, and render it.
 */
async function handleSearch() {
  clearError();
  const cityName = cityInput.value.trim();

  if (!cityName) {
    showError("Please enter a city name.");
    weatherCard.classList.add("hidden");
    return;
  }

  try {
    const data = await fetchWeather(cityName);
    renderWeather(data);
  } catch (err) {
    weatherCard.classList.add("hidden");
    showError(err.message || "Unable to fetch weather data.");
  }
}

// RapidAPI key 
const GEODB_API_KEY = "YOUR_RAPIDAPI_KEY_HERE";


/**
 * Fetches city suggestions from the GeoDB Cities API.
 * @param {string} query - Partial city name.
 * @returns {Promise<Array>} - List of city objects.
 */
async function fetchCitySuggestions(query) {
  if (!GEODB_API_KEY) {
    // If no key is provided, skip autosuggest.
    return [];
  }

  const url = `${GEODB_BASE_URL}?namePrefix=${encodeURIComponent(
    query
  )}&limit=5&sort=-population`;

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": GEODB_API_KEY,
      "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching city suggestions.");
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Renders a list of city suggestions under the input.
 * @param {Array} cities - List of city objects from GeoDB.
 */
function renderSuggestions(cities) {
  suggestionsList.innerHTML = "";

  if (!cities.length) {
    suggestionsList.style.display = "none";
    return;
  }

  cities.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = `${city.city}, ${city.countryCode}`;
    li.addEventListener("click", () => {
      cityInput.value = city.city;
      suggestionsList.innerHTML = "";
      suggestionsList.style.display = "none";
      handleSearch();
    });
    suggestionsList.appendChild(li);
  });

  suggestionsList.style.display = "block";
}

/**
 * Handles input changes and triggers autosuggest with debounce.
 * @param {Event} event - Input event.
 */
const handleInputChange = debounce(async (event) => {
  const query = event.target.value.trim();
  if (query.length < 2) {
    suggestionsList.innerHTML = "";
    suggestionsList.style.display = "none";
    return;
  }

  try {
    const cities = await fetchCitySuggestions(query);
    renderSuggestions(cities);
  } catch (err) {
    // For autosuggest errors, we fail silently to avoid annoying the user.
    console.error(err);
  }
}, 400);

// ===============================
// Event Listeners
// ===============================

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSearch();
  }
});

cityInput.addEventListener("input", handleInputChange);
