import React, { useState, useEffect } from 'react';
import { fetchReviews, submitReview } from '../utils/api';

const ReviewSystem = ({ itemId }) => {
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState('');
    const [rating, setRating] = useState(1);

    useEffect(() => {
        const loadReviews = async () => {
            const fetchedReviews = await fetchReviews(itemId);
            setReviews(fetchedReviews);
        };
        loadReviews();
    }, [itemId]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (newReview.trim()) {
            await submitReview(itemId, { review: newReview, rating });
            setNewReview('');
            setRating(1);
            const updatedReviews = await fetchReviews(itemId);
            setReviews(updatedReviews);
        }
    };

    return (
        <div className="review-system">
            <h3>Reviews</h3>
            <div className="reviews-list">
                {reviews.map((review, index) => (
                    <div key={index} className="review">
                        <p><strong>Rating: {review.rating}</strong></p>
                        <p>{review.review}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleReviewSubmit}>
                <textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Leave a review..."
                    required
                />
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={5}>5 Stars</option>
                </select>
                <button type="submit">Submit Review</button>
            </form>
        </div>
    );
};

export default ReviewSystem;