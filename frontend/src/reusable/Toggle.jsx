import React from 'react'

const Toggle = (props) => {
    const toggleName = props.toggleName;

   function handleClick(){
    const next = !props.value;
    props.sendData(toggleName, next);
   }

   const style = {
    transform: props.value ? 'translate(18px, 0)' : 'translate(0,0)',
    transition: 'transform 0.3s ease-in-out'
   };
   const style2 ={
    backgroundColor: props.value ? '#2DAFED' : 'gray',
    transition: 'background-color 0.3s ease-in-out'
   };
   
  return (
    <>
    <div className="Toggle" >
        <div>
            <p className='headName'>{props.headName}</p>
            <p className='subName'>{props.subName}</p>
        </div>
            <div className='ToggleButton rounded-full' style={style2} onClick={()=>handleClick()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className='ToggleBall'  style={style} 
                ><path d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320z"/></svg>
            </div>
    </div>
    </>
  )
}                                  

export default Toggle