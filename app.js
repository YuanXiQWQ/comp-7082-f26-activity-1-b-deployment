/* ===================================================================
   1. CONFIG  —  paste your OpenWeatherMap key between the quotes.
   =================================================================== */
   //get setScene from part c
import { setScene } from "./sky.js";
//const API_KEY = "bd1004e3345d2e70808956dc39382db4";
const WEATHER_API_URL ="https://sky-window-api.ljf920727.workers.dev/weather";
const UNITS = "metric";            // "metric" = °C, "imperial" = °F

/* ===================================================================
   2. GRAB THE ELEMENTS WE NEED
   =================================================================== */
const form     = document.getElementById("search");
const cityBox  = document.getElementById("city");
const readout  = document.getElementById("readout");
const message  = document.getElementById("message");


/* ===================================================================
   3. TALK TO THE API
   =================================================================== */
async function fetchWeather(city) {
  /*const url = "https://api.openweathermap.org/data/2.5/weather"
            + "?q=" + encodeURIComponent(city)
            + "&units=" + UNITS
            + "&appid=" + API_KEY; */
  const url = WEATHER_API_URL + "?city=" + encodeURIComponent(city);
 

  const response = await fetch(url);
  
  let data;
  
  try{
	  data= await response.json();
  }catch{
	  throw new Error(
		"The weather service returned an invalid response."
	  );
  }

  // fetch() does NOT throw on 404 or 401 — you have to check yourself.
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No city called \u201C" + city + "\u201D. Check the spelling, or add a country code like Paris,FR.");
    }
	if(data.message){
		throw new Error(data.message);
	}
   
   throw new Error(
		"The weather service returned error " +
      response.status +
      ". Try again shortly.");
  }
  return data;
}

/* ===================================================================
   4. HANDLE THE SEARCH
   =================================================================== */
form.addEventListener("submit", async (event) => {
  event.preventDefault();                 // stop the page reloading
  const city = cityBox.value.trim();

  if (city === "") {
    showMessage("Type a city name first.");
	cityBox.focus();
    return;
  }
  
   showMessage("Checking…");

  try {
    const data = await fetchWeather(city);
    console.log(data);                    // look here to find more fields to show
    
	render(data);
  } catch (error) {
    // A dropped connection lands here too, as a TypeError.
    showMessage(error instanceof TypeError
      ? "Can\u2019t reach the weather service. Check your connection."
      : error.message);
  }
});

/* ===================================================================
   5. PUT THE DATA ON SCREEN
   =================================================================== */
function render(data) {
  const degree = UNITS === "metric" ? "\u00B0C" : "\u00B0F";

  document.getElementById("place").textContent     = data.name + ", " + data.sys.country;
  document.getElementById("temp").innerHTML        = Math.round(data.main.temp) + "<span>" + degree + "</span>";
  document.getElementById("condition").textContent = capitalise(data.weather[0].description);
  document.getElementById("feels").textContent     = Math.round(data.main.feels_like) + degree;
  document.getElementById("humidity").textContent  = data.main.humidity + "%";
  document.getElementById("wind").textContent      = Math.round(data.wind.speed * 3.6) + " km/h";

  readout.classList.remove("hidden");
  message.classList.add("hidden");
  const sceneKind = getSceneKind(
    data.weather[0].main
  );

  const isNight =
    data.weather[0].icon.endsWith("n");
  // data.weather[0].main is "Rain", "Clouds", "Clear", "Snow"...
  // data.weather[0].icon ends in "d" for day, "n" for night.
   setScene(sceneKind, isNight);
}

function showMessage(text) {
  message.textContent = text;
  message.classList.remove("hidden");
  readout.classList.add("hidden");
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getSceneKind(weatherKind) {
  if (weatherKind === "Clear") {
    return "Clear";
  }

  if (
    weatherKind === "Rain" ||
    weatherKind === "Drizzle" ||
    weatherKind === "Thunderstorm"
  ) {
    return "Rain";
  }

  if (weatherKind === "Snow") {
    return "Snow";
  }

  // Mist、Fog、Haze等其他天气使用Clouds。
  return "Clouds";
}