import React from "react";

const ProductCard = ({ product }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded-md" />
            <h3 className="text-lg font-semibold mt-3">{product.name}</h3>
            <p className="text-blue-500 font-bold">${product.price}</p>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                Add to Cart
            </button>
        </div>
    );
};

export default ProductCard;
