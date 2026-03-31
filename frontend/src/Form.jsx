import React, { useState } from 'react'
import axios from 'axios';
const Form = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleSubmit = async (e)=>{
        e.preventDefault();
        const user = {email:email, password: password};
        const response = await axios.post("http://localhost:5000/api/auth/login", user);
        console.log(response);
    }
  return (
    <>
        <div className='MainForm'> 
            <form onSubmit={handleSubmit}>
                <h1>Sign up</h1>
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
                    <input type="submit" value="Sign Up" />
                </div>
            </form>
        </div>
    </>
  )
}

export default Form