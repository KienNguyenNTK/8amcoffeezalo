import React from 'react';
import { FaFacebookF, FaInstagram, FaLink, FaEnvelope } from 'react-icons/fa';
import ShareIcon from '../public/images/share-icon.svg';
import { Drawer } from 'vaul';
import TextArea from 'antd/es/input/TextArea';
import { Button, Rate } from 'antd';

interface ReviewBottleFormProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
}

const ReviewBottleForm: React.FC<ReviewBottleFormProps> = ({ isOpen, onClose, item }) => {
    const shareOptions = [
        { icon: <FaLink />, label: 'Copy link' },
        { icon: <FaFacebookF />, label: 'Facebook' },
        { icon: <FaInstagram />, label: 'Instagram' },
        { icon: <FaEnvelope />, label: 'Email' },
        { icon: <img src={ShareIcon} alt="Share" className="w-4 h-4" />, label: 'Thêm vào danh sách' },
    ];

    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-white/80" />
                <Drawer.Content className="fixed bottom-5 left-0 right-0 flex flex-col rounded-2xl bg-white"
                    style={{
                        zIndex: 1000,
                        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, .1)',
                        marginLeft: '8px',
                        marginRight: '8px',
                    }}
                >
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4 mb-2" />
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center gap-2 pb-4"
                                style={{
                                    borderBottom: '1.5px solid #f5f5f5',
                                }}
                            >
                                <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                <div>
                                    <div className="text-lg font-bold">{item.name}</div>
                                    <div className="text-8am-middle-grey">{item.origin.join(', ')}</div>
                                </div>
                            </div>

                            <div className="space-y-4 mt-4 flex flex-col items-center">
                                <TextArea
                                    placeholder="Cảm nhận của bạn..."
                                    className="w-full border-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    rows={10}
                                />

                                <div className="flex flex-col items-center gap-1">
                                    <Rate style={{ fontSize: '35px', width: '100%' }} />
                                    <div className="text-8am-middle-grey text-sm">
                                        Chạm để đánh giá
                                    </div>
                                </div>

                                <button className="w-full bg-8am-orange text-8am-white p-3 rounded-lg">Gửi</button>
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export default ReviewBottleForm;
