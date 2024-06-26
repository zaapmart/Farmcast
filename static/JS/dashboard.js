document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'f3c17a1d089141d4d04ca6d5ac44957e';
    const lat = 6.7133054; // declare constants to hold longitude and latitude
    const lon = 8.7001492;

    // Fetch current weather and 3-hour forecast
    fetchCurrentWeather(apiKey, lat, lon);
    fetchThreeHourForecast(apiKey, lat, lon);

    // Fetch profile data and display
    fetchProfileData();

    // Fetch and display other data (activities, todo_list, etc.)
    fetchActivities();
    fetchTodoList();
    fetchCropInfo();

    // Handle adding new farms
    const addFarmButton = document.getElementById('add-farm-button');
    const addFarmForm = document.getElementById('add-farm-form');
    const farmDetailsForm = document.getElementById('farm-details-form');

    if (addFarmButton) {
        addFarmButton.addEventListener('click', () => {
            addFarmForm.style.display = 'block';
        });
    }

    // Handle form submission for adding new farms
    if (farmDetailsForm) {
        farmDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // fetch inputs from the form
            const farmName = document.getElementById('farm-name').value;
            const farmLocation = document.getElementById('farm-location').value;
            const farmCoordinates = document.getElementById('farm-coordinates').value;
            const cropName = document.getElementById('crop-name').value;
            const cropSpecies = document.getElementById('crop-species').value;
            const plantingSeason = document.getElementById('planting-season').value;
            const expectedHarvest = document.getElementById('expected-harvest').value;
            const cropNotes = document.getElementById('crop-notes').value;

            // create a new farm object
            const newFarm = {
                name: farmName,
                location: farmLocation,
                coordinates: farmCoordinates,
                crop_name: cropName,
                crop_species: cropSpecies,
                planting_season: plantingSeason,
                expected_harvest: expectedHarvest,
                notes: cropNotes
            };

            // send new farm data to server
            fetch('/farms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newFarm)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    fetchProfileData();
                    fetchCropInfo();  // Refresh crop info section
                    addFarmForm.style.display = 'none';
                    alert('Farm added successfully');
                } else {
                    console.error('Error adding farm:', data);
                    alert('Error adding farm');
                }
            })
            .catch(error => {
                console.error('Error adding farm:', error);
                alert('Error adding farm');
            });
        });
    }

    // fetch profile data
    function fetchProfileData() {
        fetch('/profile')
            .then(response => response.json())
            .then(data => {
                const currentDate = new Date().toLocaleDateString();
                document.querySelector('.profile-details').innerHTML = `
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>Current Date:</strong> ${currentDate}</p>
                    <p><strong>Farms:</strong></p>
                    <ul id="farm-list">
                        ${data.farms.map(farm => `
                            <li>
                                ${farm.name} - ${farm.location} - ${farm.coordinates}
                            </li>
                        `).join('')}
                    </ul>
                `;
            })
            .catch(error => console.error('Error fetching profile data:', error));
    }

    // fetch and display current weather data
    function fetchCurrentWeather(apiKey, lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Current Weather Data:', data); // Log weather data for debugging
    
                document.getElementById('current-weather-description').textContent = data.weather[0].description;
                document.getElementById('current-temperature').textContent = `Temperature: ${data.main.temp}°C`;
                document.getElementById('current-humidity').textContent = `Humidity: ${data.main.humidity}%`;
                document.getElementById('current-wind').textContent = `Wind: ${data.wind.speed} km/h`;
    
                // Use the icon provided by the OpenWeather API
                const weatherIconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                const currentWeatherImg = document.getElementById('current-weather-img');
                currentWeatherImg.src = weatherIconUrl;
                currentWeatherImg.alt = data.weather[0].description;
            })
            .catch(error => console.error('Error fetching current weather data:', error));
    }
    
    
    // fetch and display 3-hour weather data
    function fetchThreeHourForecast(apiKey, lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const forecast = data.list.slice(0, 8); // Get the next 24 hours (8 * 3-hour segments)
                const forecastContainer = document.getElementById('three-hour-forecast');

                if (forecastContainer) {
                    forecastContainer.innerHTML = forecast.map(segment => {
                        const date = new Date(segment.dt * 1000);
                        return `
                            <div class="forecast-segment">
                                <p><strong>${date.getHours()}:00</strong></p>
                                <img src="https://openweathermap.org/img/wn/${segment.weather[0].icon}@2x.png" alt="${segment.weather[0].description}">
                                <p>${segment.weather[0].description}</p>
                                <p>Temp: ${segment.main.temp}°C</p>
                                <p>Humidity: ${segment.main.humidity}%</p>
                                <p>Wind: ${segment.wind.speed} km/h</p>
                            </div>
                        `;
                    }).join('');
                } else {
                    console.error('Error: forecastContainer is null');
                }
            })
            .catch(error => console.error('Error fetching 3-hour forecast data:', error));
    }

    // fetch farm activities
    function fetchActivities() {
        fetch('/activities')
            .then(response => response.json())
            .then(data => {
                const activitiesList = document.getElementById('activities-list');
                if (activitiesList) {
                    activitiesList.innerHTML = data.map(activity => `
                        <li>${activity.name} - ${activity.date_added} - ${activity.ideal_weather} - ${activity.resources_needed}</li>
                    `).join('');
                } else {
                    console.error('Error: activitiesList element is null');
                }
            })
            .catch(error => console.error('Error fetching activities:', error));
    }

    // fetch Todo list
    function fetchTodoList() {
        fetch('/todo_list')
            .then(response => response.json())
            .then(data => {
                const todoList = document.getElementById('todo-list');
                if (todoList) {
                    todoList.innerHTML = ''; // Clear any existing items
    
                    data.forEach(todo => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `${todo.name} - ${todo.date} - ${todo.weather_condition}`;
                        todoList.appendChild(listItem);
                    });
                } else {
                    console.error('Error: todoList element is null');
                }
            })
            .catch(error => console.error('Error fetching to-do list:', error));
    }      
    
    

    function sortTodoList() {
        const sortBy = document.getElementById('sort-by').value;
        const todoList = document.getElementById('todo-list');
        const items = Array.from(todoList.getElementsByTagName('li'));

        items.sort((a, b) => {
            const textA = a.textContent.toUpperCase();
            const textB = b.textContent.toUpperCase();

            if (sortBy === 'undone') {
                // Example sorting logic for 'undone' items
                return textA.localeCompare(textB);
            } else if (sortBy === 'deadline') {
                // Example sorting logic for 'deadline'
                const dateA = new Date(textA.split(' - ')[1]);
                const dateB = new Date(textB.split(' - ')[1]);
                return dateA - dateB;
            } else if (sortBy === 'date') {
                // Example sorting logic for 'date'
                const dateA = new Date(textA.split(' - ')[1]);
                const dateB = new Date(textB.split(' - ')[1]);
                return dateA - date
                return dateA - dateB;
            }
        });

        // Clear and re-append sorted items
        todoList.innerHTML = '';
        items.forEach(item => todoList.appendChild(item));
    }

    function fetchCropInfo() {
        fetch('/crop_info')
            .then(response => response.json())
            .then(data => {
                const cropInfoContent = document.querySelector('.crop-info-content');
                if (cropInfoContent) {
                    if (data.error) {
                        cropInfoContent.innerHTML = `<p>${data.error}</p>`;
                    } else {
                        cropInfoContent.innerHTML = `
                            <p><strong>Crop Name:</strong> ${data.name}</p>
                            <p><strong>Species:</strong> ${data.species}</p>
                            <p><strong>Planting Season:</strong> ${data.planting_season}</p>
                            <p><strong>Expected Harvest:</strong> ${data.expected_harvest}</p>
                            <p><strong>Notes:</strong> ${data.notes}</p>
                        `;
                    }
                } else {
                    console.error('Error: crop-info-content element is null');
                }
            })
            .catch(error => console.error('Error fetching crop info:', error));
    }
});
