import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Score form state
  const [scoreForm, setScoreForm] = useState({
    user_id: '',
    task_id: '',
    week_number: '',
    score: '',
    feedback: ''
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [internsRes, tasksRes, scoresRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/interns`),
        axios.get(`${API_BASE_URL}/tasks`),
        axios.get(`${API_BASE_URL}/performance-scores`)
      ]);
      
      setInterns(internsRes.data);
      setTasks(tasksRes.data);
      setScores(scoresRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, loginForm);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      alert('Login failed');
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/performance-scores`, scoreForm);
      alert('Score submitted successfully');
      setScoreForm({
        user_id: '',
        task_id: '',
        week_number: '',
        score: '',
        feedback: ''
      });
      loadData(); // Reload data
    } catch (error) {
      alert('Error submitting score');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (!token) {
    return (
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Performance Tracker Admin</h1>
        <div>
          Welcome, {user?.full_name} 
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main>
        <section className="score-form-section">
          <h2>Add Performance Score</h2>
          <form onSubmit={handleSubmitScore} className="score-form">
            <select
              value={scoreForm.user_id}
              onChange={(e) => setScoreForm({...scoreForm, user_id: e.target.value})}
              required
            >
              <option value="">Select Intern</option>
              {interns.map(intern => (
                <option key={intern.id} value={intern.id}>{intern.full_name}</option>
              ))}
            </select>

            <select
              value={scoreForm.task_id}
              onChange={(e) => setScoreForm({...scoreForm, task_id: e.target.value})}
              required
            >
              <option value="">Select Task</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Week Number"
              value={scoreForm.week_number}
              onChange={(e) => setScoreForm({...scoreForm, week_number: e.target.value})}
              required
            />

            <input
              type="number"
              placeholder="Score (0-10)"
              min="0"
              max="10"
              value={scoreForm.score}
              onChange={(e) => setScoreForm({...scoreForm, score: e.target.value})}
              required
            />

            <textarea
              placeholder="Feedback"
              value={scoreForm.feedback}
              onChange={(e) => setScoreForm({...scoreForm, feedback: e.target.value})}
              rows="3"
            />

            <button type="submit">Submit Score</button>
          </form>
        </section>

        <section className="scores-section">
          <h2>Performance History</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="scores-table">
              <table>
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Task</th>
                    <th>Week</th>
                    <th>Score</th>
                    <th>Feedback</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map(score => (
                    <tr key={score.id}>
                      <td>{score.full_name}</td>
                      <td>{score.task_title}</td>
                      <td>{score.week_number}</td>
                      <td>
                        <span className={`score score-${Math.floor(score.score / 3)}`}>
                          {score.score}/10
                        </span>
                      </td>
                      <td>{score.feedback}</td>
                      <td>{new Date(score.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;