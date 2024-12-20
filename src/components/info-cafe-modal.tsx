import React, { useEffect, useState } from 'react';
import { FaFacebookF, FaInstagram, FaLink, FaEnvelope } from 'react-icons/fa';
import ShareIcon from '../public/images/share-icon.svg';
import { Drawer } from 'vaul';
import { IoCloseSharp } from "react-icons/io5";

interface InfoCafeModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    dateCoffee: string;
}

const InfoCafeModal: React.FC<InfoCafeModalProps> = ({ isOpen, onClose, item, dateCoffee }) => {

    const [imageUrl, setImageUrl] = useState('')

    useEffect(() => {
        if (item.images) {
            setImageUrl(item.images[0])
        }
        else if (item.driveImages) {
            setImageUrl(`https://lh3.googleusercontent.com/d/${item.driveImages[0].fileId}?authuser=server`)
        }
    }, [item])

    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-white/40" />
                <Drawer.Content className="bg-gray-100 flex flex-col rounded-t-[10px] mt-24 h-[90%] lg:h-[320px] fixed bottom-0 left-0 right-0 outline-none"
                    style={{
                        zIndex: 1000,
                        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, .1)',
                        marginLeft: '8px',
                        marginRight: '8px',
                    }}
                >
                    <div className="p-4 bg-white rounded-t-[10px] flex-1 overflow-y-auto">
                        <div className="max-w-md mx-auto space-y-4 relative">
                            <div aria-hidden className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
                            <Drawer.Title>
                                <div className="flex items-center gap-2 p-4 pl-0"
                                    style={{
                                        borderBottom: '1.5px solid #f5f5f5',
                                        position: 'fixed',
                                        backgroundColor: 'white',
                                        top: 0,
                                        left: 10,
                                        width: 'calc(100% - 16px)',
                                        borderRadius: '10px',
                                    }}
                                >
                                    <img src={imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                    <div>
                                        <div className="text-lg font-bold">{item.name}</div>
                                        <div className="text-8am-middle-grey">{item.region.join(', ')}</div>
                                    </div>
                                    <button className="fixed right-4 top-4 bg-8am-gray rounded-full p-1 text-8am-white" onClick={onClose}>
                                        <IoCloseSharp className="w-5 h-5" />
                                    </button>
                                </div>
                            </Drawer.Title>
                            <div
                                style={{
                                    marginTop: 100,
                                }}
                            >
                                <div className="text-8am-middle-grey text-base font-medium">
                                    {item.beanInfo}
                                </div>

                                <div className="mb-4 pt-10" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}>
                                    <div className="text-8am-middle-grey text-sm font-medium">
                                        Độ cao
                                    </div>

                                    <div
                                        className="text-8am-black font-medium"
                                        style={{
                                            fontSize: '14px',
                                            width: '40%',
                                        }}
                                    >
                                        {item.altitude?.min} - {item.altitude?.max} m
                                    </div>
                                </div>

                                <div className="mb-4 " style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}>
                                    <div className="text-8am-middle-grey text-sm font-medium">
                                        Mức rang
                                    </div>

                                    <div
                                        className="text-8am-black font-medium"
                                        style={{
                                            fontSize: '14px',
                                            width: '40%',
                                        }}
                                    >
                                        {item.roastLevel.join(', ')}
                                    </div>
                                </div>

                                <div className="mb-4 " style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}>
                                    <div className="text-8am-middle-grey text-sm font-medium">
                                        Ngày rang
                                    </div>

                                    <div
                                        className="text-8am-black font-medium"
                                        style={{
                                            fontSize: '14px',
                                            width: '40%',
                                        }}
                                    >
                                        {dateCoffee}
                                    </div>
                                </div>

                                <div className="mb-4 " style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}>
                                    <div className="text-8am-middle-grey text-sm font-medium">
                                        Thời gian hết hạn
                                    </div>

                                    <div
                                        className="text-8am-black font-medium"
                                        style={{
                                            fontSize: '14px',
                                            width: '40%',
                                        }}
                                    >
                                        {item.expirationMonths ? item.expirationMonths + ' tháng' : 'Không có thông tin'}
                                    </div>
                                </div>

                                <div className="mb-4" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                }}>
                                    <div className="text-8am-middle-grey text-sm font-medium">
                                        Phương pháp sơ chế
                                    </div>

                                    <div
                                        className="text-8am-black font-medium"
                                        style={{
                                            fontSize: '14px',
                                            width: '40%',
                                        }}
                                    >
                                        {item.processingMethod.join(', ')}
                                    </div>
                                </div>

                                <div className="mb-4" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #F5F5F5',
                                    paddingBottom: 10,
                                    gap: 10,
                                }}>
                                    <div className="text-8am-middle-grey text-sm font-medium">
                                        Phương pháp pha chế đề xuất
                                    </div>

                                    <div
                                        className="text-8am-black font-medium"
                                        style={{
                                            fontSize: '14px',
                                            width: '42%',
                                        }}
                                    >
                                        {item.brewingMethods.espresso ? 'Espresso' : ''}
                                        {item.brewingMethods.pourOver ? 'Pour Over' : ''}
                                        {item.brewingMethods.phin ? 'Phin' : ''}
                                        {!item.brewingMethods.espresso && !item.brewingMethods.pourOver && !item.brewingMethods.phin && 'Chưa có đề xuất'}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export default InfoCafeModal;
