import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CategoryService, { Category } from '../services/categoryService';

// 獲取所有分類
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

// 根據 ID 獲取分類
export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => CategoryService.getCategory(categoryId),
    enabled: !!categoryId,
  });
};

// 創建分類
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryData: Partial<Category>) => CategoryService.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// 更新分類
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, categoryData }: { categoryId: string; categoryData: Partial<Category> }) => 
      CategoryService.updateCategory(categoryId, categoryData),
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] });
    },
  });
};

// 刪除分類
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryId: string) => CategoryService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
