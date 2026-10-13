
document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  
    // Generate example sensor readings for the dashboard.
    setText("moisture", randomInt(35, 68));
    setText("humidity", randomInt(42, 72));
    setText("tank", randomInt(55, 96));
  
    // Draw an example sensor trend chart.
    const canvas = document.getElementById("sensorChart");
    if (canvas && window.Chart) {
      new Chart(canvas, {
        type: "line",
        data: {
          labels: ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "Now"],
          datasets: [
            {
              label: "Soil Moisture (%)",
              data: [42, 45, 43, 49, 53, 56],
              borderColor: "#1f9d68",
              tension: 0.3
            },
            {
              label: "Humidity (%)",
              data: [58, 55, 60, 57, 62, 64],
              borderColor: "#8b73db",
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { min: 0, max: 100 }
          }
        }
      });
    }
  
    // Get live weather after the user shares browser location.
    const weatherButton = document.getElementById("weather-button");
    if (weatherButton) {
      weatherButton.addEventListener("click", () => {
        getLocation(async (lat, lon) => {
          try {
            const url =
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
              `&longitude=${lon}` +
              `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
  
            const response = await fetch(url);
            if (!response.ok) throw new Error("Weather service unavailable");
            const data = await response.json();
            const current = data.current;
  
            setText("temperature", Math.round(current.temperature_2m));
            setText("weather-description",
              `Current temperature: ${current.temperature_2m}°C`);
            setText("weather-humidity",
              `Humidity: ${current.relative_humidity_2m}%`);
            setText("weather-wind",
              `Wind: ${current.wind_speed_10m} km/h`);
            setText("weather-status", "Weather data loaded successfully.");
          } catch (error) {
            setText("weather-status",
              "Unable to load weather. Check your internet connection.");
          }
        }, "weather-status");
      });
    }
  
    // Show location and map on the farm page.
    const locationButton = document.getElementById("location-button");
    if (locationButton) {
      locationButton.addEventListener("click", () => {
        getLocation((lat, lon) => {
          setText("latitude", lat.toFixed(5));
          setText("longitude", lon.toFixed(5));
  
          const map = document.getElementById("map-frame");
          const bbox =
            `${lon - 0.015}%2C${lat - 0.015}%2C` +
            `${lon + 0.015}%2C${lat + 0.015}`;
  
          map.innerHTML = `
            <iframe title="Map of shared location"
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}">
            </iframe>`;
          setText("location-status", "Location received.");
        }, "location-status");
      });
    }
  
    // Demonstration irrigation controls.
    const zones = [...document.querySelectorAll(".zone-card")];
    const activeZones = new Set();
  
    function updateIrrigation() {
      setText("active-zones", activeZones.size);
      const flow = zones.reduce((total, card) => {
        const zone = Number(card.dataset.zone);
        return total + (activeZones.has(zone)
          ? Number(card.dataset.flow) : 0);
      }, 0);
      setText("water-flow", flow);
    }
  
    zones.forEach(card => {
      const zone = Number(card.dataset.zone);
      const button = card.querySelector(".zone-toggle");
      const status = card.querySelector(".zone-status");
  
      button.addEventListener("click", () => {
        if (activeZones.has(zone)) {
          activeZones.delete(zone);
          status.textContent = "OFF";
          button.textContent = "Turn On";
        } else {
          activeZones.add(zone);
          status.textContent = "ON";
          button.textContent = "Turn Off";
        }
        updateIrrigation();
      });
    });
  
    const allOffButton = document.getElementById("all-off");
    if (allOffButton) {
      allOffButton.addEventListener("click", () => {
        activeZones.clear();
        zones.forEach(card => {
          card.querySelector(".zone-status").textContent = "OFF";
          card.querySelector(".zone-toggle").textContent = "Turn On";
        });
        updateIrrigation();
      });
    }
  });
  
  function getLocation(callback, statusId) {
    if (!navigator.geolocation) {
      setText(statusId, "Your browser does not support geolocation.");
      return;
    }
  
    setText(statusId, "Requesting location permission…");
  
    navigator.geolocation.getCurrentPosition(
      position => callback(
        position.coords.latitude,
        position.coords.longitude
      ),
      error => {
        if (error.code === 1) {
          setText(statusId, "Location permission was denied.");
        } else {
          setText(statusId, "Unable to get location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }
  
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
  