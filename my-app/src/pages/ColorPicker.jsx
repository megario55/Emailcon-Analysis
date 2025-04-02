import { ChromePicker } from "react-color";
import { useState, useRef, useEffect } from "react";

const ColorPicker = ({ label, objectKey, previewContent, selectedIndex, updateContent }) => {
  const [displayPicker, setDisplayPicker] = useState(false);
  const pickerRef = useRef(null);

  // Get the current color from the specific style path
  const currentStyle = previewContent[selectedIndex];
  const currentColor = objectKey.split(".").reduce((obj, key) => obj?.[key], currentStyle) || "#000000";

  // Detect clicks outside and close picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setDisplayPicker(false);
      }
    };

    if (displayPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [displayPicker]);

  const handleColorChange = (color) => {
    const newContent = JSON.parse(JSON.stringify(previewContent[selectedIndex])); // Deep copy
    let temp = newContent;
    const keys = objectKey.split(".");

    // Traverse to the last key
    for (let i = 0; i < keys.length - 1; i++) {
      if (!temp[keys[i]]) temp[keys[i]] = {}; // Ensure nested objects exist
      temp = temp[keys[i]];
    }

    // Update the last key with the new color
    temp[keys[keys.length - 1]] = color.hex;

    // Update the state
    updateContent(selectedIndex, newContent);
  };

  return (
    <div className="editor-bg" ref={pickerRef} style={{position:"relative"}}>
      {label}
      <div
        style={{
          display: "inline-block",
          width: "30px",
          height: "30px",
          background: currentColor,
          border: "1px solid  rgb(150, 149, 149)",
          cursor: "pointer",
          marginLeft: "10px",
          padding:"0",
          overflow:"hidden",
          borderRadius:"50%",      
        }}
        onClick={() => setDisplayPicker(!displayPicker)}
      />
      {displayPicker && (
        <div style={{ position: "absolute",top:"-10%", zIndex: 2,height:"200px",maxHeight:"300px",overflow:"auto"}}>
          <ChromePicker color={currentColor} onChange={handleColorChange} />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
