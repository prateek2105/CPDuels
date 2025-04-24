import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { MathJaxContext } from "better-react-mathjax";
import "@fontsource/rubik";
import "@fontsource/rubik/800.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ChakraProvider theme={theme} resetCSS={true}>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <MathJaxContext src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
      <App />
    </MathJaxContext>
  </ChakraProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();