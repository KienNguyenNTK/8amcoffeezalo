import React from "react";
import ShareIcon from "../public/images/share-icon.svg";
import LikeIcon from "../public/images/like-icon.svg";
import { CoffeeBean } from "types/coffee";
import { useNavigate } from 'react-router-dom';

const CoffeeCard: React.FunctionComponent<CoffeeBean> = ({
  imageUrl,
  name,
  id
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/coffee/${id}`);
  };

  return (
    <div onClick={handleClick} className="relative bg-gray-100 shadow-md rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5 cursor-pointer aspect-[3/4]"
      style={{
        height: '72vw',
        width: "100%",
      }}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-5 right-3 flex gap-2">
        <button
          // onClick={onShare}5
          className="p-2 rounded-full bg-8am-light-grey-2 backdrop-blur-sm hover:bg-white/30"
        >
          <img src={ShareIcon} alt="Share" className="w-5 h-5" />
        </button>
        <button
          // onClick={onLike}
          className="p-2 rounded-full bg-8am-light-grey-2 backdrop-blur-sm hover:bg-white/30"
        >
          <img src={LikeIcon} alt="Like" className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default CoffeeCard; 