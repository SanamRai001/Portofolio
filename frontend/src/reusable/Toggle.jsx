const Toggle = (props) => {
  const handleClick = () => {
    props.sendData(props.toggleName, !props.value);
  };

  return (
    <div
      className={"Toggle" + (props.value ? " is-active" : "")}
      onMouseEnter={props.onHover}
      onFocus={props.onFocus}
    >
      <div className="ToggleCopy">
        <span className="ToggleIcon" aria-hidden="true">{props.icon}</span>
        <div>
          <p className="headName">{props.headName}</p>
          <p className="subName">{props.subName}</p>
        </div>
      </div>

      <button
        type="button"
        className={"ToggleButton" + (props.value ? " active" : "")}
        onClick={handleClick}
        role="switch"
        aria-checked={props.value}
        aria-label={"Toggle " + props.toggleName}
      >
        <span className="ToggleBall" aria-hidden="true" />
      </button>
    </div>
  )
}

export default Toggle
