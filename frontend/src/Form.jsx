import React, { useState } from 'react'
import API from "./config/api";
import axios from 'axios';

const Form = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        setLoading(true);
        try{
            const user = {email, password};
            const response = await axios.post(`${API}/api/auth/login`, user);
            const token = response.data.token;
            localStorage.setItem("token", token);
            window.location.reload();
        }
        catch(err){
            console.log("Error", err);
            setError(err.response?.data?.message || "Login failed. Check your credentials.");
            setLoading(false);
        }
    }

  return (
    <>
    {props.systemToggle.auth?
        <div className='MainForm'>
            <form onSubmit={handleSubmit}>
                <h1>Login Form</h1>
                <div>
                    <p>Viewer Account</p>
                    <p>Email:Viewer@gmail.com</p>
                    <p>Password:Viewer@123#</p>
                </div>
                <div className='email'>
                    <input type="email" placeholder='Email' onChange={(e)=>setEmail(e.target.value)} value={email}/>
                </div>
                <div className='password'>
                    <input type="password" placeholder='Password' onChange={(e)=>setPassword(e.target.value)} value={password}/>
                </div>
                <div className='checkbox'>
                    <input type="checkbox" />
                    <label htmlFor="">Remember Me</label>
                </div>
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                <div className='submit'>
                    <input type="submit" value={loading ? "Logging in..." : "Login"} disabled={loading} />
                </div>
            </form>
        </div>
        : <p></p>
    }
    </>
  )
}
export default Form