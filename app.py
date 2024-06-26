from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
import requests

app = Flask(__name__)

# Configure session
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

# Initialize empty data storage (in-memory)
data_store = {
    "profile": {"name": "", "farms": []},
    "activities": [],
    "todo_list": [],
    "crop_info": {
        "name": "",
        "variety": "",
        "planting_season": "",
        "expected_harvest": "",
        "notes": ""
    },
    "users": []
}

API_KEY = 'f3c17a1d089141d4d04ca6d5ac44957e'
LAT = 6.7133054
LON = 8.7001492

def get_current_weather():
    url = f'https://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid={API_KEY}&units=metric'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None

@app.route('/')
def index():
    if 'user' not in session:
        return redirect(url_for('login'))
    weather = get_current_weather()
    return render_template('dashboard.html', activities=data_store['activities'], todo_list=data_store['todo_list'], weather=weather)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        data_store['users'].append(data)
        return jsonify({"status": "success"})
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.content_type != 'application/json':
            return jsonify({"status": "fail", "message": "Content-Type must be application/json"}), 415

        data = request.json
        print(f"Login data received: {data}")
        for user in data_store['users']:
            if user['email'] == data['email'] and user['password'] == data['password']:
                session['user'] = user['email']
                print("Login successful")
                return jsonify({"status": "success"})
        print("Invalid email or password")
        return jsonify({"status": "fail", "message": "Invalid email or password"}), 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('login'))
    weather = get_current_weather()
    return render_template('dashboard.html', activities=data_store['activities'], todo_list=data_store['todo_list'], weather=weather)

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if request.method == 'POST':
        data = request.json
        data_store['profile']['name'] = data['name']
        return jsonify({"status": "success"})
    return jsonify(data_store['profile'])

@app.route('/farms', methods=['GET', 'POST'])
def farms():
    if request.method == 'POST':
        data = request.json
        data_store['profile']['farms'].append(data)
        return jsonify({"status": "success"})
    return jsonify(data_store['profile']['farms'])

@app.route('/activities', methods=['GET', 'POST'])
def activities():
    if request.method == 'POST':
        data = request.json
        data_store['activities'].append(data)
        return jsonify({"status": "success"})
    return jsonify(data_store['activities'])

@app.route('/view_activities')
def view_activities():
    weather = get_current_weather()
    if weather:
        for activity in data_store['activities']:
            activity['weather'] = weather['weather'][0]['description']
    return render_template('view-activities.html', activities=data_store['activities'])

@app.route('/add_activity', methods=['GET', 'POST'])
def add_activity():
    if request.method == 'POST':
        data = request.json
        data_store['activities'].append(data)

        # Convert activity data into todo list item
        todo_item = {
            "name": data['name'],
            "date": data['date_added'],  # Assuming 'date_added' is the date of the activity
            "weather_condition": data['ideal_weather']  # Assuming 'ideal_weather' is relevant for todo list
        }

        # Append todo item to todo list
        data_store['todo_list'].append(todo_item)

        print(data_store['activities'])  # Debug print statement
        print(data_store['todo_list'])  # Debug print statement

        return jsonify({"status": "success"})
    return render_template('add-activity.html')

@app.route('/todo_list', methods=['GET', 'POST'])
def todo_list():
    if request.method == 'POST':
        data = request.json
        data_store['todo_list'].append(data)
        return jsonify({"status": "success"})
    return jsonify(data_store['todo_list'])

@app.route('/fetch_todo_list', methods=['GET'])
def fetch_todo_list():
    return jsonify(data_store['todo_list'])

@app.route('/crop_info', methods=['GET'])
def crop_info():
    if data_store['profile']['farms']:
        latest_farm = data_store['profile']['farms'][-1]
        crop_info = {
            "name": latest_farm['crop_name'],
            "species": latest_farm['crop_species'],
            "planting_season": latest_farm['planting_season'],
            "expected_harvest": latest_farm['expected_harvest'],
            "notes": latest_farm.get('notes', '')
        }
        return jsonify(crop_info)
    else:
        return jsonify({"error": "No farm data available"}), 404

@app.route('/users', methods=['GET'])
def get_users():
    return jsonify(data_store['users'])

if __name__ == '__main__':
    app.run(debug=True)
