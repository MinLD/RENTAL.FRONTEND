"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { ProductCreateActions } from "@/components/own/products/product-management-types";
import type { CreateEquipmentListingRequest } from "@/types/inventory";

export function useOwnProductsController(
  createProduct: ProductCreateActions["create"],
) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const createRefreshRef = useRef<(() => void) | null>(null);
  const submittingRef = useRef(false);
  function handleOpenCreateProduct(refresh: () => void) {
    createRefreshRef.current = refresh;
    setIsCreateDrawerOpen(true);
  }

  async function handleCreateProduct(request: CreateEquipmentListingRequest) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsCreatingProduct(true);
    try {
      const result = await createProduct(request);
      if (!result.success) {
        toast.error(result.error.message);
        return result;
      }
      toast.success("Đã tạo sản phẩm.");
      setIsCreateDrawerOpen(false);
      createRefreshRef.current?.();
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo sản phẩm.",
      );
      throw error;
    } finally {
      submittingRef.current = false;
      setIsCreatingProduct(false);
    }
  }

  return {
    isCreateDrawerOpen,
    isCreatingProduct,
    setIsCreateDrawerOpen,
    handleOpenCreateProduct,
    handleCreateProduct,
  };
}
