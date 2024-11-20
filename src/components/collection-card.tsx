import React from "react";
import { useNavigate } from "react-router-dom";
import { CoffeeCollection } from "../types/collection";

interface CollectionCardProps {
    collection: CoffeeCollection;
    width?: number;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
    collection,
    width = 230
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/collection/${collection.id}`);
    };

    return (
        <div className="relative">
            <div className="text-8am-black text-lg font-medium">
                {collection.headline}
            </div>

            <div
                className="relative rounded-lg overflow-hidden shadow-lg cursor-pointer bg-white hover:shadow-xl transition-shadow duration-300"
                style={{ width: '100%' }}
                onClick={handleClick}
            >
                <div className="aspect-[4/3] relative">
                    <img
                        src={collection.imageUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-sm bg-black/30">
                        <div className="text-8am-middle-grey text-sm">
                            Tuyển tập
                        </div>

                        <div className="text-white text-base font-medium">
                            {collection.name}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionCard; 