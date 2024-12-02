import React, { useEffect, useState } from 'react';
import { FiEdit } from 'react-icons/fi';
import { IoCloseSharp } from "react-icons/io5";
import { Drawer } from 'vaul';
import { FaStar } from 'react-icons/fa';
import { notification, Progress, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';
import ReviewForm from './ReviewForm';
import { authService } from '../services/authService';
import { orderService } from '../firebase/orderService';
import { userService } from '../firebase/userService';
import { reviewService } from '../firebase/reviewService';
import { Review } from '../types/review';
import dayjs from 'dayjs';

interface ReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	review: any;
	coffee: any;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, review, coffee }) => {

	const [rating, setRating] = useState(review.rating);
	const [lstRating, setLstRating] = useState<number[]>([]);
	const [showReviewForm, setShowReviewForm] = useState(false);
	const [user, setUser] = useState<any>(null);
	const [order, setOrder] = useState<any>(null);
	const [hasBoughtCoffee, setHasBoughtCoffee] = useState(false);
	const [reviews, setReviews] = useState<Review[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [averageRating, setAverageRating] = useState(0);

	const fetchReviews = async () => {
		try {
			setIsLoading(true);
			const fetchedReviews = await reviewService.getReviewsByCoffeeId(coffee.id);
			setReviews(fetchedReviews);

			// Calculate average rating
			if (fetchedReviews.length > 0) {
				const avgRating = fetchedReviews.reduce((acc, rev) => acc + rev.rating, 0) / fetchedReviews.length;
				setAverageRating(avgRating);
				setRating(avgRating);
			}

			// Calculate rating distribution
			const ratingCounts = [0, 0, 0, 0, 0];
			fetchedReviews.forEach(rev => {
				ratingCounts[rev.rating - 1]++;
			});

			const totalReviews = fetchedReviews.length;
			const ratingPercentages = ratingCounts.map(count =>
				totalReviews > 0 ? (count / totalReviews) * 100 : 0
			);
			setLstRating(ratingPercentages.reverse());

		} catch (error) {
			console.error('Error fetching reviews:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (coffee?.id) {
			fetchReviews();
		}
	}, [coffee]);

	useEffect(() => {
		const getUser = async () => {
			const currentUser = await authService.getAuthenticatedUser();

			if (!currentUser) {
				return;
			}

			const userReal = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
			console.log('userReal: ', userReal);

			setUser(userReal);
		};
		getUser();
	}, []);

	useEffect(() => {
		const checkOrder = async () => {
			console.log('user: ', user);
			console.log('coffee: ', coffee);
			if (user && coffee) {
				const hasBoughtCoffee = await orderService.hasUserPurchased(user.id, { coffeeId: coffee.id });
				console.log('hasBoughtCoffee: ', hasBoughtCoffee);

				setHasBoughtCoffee(hasBoughtCoffee);
			}
		};
		checkOrder();
	}, [coffee, user]);

	useEffect(() => {
		const calculateRatingDistribution = () => {
			const ratingCounts = [0, 0, 0, 0, 0]; // Index 0-4 represents 1-5 stars
			review.lstReview.forEach((item: any) => {
				ratingCounts[item.rating - 1]++;
			});

			const totalReviews = review.lstReview.length;
			const ratingPercentages = ratingCounts.map(count =>
				totalReviews > 0 ? (count / totalReviews) * 100 : 0
			);

			setLstRating(ratingPercentages.reverse()); // Reverse to show 5 stars first
		};

		calculateRatingDistribution();
	}, [review.rating]);

	const handleCheckAddReview = () => {
		if (hasBoughtCoffee) {
			setShowReviewForm(true);
			onClose()
		}

		if (!hasBoughtCoffee) {
			notification.error({
				message: 'Chưa thể đánh giá',
				description: 'Bạn cần mua sản phẩm hoặc sản phẩm được xác nhận để có thể đánh giá',
				duration: 2,
				placement: 'top'
			});
		}

	}

	const formatDate = (date: any) => {
		if (date) {
			// Kiểm tra nếu là Timestamp từ Firebase
			if (date.seconds) {
				return (dayjs(new Date(date.seconds * 1000)).format('DD/MM/YYYY'));
			}
			// Kiểm tra nếu là Date object
			else if (date instanceof Date) {
				return (dayjs(date).format('DD/MM/YYYY'));
			}
			// Kiểm tra nếu là string
			else if (typeof date === 'string') {
				return (dayjs(date, 'DD/MM/YYYY').format('DD/MM/YYYY'));
			}
		}
	}

	return (
		<div>
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
									<div className="flex items-center justify-center gap-2 p-4 pl-0"
										style={{
											position: 'fixed',
											backgroundColor: 'white',
											top: 0,
											left: 10,
											zIndex: 1000,
											width: 'calc(100% - 16px)',
											borderRadius: '10px',
										}}
									>
										<button className="fixed left-4 top-4 bg-8am-gray rounded-full p-1 text-8am-white" onClick={onClose}>
											<IoCloseSharp className="w-5 h-5" />
										</button>

										<div className="text-lg font-bold">
											Cảm nhận từ hội viên
										</div>

										<button
											className="fixed right-4 top-4 bg-8am-gray rounded-full p-2 text-8am-white"
											onClick={handleCheckAddReview}
										>
											<FiEdit className="w-3 h-3" />
										</button>
									</div>
								</Drawer.Title>

								<div className='flex items-center gap-4'>
									<div className="flex flex-col text-center justify-center gap-1">
										<div className="text-6xl font-bold ">{averageRating.toFixed(1)}</div>
										<div className="flex justify-center gap-1 ">
											<Rate value={averageRating}
												allowHalf
												style={{
													color: '#ff5a23',
													fontSize: '16px',
												}}
											/>
										</div>
										<div className="text-gray-500 text-sm">
											{reviews.length} đánh giá
										</div>
									</div>

									<div
										style={{
											width: '55%',
										}}
									>
										{lstRating.map((rating, index) => (
											<div className='flex items-center gap-2'>
												<div className="text-xs text-gray-400">{lstRating.length - index}</div>
												<Progress percent={rating} showInfo={false} strokeColor="#ff5a23" />
											</div>
										))}
									</div>
								</div>


								<div className="pt-10">
									<div className="space-y-4">
										{isLoading ? (
											<div>Đang tải đánh giá...</div>
										) : reviews.length > 0 ? (
											reviews.map((rev) => (
												<div key={rev.id} className="bg-8am-light-grey-3 rounded-lg p-4">
													<div className="font-bold mb-1">{rev.user.name || 'Người dùng'}</div>
													<div className="flex gap-1 mb-2">
														<Rate value={rev.rating} allowHalf style={{ color: 'black', fontSize: '12px' }} />
													</div>
													<div className="text-sm text-gray-600">
														{rev.comment}
													</div>
													<div className="text-xs text-gray-400 mt-2">
														{formatDate(rev.createdAt)}
													</div>
												</div>
											))
										) : (
											<div>Chưa có đánh giá nào</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</Drawer.Content>
				</Drawer.Portal>
			</Drawer.Root>

			{showReviewForm && (
				<ReviewForm
					isOpen={showReviewForm}
					onClose={() => {
						setShowReviewForm(false)
						onClose()
						fetchReviews(); // Refresh reviews after new review is submitted
					}}
					item={coffee}
					user={user}
				/>
			)}
		</div>
	);
};

export default ReviewModal;
