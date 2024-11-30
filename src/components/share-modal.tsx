import React, { useEffect, useState } from 'react';
import { FaFacebookF, FaInstagram, FaLink, FaEnvelope } from 'react-icons/fa';
import ShareIcon from '../public/images/share-icon.svg';
import ZaloIcon from '../public/images/zalo-icon.png';
import { Drawer } from 'vaul';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item }) => {
    const [isBottledDrink, setIsBottledDrink] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (item.coffeeId) {
            setIsBottledDrink(true);
        }
        else {
            setIsBottledDrink(false);
        }
    }, [item]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleFacebookShare = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    };

    const handleInstagramShare = () => {
        // Instagram không có API share trực tiếp, nên sẽ mở app Instagram
        window.location.href = 'instagram://';
    };

    const handleZaloShare = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://zalo.me/zalo-share?u=${url}`, '_blank');
    };

    const shareOptions = [
        { icon: <FaLink />, label: copySuccess ? 'Copied!' : 'Copy link', onClick: handleCopyLink },
        { icon: <FaFacebookF />, label: 'Facebook', onClick: handleFacebookShare },
        { icon: <FaInstagram />, label: 'Instagram', onClick: handleInstagramShare },
        // { icon: <FaEnvelope />, label: 'Email' },
        {
            icon: <div style={{
                fontSize: '1rem',
            }}>Zalo</div>, label: 'Zalo', onClick: handleZaloShare
        },
    ];

    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-white/40" />
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
                                <img src={isBottledDrink ? item?.images[0] : item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                <div>
                                    <div className="text-lg font-bold">{item.name}</div>
                                    <div className="text-8am-middle-grey">{isBottledDrink ? item?.origin.join(', ') : item?.region.join(', ')}</div>
                                </div>
                            </div>

                            <div className="space-y-4 mt-4">
                                {shareOptions.map((option, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors duration-200 bg-8am-light-grey-3"
                                        onClick={option.onClick}
                                    >
                                        <div className="text-8am-black text-base font-medium">{option.label}</div>
                                        <div className="text-8am-white bg-8am-gray rounded-full p-2">{option.icon}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export default ShareModal;
