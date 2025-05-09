import React, { useEffect, useState } from "react";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  Square,
  Flex,
  VStack,
  Text,
  useColorModeValue,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import Database from "../../../data";

const ScoreDisplay = ({
  id,
  duelStatus,
  players,
  playerNum,
  refresh,
  onRefresh,
}) => {
  const [playerScores, setPlayerScores] = useState([]);
  const [problemScores, setProblemScores] = useState([]);

  const borderColor = useColorModeValue(
    "rgb(0, 0, 0, 0.5)",
    "rgb(255, 255, 255, 0.5)"
  );
  const problemScoreColor = useColorModeValue("primary.500", "primary.200");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateScores = async () => {
      let duel = await Database.getDuelById(id);
      if (duel.players?.length === 2) {
        setPlayerScores([duel.players[0].score, duel.players[1].score]);
      } else if (duel.players?.length === 1) {
        setPlayerScores([duel.players[0].score, 0]);
      } else {
        setPlayerScores([0, 0]);
      }
      setProblemScores(
        duel.problems.map((problem) => [
          problem.playerScores[0],
          problem.playerScores[1],
        ])
      );
    };
    if (refresh) {
      updateScores();
      onRefresh();
    }
  }, [refresh]);

  useEffect(() => {
    if (duelStatus !== "") setLoading(false);
  }, [duelStatus]);

  const renderScores = () => {
    return (
      <>
        <Tr>
          <Td height="15em" borderColor="grey.100">
            <Grid templateColumns="repeat(2, 1fr)" rowGap={1} columnGap={0}>
              <GridItem>
                <Text textStyle="body3" textAlign="center">
                  Player 1
                </Text>
              </GridItem>
              <GridItem>
                <Text textStyle="body3" textAlign="center">
                  Score
                </Text>
              </GridItem>
              <GridItem>
                <Text
                  textAlign="center"
                  fontWeight="bold"
                  fontStyle={players[0].guest ? "italic" : ""}
                >
                  {players[0].handle}
                </Text>
                {playerNum === 1 ? (
                  <Text textAlign="center" fontWeight="bold">
                    {" "}
                    (YOU)
                  </Text>
                ) : (
                  ""
                )}
              </GridItem>
              <GridItem>
                <Text textAlign="center" fontWeight="bold">
                  {playerScores[0]}
                </Text>
              </GridItem>
              <GridItem colSpan={2} mt={2}>
                <Flex justify="center" gap={1} flexWrap="wrap">
                  {problemScores.map((scores, index) => (
                    <VStack spacing={0}>
                      <Square
                        boxSize="3rem"
                        border="1px solid"
                        rounded="md"
                        borderColor={borderColor}
                        fontSize="sm"
                        color={problemScoreColor}
                      >
                        {scores[0]}
                      </Square>
                      <Text textAlign="center" fontSize="xs" pt={0}>
                        {index + 1}
                      </Text>
                    </VStack>
                  ))}
                </Flex>
              </GridItem>
            </Grid>
          </Td>
        </Tr>
        <Tr>
          <Td height="15em">
            <Grid templateColumns="repeat(2, 1fr)" rowGap={1} columnGap={0}>
              <GridItem>
                <Text textStyle="body3" textAlign="center">
                  Player 2
                </Text>
              </GridItem>
              <GridItem>
                <Text textStyle="body3" textAlign="center">
                  Score
                </Text>
              </GridItem>
              <GridItem>
                {players.length === 2 ? (
                  <>
                    <Text
                      textAlign="center"
                      fontWeight="bold"
                      fontStyle={players[1].guest ? "italic" : ""}
                    >
                      {players[1].handle}
                    </Text>
                    {playerNum === 2 ? (
                      <Text textAlign="center" fontWeight="bold">
                        (YOU)
                      </Text>
                    ) : (
                      ""
                    )}
                  </>
                ) : (
                  <Text textAlign="center" fontWeight="bold">
                    {players.length === 2 ? players[1].handle : "N/A"}
                  </Text>
                )}
              </GridItem>
              <GridItem>
                <Text textAlign="center" fontWeight="bold">
                  {players.length === 2 ? playerScores[1] : 0}
                </Text>
              </GridItem>
              <GridItem colSpan={2} mt={2}>
                <Flex justify="center" flexWrap="wrap" gap={1}>
                  {problemScores.map((scores, index) => (
                    <VStack spacing={0}>
                      <Square
                        boxSize="3rem"
                        rounded="md"
                        border="1px solid"
                        borderColor={borderColor}
                        fontSize="sm"
                        color={problemScoreColor}
                      >
                        {scores[1]}
                      </Square>
                      <Text textAlign="center" fontSize="xs" pt={0}>
                        {index + 1}
                      </Text>
                    </VStack>
                  ))}
                </Flex>
              </GridItem>
            </Grid>
          </Td>
        </Tr>
      </>
    );
  };

  return (
    <TableContainer
      border="1px solid"
      borderColor={borderColor}
      borderTopLeftRadius="md"
      borderTopRightRadius="md"
      width="22em"
      height="fit-content"
      boxShadow="2xl"
    >
      <Table>
        <Thead>
          <Tr>
            <Th
              textAlign="center"
              fontSize="1.2rem"
              borderColor="grey.500"
              py={2}
            >
              Scores
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Skeleton height="30em">
                <Td px={1} py={1} height="30em"></Td>
              </Skeleton>
            </Tr>
          ) : (
            renderScores()
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default ScoreDisplay;