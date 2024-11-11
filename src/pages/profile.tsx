import React from "react";
import { Page, Box, Text, List, Avatar } from "zmp-ui";
import { useRecoilValue } from "recoil";
import { userState } from "state";

const Profile = () => {
    const { userInfo } = useRecoilValue(userState);

    return (
        <Page className="p-4">
            <Box p={4}>
                <Text size="xLarge" bold>
                    Tài khoản
                </Text>
            </Box>

            <Box className="bg-white rounded-lg p-4">
                <Box flex alignItems="center" mb={4}>
                    <Avatar
                        size={64}
                        src={userInfo.avatar.startsWith("http") ? userInfo.avatar : undefined}
                    />
                    <Box ml={4}>
                        <Text.Title>{userInfo.name}</Text.Title>
                        <Text className="text-gray-500">ID: {userInfo.id}</Text>
                    </Box>
                </Box>

                <List>
                    <List.Item title="Cài đặt" suffix={<Text>{">"}</Text>} />
                    <List.Item title="Trợ giúp" suffix={<Text>{">"}</Text>} />
                    <List.Item title="Về chúng tôi" suffix={<Text>{">"}</Text>} />
                </List>
            </Box>
        </Page>
    );
};

export default Profile; 