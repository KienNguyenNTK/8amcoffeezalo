import React from "react";
import { Page, Box, Text, Tabs } from "zmp-ui";
import CoffeeCard from "../components/coffee-card";

const Library = () => {
    return (
        <Page className="p-4">
            <Box p={4}>
                <Text size="xLarge" bold>
                    Thư viện
                </Text>
            </Box>

            <Tabs>
                <Tabs.Tab key="reading" label="Đang đọc">
                    <Box className="grid grid-cols-2 gap-4 p-4">
                        <CoffeeCard />
                        <CoffeeCard />
                    </Box>
                </Tabs.Tab>
                <Tabs.Tab key="saved" label="Đã lưu">
                    <Box className="grid grid-cols-2 gap-4 p-4">
                        <CoffeeCard />
                        <CoffeeCard />
                        <CoffeeCard />
                    </Box>
                </Tabs.Tab>
            </Tabs>
        </Page>
    );
};

export default Library; 