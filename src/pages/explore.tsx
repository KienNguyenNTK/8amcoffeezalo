import React from "react";
import { Page, Box, Text, Input, Button } from "zmp-ui";
import CoffeeCard from "../components/coffee-card";

const Explore = () => {
  const [searchValue, setSearchValue] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);

  return (
    <Page className="p-4">
      <Box p={4}>
        <Box className="flex justify-between items-center">
          <Text size="xLarge" bold>
            Khám phá
          </Text>
          <Button onClick={() => setShowAddForm(true)}>
            Thêm cà phê
          </Button>
        </Box>
        <Box mt={4}>
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Tìm kiếm..."
          />
        </Box>
      </Box>
      
      {/* {showAddForm ? (
        <AddCoffeeForm visible={showAddForm} onClose={() => setShowAddForm(false)} />
      ) : (
        <Box className="grid grid-cols-2 gap-4 p-4">
          <CoffeeCard />
          <CoffeeCard />
          <CoffeeCard />
          <CoffeeCard />
        </Box>
      )} */}
    </Page>
  );
};

export default Explore; 