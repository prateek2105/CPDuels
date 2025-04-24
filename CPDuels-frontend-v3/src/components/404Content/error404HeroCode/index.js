import { Box, Text, useColorMode, useColorModeValue } from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import CPFavicon from "../../..//images/CPDuels Favicon (1).svg";

const Error404HeroCode = () => {
  const { colorMode } = useColorMode();
  const script = [
    "===  ===  ======  ===  ===",
    "===  === ===  === ===  ===",
    "======== ===  === ========",
    "     === ===  ===      ===",
    "     ===  ======       ===",
  ];

  const [currentLine, setCurrentLine] = useState(script.length - 1);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    const shiftLine = async () => {
      if (currentLine === -1) {
        await sleep(150);
        setCurrentLine(script.length - 1);
      } else {
        await sleep(150);
        setCurrentLine((i) => i - 1);
      }
    };
    shiftLine();
  }, [currentLine]);

  return (
    <Box
      className="macintosh"
      boxShadow={
        colorMode === "light"
          ? "0 70px 44px -44px rgba(0, 0, 0, 0.4)"
          : "#a8a8ff 0 15px 42px"
      }
    >
      <Box className="monitor-inner">
        <Box
          className="screen-cutout"
          boxShadow={colorMode === "light" ? "" : "#888888 0 10px 35px"}
        >
          <Box
            className="screen"
            paddingY="60px"
            fontSize={["15px", null, null, null, "16px"]}
            lineHeight="12px"
            fontWeight="bold"
          >
            <Box mx="auto" width="fit-content">
              {script.map((line, index) => (
                <Text
                  as="pre"
                  color={index > currentLine ? "#43ff43" : "#21bc21"}
                >
                  {line}
                </Text>
              ))}
              <Text
                fontSize="8px"
                fontWeight="normal"
                pt="27px"
                px="auto"
                color="#43ff43"
              >
                <code>Uh oh :)</code>
                <br />
                <code>Page doesn't exist.</code>
              </Text>
            </Box>
          </Box>
        </Box>
        <Box className="logo" filter="opacity(50%)">
          <img src={CPFavicon} />
        </Box>
        <Box className="opening">
          <Box className="opening-inner"></Box>
        </Box>
        <Box className="cpduels-label">CPDuels SE</Box>
      </Box>
    </Box>
  );
};

export default Error404HeroCode;
