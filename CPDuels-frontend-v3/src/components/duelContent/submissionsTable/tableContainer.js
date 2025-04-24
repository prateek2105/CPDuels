import { useTable, usePagination } from 'react-table';
import {
  TableContainer, Table, TableCaption, Thead, Tbody, Tfoot, Th, Tr, Td,
  Center,
  Button, ButtonGroup, 
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Flex, Spacer,
  HStack,
  Text,
  useColorModeValue,
  VStack,
  Skeleton
} from '@chakra-ui/react';

const ReactTable = ({ loading, columns, data, rowProps }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 }
    },
    usePagination
  );

  const fillEmptyRows = (rows, total) => {
    const leftoverRows = [];
    for (let i = rows; i < total; i++) {
      if (i === rows && rows != 0) leftoverRows.push(<Tr><Td colSpan={5} textAlign="center" borderY="solid 1px" borderColor="grey.500" fontWeight="bold"><Skeleton isLoaded={!loading}>-</Skeleton></Td></Tr>);
      else if (i === total-1) leftoverRows.push(<Tr><Td colSpan={5} textAlign="center" border="none" fontWeight="bold"><Skeleton isLoaded={!loading}>-</Skeleton></Td></Tr>);
      else leftoverRows.push(<Tr><Td colSpan={5} textAlign="center" borderBottom="solid 1px" borderColor="grey.500" fontWeight="bold"><Skeleton isLoaded={!loading}>-</Skeleton></Td></Tr>)
    }
    return (
      leftoverRows
    );
  }

  const rowTextColor = useColorModeValue("grey.900", "offWhite");
  const tableBorderColor = useColorModeValue('rgb(0, 0, 0, 0.5)', 'rgb(255, 255, 255, 0.5)');

  return (
    <>
      <VStack width="fit-content">
      <TableContainer
        width="47em"
        border="1px solid"
        borderColor={tableBorderColor}
        boxShadow='xl'
        rounded="md"
      >
        <Table {...getTableProps()} 
          size="sm"
          mt={1}
          style={{ borderCollapse:"collapse" }}
        >
          <Thead>
            {headerGroups.map(headerGroup => (
              <Tr {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column, index) => (
                  <Th {...column.getHeaderProps()}
                    style={{width: column.width, fontSize: "1em"}}
                    borderBottom="solid 1px"
                    borderColor="grey.500"
                  >
                    <Center>
                      {column.render("Header")}
                    </Center>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {page.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <Tr 
                  key={`row ${rowIndex}`}
                  {...row.getRowProps(rowProps(row))}
                >
                  {row.cells.map(cell => {
                    if (rowIndex === page.length-1) {
                      return (
                        <Td {...cell.getCellProps()}
                          style={{ width: cell.width, textAlign: "center", cursor: "pointer" }}
                          borderBottom="none"
                          color={rowTextColor}
                        >
                          {cell.render("Cell")}
                        </Td>
                      );
                    }
                    return (
                      <Td {...cell.getCellProps()}
                        style={{ width: cell.width, textAlign: "center", cursor: "pointer" }}
                        borderBottom="solid 1px"
                        borderColor="grey.500"
                        color={rowTextColor}
                      >
                        {cell.render("Cell")}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
            {
              (page.length < 10) ? fillEmptyRows(page.length, 10) : ""
            }
          </Tbody>
        </Table>
      </TableContainer>
      <Flex width="100%" align="center" justifyContent="space-between">
        <ButtonGroup>
          <Button 
            size="xs" fontSize="1.5rem"
            variant='solid' colorScheme='primary'
            onClick={() => gotoPage(0)} disabled={!canPreviousPage}
            p={3} textAlign='center'
          >{"<<"}</Button>
          <Button 
            size="xs" fontSize="1.5rem"
            variant='solid' colorScheme='primary'
            onClick={previousPage} disabled={!canPreviousPage}
            p={3} textAlign='center'
          >{"<"}</Button>
        </ButtonGroup>
        <HStack gap={1}>
          <Text>Go to Page:</Text>
          <NumberInput defaultValue={pageIndex+1} min={1} max={pageCount ? pageCount : 1}
            size='sm' borderColor="grey.100"
            onChange={(pageNum) => gotoPage(pageNum-1)}
          >
            <NumberInputField width='5em'/>
            <NumberInputStepper borderColor="grey.500">
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </HStack>
        <ButtonGroup>
          <Button 
            size="xs" fontSize="1.5rem" 
            colorScheme='primary' variant='solid'
            onClick={nextPage} disabled={!canNextPage}
            p={3} textAlign='center'
          >{">"}</Button>
          <Button 
            size="xs" fontSize="1.5rem"
            colorScheme='primary' variant='solid'
            onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}
            p={3} textAlign='center'
          >{">>"}</Button>
        </ButtonGroup>
      </Flex>
      </VStack>
    </>
  );
}

export default ReactTable;