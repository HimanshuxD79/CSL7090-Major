// GroupChatPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPrivateKey, encryptWithAES, decryptWithAES, fetchAndDecryptGroupKey, getUserIdFromToken, base64ToBinary, binaryToHex, binaryStringToByteArray, hexStringToUint8Array } from '../cryptoUtils';

const GroupChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [groupDetails, setGroupDetails] = useState({ name: '', members: [] });
    const { groupId } = useParams();
    const [userPrivateKey, setUserPrivateKey] = useState(null);
    const [groupKey, setGroupKey] = useState(null)
    const [groupAdminId, setGroupAdminId] = useState(null);
    const baseUrl = "http://localhost:3000";

    useEffect(() => {
        loadPrivateKey();
        fetchGroupMembers(groupId);
    }, [groupId]);

    useEffect(() => {
        const fetchGroupKey = async () => {
            if (userPrivateKey) {
                try {
                    const decryptedKey = await fetchAndDecryptGroupKey(groupId, userPrivateKey);
                    console.log("decryptedKey",decryptedKey);
                    setGroupKey(decryptedKey);
                } catch (error) {
                    console.error("Error in fetching and decrypting group key:", error);
                }
            }
        };

        fetchGroupKey();
    }, [groupId, userPrivateKey]);

    useEffect(() => {
        if (groupKey) {
            fetchMessages();
        }
    }, [groupKey]); // Dependency on groupKey


    const loadPrivateKey = async () => {
        try {
            const privateKey = await getPrivateKey();
            setUserPrivateKey(privateKey);
        } catch (error) {
            console.error("Error loading private key:", error);
        }
    };
    const fetchGroupMembers = async (groupId) => {
        try {
            const response = await fetch(`${baseUrl}/groups/details/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
            });
            const result = await response.json();
            if (response.ok) {
                setGroupDetails(result);
                setGroupAdminId(result.admin);
            } else {
                console.error('Error fetching group members:', result.message);
            }

        } catch (error) {
            console.error('Network error:', error);
        }
    };

    const fetchUsernameByUserId = async (userId) => {
        try {
            const response = await fetch(`${baseUrl}/groups/getUsername/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
            });
            const data = await response.json()
            return data.username;
        } catch (error) {
            console.error(`Error fetching username for userId ${userId}:`, error);
            return ''; // Return an empty string in case of an error
        }
    };


    const fetchMessages = async () => {
        try {
            const response = await fetch(`${baseUrl}/groups/messages/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
            });
            const result = await response.json();

            if (response.ok && groupKey) {
                const decryptedMessages = await Promise.all(
                    result.messages.map(async (msg) => {
                        const binaryGroupKey = base64ToBinary(groupKey);
                        const userId = getUserIdFromToken();

                        if (userId == groupAdminId) {
                            var decryptedContent = await decryptWithAES(msg.content, binaryGroupKey);
                        } else {
                            var decryptedContent = await decryptWithAES(msg.content, base64ToBinary(base64ToBinary(groupKey)));

                        }

                        // Fetch the sender's username using the userId
                        const senderUsername = await fetchUsernameByUserId(msg.sender);

                        return {
                            ...msg,
                            content: decryptedContent,
                            sender: senderUsername, // Update sender with the username
                        };
                    })
                );
                setMessages(decryptedMessages);
            } else {
                console.error('Error fetching messages:', result.message);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    const handleSendMessage = async () => {
        try {
            if (!groupKey) {
                console.error("Group key not available for encryption.");
                return;
            }
    
            const userId = getUserIdFromToken();
            if (!userId) {
                console.error("User ID is not available.");
                return;
            }
    
            // Use the hex key directly
            const encryptedContent = await encryptWithAES(newMessage, groupKey);
    
            const response = await fetch(`${baseUrl}/groups/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
                body: JSON.stringify({
                    content: encryptedContent,
                    senderId: userId,
                    groupId,
                }),
            });
    
            if (response.ok) {
                setMessages([...messages, { content: newMessage, sender: userId }]);
                setNewMessage('');
            } else {
                console.error('Error sending message');
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Formats the date and time according to the user's locale
    }


    return (
        <div style={styles.container}>
            <h2>Group Chat - {groupDetails.name}</h2>

            <div>
                <h3>Members</h3>
                <ul>
                    {groupDetails.members.map((member, index) => (
                        <li key={index}>{member.username}</li> // Display member names
                    ))}
                </ul>
            </div>

            <div>
                {messages.map((message, index) => (
                    <div style={styles.message} key={index}>
                        <div>
                            <strong>{message.sender}</strong> {/* Display sender username */}
                        </div>
                        <div>{message.content}</div> {/* Display decrypted message content */}
                        <div>{formatTimestamp(message.timestamp)}</div> {/* Display message timestamp */}
                    </div>
                ))}
            </div>

            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
            />
            <button onClick={handleSendMessage}>Send</button>
        </div>
    );
};

const styles = {
    message: {
        backgroundColor: "rgb(225 225 225)",
        margin: "1rem 0",
    },
    container: {
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        margin: "1rem"
    }
}

export default GroupChatPage;
