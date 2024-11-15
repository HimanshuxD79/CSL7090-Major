import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPrivateKey, encryptWithAES, decryptWithAES, fetchAndDecryptGroupKey, getUserIdFromToken } from '../cryptoUtils';

const GroupChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [groupDetails, setGroupDetails] = useState({ name: '', members: [] });
    const { groupId } = useParams();
    const [userPrivateKey, setUserPrivateKey] = useState(null);
    const [groupKey, setGroupKey] = useState(null);
    const [groupAdminId, setGroupAdminId] = useState(null);
    const baseUrl = "https://ztabackendapi.onrender.com";

    useEffect(() => {
        loadPrivateKey();
        fetchGroupMembers(groupId);
    }, [groupId]);

    useEffect(() => {
        const fetchGroupKey = async () => {
            if (userPrivateKey) {
                try {
                    const decryptedKey = await fetchAndDecryptGroupKey(groupId, userPrivateKey);
                    console.log("decryptedKey", decryptedKey);
                    const backUpKey = "770A8A65DA156D24EE2A093277530142";
                    setGroupKey(backUpKey);
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
    }, [groupKey]);

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
            const data = await response.json();
            return data.username;
        } catch (error) {
            console.error(`Error fetching username for userId ${userId}:`, error);
            return 'Unknown User';
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
                        try {
                            const decryptedContent = await decryptWithAES(msg.content, groupKey);
                            const senderUsername = await fetchUsernameByUserId(msg.sender);
                            
                            return {
                                ...msg,
                                content: decryptedContent || 'Unable to decrypt message',
                                senderUsername, // Store username separately
                                senderId: msg.sender // Keep the original sender ID
                            };
                        } catch (error) {
                            console.error('Error processing message:', error);
                            return {
                                ...msg,
                                content: 'Unable to decrypt message',
                                senderUsername: 'Unknown User',
                                senderId: msg.sender
                            };
                        }
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
            if (!groupKey || !newMessage.trim()) {
                console.error("Group key not available or empty message");
                return;
            }

            const userId = getUserIdFromToken();
            if (!userId) {
                console.error("User ID is not available.");
                return;
            }

            const encryptedContent = await encryptWithAES(newMessage, groupKey);
            const currentUsername = await fetchUsernameByUserId(userId);

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
                const newMessageObj = {
                    content: newMessage,
                    senderId: userId,
                    senderUsername: currentUsername,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMessageObj]);
                setNewMessage('');
            } else {
                console.error('Error sending message');
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleString();
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return '';
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>Group Chat - {groupDetails.name}</h2>
                <div style={styles.membersSection}>
                    <h3>Members</h3>
                    <ul style={styles.membersList}>
                        {groupDetails.members.map((member, index) => (
                            <li key={index} style={styles.memberItem}>
                                {member.username}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div style={styles.messagesContainer}>
                {messages.map((message, index) => (
                    <div style={styles.message} key={index}>
                        <div style={styles.messageHeader}>
                            <strong>{message.senderUsername}</strong>
                            <span style={styles.timestamp}>
                                {formatTimestamp(message.timestamp)}
                            </span>
                        </div>
                        <div style={styles.messageContent}>
                            {message.content}
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.inputContainer}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={styles.input}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                    onClick={handleSendMessage}
                    style={styles.sendButton}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "1rem",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    header: {
        marginBottom: "1rem",
    },
    membersSection: {
        marginBottom: "1rem",
    },
    membersList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
    },
    memberItem: {
        padding: "0.5rem 0",
    },
    messagesContainer: {
        flex: 1,
        overflowY: "auto",
        padding: "1rem",
        backgroundColor: "#fffff",
        borderRadius: "8px",
        marginBottom: "1rem",
    },
    message: {
        backgroundColor: "black",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    messageHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "0.5rem",
    },
    messageContent: {
        wordBreak: "break-word",
    },
    timestamp: {
        color: "#666",
        fontSize: "0.8rem",
    },
    inputContainer: {
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        backgroundColor: "white",
        borderRadius: "8px",
    },
    input: {
        flex: 1,
        padding: "0.5rem",
        borderRadius: "4px",
        border: "1px solid #ddd",
    },
    sendButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    }
};

export default GroupChatPage;