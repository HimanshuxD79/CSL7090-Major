import React from 'react';
import { Link } from "react-router-dom";

const Landing = () => {
    return (
        <div style={styles.div}>
            <Link style={styles.a} to="/login">Log in</Link>
            <Link style={styles.a} to="/register">Register</Link>
        </div>
    );
}
const styles = {
    div: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: "100vh",
        width: "100vw",
        flexDirection: "column"
    },
    a: {
        margin: "1rem",
        border: "1px solid black",
        color: "black",
        width: "100px",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        textAlign: "center"
    },

}
export default Landing;
