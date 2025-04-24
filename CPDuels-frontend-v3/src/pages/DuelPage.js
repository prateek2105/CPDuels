import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  VStack,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalHeader,
  ModalContent,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Button,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import BaseLayout from "../components/baseLayout";
import TimeAndJoinDisplay from "../components/duelContent/timeAndJoinDisplay";
import ScoreDisplay from "../components/duelContent/scoreDisplay";
import Database, { getUID } from "../data";
import socket from "../socket";
import { useParams, useNavigate } from "react-router-dom";
import TabContainer from "../components/duelContent/tabContainer.js";
import { MathJax } from "better-react-mathjax";
import AbortAndResignDisplay from "../components/duelContent/abortAndResignDisplay";

const DuelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [duelPlatform, setDuelPlatform] = useState("CF");
  const [duelStatus, setDuelStatus] = useState("");
  const [players, setPlayers] = useState([]);
  const [playerNum, setPlayerNum] = useState();
  const [problems, setProblems] = useState([]);
  const [problemVerdicts, setProblemVerdicts] = useState([]);
  const [submissionsRefresh, setSubmissionsRefresh] = useState(true);
  const [submissionsToast, setSubmissionsToast] = useState(false);
  const [scoresRefresh, setScoresRefresh] = useState(true);
  const [problemsRefresh, setProblemsRefresh] = useState(true);
  const [mathJaxRendered, setMathJaxRendered] = useState(false);
  const [replacingProblems, setReplacingProblems] = useState(false);
  const [problemSubmitReceived, setProblemSubmitReceived] = useState(false);
  const [autoAborted, setAutoAborted] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();
  const toastRef = useRef();

  const makeToast = (toastParams) => {
    if (toastRef.current) {
      toast.close(toastRef.current);
      toastRef.current = toast(toastParams);
    } else {
      toastRef.current = toast(toastParams);
    }
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDuelInfo = async () => {
      const duel = await Database.getDuelById(id);
      if (!duel || duel?.message) navigate("/noduel");
      setLoading(false);
      if (duelStatus !== duel.status) setDuelStatus(duel.status);
      if (duelPlatform !== duel.platform) setDuelPlatform(duel.platform);

      setPlayers(duel.players);
      let uid = getUID(); let _playerNum;
      if (uid === duel.players[0].uid) {
          _playerNum = 1;
      } else if (duel.players[1] && uid === duel.players[1].uid) {
        _playerNum = 2;
      }
      setPlayerNum(_playerNum);

      if (!problems?.length || problemsRefresh) {
        let problemContents = [];
        if (duel.platform === "CF") {
          for (let i = 0; i < duel.problems?.length; i++) {
            let content = await Database.getCFProblemById(
              duel.problems[i].databaseId
            );
            problemContents.push({
              ...content,
              duelPoints: duel.problems[i].duelPoints,
            });
          }
        } else if (duel.platform === "LC") {
            for (let i = 0; i < duel.problems?.length; i++) {
              let content = await Database.getLCProblemById(
                duel.problems[i].databaseId
              );
              problemContents.push({
                ...content,
                duelPoints: duel.problems[i].duelPoints,
              });
              console.log(problemContents);
            }
        } else {
            // AT
        }
        setProblems(problemContents);
      }

      if (duel.regeneratingProblems) setReplacingProblems(true);
      
      let newProblemVerdicts = [...Array(duel.problems.length).fill([null])];
      if (_playerNum) {
        let playerIndex = _playerNum - 1;
        for (let i = 0; i < duel.problems.length; i++) {
          if (duel.problems[i].playerSolveTimes[playerIndex])
            newProblemVerdicts[i] = "AC";
          else if (duel.problems[i].playerAttempts[playerIndex])
            newProblemVerdicts[i] = "WA";
        }
      }
      setProblemVerdicts(newProblemVerdicts);
    }

    if (problemsRefresh) {
      getDuelInfo();
      setProblemsRefresh(false);
    }

    socket.on("connect", async () => {
      socket.emit("join", { roomId: id });
    });
    socket.on("error-message", (message) => {
      alert(message);
    });
    socket.on("status-change", ({ roomId, newStatus }) => {
      if (roomId === id) {
        setLoading(true);
        setProblemsRefresh(true);
        setMathJaxRendered(false);
        getDuelInfo();
      }
    });
    socket.on("abort-duel-error", ({ roomId, uid, message }) => {
      let localUid = getUID();
      if (roomId === id && uid === localUid) {
        makeToast({
          title: "Error",
          description: message,
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    });
    socket.on("resign-duel-error", ({ roomId, uid, message }) => {
      let localUid = getUID();
      if (roomId === id && uid === localUid) {
        makeToast({
          title: "Error",
          description: message,
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    });
    socket.on("problem-change", ({ roomId }) => {
      if (roomId === id) {
        setProblems([]); setProblemVerdicts([]);
        setProblemsRefresh(true);
        setScoresRefresh(true);
        setMathJaxRendered(false);
      }
    });
    socket.on("submission-change", ({ duelId, uid }) => {
      if (duelId === id) {
        setSubmissionsRefresh(true);
        setProblemsRefresh(true);
        setScoresRefresh(true);
        let localUid = getUID();
        if (uid === localUid) {
          setSubmissionsToast(true);
        }
      }
    });
    socket.on("duel-aborted-inactive", ({ roomId }) => {
      if (roomId === id) {
        setSubmissionsRefresh(true);
        setProblemsRefresh(true);
        setScoresRefresh(true);
        setAutoAborted(true);
      }
    });
    return () => {
      socket.off("connect");
      socket.off("error-message");
      socket.off("status-change");
      socket.off("abort-duel-error");
      socket.off("resign-duel-error");
      socket.off("submission-change");
      socket.off("duel-aborted-inactive");
    };
  }, [id, problemsRefresh, problems]);

  useEffect(() => {
    socket.on("regenerate-problems-received", ({ roomId }) => {
      if (roomId === id) {
        setReplacingProblems(true);
        setProblems([]);
      }
    });
    socket.on("regenerate-problems-completed", ({ roomId }) => {
      if (roomId === id) {
        setReplacingProblems(false);
        setProblemsRefresh(true);
        setMathJaxRendered(false);
        if (playerNum)
          makeToast({
            title: "Problems regenerated.",
            description: "Please see the new problem set.",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
      }
    });
    return () => {
      socket.off("regenerate-problems-received");
      socket.off("regenerate-problems-completed");
    };
  }, [id]);

  useEffect(() => {
    socket.on("problem-submitted-success", ({ roomId, uid }) => {
      let localUid = getUID();
      if (roomId === id && uid === localUid) {
        setProblemSubmitReceived(true);
        makeToast({
          title: "Submitted Successfully",
          description: "Now wait for the verdict :)",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    });

    socket.on("problem-submitted-error", ({ roomId, uid, message }) => {
      let localUid = getUID();
      if (roomId === id && uid === localUid) {
        setProblemSubmitReceived(true);
        makeToast({
          title: "Submission Error",
          description: message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    });

    return () => {
      socket.off("problem-submitted-success");
      socket.off("problem-submitted-error");
    };
  }, [problemSubmitReceived]);

  useEffect(() => {
    if (duelStatus === "FINISHED" || autoAborted) onOpen();
  }, [duelStatus, autoAborted]);

  return (
    <MathJax dynamic={true}>
      <BaseLayout
        content={
          <Box>
            {loading ? (
              <Flex
                position="absolute"
                top={0}
                left={0}
                justify="center"
                width="100%"
                height="100%"
                textAlign="center"
                background="rgb(0, 0, 0, 0.6)"
                zIndex={10}
              >
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  mt="50vh"
                  emptyColor="grey.300"
                  color="#43ff43"
                  size="xl"
                />
              </Flex>
            ) : (
              ""
            )}
            <Flex
              justify="space-between"
              align="flex-start"
              transform={[null, null, "scale(0.65)", "scale(0.85)", "none"]}
              ml={[null, null, "-8.5em", "-3.5em", 0]}
              mt={[null, null, "-8.25em", "-3.25em", 0]}
              gap={[null, null, 2, null, null]}
            >
              <TabContainer
                id={id}
                duelPlatform={duelPlatform}
                duelStatus={duelStatus}
                players={players}
                playerNum={playerNum}
                problems={problems}
                problemVerdicts={problemVerdicts}
                submissionsRefresh={submissionsRefresh}
                onSubmissionsRefresh={() => setSubmissionsRefresh(false)}
                submissionsToast={submissionsToast}
                onSubmissionsToast={() => setSubmissionsToast(false)}
                mathJaxRendered={mathJaxRendered}
                onMathJaxRendered={() => setMathJaxRendered(true)}
                replacingProblems={replacingProblems}
                setReplacingProblems={setReplacingProblems}
                problemSubmitReceived={problemSubmitReceived}
                onProblemSubmitReceived={() => setProblemSubmitReceived(false)}
              />
              <VStack spacing={2}>
                <TimeAndJoinDisplay
                  id={id}
                  duelStatus={duelStatus}
                  players={players}
                  playerNum={playerNum}
                  replacing={replacingProblems}
                />
                {playerNum &&
                duelStatus !== "FINISHED" &&
                duelStatus !== "ABORTED" ? (
                  <AbortAndResignDisplay
                    id={id}
                    duelStatus={duelStatus}
                    players={players}
                    playerNum={playerNum}
                  />
                ) : (
                  ""
                )}
                <ScoreDisplay
                  id={id}
                  duelStatus={duelStatus}
                  players={players}
                  playerNum={playerNum}
                  refresh={scoresRefresh}
                  onRefresh={() => setScoresRefresh(false)}
                />
              </VStack>
            </Flex>
            <Modal isOpen={isOpen} onClose={onClose} size="sm">
              <ModalOverlay />
              <ModalContent>
                {autoAborted ? 
                  <ModalHeader>Duel Aborted</ModalHeader>
                  : <ModalHeader>Duel Is Over</ModalHeader>
                }
                <ModalCloseButton />
                <ModalBody>
                  {autoAborted ?
                    <p>Your duel was auto-aborted for not starting after 2 minutes.</p>
                    : <p>You can view the results now.</p>
                  }
                </ModalBody>
                <ModalFooter justifyContent="center">
                  <Button colorScheme="primary" mr={3} onClick={onClose}>
                    Ok
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Box>
        }
      />
    </MathJax>
  );
};

export default DuelPage;
