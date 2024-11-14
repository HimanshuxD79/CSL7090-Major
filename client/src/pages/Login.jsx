import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const baseUrl = "http://localhost:3000";
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            // Check if the login was successful
            if (response.ok && data.token) {
                console.log('Login Success:', data);
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', data.username);

                if (onLogin) {
                    onLogin(username, password);
                }
                window.location = "/groups"

            } else {
                // Handle login failure
                setErrorMessage(data.message || 'Unknown error');
                console.error('Login failed:', data.message || 'Unknown error');
            }
        } catch (error) {
            setErrorMessage("Error logging in: " + error);
            console.error("Error logging in: " + error);
        }
    };


    return (
        <div style={styles.container}>
            <div style={styles.form}>
                <h2>Login</h2>
                {errorMessage && <div style={styles.error}>{errorMessage}</div>} {/* Display the error message */}

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    style={styles.input}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={styles.input}
                />
                <button onClick={handleLogin} style={styles.button}>Login</button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw"
    },
    form: {
        margin: '10px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '5px',
    },
    input: {
        display: 'block',
        margin: '10px 0',
        padding: '10px',
        width: '200px',
    },
    button: {
        padding: '10px 20px',
        cursor: 'pointer',
    }
};

export default Login;
