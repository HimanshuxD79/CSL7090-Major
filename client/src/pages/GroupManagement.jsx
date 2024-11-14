import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrivateKey, fetchUserPublicKey, encryptWithPublicKey, fetchAndDecryptGroupKey,generateGroupKey } from '../cryptoUtils';

const GroupManagement = ({ userId }) => {
    const [groupName, setGroupName] = useState('');
    const [groups, setGroups] = useState([]); // State to store groups
    const baseUrl = "https://ztabackendapi.onrender.com";

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groupKey, setGroupKey] = useState(null);
    const [adminPrivateKey, setAdminPrivateKey] = useState(null);
    const [memberGroups, setMemberGroups] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchGroups();
        fetchMemberGroups();
        loadPrivateKey();
    }, []);

    const loadPrivateKey = async () => {
        try {
            const privateKey = await getPrivateKey();
            setAdminPrivateKey(privateKey);
        } catch (error) {
            console.error("Error loading private key:", error);
        }
    };
    const searchUsers = async () => {
        try {
            const response = await fetch(`${baseUrl}/groups/searchUsers?username=${searchTerm}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
            });

            const result = await response.json();
            if (response.ok) {
                setSearchResults(result.users);
            } else {
                console.error('Error searching users:', result.message);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    const addUserToGroup = async (groupId, newUserId, groupKey) => {
        try {
            // Fetch the new user's public key
            console.log("Group key",groupKey)
            if (!groupKey) {
                throw new Error("Group key is not available");
            }
            const newUserPublicKey = await fetchUserPublicKey(newUserId);
            if (!newUserPublicKey) {
                throw new Error("Failed to fetch new user's public key");
            }

            // Encrypt the group key with the new user's public key
            const encryptedGroupKeyForNewUser = await encryptWithPublicKey(groupKey, newUserPublicKey);

            if (!encryptedGroupKeyForNewUser) {
                throw new Error("Failed to encrypt group key for new user");
            }

            // Send request to backend to add user to group
            const response = await fetch(`${baseUrl}/groups/addGroupMember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
                body: JSON.stringify({ groupId, newUserId, encryptedGroupKey: encryptedGroupKeyForNewUser })
            });

            const result = await response.json();
            if (response.ok) {
                console.log('User added to group:', result);
            } else {
                console.error('Error adding user to group:', result.message);
            }
        } catch (error) {
            console.error('Error in addUserToGroup:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await fetch(`${baseUrl}/groups/adminGroups`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`, // Assuming you store the token in localStorage
                },
            });

            const result = await response.json();

            if (response.ok) {
                setGroups(result.groups); // Assuming the response has a 'groups' field
            } else {
                console.error('Error fetching groups:', result.message);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    const fetchMemberGroups = async () => {
        try {
            const response = await fetch(`${baseUrl}/groups/memberGroups`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
            });

            const result = await response.json();

            if (response.ok) {
                setMemberGroups(result.groups); // Update the state with the fetched groups
            } else {
                console.error('Error fetching member groups:', result.message);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    useEffect(() => {
        fetchMemberGroups();
        loadPrivateKey();
    }, []);


    const createGroup = async (event) => {
        event.preventDefault()

        try {
            const groupKey = await generateGroupKey();
            console.log("groupKey",groupKey);
            console.log("userID",userId);
            const adminPublicKey = await fetchUserPublicKey(userId);
            console.log("adminPublicKey",adminPublicKey);
            const encryptedGroupKey = await encryptWithPublicKey(groupKey, adminPublicKey);
            console.log("encryptedKey",encryptedGroupKey);
            if (!encryptedGroupKey) {
                throw new Error("Failed to encrypt group key for group creation");
            }
            const response = await fetch(`${baseUrl}/groups/createGroup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
                body: JSON.stringify({ groupName, userId,encryptedGroupKey })
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
    }

    const handleLogout = () => {
        window.location = '/login'; // Redirect to the login page

        localStorage.removeItem('userToken'); // Clear the token from local storage
        localStorage.removeItem('userName'); // Clear the token from local storage
    };

    const navigateToGroupChat = (groupId) => {
        navigate(`/group-chat/${groupId}`); // Redirect to the group chat page
    };

    return (
        <div style={styles.container}>
            <form onSubmit={createGroup} style={styles.form}>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group Name"
                    required
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>Create Group</button>
            </form>
            <button onClick={handleLogout} style={styles.button}>Logout</button> {/* Logout button */}
            <div style={styles.groupsContainer}>
                <div style={styles.group}>
                    <h3>Groups as Member</h3>

                    {memberGroups.map(group => (
                        <div key={group._id}>
                            <p onClick={() => navigateToGroupChat(group._id)} >{group.name}</p>
                        </div>
                    ))}
                </div>


                <div style={styles.group}>
                    <h3>Groups as Admin</h3>

                    {groups.map(group => (
                        <div style={styles.groupItem} key={group._id}>
                            <p onClick={() => navigateToGroupChat(group._id)} >{group.name}</p>
                            {/* Add a button to select this group */}
                            <button onClick={async () => {
                                console.log("group_id",group._id);
                                setSelectedGroupId(group._id);
                                console.log(adminPrivateKey)
                                const key = await fetchAndDecryptGroupKey(group._id, adminPrivateKey);
                                console.log("key",key);
                                if (!key) {
                                    console.error("Failed to fetch group key for group ID:", group._id);
                                } else {
                                    setGroupKey(key);
                                }
                            }}>Select Group</button>

                        </div>
                    ))}
                </div>
            </div>
            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Users"
                />
                <button onClick={searchUsers}>Search</button>
            </div>
            <div>
                {searchResults.map(user => (
                    <div key={user._id}>
                        {user.username}
                        {/* Add a button to add the user to the selected group */}
                        <button onClick={() => addUserToGroup(selectedGroupId, user._id, groupKey)}>Add to Group</button>
                    </div>
                ))}

            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw"
    },
    form: {
        margin: '10px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '5px',
    },
    button: {
        padding: '10px 20px',
        cursor: 'pointer',
    },
    input: {
        display: 'block',
        margin: '10px 0',
        padding: '10px',
        width: '200px',
    },
    groupsContainer: {
        display: "flex"
    },
    group: {
        display: "flex",
        flexDirection: "column",
        margin: "1rem"
    },
    groupItem: {
        display: "flex",
        justifyContent: "space-between"

    }
}

export default GroupManagement;
