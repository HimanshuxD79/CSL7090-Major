const login = () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Login Success:', data);
            localStorage.setItem('userToken', data.token);

        })
        .catch((error) => {
            console.error('Login Error:', error);
            // Handle login error
        });
}

const register = () => {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    fetch('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Registration info:', data);
            // Handle registration success
        })
        .catch((error) => {
            console.error('Registration Error:', error);
            // Handle registration error
        });
}


const encryptMessage = (message, secretKey) => {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
};

const decryptMessage = (ciphertext, secretKey) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

const sendMessage = async (message, groupId) => {
    const groupKey = getGroupKey(groupId); // Function to retrieve the group's key
    const encryptedMessage = encryptMessage(message, groupKey);

    // Send the encrypted message to the server
    const response = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${yourAuthToken}` // Include your auth token
        },
        body: JSON.stringify({ content: encryptedMessage, groupId })
    });

    return response.json();
};

const receiveMessage = (encryptedMessage, groupId) => {
    const groupKey = getGroupKey(groupId);
    return decryptMessage(encryptedMessage, groupKey);
};

const getUserIdFromToken = () => {
    const token = localStorage.getItem('userToken');
    if (!token) return null;

    try {
        const base64Url = token.split('.')[1]; // Get the payload part of the token
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return payload.id;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}


document.getElementById('create-group-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const groupName = document.getElementById('group-name').value;
    const userId = getUserIdFromToken();

    try {
        const response = await fetch('http://localhost:3000/groups/createGroup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add your authentication headers here
            },
            body: JSON.stringify({ groupName, userId })
        });

        const result = await response.json();
        if (response.ok) {
            console.log('Group created:', result);
            // Handle successful group creation
        } else {
            console.error('Error creating group:', result.message);
            // Handle errors
        }
    } catch (error) {
        console.error('Network error:', error);
        // Handle network errors
    }
});


