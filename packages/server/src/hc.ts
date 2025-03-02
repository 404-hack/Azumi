import { hc } from 'hono/client';
import type { 
  CreateMenuInput, 
  CreateMenuCategoryInput, 
  CreateMenuPackInput, 
  CreateMenuOptionGroupInput 
} from '@repo/types/menu';

type ApiType = {
  menu: {
    create: {
      post: {
        input: CreateMenuInput;
        output: {
          message: string;
          data: {
            id: string;
            name: string;
            description: string;
            image: string;
            price: number;
            priceDescription?: string;
            inStock: boolean;
            categoryId: string;
            packId?: string;
            optionGroupId?: string;
            shopId: string;
            createdAt: string;
            updatedAt: string;
          };
        };
      };
    };
    'category/create': {
      post: {
        input: CreateMenuCategoryInput;
        output: {
          message: string;
          data: {
            id: string;
            name: string;
            published: boolean;
            shopId: string;
            createdAt: string;
            updatedAt: string;
          };
        };
      };
    };
    'pack/create': {
      post: {
        input: CreateMenuPackInput;
        output: {
          message: string;
          data: {
            id: string;
            name: string;
            description: string;
            price: number;
            shopId: string;
            createdAt: string;
            updatedAt: string;
          };
        };
      };
    };
    'option-group/create': {
      post: {
        input: CreateMenuOptionGroupInput;
        output: {
          message: string;
          data: {
            optionGroup: {
              id: string;
              name: string;
              description: string;
              required: boolean;
              multiSelect: boolean;
              shopId: string;
              createdAt: string;
              updatedAt: string;
            };
            options: Array<{
              id: string;
              name: string;
              price: number;
              groupId: string;
              createdAt: string;
              updatedAt: string;
            }>;
          };
        };
      };
    };
    'menuCategoryWithItem/:shopId': {
      get: {
        output: {
          message: string;
          data: Array<{
            id: string;
            name: string;
            published: boolean;
            shopId: string;
            menus: Array<{
              id: string;
              name: string;
              description: string;
              image: string;
              price: number;
              priceDescription?: string;
              inStock: boolean;
              categoryId: string;
              packId?: string;
              optionGroupId?: string;
              shopId: string;
            }>;
          }>;
        };
      };
    };
    'category/:id': {
      get: {
        output: {
          message: string;
          data: {
            id: string;
            name: string;
            published: boolean;
            shopId: string;
            createdAt: string;
            updatedAt: string;
          };
        };
      };
    };
    'categories/:shopId': {
      get: {
        output: {
          message: string;
          data: Array<{
            id: string;
            name: string;
            published: boolean;
            shopId: string;
            createdAt: string;
            updatedAt: string;
          }>;
        };
      };
    };
  };
};

export const hcWithType = (baseUrl: string, init?: RequestInit) => {
  return {
    api: hc<ApiType>(baseUrl, init),
  };
};
