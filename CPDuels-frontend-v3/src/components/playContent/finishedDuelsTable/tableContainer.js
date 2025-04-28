import { useTable, useSortBy, useFilters, usePagination, useRowSelect } from 'react-table';
import Filter, { DefaultColumnFilter } from './filters';
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
import { motion } from 'framer-motion';
import { 
  FiChevronsLeft, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsRight,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

// Updated theme with new colors and styles
const THEME = {
  colors: {
    primary: {
      main: '#4F46E5',      // Deep indigo
      hover: '#4338CA',
      light: '#EEF2FF'
    },
    secondary: {
      main: '#14B8A6',      // Teal
      hover: '#0D9488',
      light: '#CCFBF1'
    },
    accent: {
      main: '#F59E0B',      // Amber
      hover: '#D97706',
      light: '#FEF3C7'
    },
    background: {
      light: '#FFFFFF',
      dark: '#1E1E2E'
    },
    text: {
      light: '#1F2937',
      dark: '#F1F5F9'
    }
  },
  borderRadius: '1rem',
  shadows: {
    card: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    button: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    hover: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
};

// Add new custom button component
const PaginationButton = ({ icon, children, ...props }) => (
  <Button
    leftIcon={icon}
    bg={THEME.colors.secondary.main}
    color="white"
    size="sm"
    px={4}
    shadow={THEME.shadows.button}
    _hover={{
      bg: THEME.colors.secondary.hover,
      transform: 'translateY(-2px)',
      shadow: THEME.shadows.hover
    }}
    transition="all 0.2s"
    {...props}
  >
    {children}
  </Button>
);

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
      defaultColumn: { Filter: DefaultColumnFilter },
      initialState: { pageIndex: 0, pageSize: 10 }
    },
    useFilters,
    useSortBy,
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

  const generateSortingIndicator = column => {
    if (!column.isSorted) return null;
    return column.isSortedDesc ? 
      <FiArrowDown style={{ display: 'inline', marginLeft: '4px' }}/> : 
      <FiArrowUp style={{ display: 'inline', marginLeft: '4px' }}/>;
  }

  const onChangeInSelect = event => {
    setPageSize(Number(event.target.value))
  }
  
  const onChangeInInput = event => {
    const page = event.target.value ? Number(event.target.value) - 1 : 0
    gotoPage(page)
  }

  const customStyles = {
    tableContainer: {
      background: useColorModeValue(THEME.colors.background.light, THEME.colors.background.dark),
      borderRadius: THEME.borderRadius,
      boxShadow: THEME.shadows.card,
      border: 'none',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
    header: {
      bg: useColorModeValue(THEME.colors.primary.light, THEME.colors.primary.main),
      color: useColorModeValue(THEME.colors.primary.main, 'white'),
      fontWeight: 'bold',
      fontSize: '0.875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    row: {
      _hover: {
        bg: useColorModeValue(THEME.colors.secondary.light, 'rgba(20, 184, 166, 0.1)'),
        transform: 'translateX(4px)',
        transition: 'all 0.2s'
      }
    }
  };

  return (
    <>
      <VStack spacing={6} width="fit-content">
        <TableContainer
          {...customStyles.tableContainer}
          width="41em"
          as={motion.div}
          whileHover={{ y: -3, boxShadow: THEME.shadows.hover }}
        >
          <Table {...getTableProps()} 
            size="md"
            mt={1}
            style={{ borderCollapse:"collapse" }}
          >
            <Thead>
              {headerGroups.map(headerGroup => (
                <Tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, index) => (
                    <Th
                      {...column.getHeaderProps()}
                      {...customStyles.header}
                      py={4}
                    >
                      <Center {...column.getSortByToggleProps()}>
                        {column.render("Header")}
                        {generateSortingIndicator(column)}
                      </Center>
                      {index !== 0 && <Filter column={column} />}
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
                    {...customStyles.row}
                  >
                    {row.cells.map(cell => {
                      if (rowIndex === page.length-1) {
                        return (
                          <Td {...cell.getCellProps()}
                            style={{ width: cell.width, textAlign: "center" }}
                            borderBottom="none"
                          >
                            {cell.render("Cell")}
                          </Td>
                        );
                      }
                      return (
                        <Td {...cell.getCellProps()}
                          style={{ width: cell.width, textAlign: "center" }}
                          borderBottom="solid 1px"
                          borderColor="grey.500"
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
        <Flex 
          width="100%" 
          justify="space-between" 
          align="center"
          px={6}
          py={2}
          bg={useColorModeValue('white', THEME.colors.background.dark)}
          borderRadius="lg"
          shadow="sm"
        >
          <ButtonGroup spacing={3}>
            <PaginationButton
              icon={<FiChevronsLeft />}
              onClick={() => gotoPage(0)}
              isDisabled={!canPreviousPage}
            >
              First
            </PaginationButton>
            <PaginationButton
              icon={<FiChevronLeft />}
              onClick={previousPage}
              isDisabled={!canPreviousPage}
            >
              Prev
            </PaginationButton>
          </ButtonGroup>

          <HStack spacing={4}>
            <Text 
              fontSize="sm" 
              fontWeight="medium"
              color={useColorModeValue(THEME.colors.text.light, THEME.colors.text.dark)}
            >
              Page {pageIndex + 1} of {pageOptions.length}
            </Text>
            <NumberInput
              size="sm"
              maxW={20}
              min={1}
              max={pageCount}
              value={pageIndex + 1}
              onChange={(value) => gotoPage(Number(value) - 1)}
            >
              <NumberInputField 
                borderRadius="md"
                borderColor={THEME.colors.secondary.main}
                _hover={{ borderColor: THEME.colors.secondary.hover }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper 
                  borderColor={THEME.colors.secondary.main}
                  color={THEME.colors.secondary.main}
                />
                <NumberDecrementStepper 
                  borderColor={THEME.colors.secondary.main}
                  color={THEME.colors.secondary.main}
                />
              </NumberInputStepper>
            </NumberInput>
          </HStack>

          <ButtonGroup spacing={3}>
            <PaginationButton
              icon={<FiChevronRight />}
              onClick={nextPage}
              isDisabled={!canNextPage}
            >
              Next
            </PaginationButton>
            <PaginationButton
              icon={<FiChevronsRight />}
              onClick={() => gotoPage(pageCount - 1)}
              isDisabled={!canNextPage}
            >
              Last
            </PaginationButton>
          </ButtonGroup>
        </Flex>
      </VStack>
    </>
  );
}

export default ReactTable;