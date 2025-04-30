import React, { useEffect, useState, useRef } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Box,
  Center,
  Button,
  useColorModeValue,
  useDisclosure,
  ButtonGroup,
  IconButton,
  Flex,
  Text,
} from "@chakra-ui/react";
import socket from "../../socket";
import Database, { getUID } from "../../data";
import "./cfStyles.css";
import "./lcStyles.css";
import { RepeatIcon } from "@chakra-ui/icons";
import { MathJax } from "better-react-mathjax";

const AccordionContainer = ({
  id,
  duelPlatform,
  duelStatus,
  playerNum,
  problems = [], // Set default value to empty array
  problemVerdicts = [], // Set default value to empty array
  mathJaxRendered,
  onMathJaxRendered,
  replacing,
  problemSubmitReceived,
  onProblemSubmitReceived,
}) => {
  const [selectedProblem, setSelectedProblem] = useState();
  const [selectedReplaceProblemIndices, setSelectedReplaceProblemIndices] =
    useState([]);
  const [duelProblems, setDuelProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch problems from database when component mounts
  useEffect(() => {
    const fetchDuelProblems = async () => {
      setIsLoading(true);
      try {
        const duel = await Database.getDuelById(id);
        console.log("Fetched duel:", duel);
        if (duel && duel.problems && duel.problems.length > 0) {
          setDuelProblems(duel.problems);
        } else {
          console.warn("No problems found in duel data");
        }
      } catch (error) {
        console.error("Error fetching duel problems:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDuelProblems();
    }
  }, [id, duelStatus]);

  // Debug logging to track props and state
  useEffect(() => {
    console.log("Current problems prop:", problems);
    console.log("Current duelProblems state:", duelProblems);
    console.log("Current duelStatus:", duelStatus);
  }, [problems, duelProblems, duelStatus]);

  useEffect(() => {
    if (!mathJaxRendered && document.querySelector(".MathJaxEnd")) {
      onMathJaxRendered && onMathJaxRendered();
    }
  }, [mathJaxRendered, onMathJaxRendered]);

  const defaultBorderColor = useColorModeValue(
    "rgb(0, 0, 0, 0.5)",
    "rgb(255, 255, 255, 0.5)"
  );
  const rightAnswerColor = useColorModeValue("#b2eda7", "#21aa21");
  const wrongAnswerColor = useColorModeValue("red.500", "#b00");
  const selectedRowColor = useColorModeValue("primary.300", "primary.700");
  const rightAnswerSelectedColor = useColorModeValue("#d4edc9", "#238523");
  const wrongAnswerSelectedColor = useColorModeValue("#ff7575", "#c00");
  const sampleTestLineColor = useColorModeValue("grey.100", "grey.700");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const selectedReplaceColor = useColorModeValue("red.500", "red.300");
  const numberColor = useColorModeValue("grey.900", "offWhite");

  const handleReplace = (e) => {
    e.preventDefault();
    socket.emit("regenerate-problems", {
      roomId: id,
      problemIndices: selectedReplaceProblemIndices,
    });
    setSelectedReplaceProblemIndices([]);
  };

  useEffect(() => {
    const handleReplaceProblemReceived = ({ roomId, uid, updatedIndices }) => {
      let localUid = getUID();
      if (roomId === id && uid !== localUid) {
        setSelectedReplaceProblemIndices(updatedIndices);
      }
    };
    
    socket.on("replace-problem-received", handleReplaceProblemReceived);
    
    return () => {
      socket.off("replace-problem-received", handleReplaceProblemReceived);
    };
  }, [id]);

  useEffect(() => {
    if (replacing) {
      setSelectedReplaceProblemIndices([]);
    }
  }, [replacing, problems]);

  const mapLCRatings = (ratingNum) => {
    switch (ratingNum) {
      case 1:
        return "EASY";
      case 2:
        return "MEDIUM";
      default:
        return "HARD";
    }
  };

  // Helper function to check if problems array is valid
  const hasValidProblems = (problemsArray) => {
    return Array.isArray(problemsArray) && problemsArray.length > 0;
  };

  // Determine which problems array to use
  const displayProblems = hasValidProblems(problems) ? problems : 
                         hasValidProblems(duelProblems) ? duelProblems : [];

  if (isLoading) {
    return <Text fontSize="1.2rem">Loading problems...</Text>;
  }

  if (duelStatus === "INITIALIZED") {
    if (playerNum && hasValidProblems(displayProblems))
      return (
        <MathJax dynamic={true}>
          <Box>
            <Text fontSize="1.2rem" mb="1em">
              Already seen some of these problems? Select the ones you'd like to
              drop from the problem set, hit the refresh button, and we'll
              replace them with new ones.
              <br />
              Ready up when you're satisfied.
            </Text>
            <Flex mb="1em" gap={1} justify="center" height="fit-content">
              <ButtonGroup>
                {displayProblems.map((problem, index) => (
                  <Button
                    key={index}
                    width="3.5em"
                    height="3.5em"
                    color={
                      selectedReplaceProblemIndices.includes(index)
                        ? selectedReplaceColor
                        : numberColor
                    }
                    border="solid 2px"
                    borderColor={
                      selectedReplaceProblemIndices.includes(index)
                        ? selectedReplaceColor
                        : "grey.100"
                    }
                    onClick={() => {
                      let updatedIndices;
                      if (selectedReplaceProblemIndices.includes(index)) {
                        updatedIndices = selectedReplaceProblemIndices.filter(
                          idx => idx !== index
                        );
                      } else {
                        updatedIndices = [
                          ...selectedReplaceProblemIndices,
                          index,
                        ];
                      }
                      setSelectedReplaceProblemIndices(updatedIndices);
                      let uid = getUID();
                      socket.emit("replace-problem-selected", {
                        roomId: id,
                        uid: uid,
                        updatedIndices: updatedIndices,
                      });
                    }}
                    variant="outline"
                    disabled={replacing}
                  >
                    {index + 1}
                  </Button>
                ))}
              </ButtonGroup>
              <Box ml="1em">
                <IconButton
                  boxSize="3.5em"
                  icon={<RepeatIcon />}
                  variant="solid"
                  colorScheme="primary"
                  isLoading={replacing}
                  onClick={handleReplace}
                  disabled={
                    selectedReplaceProblemIndices.length === 0 || replacing
                  }
                />
              </Box>
            </Flex>
            <Accordion
              onChange={(index) => {
                setSelectedProblem(index + 1);
              }}
              allowToggle
              boxShadow="2xl"
            >
              {duelPlatform === "CF"
                ? displayProblems.map((problem, index) => (
                    <AccordionItem key={problem?.id || `cf-problem-${index}`} border="none">
                      <h2>
                        <AccordionButton
                          height="3.5em"
                          bg={
                            index === selectedProblem - 1
                              ? selectedRowColor
                              : ""
                          }
                          _hover={"none"}
                          border="solid 1px"
                        >
                          <Box flex="2" textAlign="left">
                            {index + 1}. <b>{problem?.name || "Unnamed Problem"}</b>
                          </Box>
                          <Box flex="1" textAlign="center">
                            <b>Rated:</b> {problem?.rating || "N/A"}, <b>Points:</b>{" "}
                            {problem?.duelPoints || 0}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel border="solid 1px" borderTop={"none"}>
                        <Box
                          className="problem-statement"
                          fontSize="0.95rem"
                          mb="-1.5em"
                        >
                          <div
                            className={
                              index === displayProblems.length - 1
                                ? "MathJaxEnd"
                                : ""
                            }
                            dangerouslySetInnerHTML={{
                              __html: problem?.content?.statement || "Problem statement not available",
                            }}
                          ></div>
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  ))
                : duelPlatform === "LC"
                ? displayProblems.map((problem, index) => (
                    <AccordionItem key={problem?.id || `lc-problem-${index}`} border="none">
                      <h2>
                        <AccordionButton
                          height="3.5em"
                          bg={
                            index === selectedProblem - 1
                              ? selectedRowColor
                              : ""
                          }
                          _hover={"none"}
                          border="solid 1px"
                        >
                          <Box flex="2" textAlign="left">
                            {index + 1}. <b>{problem?.name || "Unnamed Problem"}</b>
                          </Box>
                          <Box flex="1" textAlign="center">
                            <b>Rated:</b> {mapLCRatings(problem?.difficulty)},{" "}
                            <b>Points:</b> {problem?.duelPoints || 0}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel border="solid 1px" borderTop={"none"}>
                        <Box
                          className="lc-problem-statement"
                          fontSize="0.95rem"
                          mb="-2.5em"
                        >
                          <div
                            className={
                              index === displayProblems.length - 1
                                ? "MathJaxEnd"
                                : ""
                            }
                            dangerouslySetInnerHTML={{
                              __html: problem?.content?.problemPreview || "Problem preview not available",
                            }}
                          ></div>
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  ))
                : <Text>Unsupported platform.</Text>}
            </Accordion>
          </Box>
        </MathJax>
      );
    else
      return (
        <Text fontSize="1.2rem">
          {hasValidProblems(displayProblems) 
            ? "This duel is no longer open and problems are being finalized."
            : "No problems have been loaded for this duel yet. Please wait for the host to load problems."}
        </Text>
      );
  } else if (duelStatus === "ONGOING") {
    // Fixed the ongoing status view
    return (
      <Box>
        <Text fontSize="1.2rem" mb={3}>Problem links for this duel:</Text>
        {hasValidProblems(displayProblems) ? (
          displayProblems.map((problem, index) => (
            <Text key={index} fontSize="1.1rem" mb={2}>
              {index + 1}. <a 
                href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{color: 'blue', textDecoration: 'underline'}}
              >
                {problem.name || "Unnamed Problem"}
              </a>
            </Text>
          ))
        ) : (
          <Text>No problems available. Please wait for the duel to load problems.</Text>
        )}
      </Box>
    );
  } else {
    // For other statuses like FINISHED
    return hasValidProblems(displayProblems) ? (
      <Accordion
        onChange={(index) => {
          setSelectedProblem(index + 1);
        }}
        allowToggle
        boxShadow="2xl"
      >
        {playerNum ? (
          ""
        ) : duelStatus === "ONGOING" ? (
          <Text fontSize="1.2rem" mb="1em">
            You are a spectator and may not submit to any problems in this duel.
          </Text>
        ) : (
          ""
        )}
        {duelPlatform === "CF"
          ? displayProblems.map((problem, index) => (
              <AccordionItem key={problem?.id || `cf-problem-${index}`} border="none">
                <h2>
                  <AccordionButton
                    height="3.5em"
                    bg={
                      index === selectedProblem - 1
                        ? problemVerdicts[index] === "AC"
                          ? rightAnswerSelectedColor
                          : problemVerdicts[index] === "WA"
                          ? wrongAnswerSelectedColor
                          : selectedRowColor
                        : problemVerdicts[index] === "AC"
                        ? rightAnswerColor
                        : problemVerdicts[index] === "WA"
                        ? wrongAnswerColor
                        : ""
                    }
                    _hover={"none"}
                    border="solid 1px"
                    borderColor={
                      index === selectedProblem - 1
                        ? problemVerdicts[index] === "AC"
                          ? rightAnswerColor
                          : problemVerdicts[index] === "WA"
                          ? wrongAnswerColor
                          : ""
                        : ""
                    }
                  >
                    <Box flex="2" textAlign="left">
                      {index + 1}. <b>{problem?.name || "Unnamed Problem"}</b>
                    </Box>
                    <Box flex="1" textAlign="center">
                      <b>Rated:</b> {problem?.rating || "N/A"}, <b>Points:</b>{" "}
                      {problem?.duelPoints || 0}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel
                  p={4}
                  border="solid 1px"
                  borderTop={"none"}
                  borderColor={
                    problemVerdicts[index] === "AC"
                      ? rightAnswerSelectedColor
                      : problemVerdicts[index] === "WA"
                      ? wrongAnswerSelectedColor
                      : ""
                  }
                >
                  {problem?.content?.constraints ? (
                    <Flex
                      dangerouslySetInnerHTML={{
                        __html: problem.content?.constraints,
                      }}
                    ></Flex>
                  ) : (
                    ""
                  )}
                  <Box mt={2} className="problem-statement" fontSize="0.95rem">
                    <Text fontWeight="bold" fontSize="1.2rem">
                      Problem Statement
                    </Text>
                    {problem?.content?.statement ? (
                      <div
                        className={
                          index === displayProblems.length - 1 ? "MathJaxEnd" : ""
                        }
                        dangerouslySetInnerHTML={{
                          __html: problem.content?.statement,
                        }}
                      ></div>
                    ) : (
                      <Text>Problem statement not available</Text>
                    )}
                  </Box>
                  <Box
                    mt={2}
                    className="problem-input-specifications"
                    fontSize="0.95rem"
                  >
                    <Text fontWeight="bold" fontSize="1.2rem">
                      Input
                    </Text>
                    {problem?.content?.input ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: problem.content?.input,
                        }}
                      ></div>
                    ) : (
                      <Text>Input specifications not available</Text>
                    )}
                  </Box>
                  <Box
                    mt={2}
                    className="problem-output-specifications"
                    fontSize="0.95rem"
                  >
                    <Text fontWeight="bold" fontSize="1.2rem">
                      Output
                    </Text>
                    {problem?.content?.output ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: problem.content?.output,
                        }}
                      ></div>
                    ) : (
                      <Text>Output specifications not available</Text>
                    )}
                  </Box>
                  <Box
                    mt={2}
                    className="problem-sample-test-cases"
                    fontSize="0.95rem"
                    sx={{
                      " && .test-example-line.test-example-line-odd": {
                        backgroundColor: sampleTestLineColor,
                      },
                      " && .sample-test, .sample-test .title, .sample-test .input, .sample-test .output":
                        {
                          borderColor: defaultBorderColor,
                        },
                    }}
                  >
                    {problem?.content?.testCases ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: problem.content?.testCases,
                        }}
                      ></div>
                    ) : (
                      <Text>Test cases not available</Text>
                    )}
                  </Box>
                  <Box mt={2} className="problem-note" fontSize="0.95rem">
                    {problem?.content?.note ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: problem.content?.note,
                        }}
                      ></div>
                    ) : (
                      ""
                    )}
                  </Box>
                  <Center pt={3}>
                    <Button
                      onClick={duelStatus === "FINISHED" ? () => {
                          window.open(`https://www.codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`);
                        } : onOpen
                      }
                      size="md"
                      fontSize="lg"
                      variant="solid"
                      colorScheme="primary"
                      isDisabled={playerNum ? false : true}
                    >
                      {duelStatus === "FINISHED" ? "See Problem Source" : "Submit Your Answer"}
                    </Button>
                  </Center>
                </AccordionPanel>
              </AccordionItem>
            ))
          : duelPlatform === "LC"
          ? displayProblems.map((problem, index) => (
              <AccordionItem key={problem?.id || `lc-problem-${index}`} border="none">
                <h2>
                  <AccordionButton
                    height="3.5em"
                    bg={
                      index === selectedProblem - 1
                        ? problemVerdicts[index] === "AC"
                          ? rightAnswerSelectedColor
                          : problemVerdicts[index] === "WA"
                          ? wrongAnswerSelectedColor
                          : selectedRowColor
                        : problemVerdicts[index] === "AC"
                        ? rightAnswerColor
                        : problemVerdicts[index] === "WA"
                        ? wrongAnswerColor
                        : ""
                    }
                    _hover={"none"}
                    border="solid 1px"
                    borderColor={
                      index === selectedProblem - 1
                        ? problemVerdicts[index] === "AC"
                          ? rightAnswerColor
                          : problemVerdicts[index] === "WA"
                          ? wrongAnswerColor
                          : ""
                        : ""
                    }
                  >
                    <Box flex="2" textAlign="left">
                      {index + 1}. <b>{problem?.name || "Unnamed Problem"}</b>
                    </Box>
                    <Box flex="1" textAlign="center">
                      <b>Rated:</b> {mapLCRatings(problem?.difficulty)}, <b>Points:</b>{" "}
                      {problem?.duelPoints || 0}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel
                  p={4}
                  border="solid 1px"
                  borderTop={"none"}
                  borderColor={
                    problemVerdicts[index] === "AC"
                      ? rightAnswerSelectedColor
                      : problemVerdicts[index] === "WA"
                      ? wrongAnswerSelectedColor
                      : ""
                  }
                >
                  <Box
                    className="lc-problem-statement"
                    fontSize="0.95rem"
                  >
                    {problem?.content?.problemWhole ? (
                      <div
                        className={
                          index === displayProblems.length - 1 ? "MathJaxEnd" : ""
                        }
                        dangerouslySetInnerHTML={{
                          __html: problem.content?.problemWhole,
                        }}
                      ></div>
                    ) : (
                      <Text>Problem content not available</Text>
                    )}
                  </Box>
                  <Center pt={3}>
                    <Button
                      onClick={onOpen}
                      size="md"
                      fontSize="lg"
                      variant="solid"
                      colorScheme="primary"
                      isDisabled={duelStatus !== "ONGOING" || !playerNum}
                    >
                      Submit Your Answer
                    </Button>
                  </Center>
                </AccordionPanel>
              </AccordionItem>
            ))
          : <Text>Unsupported platform.</Text>}
      </Accordion>
    ) : (
      <Text fontSize="1.2rem">
        Problem duel not started or no problems available.
      </Text>
    );
  }
};

export default AccordionContainer;