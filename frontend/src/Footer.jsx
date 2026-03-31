import React from 'react'

const Footer = () => {
  return (
    <>
        <div className='MainFooter'>
            <div className='UpperFooter'>
                <div>
                    <h1>System Core</h1>
                    <p>Specialized in building high-availablity distributed systems, secure APIs gateways, and scalable microservices architecture.</p>
                </div>
                <div>
                    <h1>Quick Access</h1>
                    <ul>
                        <li><a href="">SystemControl</a></li>
                        <li><a href="">Projects</a></li>
                        <li><a href="">Resume</a></li>
                    </ul>
                </div>
                <div>
                    <h1>Status</h1>
                    <h4>All systems operational</h4>
                    <ul>
                        <li>icons</li>
                        <li>icons</li>
                        <li>icons</li>
                    </ul>
                </div>
            </div>
            <hr />
            <div className='LowerFooter'>
                <div> 2026 Backend Developer Portofolio. Built for scale</div>    
                <div> Uptime:99.99% 1 | Latency:24ms</div>
            </div> 
        </div>
    </>
  )
}

export default Footer