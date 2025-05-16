import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the document title
document.title = "ImageExtractor - Extract All Images from Any Website";

createRoot(document.getElementById("root")!).render(<App />);
