import React, { useState, useRef,useEffect } from "react";
import axios from "axios";
import "./Readmainpage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {FaBars, FaTimes} from "react-icons/fa";
import { useParams,useLocation } from "react-router-dom";
import { FiEdit } from 'react-icons/fi'; // Importing icons

import {
  FaParagraph,
  FaImage,
  FaHeading,
  FaPlusSquare,
  FaGlobe,FaIdCard,FaFileImage,
  FaVideo,
} from "react-icons/fa";
import { FaUser, FaUsers, FaRocket } from "react-icons/fa"; // Import icons
import { MdSend } from "react-icons/md";
import { FaDesktop,FaSave,FaEye } from "react-icons/fa";
import { MdPhoneAndroid } from "react-icons/md";
import { MdAddPhotoAlternate } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import ParaEditor from "../component/ParaEditor.jsx";
import SendexcelModal from "../component/Importexcel.jsx";
import SendbulkModal from "../component/SendbulkModal.jsx";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import apiConfig from "../apiconfig/apiConfig.js";
import ColorPicker from "./ColorPicker.jsx";

const Clicksinglemainpage = () => {
  const [activeTab, setActiveTab] = useState("button1");
  const [isLoading, setIsLoading] = useState(false); // State for loader
  const [isLoadingsch, setIsLoadingsch] = useState(false); // State for loader
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgColorpre, setBgColorpre] = useState("#ffffff");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedContent, setSelectedContent] = useState(""); // Store selected content
  const { campaignId } = useParams();
  const location = useLocation();
  const singleemails = location.state?.singleemails || []; // Get emails from state
  const [clickcampaigns, setClickcampaigns] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: "",
    subject: "",
    previewtext: "",
    scheduledTime: "",
    aliasName: "",
    attachments: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(null); // Track selected content index
  const [modalIndex, setModalIndex] = useState(null);
  const dragIndex = useRef(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSendexcelModal, setShowSendexcelModal] = useState(false); // State for opening Sendexcelmail
  const [isScheduled, setIsScheduled] = useState(false); // Toggle state
  const [showSendModal, setShowSendModal] = useState(false); // State for opening SendbulkModal
  const [previewContent, setPreviewContent] = useState([]);
  const [previewContentpre, setPreviewContentpre] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef(null);
const [isNavOpen, setIsNavOpen] = useState(false);
const [isMobilestyle, setIsMobilestyle] = useState(window.innerWidth <= 600);
const [isModalOpenstyle, setIsModalOpenstyle] = useState(false);
const [isOpentemplate, setIsOpentemplate] = useState(false); // Manage dropdown visibility
const [templates, setTemplates] = useState([]); // Store fetched templates
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [selectedTemplatepre, setSelectedTemplatepre] = useState(null);
const [isPreviewOpen, setIsPreviewOpen] = useState(false);
const [groups, setGroups] = useState([]); // Stores group names
const [students, setStudents] = useState([]); // Stores all students
const [selectedGroup, setSelectedGroup] = useState({});
const [fieldNames, setFieldNames] = useState({});
const templateRef = useRef(null);
const [openedGroups, setOpenedGroups] = useState({});
const dropdownRef = useRef(null);

const handleGroupChange = (e, index) => {
  const groupName = e.target.value;

  setSelectedGroup((prev) => ({
    ...prev,
    [index]: groupName,
  }));

  // Allow reopening if selecting the same group again
  setOpenedGroups((prev) => ({
    ...prev,
    [index]: !prev[index] || prev[index] !== groupName, // Toggle if same group selected
  }));

  if (!students || students.length === 0) {
    console.log("No students available yet.");
    return;
  }

  console.log(`All students:`, students);
  console.log(`Selected Group for Heading ${index}:`, groupName);

  const filteredStudents = students.filter(
    (student) => student.group && student.group._id === groupName
  );

  const sampleStudent = filteredStudents.length > 0 ? filteredStudents[0] : null;

  const newFieldNames = sampleStudent
    ? Object.keys(sampleStudent).filter(
        (key) => key !== "_id" && key !== "group" && key !== "__v"
      )
    : [];

  setFieldNames((prev) => ({
    ...prev,
    [index]: newFieldNames,
  }));
};
const handleClickOutside = (event) => {
  if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
    setOpenedGroups({});
  }
};

useEffect(() => {
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get(`${apiConfig.baseURL}/api/stud/getcamhistory/${campaignId}`);
        setClickcampaigns(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCampaigns();
  }, [campaignId]);


const toggletemplate = (event) => {
  event.stopPropagation(); // Prevent event from bubbling up
  setIsOpentemplate((prev) => !prev);
};
const styleControlsRef = useRef(null);

useEffect(() => {
  if (selectedIndex !== null && styleControlsRef.current) {
    styleControlsRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}, [selectedIndex]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (templateRef.current && !templateRef.current.contains(event.target)) {
      setIsOpentemplate(false);
    }
  };

  window.addEventListener("mousedown", handleClickOutside);

  return () => {
    window.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  if (!user?.id) return;

  const fetchGroupsAndStudents = async () => {
    try {
      const groupsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${user.id}`);
      setGroups(groupsResponse.data);

      const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/students`);
      setStudents(studentsResponse.data);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  };

  fetchGroupsAndStudents();
}, [user.id]); 



// Fetch options from the database when the component mounts

useEffect(() => {
  const fetchtemplate = async () => {
    if (!user) {
      navigate("/"); // Redirect to login if user is not found
      return;
    }

    try {
      const res = await axios.get(`${apiConfig.baseURL}/api/stud/templates/${user.id}`);
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch templates");
    }
  };

  fetchtemplate();
}, [user, navigate]);  // Ensure useEffect is dependent on `user` and `navigate`



useEffect(() => {
  const handleResize = () => {
    setIsMobilestyle(window.innerWidth <= 600);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
const handlePreview=(template)=>{
  setIsOpentemplate(false); // Close the dropdown
  setIsNavOpen(false);
  setIsPreviewOpen(true);
  setSelectedTemplatepre(template);
  setBgColorpre(template.bgColor || "#ffffff"); // Update background color
  setPreviewContentpre(template.previewContent || []); // Update previewContent
}
const handlecancel=()=>{
  setIsPreviewOpen(false);
  setShowTemplateModal(false);
  setIsNavOpen(false);
}
const handleTemplateSelect = (template) => {
  setIsPreviewOpen(false);
  setIsNavOpen(false);
  setIsOpentemplate(false); // Close the dropdown
  setSelectedTemplate(template);
  setBgColor(template.bgColor || "#ffffff"); // Update background color
  setPreviewContent(template.previewContent || []); // Update previewContent
};

  const handlebackcampaign = () => {
    navigate("/home");
    sessionStorage.removeItem("firstVisit");
    sessionStorage.removeItem("toggled");
  };

  // Add new text
  const addText = () => {
    saveToUndoStack(); // Save the current state before deleting

    setPreviewContent([
      ...previewContent,
      {
        type: "para",
        content: "Replace Your Content...",
        style: {
          fontSize: "15px",
          borderRadius: "10px",
          textAlign: "left",
          color: "#000000",
          backgroundColor: "#f4f4f4",
          padding: "10px 10px",
        },
      },
    ]);
  };
  const addMultipleImage = () => {
    //  const isMobile = window.innerWidth <= 600; // Check if screen width is 600px or less
  
     setPreviewContent([
       ...previewContent,
       {
         type: "multipleimage",
         src1: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s",
         src2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s",
         style: {
          width: "100%",
          height: "auto",
          borderRadius: "10px",
          textAlign: "center",
        },
        },
       
     ]);
   };

   const addCardImage = () => {
    setPreviewContent([
      ...previewContent,
      {
        type: "cardimage",
         style:{
             width: "80%",
              height: "auto",
              margin: "0px auto",
              
         },
        src1: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s", // Default image source
        content1:
          "Artificial intelligence is transforming the way we interact with technology, enabling machines to process data with efficiency.", // Default paragraph text
        style1: {
          color: "black",
          backgroundColor: "#f4f4f4",         
        },
      },
    ]);
  };

  
  const addHeading = () => {
    saveToUndoStack(); // Save the current state before deleting

    setPreviewContent([
      ...previewContent,
      {
        type: "head",
        content: "Heading",
        style: {
          fontSize: "25px",
          borderRadius: "10px",
          textAlign: "center",
          color: "#000000",
          padding: "10px 0px 10px 5px",
          fontWeight: "bold",
        },
      },
    ]);
  };

  const addImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);

      // Upload image to Cloudinary or server
      try {
        const response = await axios.post(
          `${apiConfig.baseURL}/api/stud/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        const imageUrl1 = response.data.imageUrl;
        setPreviewContent([
          ...previewContent,
          {
            type: "image",
            src: imageUrl1,
            style: {
              width: "100%",
              height: "auto",
              borderRadius: "10px",
              textAlign: "center",
              margin: "5px auto",
            },
          },
        ]);
      } catch (err) {
        toast.error("Image upload failed");
      }
    };
    fileInput.click();
  };

  const addLogo = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);

      // Upload image to Cloudinary or server
      try {
        const response = await axios.post(
          `${apiConfig.baseURL}/api/stud/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        const imageUrl = response.data.imageUrl;
        setPreviewContent([
          ...previewContent,
          {
            type: "logo",
            src: imageUrl,
            style: {
              width: "50%",
              height: "auto",
              borderRadius: "0px",
              textAlign: "center",
              margin: "5px auto",
            },
          },
        ]);
      } catch (err) {
        toast.error("Image upload failed");
      }
    };
    fileInput.click();
  };

  const uploadImage = async (index, imageNumber) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await axios.post(
          `${apiConfig.baseURL}/api/stud/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const imageUrl3 = response.data.imageUrl;

        // Update the correct image in the layout
        setPreviewContent((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  [imageNumber === 1 ? "src1" : "src2"]: imageUrl3,
                }
              : item
          )
        );
      } catch (err) {
        toast.error("Image upload failed");
      }
    };

    input.click();
  };

  //add  clickable image
  const addlinkImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);

      // Upload image to Cloudinary or server
      try {
        const response = await axios.post(
          `${apiConfig.baseURL}/api/stud/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        const imageUrl2 = response.data.imageUrl;
        setPreviewContent([
          ...previewContent,
          {
            type: "link-image",
            src: imageUrl2,
            style: {
              width: "100%",
              height: "auto",
              borderRadius: "10px",
              textAlign: "center",
              margin: "5px auto",
            },
            link: "https://www.imageconindia.com/",
          },
        ]);
      } catch (err) {
        toast.error("Image upload failed");
      }
    };
    fileInput.click();
  };

  const addImageText = () => {
    setPreviewContent([
      ...previewContent,
      {
        type: "imagewithtext",
        src1: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s", // Default image source
        content1:
          "Artificial intelligence is transforming the way we interact with technology, enabling machines to process data with efficiency.", // Default paragraph text
        style1: {
          color: "black",
          borderRadius: "10px",
          backgroundColor: "#f4f4f4",
        },
      },
    ]);
  };

  const addTextImage = () => {
    setPreviewContent([
      ...previewContent,
      {
        type: "textwithimage",
        src2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s", // Default image source
        content2:
          "Artificial intelligence is transforming the way we interact with technology, enabling machines to process data with efficiency.", // Default paragraph text
        style: {
          color: "black",
          backgroundColor: "#f4f4f4",
          borderRadius: "10px",
        },
      },
    ]);
  };

  //add video with icon
  const addVideo = () => {
    const isMobile = window.innerWidth <= 600; // Check if screen width is 600px or less

    setPreviewContent([
      ...previewContent,
      {
        type: "video-icon",
        src1: "https://zawiya.org/wp-content/themes/zawiyah/images/thumbnail-default.jpg",
        src2: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2J2eGkwZHZ6ZmQxMzV2OWQzOG1qazZsNGs1dXNxaWV3NTJqbHd0YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gcBq6Nom44PGBoUhWm/giphy.gif",
        link: "https://www.imageconindia.com/",
        style: {
          width: "100%",
          height: isMobile ? "230px" : "350px", // Adjust height based on screen size
          borderRadius: "10px",
          textAlign: "center",
          margin: "5px auto",
        },
      },
    ]);
  };
  const addSocialMedia = () => {
    setPreviewContent([
      ...previewContent,
      {
        type: "icons",
        iconsrc1:
          "https://media-hosting.imagekit.io//67bd5de7d7284435/facebook.png?Expires=1834659823&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Q3MgNGs1Jso~sjt298M6H-vs8QWdp~OxEKGNi1BF1Wq3uJwZqz2NeeW1BSNFKjYNxGR4otU8ssEUvdJ9TJMsbGUs6S1dxJiJ6ln3gxasE5ir4yXdWf1~fm-yQdE9F7Bssys1mf1aDBJjDG0ro7pHSILRd1v7eN~KS6VItz1k7kNejlwi84h0X6pjeIy5Lh7Zhilmc2ON5XD2Zio9oQa1OUJhj2D9ZXxR84ubLtUY4dmiESDaLtsUX0Gjvm6R0nXMkRL0oIxuIsgxi3JnmjesQgldTr4s9AIsgDmYy24DGbuaLji3epak-9fG0lyxZyyLQYfYmt8Wq-0PN0QDs2yQkQ__",
        style1: { width: "30px", height: "30px" },
        links1: "https://www.facebook.com",

        iconsrc2:
          "https://media-hosting.imagekit.io//29eaf64e0e144a39/twitter.png?Expires=1834659855&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=tMMasC4XY4z4xl3DzTIcSSXTBBH-eMULL3w0WH5nHGsu0zVlz8~HLSw5nfiw2iBgB~J4QPle2LM4ow1aPq0x2cCUvAHLQ8IG9P5-KSV0Em2C1eZuXFaScWasYxeX9OAV1uIRBBvQxvId20IbNK7c9eBBUy12Htg2rjE2p8zCtqhwy5Ef6AqOogF3G7FcKpY8-DMNLKVrsagHuhP2R7m9gndSODhxsfSp17lW4R0wgo73IZicToB~U1mdlNOe2I7WKXGV3znS3u0P9NYdU4KR7DLmGX7NhEQaSQ1rF7yN6lL8tZHfPNoBCh50CbkuM16wf6qCcrHlcta1sPjlgfhTdg__",
        style2: { width: "55px", height: "55px" },
        links2: "https://www.twitter.com",

        iconsrc3:
          "https://media-hosting.imagekit.io//cfa67b595a694323/instagram.png?Expires=1834659862&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=F~x667oLkHSCCRT94amSjjg-7YvZGcUgYUBAOS8PyHS6fKhyxIg1BNFqgBrI-Wfibxvg9Ju~S4TxBkdF~PAhJqW4skqoNoWnadypcOGEWQnsK4Vt34cegUPk1WkeIWFz2twm1ase7PsFMgZFHQPYmH5iZsMlCSvkwyAnIhLOJHcKuUz6YeI8wAhCAvI7mZp4oLbICW08nHqJIhfrP5h4tYZ74PHgw5Z6NGeRrXMHph~itymPichKycdyv92m~3EozEAo~qrXeuF0hbU1H2hEeTqbiQU1dnDJXlA~Nq6r1QtFhJXMoSYv7Tw~qoQqyUZqwQw8cQ7XjSBrW0-fMXq6GA__",
        style3: { width: "30px", height: "30px" },
        links3: "https://www.instagram.com",

        iconsrc4:
          "https://media-hosting.imagekit.io//24a0e8c0dfbd44da/youtube.png?Expires=1834659634&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=hKVEIuwIlua~7-1jjd~A0vSiyD9UYbdSHvQHs7nUNyetORS16hhvkxUSuQdkxNmmx~2h3JRNia3qZamzljVLCTlEiqF9OofWaXvenvzpF3tp3SkHei8WjQ5ZJdLT~YMgRgANJz7rYArnQugBukzmkHbg57GNJFTNrShLyFkSepwDlLG6nbo7qdPPmDNDyAbwhIlReMOgAnU7Mb1FsBd98TXbImb8hyiiUsM2zgTK0eEwGM1llYJlavFgrvwPbMenHEf37N~I56Z7H9ZUEPXmpZpJGIJONVVOkld~TuzfWLa52ogLEKb8ugc9gMrKJVdnL4fdrUoj7fyT~aWVxugQ0A__",
        style4: { width: "30px", height: "30px" },
        links4: "https://www.youtube.com",

        ContentStyle: {
          width: "100%",
          backgroundColor: "white",
          borderRadius: "10px",
          textAlign: "center",
        },
      },
    ]);
  };
  const handleLinksClick2 = (e, link) => {
    if (link) {
      window.open(link.startsWith("http") ? link : `http://${link}`, "_blank");
    }
  };

  //add multimage with button
 const addMultiImage = () => {
   const isMobile = window.innerWidth <= 600; // Check if screen width is 600px or less

   setPreviewContent([
     ...previewContent,
     {
       type: "multi-image",
       src1: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s",
       src2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjCoUtOal33JWLqals1Wq7p6GGCnr3o-lwpQ&s",
       link1: "https://www.imageconindia.com/",
       link2: "https://www.imageconindia.com/",
       buttonStyle1: {
         textAlign: "center",
         padding: isMobile ? "8px 8px" : "12px 25px", // Adjust padding based on screen size
         backgroundColor: "black",
         color: "#ffffff",
         width: "auto",
         marginTop: "10px",
         alignItems: "center",
         borderRadius: "5px",
       },
       buttonStyle2: {
         textAlign: "center",
         padding: isMobile ? "8px 8px" : "12px 25px", // Adjust padding based on screen size
         backgroundColor: "black",
         color: "#ffffff",
         width: "auto",
         marginTop: "10px",
         alignItems: "center",
         borderRadius: "5px",
       },
       content1: "Click Me",
       content2: "Click Me",
       style: {
         width: "100%",
         height: "auto",
         borderRadius: "10px",
         textAlign: "center",
       },
     },
   ]);
 };

  const addButton = () => {
    saveToUndoStack(); // Save the current state before deleting
    setPreviewContent([
      ...previewContent,
      {
        type: "button",
        content: "Click Me",
        style: {
          textAlign: "center",
          padding: "12px 25px",
          backgroundColor: "black",
          color: "#ffffff",
          width: "auto",
          marginTop: "5px",
          alignItem: "center",
          borderRadius: "5px",
        },
        link: "https://www.imageconindia.com/",
      },
    ]);
  };

  // Handle content editing
  const updateContent = (index, newContent) => {
    saveToUndoStack(); // Save the current state before deleting
    const updated = [...previewContent];
    updated[index] = { ...updated[index], ...newContent };
    setPreviewContent(updated);
  };

  const handleItemClick = (index) => {
    setSelectedIndex(index); // Set the selected index when an item is clicked
  };

  //delete
  const deleteContent = (index) => {
    saveToUndoStack(); // Save the current state before deleting
    const updated = previewContent.filter((_, i) => i !== index);
    setPreviewContent(updated);
    if (selectedIndex === index) {
      setSelectedIndex(null); // Reset selection if the deleted item was selected
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1); // Adjust index
    }
  };
  const saveToUndoStack = () => {
    setUndoStack([...undoStack, [...previewContent]]);
    setRedoStack([]); // Clear redo stack whenever a new action is performed
  };

  // Undo action
  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack.pop(); // Pop the last state
      setRedoStack([...redoStack, [...previewContent]]); // Save current state to redo stack
      setPreviewContent(previousState); // Revert to the previous state
    }
  };

  // Redo action
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop(); // Pop the redo state
      setUndoStack([...undoStack, [...previewContent]]); // Save current state to undo stack
      setPreviewContent(nextState); // Reapply the redo state
    }
  };
  const handleSaveButton = () => {
  if (!user || !user.id) {
    toast.error("Please ensure the user is valid");
    return; // Stop further execution if user is invalid
  }
  if (!templateName) {
    toast.error("Please enter a Template name");
  }
  if (!previewContent || previewContent.length === 0) {
    toast.warning("No preview content available.");
    return;
  }

  setIsLoading(true);
  if (templateName && user && user.id && previewContent) {
    axios
      .post(`${apiConfig.baseURL}/api/stud/template`, { temname:templateName, userId: user.id,previewContent,bgColor })
      .then((res) => {
        console.log("Template saved successfully:", res.data);
        toast.success("Template Saved Successfully");
        setTimeout(()=>{
        setShowTemplateModal(false);
        setTemplateName("");
        setIsLoading(false);
        },(2000))
      })
      .catch((error) => {
        setIsLoading(false);
         // Dismiss previous toasts before showing a new one
                    toast.dismiss();              
                    if (error.response && error.response.data && error.response.data.message) {
                      toast.warning(error.response.data.message, { autoClose: 3000 });
                    } else {
                      toast.error("Failed to Save template", { autoClose: 3000 });
                    }
      });
  } else {
    setIsLoading(false);
    toast.error("Please ensure all fields are filled and user is valid");
  }
};
const sendscheduleEmail = async () => {
  if (!previewContent || previewContent.length === 0) {
    toast.warning("No preview content available.");
    return;
  }
  if (!emailData || !singleemails.length || !emailData.subject || !emailData.previewtext || !emailData.aliasName || !emailData.scheduledTime) {
    toast.warning("Please fill in all required fields.");
    return;
  }
  setIsLoadingsch(true);

  try {
    let recipients = singleemails.map(email => email); // Simply copy the array
    console.log("Valid Recipients:", recipients);    
    let attachments = [];

    if (emailData.attachments && emailData.attachments.length > 0) {
      const formData = new FormData();
      
      emailData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    
      const uploadResponse = await axios.post(
        `${apiConfig.baseURL}/api/stud/uploadfile`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    
      console.log("Uploaded Files:", uploadResponse.data);    
      attachments = uploadResponse.data.fileUrls.map((file, index) => ({
        originalName: emailData.attachments[index].name,
        fileUrl: file 
      }));
    }
// Ensure campaign name follows Click-Retarget pattern
let campaignName = clickcampaigns?.campaignname?.trim() || "";

// If campaign name doesn't already contain "Click-Retarget", prepend it
if (!campaignName.includes("IndividualClick-Retarget")) {
  campaignName = `IndividualClick-Retarget ${campaignName}`;
} else {
  // Extract count and increment if it already has Click-Retarget
  let match = campaignName.match(/IndividualClick-Retarget(?:-(\d+))?/);
  let count = match && match[1] ? parseInt(match[1]) + 1 : 2;

  campaignName = campaignName.replace(/IndividualClick-Retarget(?:-\d+)?/, `IndividualClick-Retarget-${count}`);
}

    // Store campaign history with uploaded file data
    const campaignHistoryData = {
      campaignname: campaignName.trim(), 
      groupname: "No Group",
      totalcount: recipients.length,
      recipients: recipients.join(","), // Convert array to a single string
      sendcount: 0,
      failedcount: 0,
      sendEmails: 0,
      failedEmails: 0,
      subject: emailData.subject,
      previewtext: emailData.previewtext,
      aliasName: emailData.aliasName,
      attachments,
      previewContent,
      bgColor,
      exceldata: [{}],
      status: "Scheduled On",
      progress: 0,
      scheduledTime: new Date(emailData.scheduledTime).toISOString(),
      senddate: new Date().toLocaleString(),
      user: user.id,
      groupId: "no group",
    };

    await axios.post(`${apiConfig.baseURL}/api/stud/camhistory`, campaignHistoryData);

    toast.success("Email scheduled successfully!");
    navigate("/campaigntable");
  } catch (error) {
    console.error("Error scheduling email:", error);
    toast.error("Failed to schedule email.");
  } finally {
    setIsLoadingsch(false);
  }
};

  //Normal Send Email
  const sendEmail = async () => {
    if (!previewContent || previewContent.length === 0) {
      toast.warning("No preview content available.");
      return;
    }
    if (!emailData || !singleemails.length || !emailData.subject || !emailData.previewtext || !emailData.aliasName) {
      toast.warning("Please fill in all required fields.");
      return;
    }
  
    setIsLoading(true);
    navigate("/campaigntable");
    sessionStorage.removeItem("firstVisit");
    sessionStorage.removeItem("toggled");
  
    try {
      let recipients = singleemails.map(email => email); // Simply copy the array
      console.log("Valid Recipients:", recipients);    
      if (!recipients || recipients.length === 0) {
        console.error("No recipients found!");
        return;
      }
      let sentEmails = [];
      let failedEmails = [];
      let attachments = [];
      if (emailData.attachments && emailData.attachments.length > 0) {
        const formData = new FormData();
        
        emailData.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      
        const uploadResponse = await axios.post(
          `${apiConfig.baseURL}/api/stud/uploadfile`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      
        console.log("Uploaded Files:", uploadResponse.data);    
        // Structure the uploaded files with original name and URL
         attachments = uploadResponse.data.fileUrls.map((file, index) => ({
          originalName: emailData.attachments[index].name, // Get original file name
          fileUrl: file // Cloudinary URL
        }));
      }
      // Ensure campaign name follows Click-Retarget pattern
let campaignName = clickcampaigns?.campaignname?.trim() || "";

// If campaign name doesn't already contain "Click-Retarget", prepend it
if (!campaignName.includes("IndividualClick-Retarget")) {
  campaignName = ` IndividualClick-Retarget ${campaignName}`;
} else {
  // Extract count and increment if it already has Click-Retarget
  let match = campaignName.match(/IndividualClick-Retarget(?:-(\d+))?/);
  let count = match && match[1] ? parseInt(match[1]) + 1 : 2;

  campaignName = campaignName.replace(/IndividualClick-Retarget(?:-\d+)?/, `IndividualClick-Retarget-${count}`);
}

      // Store initial campaign history with "Pending" status
      const campaignHistoryData = {
        campaignname:campaignName.trim(), 
        groupname: "No Group",
        totalcount: recipients.length,
        recipients: "no mail",  
        sendcount: 0,
        failedcount: 0,
        sendEmails: 0,
        failedEmails: 0,
        subject: emailData.subject,
        previewtext: emailData.previewtext,
        aliasName: emailData.aliasName,
        previewContent,
        attachments,
        bgColor,
        exceldata: [{}],
        scheduledTime: new Date(),
        status: "Pending",
        senddate: new Date().toLocaleString(),
        user: user.id,
        groupId: "no group",
        progress: 0, // Track progress in DB
      };
  
      const campaignResponse = await axios.post(`${apiConfig.baseURL}/api/stud/camhistory`, campaignHistoryData);
      const campaignId = campaignResponse.data.id;
      console.log("Initial Campaign History Saved:", campaignResponse.data);
  
     // Send emails concurrently using Promise.all
        await Promise.all(
          recipients.map(async (email, index) => {
            try {
              const response = await axios.post(`${apiConfig.baseURL}/api/stud/sendtestmail`, {
                emailData: { ...emailData, recipient: email },
                previewContent,
                bgColor,
                attachments,
                campaignId,
                userId: user.id
              });
    
              if (response.status === 200) {
                sentEmails.push(email);
              } else {
                console.error(`Failed to send email to ${email}:`, response);
                failedEmails.push(email);
              }
            } catch (err) {
              console.error(`Error sending email to ${email}:`, err);
              failedEmails.push(email);
            }
            // Update progress dynamically
            const totalEmails = recipients.length;
            const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
            const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
            const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;
      
            // Update the database after each email is processed
            await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
              sendcount: sentEmails.length,
              failedcount: failedEmails.length,
              sentEmails,
              failedEmails,
              status: "In Progress",
              progress: currentProgress, // Updated progress calculation
            }); 
            console.log(`Progress updated: ${currentProgress}%`);
          })
        );
    
  
      // Final DB update after sending all emails
      const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
      await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${campaignId}`, {
        sendcount: sentEmails.length,
        failedcount: failedEmails.length,
        sentEmails,
        failedEmails,
        status: finalStatus,
      });
  
      console.log("Emails sent successfully");
    } catch (error) {
      console.error("Error in sendEmail:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  //add variable
  const handleInsertName = (index, name) => {
    const updatedPreviewContent = [...previewContent];

    // Append {fname} or {lname} at the end of the existing content
    updatedPreviewContent[index].content += name;

    setPreviewContent(updatedPreviewContent);
    setSelectedGroup(false);
  };

  const handleCursorPosition = (e, index) => {
    const cursorPosition = e.target.selectionStart; // Get the cursor position inside the content
    const updatedPreviewContent = [...previewContent];
    updatedPreviewContent[index].cursorPosition = cursorPosition;

    setPreviewContent(updatedPreviewContent);
  };

  // Drag and drop logic
  const handleDragStart = (index) => {
    dragIndex.current = index;
  };

  const handleDrop = (dropIndex) => {
    if (dragIndex.current !== null) {
      const tempContent = [...previewContent];
      const [draggedItem] = tempContent.splice(dragIndex.current, 1);
      tempContent.splice(dropIndex, 0, draggedItem);
      setPreviewContent(tempContent);
      dragIndex.current = null;
    }
  };

  const handleEditorDrop = (e) => {
    e.preventDefault();
    const type = dragIndex.current;
    if (type === "para") addText();
    else if (type === "head") addHeading();
    else if (type === "image") addImage();
    else if (type === "logo") addLogo();
    else if (type === "button") addButton();
    else if (type === "multi-image") addMultiImage();
    else if (type === "link-image") addlinkImage();
    else if (type === "imagewithtext") addImageText();
    else if (type === "textwithimage") addTextImage();
    else if (type === "video-icon") addVideo();
    else if (type === "icons") addSocialMedia();
    else if (type === "multipleimage") addMultipleImage();
    else if (type === "cardimage") addCardImage();



    dragIndex.current = null; // Reset the type after drop
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop by preventing default
  };
 
 


  //  // Toggle function that only works on mobile devices
  //  const handleToggle = () => {
  //    if (window.matchMedia("(max-width: 768px)").matches) {
  //      setShowMobileContent((prev) => !prev);
  //    }
  //  };


  const handleLinkClick = (e, index) => {
    e.preventDefault(); // Prevent default navigation
    const link = previewContent[index]?.link || "";
    if (link) {
      window.open(link.startsWith("http") ? link : `http://${link}`, "_blank");
    }
  };

  return (
    <div>
      <div
        className="mobile-content"
      >
        <div className="desktop-nav">
          <nav className="navbar-read">
            <div>
            <h5 className="company-name-read">
  <span style={{ color: "#2f327D" }}>
    {(() => {
      let name = clickcampaigns?.campaignname || ""; // Ensure it's a string

      if (!name.includes("IndividualClick-Retarget")) {
        return `IndividualClick-Retarget ${name}`; // If not present, add Click-Retarget
      } 

      let match = name.match(/IndividualClick-Retarget(?:-(\d+))?/);
      let count = match && match[1] ? parseInt(match[1]) + 1 : 2; // If present, increment count

      return name.replace(/IndividualClick-Retarget(?:-\d+)?/, `IndividualClick-Retarget-${count}`);
    })()}
  </span>
  <span style={{ color: "#f48c06" }}> Campaign</span>
</h5>

            </div>
            <div>
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="undo-btn"
                data-tooltip="Undo" // Custom tooltip using data attribute
              >
                <i className="fas fa-undo-alt"></i>
              </button>

              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="redo-btn"
                data-tooltip="Redo" // Custom tooltip using data attribute
              >
                <i className="fas fa-redo-alt"></i>
              </button>

              <button
                onClick={() => setIsMobileView(false)}
                className="navbar-button-Desktop"
              >
                <span className="Nav-icons">
                  <FaDesktop />
                </span>{" "}
                {/* <span className="nav-names">Desktop</span> */}
              </button>
              <button
                onClick={() => setIsMobileView(true)}
                className="navbar-button-Desktop"
              >
                <span className="Nav-icons">
                  <MdPhoneAndroid />
                </span>{" "}
                {/* <span className="nav-names">Mobile</span> */}
              </button>

              <button
                onClick={() => setShowTemplateModal(true)}
                className="navbar-button-send"
              >
                <span className="Nav-icons">
                  <FaSave />
                </span>{" "}
                <span className="nav-names">Save</span>
              </button>
              
              <button  ref={templateRef}
                onClick={(e) => toggletemplate(e)}
                className="navbar-button-send"
              >
                <span className="Nav-icons">
                  <FaEye />
                </span>{" "}
                <span className="nav-names">Templates</span>
              </button>

              {/* Template List - Shown below View button when isOpen is true */}
              {isOpentemplate && (
                <div className="template-list" ref={templateRef}>
                  <p className="template-title">
                    <span>Select</span> Template
                  </p>
                  {templates.length > 0 ? (
                    <div className="template-container">
                      {templates.map((template) => (
                        <div
                          key={template._id}
                          className="template-item"
                          onClick={() => handlePreview(template)}
                        >
                          {template.temname}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-template">No templates available</div>
                  )}
                </div>
              )}

              <button
                onClick={() => setModalOpen(true)}
                className="navbar-button-send"
              >
                <span className="Nav-icons">
                  <MdSend />
                </span>{" "}
                <span className="nav-names">Send Mail</span>
              </button>
              <button onClick={handlebackcampaign} className="navbar-button">
                <span className="Nav-icons">
                  <FaArrowLeft />
                </span>{" "}
                <span className="nav-names">Home</span>
              </button>
            </div>
          </nav>
        </div>
        <div className="Mobile-nav">
          <nav className="navbar-read">
            <div className="navbar-header">
            <h5 className="company-name-read">
  <span style={{ color: "#2f327D" }}>
    {(() => {
      let name = clickcampaigns?.campaignname || ""; // Ensure it's a string

      if (!name.includes("IndividualClick-Retarget")) {
        return `IndividualClick-Retarget ${name}`; // If not present, add Click-Retarget
      } 

      let match = name.match(/IndividualClick-Retarget(?:-(\d+))?/);
      let count = match && match[1] ? parseInt(match[1]) + 1 : 2; // If present, increment count

      return name.replace(/IndividualClick-Retarget(?:-\d+)?/, `IndividualClick-Retarget-${count}`);
    })()}
  </span>
  <span style={{ color: "#f48c06" }}> Campaign</span>
</h5>
            </div>
            <div className="nav-edit">
              <div>
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="undo-btn"
                  data-tooltip="Undo"
                >
                  <i className="fas fa-undo-alt"></i>
                </button>
              </div>
              <div>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="redo-btn"
                  data-tooltip="Redo"
                >
                  <i className="fas fa-redo-alt"></i>
                </button>
              </div>
              <div>
                <button
                  className="toggle-btn"
                  onClick={() => setIsNavOpen(!isNavOpen)}
                >
                  {isNavOpen ? <FaTimes /> : <FaBars />}
                </button>
              </div>
            </div>

            {isNavOpen && (
              <div className="navbar-content">
                <button onClick={() => {
    setShowTemplateModal(true);
    if (window.innerWidth < 768) {
      setIsNavOpen(false); // Close toggle only in mobile view
    }
  }}                  className="navbar-button-sends"
                >
                  <span className="Nav-icons">
                    <FaSave />
                  </span>{" "}
                  <span className="nav-names">Save</span>
                </button>
                <button
                onClick={(e) => toggletemplate(e)}
                className="navbar-button-send"
                >
                  <span className="Nav-icons">
                    <FaEye />
                  </span>{" "}
                  <span className="nav-names">Templates</span>
                </button>

                {/* Template List - Shown below View button when isOpen is true */}
                {isOpentemplate && (
                  <div className="template-list" ref={templateRef}>
                    <p className="template-title">
                      <span>Select</span> Template
                    </p>
                    {templates.length > 0 ? (
                      <div className="template-container">
                        {templates.map((template) => (
                          <div
                            key={template._id}
                            className="template-item"
                            onClick={() => handlePreview(template)}
                            >
                            {template.temname}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-template">No templates available</div>
                    )}
                  </div>
                )}
                <button
                  
                  className="navbar-button-send"
                >
                  <span className="Nav-icons">
                    <MdSend />
                  </span>{" "}
                  <span className="nav-names">Send Mail</span>
                </button>

                <button onClick={handlebackcampaign} className="navbar-button">
                  <span className="Nav-icons">
                    <FaArrowLeft />
                  </span>
                  <span className="nav-names">Home</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        <div className="app-container">
          {/* Left Editor */}
          <div className="editor item-2">
            {/* Tabs */}
            <div className="tabs">
              <button className="tab">Components</button>
            </div>

            <div className="edit-btn">
              {/* Tab Content */}
              <div className="content-tab">
                <button
                  onClick={addLogo}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("logo")}
                >
                  <MdAddPhotoAlternate /> Logo
                </button>
                <button
                  onClick={addHeading}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("head")}
                >
                  <FaHeading /> Heading
                </button>
                <button
                  onClick={addText}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("para")}
                >
                  <FaParagraph /> Paragraph
                </button>
                <button
                  onClick={addImage}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("image")}
                >
                  <FaImage /> Image
                </button>
                <button
                  onClick={addlinkImage}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("link-image")}
                >
                  <FaImage />
                  Clickable Image
                </button>
                <button
                  onClick={addMultiImage}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("multi-image")}
                >
                  <FaImage /> Multi-Image-Button
                </button>
                <button
                  onClick={addMultipleImage}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("multipleimage")}
                >
                  <FaImage /> Multi-Image
                </button>
                <button
                  onClick={addCardImage}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("cardimage")}
                >
                  <FaIdCard/> Image-Card
                </button>

                <button
                  onClick={addTextImage}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("textwithimage")}
                >
                  <FaFileImage /> Text-Image
                </button>
                <button
                  onClick={addImageText}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("imagewithtext")}
                >
                  <FaFileImage /> Image-Text
                </button>

                <button
                  onClick={addVideo}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("video-icon")}
                >
                  <FaVideo />
                  Video
                </button>
                <button
                  onClick={addSocialMedia}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("icons")}
                >
                  <FaGlobe />
                  Social Icons
                </button>
                <button
                  onClick={addButton}
                  className="editor-button"
                  draggable
                  onDragStart={(e) => handleDragStart("button")}
                >
                  <FaPlusSquare /> Button
                </button>
                <button className="editor-button">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-color-pic"
                  />
                  Template-Bg
                </button>
              </div>
            </div>

            {/* Styling Controls */}
          <>
                        {selectedIndex !== null && previewContent[selectedIndex] && (
                          <>
                            {isMobilestyle ? (
                              <>
                                {isModalOpenstyle && (
                                  <div className="modal-overlay-send" >
                                    <div className="modal-content-style">
                                      <button
                                        className="close-btn-style"
                                        onClick={() => setIsModalOpenstyle(false)}
                                      >
                                        X
                                      </button>
                                      <h3>Style Controls</h3>
                                      <div className="style-item">
                                        {previewContent[selectedIndex].type ===
                                          "para" && (
                                          <>
                            <ColorPicker
                  label="Text Color"
                  objectKey="style.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                <ColorPicker 
                  label="Text Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                          </>
                                        )}
                                        {previewContent[selectedIndex].type === "multipleimage" && (
                                    <>
                                    <div style={{textAlign:"center"}}>No style control for this type</div>
                                     </>
                                        )}
          {previewContent[selectedIndex].type === "cardimage" && (
                                    <>
                                     <ColorPicker
                  label="Text Color"
                  objectKey="style1.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                <ColorPicker 
                  label="Text Background"
                  objectKey="style1.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                     
                                    </>
                                  )}
          
          
                                        {previewContent[selectedIndex].type ===
                                          "head" && (
                                          <>
                                            <label>Font Size:</label>
                                            <input
                                              type="number"
                                              value={parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.fontSize.replace("px", "")
                                              )}
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    fontSize: `${e.target.value}px`,
                                                  },
                                                })
                                              }
                                            />
                                           <ColorPicker
                  label="Text Color"
                  objectKey="style.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                <ColorPicker 
                  label="Text Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                            <label>Text Alignment:</label>
                                            <select
                                              value={
                                                previewContent[selectedIndex].style
                                                  .textAlign
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    textAlign: e.target.value,
                                                  },
                                                })
                                              }
                                            >
                                              <option value="left">Left</option>
                                              <option value="center">Center</option>
                                              <option value="right">Right</option>
                                            </select>
                                          </>
                                        )}
                                        {previewContent[selectedIndex].type ===
                                          "button" && (
                                          <>
                                            <label>Button name:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter button name"
                                              value={
                                                previewContent[selectedIndex].content ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  content: e.target.value,
                                                })
                                              }
                                            />
                                          <ColorPicker
                  label="Text Color"
                  objectKey="style.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                <ColorPicker 
                  label="Text Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                            <label>Text Alignment:</label>
                                            <select
                                              value={
                                                previewContent[selectedIndex]?.style
                                                  ?.textAlign || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    textAlign: e.target.value,
                                                  },
                                                })
                                              }
                                            >
                                              <option value="left">Left</option>
                                              <option value="center">Center</option>
                                              <option value="right">Right</option>
                                            </select>
          
                                            <label>Button Size:</label>
                                            <div>
                                              <button
                                                className="modal-btn-size"
                                                onClick={() =>
                                                  updateContent(selectedIndex, {
                                                    style: {
                                                      ...previewContent[selectedIndex]
                                                        .style,
                                                      width: "auto",
                                                    },
                                                  })
                                                }
                                              >
                                                Small
                                              </button>
                                              <button
                                                className="modal-btn-size"
                                                onClick={() =>
                                                  updateContent(selectedIndex, {
                                                    style: {
                                                      ...previewContent[selectedIndex]
                                                        .style,
                                                      width: "60%",
                                                    },
                                                  })
                                                }
                                              >
                                                Medium
                                              </button>
                                              <button
                                                className="modal-btn-size"
                                                onClick={() =>
                                                  updateContent(selectedIndex, {
                                                    style: {
                                                      ...previewContent[selectedIndex]
                                                        .style,
                                                      width: "85%",
                                                    },
                                                  })
                                                }
                                              >
                                                Large
                                              </button>
                                            </div>
          
                                            <label>Border Radius:</label>
                                            <input
                                              type="range"
                                              min="0"
                                              max="50"
                                              value={parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.borderRadius.replace("px", "")
                                              )}
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    borderRadius: `${e.target.value}px`,
                                                  },
                                                })
                                              }
                                            />
          
                                            <label>Link:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].link || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  link: e.target.value,
                                                })
                                              }
                                            />
                                          </>
                                        )}
          
                                        {/* New Editor for Multi-Image Links and Button Styling */}
                                        {previewContent[selectedIndex].type ===
                                          "multi-image" && (
                                          <>
                                            <h4>Button-1 Styles</h4>
                                            <div>
                                              <label>Button Name:</label>
                                              <input
                                                type="text"
                                                placeholder="Enter button name"
                                                value={
                                                  previewContent[selectedIndex]
                                                    .content1 || ""
                                                }
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    content1: e.target.value,
                                                  })
                                                }
                                              />
                                              <label>Button Link:</label>
                                              <input
                                                type="text"
                                                value={
                                                  previewContent[selectedIndex].link1
                                                }
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    link1: e.target.value,
                                                  })
                                                }
                                              />
                                              <ColorPicker
                  label="Button Text Color"
                  objectKey="buttonStyle1.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                <ColorPicker 
                  label="Button Text Background"
                  objectKey="buttonStyle1.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                              <label>Text Alignment:</label>
                                              <select
                                                value={
                                                  previewContent[selectedIndex]
                                                    ?.buttonStyle1?.textAlign || ""
                                                }
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    buttonStyle1: {
                                                      ...previewContent[selectedIndex]
                                                        .buttonStyle1,
                                                      textAlign: e.target.value,
                                                    },
                                                  })
                                                }
                                              >
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                              </select>
                                              <label>Button Size:</label>
                                              <div>
                                                <button
                                                  className="modal-btn-size"
                                                  onClick={() =>
                                                    updateContent(selectedIndex, {
                                                      buttonStyle1: {
                                                        ...previewContent[selectedIndex]
                                                          .buttonStyle1,
                                                        width: "auto",
                                                      },
                                                    })
                                                  }
                                                >
                                                  Small
                                                </button>
                                                <button
                                                  className="modal-btn-size"
                                                  onClick={() =>
                                                    updateContent(selectedIndex, {
                                                      buttonStyle1: {
                                                        ...previewContent[selectedIndex]
                                                          .buttonStyle1,
                                                        width: "50%",
                                                      },
                                                    })
                                                  }
                                                >
                                                  Medium
                                                </button>
                                                <button
                                                  className="modal-btn-size"
                                                  onClick={() =>
                                                    updateContent(selectedIndex, {
                                                      buttonStyle1: {
                                                        ...previewContent[selectedIndex]
                                                          .buttonStyle1,
                                                        width: "80%",
                                                      },
                                                    })
                                                  }
                                                >
                                                  Large
                                                </button>
                                              </div>
                                              <label>Border Radius:</label>
                                              <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={parseInt(
                                                  previewContent[
                                                    selectedIndex
                                                  ].buttonStyle1.borderRadius.replace(
                                                    "px",
                                                    ""
                                                  )
                                                )}
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    buttonStyle1: {
                                                      ...previewContent[selectedIndex]
                                                        .buttonStyle1,
                                                      borderRadius: `${e.target.value}px`,
                                                    },
                                                  })
                                                }
                                              />
                                            </div>
                                            <h4>Button-2 Style</h4>
                                            <div>
                                              <label>Button Name:</label>
                                              <input
                                                type="text"
                                                placeholder="Enter button name"
                                                value={
                                                  previewContent[selectedIndex]
                                                    .content2 || ""
                                                }
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    content2: e.target.value,
                                                  })
                                                }
                                              />
          
                                              <label>Button Link:</label>
                                              <input
                                                type="text"
                                                value={
                                                  previewContent[selectedIndex].link2
                                                }
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    link2: e.target.value,
                                                  })
                                                }
                                              />
          
          <ColorPicker
                  label="Button Text Color"
                  objectKey="buttonStyle2.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                        <ColorPicker
                  label="Button Text Background"
                  objectKey="buttonStyle2.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
          
                                              <label>Text Alignment:</label>
                                              <select
                                                value={
                                                  previewContent[selectedIndex]
                                                    ?.buttonStyle2?.textAlign || ""
                                                }
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    buttonStyle2: {
                                                      ...previewContent[selectedIndex]
                                                        .buttonStyle2,
                                                      textAlign: e.target.value,
                                                    },
                                                  })
                                                }
                                              >
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                              </select>
          
                                              <label>Button Size:</label>
                                              <div>
                                                <button
                                                  className="modal-btn-size"
                                                  onClick={() =>
                                                    updateContent(selectedIndex, {
                                                      buttonStyle2: {
                                                        ...previewContent[selectedIndex]
                                                          .buttonStyle2,
                                                        width: "auto",
                                                      },
                                                    })
                                                  }
                                                >
                                                  Small
                                                </button>
                                                <button
                                                  className="modal-btn-size"
                                                  onClick={() =>
                                                    updateContent(selectedIndex, {
                                                      buttonStyle2: {
                                                        ...previewContent[selectedIndex]
                                                          .buttonStyle2,
                                                        width: "50%",
                                                      },
                                                    })
                                                  }
                                                >
                                                  Medium
                                                </button>
                                                <button
                                                  className="modal-btn-size"
                                                  onClick={() =>
                                                    updateContent(selectedIndex, {
                                                      buttonStyle2: {
                                                        ...previewContent[selectedIndex]
                                                          .buttonStyle2,
                                                        width: "80%",
                                                      },
                                                    })
                                                  }
                                                >
                                                  Large
                                                </button>
                                              </div>
          
                                              <label>Border Radius:</label>
                                              <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={parseInt(
                                                  previewContent[
                                                    selectedIndex
                                                  ].buttonStyle2.borderRadius.replace(
                                                    "px",
                                                    ""
                                                  )
                                                )}
                                                onChange={(e) =>
                                                  updateContent(selectedIndex, {
                                                    buttonStyle2: {
                                                      ...previewContent[selectedIndex]
                                                        .buttonStyle2,
                                                      borderRadius: `${e.target.value}px`,
                                                    },
                                                  })
                                                }
                                              />
                                            </div>
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex]?.type ===
                                          "icons" && (
                                          <>
                  
                        <ColorPicker
                  label="Background Color"
                  objectKey="ContentStyle.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                            <label>Link1:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].links1 || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  links1: e.target.value,
                                                })
                                              }
                                            />
          
                                            <label>Link2:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].links2 || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  links2: e.target.value,
                                                })
                                              }
                                            />
          
                                            <label>Link3:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].links3 || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  links3: e.target.value,
                                                })
                                              }
                                            />
          
                                            <label>Link4:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].links4 || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  links4: e.target.value,
                                                })
                                              }
                                            />
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex].type ===
                                          "link-image" && (
                                          <>
                                            <label>Size (%):</label>
                                            <input
                                              type="range"
                                              min="10"
                                              max="100"
                                              value={parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              )}
                                              onChange={(e) => {
                                                const newSize = e.target.value;
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    width: `${newSize}%`,
                                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                                  },
                                                });
                                              }}
                                            />
                                            <span>
                                              {parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              )}
                                              %
                                            </span>
          
                                            <ColorPicker
                  label="Image Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
          
                                            <label>Link:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].link || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  link: e.target.value,
                                                })
                                              }
                                            />
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex].type ===
                                          "logo" && (
                                          <>
                                            <label>Size (%):</label>
                                            <input
                                              type="range"
                                              min="10"
                                              max="100"
                                              value={
                                                parseInt(
                                                  previewContent[
                                                    selectedIndex
                                                  ].style.width.replace("%", "")
                                                ) || 50
                                              }
                                              onChange={(e) => {
                                                const newSize = e.target.value;
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    width: `${newSize}%`,
                                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                                  },
                                                });
                                              }}
                                            />
                                            <span>
                                              {parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              ) || 50}
                                              %
                                            </span>
          
                                            <label>Border Radius:</label>
                                            <input
                                              type="range"
                                              min="0"
                                              max="50"
                                              value={parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.borderRadius.replace("px", "")
                                              )}
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    borderRadius: `${e.target.value}px`,
                                                  },
                                                })
                                              }
                                            />
                        <ColorPicker
                  label="Image Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                           
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex].type ===
                                          "textwithimage" && (
                                          <>
                                           <ColorPicker
                  label="Text Color"
                  objectKey="style.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                        <ColorPicker
                  label="Text Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex].type ===
                                          "imagewithtext" && (
                                          <>
                                           <ColorPicker
                  label="Text Color"
                  objectKey="style1.color"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                        <ColorPicker
                  label="Text Background"
                  objectKey="style1.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex].type ===
                                          "video-icon" && (
                                          <>
                                            <label>Size (%):</label>
                                            <input
                                              type="range"
                                              min="50"
                                              max="100"
                                              value={parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              )}
                                              onChange={(e) => {
                                                const newSize = e.target.value;
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    width: `${newSize}%`,
                                                  },
                                                });
                                              }}
                                            />
                                            <span>
                                              {parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              )}
                                              %
                                            </span>
          
                                            <label>Link:</label>
                                            <input
                                              type="text"
                                              placeholder="Enter URL"
                                              value={
                                                previewContent[selectedIndex].link || ""
                                              }
                                              onChange={(e) =>
                                                updateContent(selectedIndex, {
                                                  link: e.target.value,
                                                })
                                              }
                                            />
                                          </>
                                        )}
          
                                        {previewContent[selectedIndex].type ===
                                          "image" && (
                                          <>
                                            <label>Size (%):</label>
                                            <input
                                              type="range"
                                              min="10"
                                              max="100"
                                              value={parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              )}
                                              onChange={(e) => {
                                                const newSize = e.target.value;
                                                updateContent(selectedIndex, {
                                                  style: {
                                                    ...previewContent[selectedIndex]
                                                      .style,
                                                    width: `${newSize}%`,
                                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                                  },
                                                });
                                              }}
                                            />
                                            <span>
                                              {parseInt(
                                                previewContent[
                                                  selectedIndex
                                                ].style.width.replace("%", "")
                                              )}
                                              %
                                            </span>
                        <ColorPicker
                  label="Image Background"
                  objectKey="style.backgroundColor"
                  previewContent={previewContent}
                  selectedIndex={selectedIndex}
                  updateContent={updateContent}
                />
                                           
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                    <div className="style-controls" ref={styleControlsRef}>
                      <h3>Style Controls</h3>
                      <div className="style-item">
                        {previewContent[selectedIndex].type === "para" && (
                          <>
                            <div className="editor-bg">
                              Text Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style.color
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      color: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="editor-bg">
                              Text Background
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}

                        {previewContent[selectedIndex].type === "head" && (
                          <>
                            <label>Font Size:</label>
                            <input
                              type="number"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.fontSize.replace("px", "")
                              )}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    fontSize: `${e.target.value}px`,
                                  },
                                })
                              }
                            />
                            <div className="editor-bg">
                              Text Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style.color
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      color: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="editor-bg">
                              Text Background
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <label>Text Alignment:</label>
                            <select
                              value={
                                previewContent[selectedIndex].style.textAlign
                              }
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    textAlign: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </>
                        )}
                        {previewContent[selectedIndex].type === "button" && (
                          <>
                            <label>Button name:</label>
                            <input
                              type="text"
                              placeholder="Enter button name"
                              value={
                                previewContent[selectedIndex].content || ""
                              }
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  content: e.target.value,
                                })
                              }
                            />
                            <div className="editor-bg">
                              Background Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="editor-bg">
                              Text Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style.color
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      color: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <label>Text Alignment:</label>
                            <select
                              value={
                                previewContent[selectedIndex]?.style
                                  ?.textAlign || ""
                              }
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    textAlign: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>

                            <label>Button Size:</label>
                            <div>
                              <button
                                className="modal-btn-size"
                                onClick={() =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      width: "auto",
                                    },
                                  })
                                }
                              >
                                Small
                              </button>
                              <button
                                className="modal-btn-size"
                                onClick={() =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      width: "60%",
                                    },
                                  })
                                }
                              >
                                Medium
                              </button>
                              <button
                                className="modal-btn-size"
                                onClick={() =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      width: "85%",
                                    },
                                  })
                                }
                              >
                                Large
                              </button>
                            </div>

                            <label>Border Radius:</label>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.borderRadius.replace("px", "")
                              )}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    borderRadius: `${e.target.value}px`,
                                  },
                                })
                              }
                            />

                            <label>Link:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].link || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  link: e.target.value,
                                })
                              }
                            />
                          </>
                        )}

                        {/* New Editor for Multi-Image Links and Button Styling */}
                        {previewContent[selectedIndex].type ===
                          "multi-image" && (
                            <div>
                            <div className="tab-container-style">
                              <button
                                className={`tab-style ${activeTab === "button1" ? "active" : ""}`}
                                onClick={() => setActiveTab("button1")}
                              >
                                Button-1
                              </button>
                              <button
                                className={`tab-style ${activeTab === "button2" ? "active" : ""}`}
                                onClick={() => setActiveTab("button2")}
                              >
                                Button-2
                              </button>
                            </div>
                      
                            {activeTab === "button1" && (
                              <div className="style-editor">
                                <h4>Button-1 Styles</h4>
                                <label>Button Name:</label>
                                <input
                                  type="text"
                                  placeholder="Enter button name"
                                  value={previewContent[selectedIndex].content1 || ""}
                                  onChange={(e) => updateContent(selectedIndex, { content1: e.target.value })}
                                />
                                <label>Button Link:</label>
                                <input
                                  type="text"
                                  value={previewContent[selectedIndex].link1}
                                  onChange={(e) => updateContent(selectedIndex, { link1: e.target.value })}
                                />
                               <div className="editor-bg">
                                      Button Text Color:
                                      <input
                                        type="color"
                                        value={
                                          previewContent[selectedIndex]
                                            .buttonStyle1.color
                                        }
                                        onChange={(e) =>
                                          updateContent(selectedIndex, {
                                            buttonStyle1: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle1,
                                              color: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="editor-bg">
                                      Button Background Color:
                                      <input
                                        type="color"
                                        value={
                                          previewContent[selectedIndex]
                                            .buttonStyle1.backgroundColor
                                        }
                                        onChange={(e) =>
                                          updateContent(selectedIndex, {
                                            buttonStyle1: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle1,
                                              backgroundColor: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                    </div>

                                    <label>Text Alignment:</label>
                                    <select
                                      value={
                                        previewContent[selectedIndex]
                                          ?.buttonStyle1?.textAlign || ""
                                      }
                                      onChange={(e) =>
                                        updateContent(selectedIndex, {
                                          buttonStyle1: {
                                            ...previewContent[selectedIndex]
                                              .buttonStyle1,
                                            textAlign: e.target.value,
                                          },
                                        })
                                      }
                                    >
                                      <option value="left">Left</option>
                                      <option value="center">Center</option>
                                      <option value="right">Right</option>
                                    </select>
                                    <label>Button Size:</label>
                                    <div>
                                      <button
                                        className="modal-btn-size"
                                        onClick={() =>
                                          updateContent(selectedIndex, {
                                            buttonStyle1: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle1,
                                              width: "auto",
                                            },
                                          })
                                        }
                                      >
                                        Small
                                      </button>
                                      <button
                                        className="modal-btn-size"
                                        onClick={() =>
                                          updateContent(selectedIndex, {
                                            buttonStyle1: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle1,
                                              width: "50%",
                                            },
                                          })
                                        }
                                      >
                                        Medium
                                      </button>
                                      <button
                                        className="modal-btn-size"
                                        onClick={() =>
                                          updateContent(selectedIndex, {
                                            buttonStyle1: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle1,
                                              width: "80%",
                                            },
                                          })
                                        }
                                      >
                                        Large
                                      </button>
                                    </div>
                                    <label>Border Radius:</label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="50"
                                      value={parseInt(
                                        previewContent[
                                          selectedIndex
                                        ].buttonStyle1.borderRadius.replace(
                                          "px",
                                          ""
                                        )
                                      )}
                                      onChange={(e) =>
                                        updateContent(selectedIndex, {
                                          buttonStyle1: {
                                            ...previewContent[selectedIndex]
                                              .buttonStyle1,
                                            borderRadius: `${e.target.value}px`,
                                          },
                                        })
                                      }
                                    />
                              </div>
                            )}
                      
                            {activeTab === "button2" && (
                              <div className="style-editor">
                                <h4>Button-2 Styles</h4>
                                <label>Button Name:</label>
                                <input
                                  type="text"
                                  placeholder="Enter button name"
                                  value={previewContent[selectedIndex].content2 || ""}
                                  onChange={(e) => updateContent(selectedIndex, { content2: e.target.value })}
                                />
                                <label>Button Link:</label>
                                <input
                                  type="text"
                                  value={previewContent[selectedIndex].link2}
                                  onChange={(e) => updateContent(selectedIndex, { link2: e.target.value })}
                                />
                                 <div className="editor-bg">
                                      Button Text Color:
                                      <input
                                        type="color"
                                        value={
                                          previewContent[selectedIndex]
                                            .buttonStyle2.color
                                        }
                                        onChange={(e) =>
                                          updateContent(selectedIndex, {
                                            buttonStyle2: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle2,
                                              color: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                    </div>

                                    <div className="editor-bg">
                                      Button Background Color:
                                      <input
                                        type="color"
                                        value={
                                          previewContent[selectedIndex]
                                            .buttonStyle2.backgroundColor
                                        }
                                        onChange={(e) =>
                                          updateContent(selectedIndex, {
                                            buttonStyle2: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle2,
                                              backgroundColor: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                    </div>

                                    <label>Text Alignment:</label>
                                    <select
                                      value={
                                        previewContent[selectedIndex]
                                          ?.buttonStyle2?.textAlign || ""
                                      }
                                      onChange={(e) =>
                                        updateContent(selectedIndex, {
                                          buttonStyle2: {
                                            ...previewContent[selectedIndex]
                                              .buttonStyle2,
                                            textAlign: e.target.value,
                                          },
                                        })
                                      }
                                    >
                                      <option value="left">Left</option>
                                      <option value="center">Center</option>
                                      <option value="right">Right</option>
                                    </select>

                                    <label>Button Size:</label>
                                    <div>
                                      <button
                                        className="modal-btn-size"
                                        onClick={() =>
                                          updateContent(selectedIndex, {
                                            buttonStyle2: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle2,
                                              width: "auto",
                                            },
                                          })
                                        }
                                      >
                                        Small
                                      </button>
                                      <button
                                        className="modal-btn-size"
                                        onClick={() =>
                                          updateContent(selectedIndex, {
                                            buttonStyle2: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle2,
                                              width: "50%",
                                            },
                                          })
                                        }
                                      >
                                        Medium
                                      </button>
                                      <button
                                        className="modal-btn-size"
                                        onClick={() =>
                                          updateContent(selectedIndex, {
                                            buttonStyle2: {
                                              ...previewContent[selectedIndex]
                                                .buttonStyle2,
                                              width: "80%",
                                            },
                                          })
                                        }
                                      >
                                        Large
                                      </button>
                                    </div>

                                    <label>Border Radius:</label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="50"
                                      value={parseInt(
                                        previewContent[
                                          selectedIndex
                                        ].buttonStyle2.borderRadius.replace(
                                          "px",
                                          ""
                                        )
                                      )}
                                      onChange={(e) =>
                                        updateContent(selectedIndex, {
                                          buttonStyle2: {
                                            ...previewContent[selectedIndex]
                                              .buttonStyle2,
                                            borderRadius: `${e.target.value}px`,
                                          },
                                        })
                                      }
                                    />
                              </div>
                            )}
                            </div>
                        )}

                        {previewContent[selectedIndex]?.type === "icons" && (
                          <>
                            <div className="editor-bg">
                              Background Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex]?.ContentStyle
                                    ?.backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    ContentStyle: {
                                      ...previewContent[selectedIndex]
                                        .ContentStyle,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <label>Link1:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].links1 || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  links1: e.target.value,
                                })
                              }
                            />

                            <label>Link2:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].links2 || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  links2: e.target.value,
                                })
                              }
                            />

                            <label>Link3:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].links3 || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  links3: e.target.value,
                                })
                              }
                            />

                            <label>Link4:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].links4 || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  links4: e.target.value,
                                })
                              }
                            />
                          </>
                        )}

                        {previewContent[selectedIndex].type ===
                          "link-image" && (
                          <>
                            <label>Size (%):</label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              onChange={(e) => {
                                const newSize = e.target.value;
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    width: `${newSize}%`,
                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                  },
                                });
                              }}
                            />
                            <span>
                              {parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              %
                            </span>

                            <div className="editor-bg">
                              Image Background
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>

                            <label>Link:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].link || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  link: e.target.value,
                                })
                              }
                            />
                          </>
                        )}

                        {previewContent[selectedIndex].type === "logo" && (
                          <>
                            <label>Size (%):</label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={
                                parseInt(
                                  previewContent[
                                    selectedIndex
                                  ].style.width.replace("%", "")
                                ) || 50
                              }
                              onChange={(e) => {
                                const newSize = e.target.value;
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    width: `${newSize}%`,
                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                  },
                                });
                              }}
                            />
                            <span>
                              {parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              ) || 50}
                              %
                            </span>

                            <label>Border Radius:</label>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.borderRadius.replace("px", "")
                              )}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    borderRadius: `${e.target.value}px`,
                                  },
                                })
                              }
                            />

                            <div className="editor-bg">
                              Image Background
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}

                        {previewContent[selectedIndex].type ===
                          "textwithimage" && (
                          <>
                            <div className="editor-bg">
                              Background Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="editor-bg">
                              Text Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style.color ||
                                  "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      color: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}

                        {previewContent[selectedIndex].type ===
                          "imagewithtext" && (
                          <>
                            <div className="editor-bg">
                              Background Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style1
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style1: {
                                      ...previewContent[selectedIndex].style1,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="editor-bg">
                              Text Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style1.color ||
                                  "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style1: {
                                      ...previewContent[selectedIndex].style1,
                                      color: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}


{previewContent[selectedIndex].type === "cardimage" && (
                          <>
                            <label>Size (%):</label>
                            <input
                              type="range"
                              min="70"
                              max="100"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              onChange={(e) => {
                                const newSize = e.target.value;
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    width: `${newSize}%`,
                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                  },
                                });
                              }}
                            />
                            <span>
                              {parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              %
                            </span>

                            <div className="editor-bg">
                              Background Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style1
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style1: {
                                      ...previewContent[selectedIndex].style1,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="editor-bg">
                              Text Color
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style1.color ||
                                  "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style1: {
                                      ...previewContent[selectedIndex].style1,
                                      color: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}

                        {previewContent[selectedIndex].type ===
                          "video-icon" && (
                          <>
                            <label>Size (%):</label>
                            <input
                              type="range"
                              min="50"
                              max="100"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              onChange={(e) => {
                                const newSize = e.target.value;
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    width: `${newSize}%`,
                                    // height: `${newSize}px`, // Adjusting height based on size percentage
                                  },
                                });
                              }}
                            />
                            <span>
                              {parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              %
                            </span>

                            <label>Link:</label>
                            <input
                              type="text"
                              placeholder="Enter URL"
                              value={previewContent[selectedIndex].link || ""}
                              onChange={(e) =>
                                updateContent(selectedIndex, {
                                  link: e.target.value,
                                })
                              }
                            />
                          </>
                        )}

                        {previewContent[selectedIndex].type === "image" && (
                          <>
                            <label>Size (%):</label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              onChange={(e) => {
                                const newSize = e.target.value;
                                updateContent(selectedIndex, {
                                  style: {
                                    ...previewContent[selectedIndex].style,
                                    width: `${newSize}%`,
                                    // height: `${newSize * 5}px`, // Adjusting height based on size percentage
                                  },
                                });
                              }}
                            />
                            <span>
                              {parseInt(
                                previewContent[
                                  selectedIndex
                                ].style.width.replace("%", "")
                              )}
                              %
                            </span>

                            <div className="editor-bg">
                              Image Background
                              <input
                                type="color"
                                value={
                                  previewContent[selectedIndex].style
                                    .backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  updateContent(selectedIndex, {
                                    style: {
                                      ...previewContent[selectedIndex].style,
                                      backgroundColor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          </div>

          {/* Right Preview */}
          <div className="preview-container item-1">
            {selectedTemplate && (
              <h3 className="temname">{selectedTemplate.temname} Template</h3>
            )}{" "}
            {/* Now it's used */}
            <div
              className={`template-preview ${
                isMobileView ? "mobile-view" : ""
              }`}
              style={{ backgroundColor: bgColor }}
              onDrop={handleEditorDrop}
              onDragOver={handleDragOver}
            >
              <div
                className="preview-card"
                style={{ backgroundColor: bgColor }}
              >
                {previewContent.map((item, index) => {
                  if (!item || !item.type) {
                    return null; // Skip rendering undefined or malformed items
                  }
                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(index)}
                      className="content-item"
                      onClick={() => handleItemClick(index)}
                      style={item.style}
                    >
                      {item.type === "para" && (
                       <>
                         <p
                           className="border"
                           contentEditable
                           suppressContentEditableWarning
                           onClick={() => {
                             setSelectedIndex(index);
                             setSelectedContent(item.content); // Store the correct content
                             setIsModalOpen(true); // Open the modal
                           }}
                           style={item.style}
                           dangerouslySetInnerHTML={{ __html: item.content }}
                         />
                         {isModalOpen && selectedIndex === index && (
                           <ParaEditor
                             isOpen={isModalOpen}
                             content={selectedContent} // Pass the correct content
                             style={item.style}
                             onSave={(newContent) => {
                               updateContent(index, { content: newContent }); // Save the new content
                               setIsModalOpen(false);
                             }}
                             onClose={() => setIsModalOpen(false)}
                           />
                         )}
                       </>
                     )}

{item.type === "multipleimage" ? (
                        <div className="Layout-img">
                          <div className="Layout">
                            <img
                              src={
                                item.src1 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiple-img"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 1)}
                            />
                          </div>

                          <div className="Layout">
                            <img
                              src={
                                item.src2 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiple-img"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 2)}
                            />
                          </div>
                        </div>
                      ) : null}

                      {item.type === "multi-image" ? (
                        <div className="Layout-img">
                          <div className="Layout">
                            <img
                              src={
                                item.src1 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiimg"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 1)}
                            />
                            <a
                              href={item.link1}
                              target="_blank"
                              className="button-preview"
                              rel="noopener noreferrer"
                              style={item.buttonStyle1}
                            >
                              {item.content1}
                            </a>
                          </div>

                          <div className="Layout">
                            <img
                              src={
                                item.src2 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiimg"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 2)}
                            />
                            <a
                              href={item.link2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button-preview"
                              style={item.buttonStyle2}
                            >
                              {item.content2}
                            </a>
                          </div>
                        </div>
                      ) : null}

                      {item.type === "video-icon" ? (
                        <div className="video-icon">
                          <img
                            src={item.src1 || "https://via.placeholder.com/200"}
                            alt="Editable"
                            className="videoimg"
                            title="Upload Thumbnail Image"
                            style={item.style}
                            onClick={() => uploadImage(index, 1)}
                          />
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={item.src2}
                              className="video-btn"
                              alt="icon"
                            />
                          </a>
                        </div>
                      ) : null}

                      
{item.type === "cardimage" ? (
                        <div
                          className="card-image-container"
                          style={item.style1}
                        >
                          <img
                            src={item.src1 || "https://via.placeholder.com/200"}
                            style={item.style}
                            alt="Editable"
                            className="card-image"
                            title="Upload Image"
                            onClick={() => uploadImage(index, 1)}
                          />
                          <p
                            className="card-text"
                            contentEditable
                            suppressContentEditableWarning
                            onClick={() => setModalIndex(index)} // Open modal for this index
                            style={item.style}
                            dangerouslySetInnerHTML={{
                              __html: item.content1,
                            }}
                          />

                          {modalIndex === index && ( // Open only for the selected index
                            <ParaEditor
                              isOpen={true}
                              content={item.content1}
                              onSave={(newContent) => {
                                updateContent(index, { content1: newContent });
                                setModalIndex(null); // Close modal after save
                              }}
                              onClose={() => setModalIndex(null)}
                            />
                          )}
                        </div>
                      ) : null}
{item.type === "head" && (
      <div ref={dropdownRef}>
        <p
          className="border"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) =>
            updateContent(index, {
              content: e.target.textContent,
            })
          }
          onMouseUp={(e) => handleCursorPosition(e, index)}
          onSelect={(e) => handleCursorPosition(e, index)}
          style={item.style}
        >
          {item.content}
        </p>

        {/* Local state for each heading */}
        <div className="select-group-container">
          {/* Select Group */}
          <select
            onChange={(e) => handleGroupChange(e, index)}
            value={selectedGroup[index] || ""}
            className="select-variable"
          >
            <option value="" disabled className="template-title">
              Add Variable
            </option>
            <option value="" disabled>
              Select Group
            </option>
            {groups.map((group, idx) => (
              <option key={idx} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>

          {/* Show fields only for the selected heading */}
          {selectedGroup[index] && openedGroups[index] && (
            <div className="dropdown-container">
              <p className="template-title">
                <span>Add</span> Variable
              </p>
              {fieldNames[index] && fieldNames[index].length > 0 ? (
                <div>
                  {fieldNames[index].map((field, idx) => (
                    <div
                      className="list-field"
                      key={idx}
                      onClick={() => handleInsertName(index, `{${field}}`)}
                    >
                      {field}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-variables">No Variables</p>
              )}
            </div>
          )}
        </div>
      </div>
    )}

                      {item.type === "link-image" && (
                        <div className="border">
                          <a
                            href={item.link || "#"}
                            onClick={(e) => handleLinkClick(e, index)}
                          >
                            <img
                              src={
                                item.src || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="img"
                              style={item.style}
                            />
                          </a>
                        </div>
                      )}
                      {item.type === "image" && (
                        <div className="border">
                          <img
                            src={item.src || "https://via.placeholder.com/200"}
                            alt="Editable"
                            className="img"
                            style={item.style}
                          />
                        </div>
                      )}

                      {item.type === "icons" && (
                        <div
                          className="border"
                          style={item.ContentStyle}
                          key={index}
                        >
                          <div className="icon-containers">
                            <a
                              href={item.links1 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links1)}
                            >
                              <img
                                src={item.iconsrc1}
                                alt="Facebook"
                                className="icon"
                                style={item.style1}
                              />
                            </a>

                            <a
                              href={item.links2 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links2)}
                            >
                              <img
                                src={item.iconsrc2}
                                alt="Twitter"
                                className="icon"
                                rel="noopener noreferrer"
                                style={item.style2}
                              />
                            </a>

                            <a
                              href={item.links3 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links3)}
                            >
                              <img
                                src={item.iconsrc3}
                                alt="Instagram"
                                className="icon"
                                style={item.style3}
                              />
                            </a>

                            <a
                              href={item.links4 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links4)}
                            >
                              <img
                                src={item.iconsrc4}
                                alt="Youtube"
                                className="icon"
                                style={item.style4}
                              />
                            </a>
                          </div>
                        </div>
                      )}

                      {item.type === "imagewithtext" ? (
                        <div className="image-text-container">
                          <div
                            className="image-text-wrapper"
                            style={item.style1}
                          >
                            <img
                              src={
                                item.src1 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="image-item"
                              title="Upload Image"
                              onClick={() => uploadImage(index, 1)}
                            />
                            <p
                              className="text-item"
                              contentEditable
                              suppressContentEditableWarning
                              onClick={() => setModalIndex(index)} // Open modal for this index
                              style={item.style}
                              dangerouslySetInnerHTML={{
                                __html: item.content1,
                              }}
                            />
                          </div>
                          {modalIndex === index && ( // Open only for the selected index
                            <ParaEditor
                              isOpen={true}
                              content={item.content1}
                              onSave={(newContent) => {
                                updateContent(index, { content1: newContent });
                                setModalIndex(null); // Close modal after save
                              }}
                              onClose={() => setModalIndex(null)}
                            />
                          )}
                        </div>
                      ) : null}

                      {item.type === "textwithimage" ? (
                        <div className="image-text-container">
                          <div
                            className="image-text-wrapper"
                            style={item.style}
                          >
                            <p
                              className="text-item"
                              contentEditable
                              suppressContentEditableWarning
                              onClick={() => setModalIndex(index)} // Open modal for this index
                              style={item.style}
                              dangerouslySetInnerHTML={{
                                __html: item.content2,
                              }}
                            />
                            <img
                              src={
                                item.src2 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="image-item"
                              title="Upload Image"
                              onClick={() => uploadImage(index, 2)}
                            />
                          </div>
                          {modalIndex === index && ( // Open only for the selected index
                            <ParaEditor
                              isOpen={true}
                              content={item.content2}
                              onSave={(newContent) => {
                                updateContent(index, { content2: newContent });
                                setModalIndex(null); // Close modal after save
                              }}
                              onClose={() => setModalIndex(null)}
                            />
                          )}
                        </div>
                      ) : null}

                      {item.type === "logo" && (
                        <div className="border">
                          <img
                            src={item.src || "https://via.placeholder.com/200"}
                            alt="Editable"
                            className="logo"
                            style={item.style}
                          />
                        </div>
                      )}
                      {item.type === "button" && (
                        <div className="border-btn">
                          <a
                            href={item.link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={item.style}
                            className="button-preview"
                          >
                            {item.content}
                          </a>
                        </div>
                      )}
                      {item.type === "link" && (
                        <div className="border-btn">
                          <a
                            href={item.href || "#"}
                            onClick={(e) => handleLinkClick(e, index)}
                            style={item.style}
                          >
                            {item.content}
                          </a>
                        </div>
                      )}
                      <div className="del-edit-btn">
                        <button
                          className="delete-btn"
                          onClick={() => deleteContent(index)}
                        >
                          <FiTrash2 />
                        </button>
                        <button
                          className="edit-con-btn"
                          onClick={() => setIsModalOpenstyle(true)}
                        >
                          <FiEdit />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Modal for preview Content */}
            {/* Right Preview */}

           {isPreviewOpen &&(
              <div className="preview-modal-overlay-tem">
              <div className="preview-modal-content">
            <div className="preview-con item-1">
            {selectedTemplatepre && (
              <h3 className="temname">{selectedTemplatepre.temname} Preview</h3>
            )}{" "}
            {/* Now it's used */}
            <div
              className={`template-preview ${
                isMobileView ? "mobile-view" : ""
              }`}
              style={{ backgroundColor: bgColorpre }}
              onDrop={handleEditorDrop}
              onDragOver={handleDragOver}
            >
              <div
                className="preview-card"
                style={{ backgroundColor: bgColorpre }}
              >
                {previewContentpre.map((item, index) => {
                  if (!item || !item.type) {
                    return null; // Skip rendering undefined or malformed items
                  }
                  return (
                    <div
                      className="content-item-preview"
                      style={item.style}
                    >
                      {item.type === "para" && (
                        <>
                          <p
                            className="border"
                            contentEditable
                            suppressContentEditableWarning
                            onClick={() => {
                              setSelectedIndex(index);
                              setIsModalOpen(true); // Open the modal
                            }}
                            style={item.style}
                            dangerouslySetInnerHTML={{ __html: item.content }} // Render HTML content here
                          />
                        </>
                      )}

                      {item.type === "multi-image" ? (
                        <div className="Layout-img">
                          <div className="Layout">
                            <img
                              src={
                                item.src1 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiimg"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 1)}
                            />
                            <a
                              href={item.link1}
                              target="_blank"
                              className="button-preview"
                              rel="noopener noreferrer"
                              style={item.buttonStyle1}
                            >
                              {item.content1}
                            </a>
                          </div>

                          <div className="Layout">
                            <img
                              src={
                                item.src2 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiimg"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 2)}
                            />
                            <a
                              href={item.link2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button-preview"
                              style={item.buttonStyle2}
                            >
                              {item.content2}
                            </a>
                          </div>
                        </div>
                      ) : null}

                      {item.type === "video-icon" ? (
                        <div className="video-icon">
                          <img
                            src={item.src1 || "https://via.placeholder.com/200"}
                            alt="Editable"
                            className="videoimg"
                            title="Upload Thumbnail Image"
                            style={item.style}
                            onClick={() => uploadImage(index, 1)}
                          />
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={item.src2}
                              className="video-btn"
                              alt="icon"
                            />
                          </a>
                        </div>
                      ) : null}

                      
                      
{item.type === "cardimage" ? (
                        <div
                          className="card-image-container"
                          style={item.style1}
                        >
                          <img
                            src={item.src1 || "https://via.placeholder.com/200"}
                            style={item.style}
                            alt="Editable"
                            className="card-image"
                            title="Upload Image"
                            onClick={() => uploadImage(index, 1)}
                          />
                          <p
                            className="card-text"
                            contentEditable
                            suppressContentEditableWarning
                            onClick={() => setModalIndex(index)} // Open modal for this index
                            style={item.style}
                            dangerouslySetInnerHTML={{
                              __html: item.content1,
                            }}
                          />

                          {modalIndex === index && ( // Open only for the selected index
                            <ParaEditor
                              isOpen={true}
                              content={item.content1}
                              onSave={(newContent) => {
                                updateContent(index, { content1: newContent });
                                setModalIndex(null); // Close modal after save
                              }}
                              onClose={() => setModalIndex(null)}
                            />
                          )}
                        </div>
                      ) : null}

                      {item.type === "head" && (
                        <div>
                          <p
                            className="border"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              updateContent(index, {
                                content: e.target.textContent,
                              })
                            }
                            onMouseUp={(e) => handleCursorPosition(e, index)}
                            onSelect={(e) => handleCursorPosition(e, index)}
                            style={item.style}
                          >
                            {item.content}
                          </p>
                          
                        </div>
                      )}

                      {item.type === "link-image" && (
                        <div className="border">
                          <a
                            href={item.link || "#"}
                            onClick={(e) => handleLinkClick(e, index)}
                          >
                            <img
                              src={
                                item.src || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="img"
                              style={item.style}
                            />
                          </a>
                        </div>
                      )}
                      {item.type === "image" && (
                        <div className="border">
                          <img
                            src={item.src || "https://via.placeholder.com/200"}
                            alt="Editable"
                            className="img"
                            style={item.style}
                          />
                        </div>
                      )}

                      {item.type === "icons" && (
                        <div
                          className="border"
                          style={item.ContentStyle}
                          key={index}
                        >
                          <div className="icon-containers">
                            <a
                              href={item.links1 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links1)}
                            >
                              <img
                                src={item.iconsrc1}
                                alt="Facebook"
                                className="icon"
                                style={item.style1}
                              />
                            </a>

                            <a
                              href={item.links2 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links2)}
                            >
                              <img
                                src={item.iconsrc2}
                                alt="Twitter"
                                className="icon"
                                rel="noopener noreferrer"
                                style={item.style2}
                              />
                            </a>

                            <a
                              href={item.links3 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links3)}
                            >
                              <img
                                src={item.iconsrc3}
                                alt="Instagram"
                                className="icon"
                                style={item.style3}
                              />
                            </a>

                            <a
                              href={item.links4 || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleLinksClick2(e, item.links4)}
                            >
                              <img
                                src={item.iconsrc4}
                                alt="Youtube"
                                className="icon"
                                style={item.style4}
                              />
                            </a>
                          </div>
                        </div>
                      )}

                      {item.type === "imagewithtext" ? (
                        <div className="image-text-container">
                          <div
                            className="image-text-wrapper"
                            style={item.style1}
                          >
                            <img
                              src={
                                item.src1 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="image-item"
                              title="Upload Image"
                              onClick={() => uploadImage(index, 1)}
                            />
                            <p
                              className="text-item"
                              contentEditable
                              suppressContentEditableWarning
                              onClick={() => setModalIndex(index)} // Open modal for this index
                              style={item.style}
                              dangerouslySetInnerHTML={{
                                __html: item.content1,
                              }}
                            />
                          </div>
                          {modalIndex === index && ( // Open only for the selected index
                            <ParaEditor
                              isOpen={true}
                              content={item.content1}
                              onSave={(newContent) => {
                                updateContent(index, { content1: newContent });
                                setModalIndex(null); // Close modal after save
                              }}
                              onClose={() => setModalIndex(null)}
                            />
                          )}
                        </div>
                      ) : null}
                      

{item.type === "multipleimage" ? (
                        <div className="Layout-img">
                          <div className="Layout">
                            <img
                              src={
                                item.src1 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiple-img"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 1)}
                            />
                            {/* <a
                              href={item.link1}
                              target="_blank"
                              className="button-preview"
                              rel="noopener noreferrer"
                              style={item.buttonStyle1}
                            >
                              {item.content1}
                            </a> */}
                          </div>

                          <div className="Layout">
                            <img
                              src={
                                item.src2 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="multiple-img"
                              title="Upload Image"
                              style={item.style}
                              onClick={() => uploadImage(index, 2)}
                            />
                            {/* <a
                              href={item.link2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button-preview"
                              style={item.buttonStyle2}
                            >
                              {item.content2}
                            </a> */}
                          </div>
                        </div>
                      ) : null}

                      {item.type === "textwithimage" ? (
                        <div className="image-text-container">
                          <div
                            className="image-text-wrapper"
                            style={item.style}
                          >
                            <p
                              className="text-item"
                              contentEditable
                              suppressContentEditableWarning
                              onClick={() => setModalIndex(index)} // Open modal for this index
                              style={item.style}
                              dangerouslySetInnerHTML={{
                                __html: item.content2,
                              }}
                            />
                            <img
                              src={
                                item.src2 || "https://via.placeholder.com/200"
                              }
                              alt="Editable"
                              className="image-item"
                              title="Upload Image"
                              onClick={() => uploadImage(index, 2)}
                            />
                          </div>
                          {modalIndex === index && ( // Open only for the selected index
                            <ParaEditor
                              isOpen={true}
                              content={item.content2}
                              onSave={(newContent) => {
                                updateContent(index, { content2: newContent });
                                setModalIndex(null); // Close modal after save
                              }}
                              onClose={() => setModalIndex(null)}
                            />
                          )}
                        </div>
                      ) : null}

                      {item.type === "logo" && (
                        <div className="border">
                          <img
                            src={item.src || "https://via.placeholder.com/200"}
                            alt="Editable"
                            className="logo"
                            style={item.style}
                          />
                        </div>
                      )}
                      {item.type === "button" && (
                        <div className="border-btn">
                          <a
                            href={item.link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={item.style}
                            className="button-preview"
                          >
                            {item.content}
                          </a>
                        </div>
                      )}
                      {item.type === "link" && (
                        <div className="border-btn">
                          <a
                            href={item.href || "#"}
                            onClick={(e) => handleLinkClick(e, index)}
                            style={item.style}
                          >
                            {item.content}
                          </a>
                        </div>
                      )}
                 
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <button
                  className="preview-create-button"
                  onClick={() => handleTemplateSelect(selectedTemplatepre)}
                  >
                Select
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="preview-create-button"
                >
                  Cancel
                </button>
          </div>
          </div>
          )}
        


          {/* Modal for Save Template */}
          {showTemplateModal && (
            <div className="campaign-modal-overlay-tem">
              <div className="campaign-modal-content">
                <h3>Save Template</h3>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter Template Name"
                  className="modal-input"
                />
                <button
                  className="modal-create-button"
                  onClick={handleSaveButton}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loader-create"></span> // Spinner
                  ) : (
                    "Save"
                  )}{" "}
                </button>
                <button
                  onClick={handlecancel}
                  className="modal-create-button-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Show SendBulkModal when button is clicked */}
          {showSendModal && (
            <SendbulkModal
              isOpen={showSendModal}
              onClose={() => setShowSendModal(false)}
              bgColor={bgColor}
              previewContent={previewContent} // Pass previewContent to Sendbulkmail
            />
          )}

          {/* Show Sendexcelmail when button is clicked */}
          {showSendexcelModal && (
            <SendexcelModal
              isOpen={showSendexcelModal}
              onClose={() => setShowSendexcelModal(false)}
              bgColor={bgColor}
              previewContent={previewContent} // Pass previewContent to Sendexcelmail
            />
          )}

          {/* send mail Modal */}
          {isOpen && (
            <div className="modal-overlay-send">
              <div className="modal-content-send" ref={modalRef}>
                <h2>Select an Option</h2>

                {/* Card Structure with Icons */}
                <div className="button-group-send">
                  <button
                    className="modal-btn-send"
                    onClick={() => setModalOpen(true)}
                  >
                    <FaUser className="icon-send" />
                    Send Single
                  </button>
                  <button
                    className="modal-btn-send"
                    onClick={() => setShowSendModal(true)}
                  >
                    <FaUsers className="icon-send" />
                    Send Bulk
                  </button>
                  <button
                    className="modal-btn-send"
                    onClick={() => setShowSendexcelModal(true)}
                  >
                    <FaRocket className="icon-send" />
                    Send Bulk Instant
                  </button>
                </div>

                {/* Close Button */}
                <button
                  className="close-btn-send"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        {/* Modal */}
{modalOpen && (
  <div className="modal">
    <div className="modal-content testmail-content">
      <h2>Send Single Mail</h2>
      <button className="close-btn" onClick={()=>setModalOpen(false)}>&times;</button>
      <label htmlFor="Email">Recipient Emails:</label>
      <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
      <h3>Click-Retargert Email List</h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {singleemails.length > 0 ? (
          singleemails.map((email, index) => (
            <li key={index} style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}>
              {email}
            </li>
          ))
        ) : (
          <li>No emails found</li>
        )}
      </ul>
    </div>
       
      <label htmlFor="Alias Name">Alias Name:</label>

      <input
        type="text"
        placeholder="Alias Name"
        value={emailData.aliasName}
        onChange={(e) =>
          setEmailData({ ...emailData, aliasName: e.target.value })
        }
      />
    <label htmlFor="subject">Subject:</label>
      <input
        type="text"
        placeholder="Subject"
        value={emailData.subject}
        onChange={(e) =>
          setEmailData({ ...emailData, subject: e.target.value })
        }
      />
      <label htmlFor="preview-text">Preview Text:</label>
      <input
        type="text"
        placeholder="Preview Text"
        value={emailData.previewtext}
        onChange={(e) =>
          setEmailData({ ...emailData, previewtext: e.target.value })
        }
      />

      {/* Attachment File Input */}
      <label htmlFor="attachments">Attach Files(Max-10):</label>
        {/* Attachment File Input */}
        <input
        type="file"
        multiple
        onChange={(e) => {
          const newFiles = Array.from(e.target.files);
          const allFiles = [...(emailData.attachments || []), ...newFiles];

          if (allFiles.length > 10) {
            toast.warning("You can only attach up to 10 files.");
            return;
          }

          setEmailData({ ...emailData, attachments: allFiles });
        }}
      />

      {/* Display Attached Files */}
      <div className="file-list">
        {emailData.attachments && emailData.attachments.length > 0 ? (
          <ol>
            {emailData.attachments.map((file, index) => (
              <li key={index}>
                {file.name} - {Math.round(file.size / 1024)} KB
                <button className="attach-close"
                  onClick={() => {
                    const newAttachments = emailData.attachments.filter(
                      (_, i) => i !== index
                    );
                    setEmailData({ ...emailData, attachments: newAttachments });
                  }}
                >
                  X
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p>No files selected</p>
        )}
      </div>


      {/* Toggle Button for Scheduled Mail */}
      <div className="toggle-container">
        <span>
          {isScheduled
            ? "Scheduled Mail Enabled :"
            : "Scheduled Mail Disabled :"}
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={isScheduled}
            onChange={() => setIsScheduled(!isScheduled)}
          />
          <span className="slider-send round"></span>
        </label>
      </div>

      {/* Show scheduled time input only if the toggle is enabled */}
      {isScheduled && (
        <div>
          <label htmlFor="schedule-time">Set Schedule Time:</label>
          <input
            type="datetime-local"
            value={emailData.scheduledTime}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                scheduledTime: e.target.value,
              })
            }
          />
        </div>
      )}
      <button
        onClick={sendEmail}
        className="modal-button"
        disabled={isLoading || isScheduled} // Disable if scheduled is enabled
      >
        {isLoading ? "Processing..." : "Send Now"}
      </button>
      <button
        onClick={sendscheduleEmail}
        disabled={isLoadingsch || !isScheduled} // Disable if scheduled is not enabled
        className="modal-button"
      >
        {isLoadingsch ? "Processing..." : "Scheduled"}
      </button>
      <button
        onClick={() => setModalOpen(false)}
        className="modal-button"
      >
        Cancel
      </button>
    </div>
  </div>
)}

        </div>
        <ToastContainer
          className="custom-toast"
          position="bottom-center"
          autoClose={2000}
          hideProgressBar={true} // Disable progress bar
          closeOnClick={false}
          closeButton={false}
          pauseOnHover={true}
          draggable={true}
          theme="light" // Optional: Choose theme ('light', 'dark', 'colored')
        />
      </div>
    </div>
  );
};

export default Clicksinglemainpage;
