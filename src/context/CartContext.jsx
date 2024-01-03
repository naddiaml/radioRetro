import React, { createContext, useState, useRef, useEffect } from "react";
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const cartRef = useRef([]);
    const [cart, setCart] = useState([]);

    const addToCart = (item, quantity) => {
        const existingItemIndex = cart.findIndex((product) => product.id === item.id);

        if (existingItemIndex !== -1) {
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity += quantity;
            setCart(updatedCart);
            setStockLocally(item.id, item.stock - updatedCart[existingItemIndex].quantity);
        } else {
            const newItem = { id: item.id, category: item.category, name: item.name, image: item.image, price: item.price, quantity };
            setCart([...cart, newItem]);
            setStockLocally(item.id, item.stock - quantity);
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            const removedItem = cart.find((item) => item.id === itemId);

            const productDocRef = doc(db, 'products', itemId);
            const productDoc = await getDoc(productDocRef);
            const currentStock = productDoc.data().stock;

            await updateDoc(productDocRef, { stock: currentStock + removedItem.quantity });

            setCart(cart.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    const setStockLocally = async (itemId, updatedStock) => {
        const productDocRef = doc(db, 'products', itemId);
        await updateDoc(productDocRef, { stock: updatedStock });
    };

    const getTotalQuantity = () => {
        return cart.reduce((total, item) => {
            const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
            return total + quantity;
        }, 0);
    };

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    return (
        <CartContext.Provider value={{ cartRef, cart, addToCart, removeFromCart, getTotalQuantity }}>
            {children}
        </CartContext.Provider>
    );
};