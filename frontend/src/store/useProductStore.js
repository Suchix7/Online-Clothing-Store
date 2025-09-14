import { create } from "zustand";
import { axiosInstance } from "../lib/axiosInstance.js";

export const useProductStore = create((set, get) => ({
  fetchedProducts: null,
  isFetching: false,
  fetchProducts: async () => {
    try {
      const res = await axiosInstance.get("/product");
      set({ fetchedProducts: res.data });
    } catch (error) {
      console.log("Error while fetching in useProductStore: ", error);
      set({ fetchedProducts: null });
    } finally {
      set({ isFetching: false });
    }
  },
}));
