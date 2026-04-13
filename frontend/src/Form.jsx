import React, { useState } from 'react'
import axios from 'axios';
const Form = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleSubmit = async (e)=>{
        e.preventDefault();
        const user = {email:email, password: password};
        const response = await axios.post("http://localhost:5000/api/auth/login", user);
        const token = response.data.token;
        window.location.reload();
        localStorage.setItem("token", token);
        console.log("this is token  :",token);
    }
  return (
    <>
    {props.systemToggle.auth?
        <div className='MainForm'> 
            <form onSubmit={handleSubmit}>
                <h1>Login  Form</h1>
                <div>
                    <p>Viewer Account</p>
                    <p>Email:Viewer@gmail.com</p>
                    <p>Password:Viewer@123#</p>
                </div>
                <div className='email' >
                    <input type="email" placeholder='Email' onChange={(e)=>setEmail(e.target.value)} value={email}/>
                </div>
                <div className='password' >
                    <input type="password" placeholder='Password' onChange={((e)=>setPassword(e.target.value))} value={password}/>
                </div>
                <div className='checkbox'>
                    <input type="checkbox" />
                    <label htmlFor="">Remember Me</label>
                </div>
                <div className='submit' >
                    <input type="submit" value="Login" />
                </div>
            </form>
        </div>
        : <p></p>
    
    }
    </>
  )
}

export default Form