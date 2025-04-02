import React from 'react';
import RoutesPage from './pages/RoutesPage.jsx';
import { ToastContainer } from "react-toastify";
import './App.css';

function App() {
  return(
    <>
    <RoutesPage/>
<ToastContainer className="custom-toast"
  position="bottom-center"
      autoClose= {2000} 
      hideProgressBar={true} // Disable progress bar
      closeOnClick= {false}
      closeButton={false}
      pauseOnHover= {true}
      draggable= {true}
      theme= "light" // Optional: Choose theme ('light', 'dark', 'colored')
/>
   </>
);
}

export default App;