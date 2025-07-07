import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "~/lib/hono-client";

export const useHonoApi = () => {
  const queryClient = useQueryClient();

  const useProfile = () =>
    useQuery({
      queryKey: ["profile"],
      queryFn: async () => {
        const response = await client.rider.profile.$get();
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        return response.json();
      },
    });

  const useActiveOrders = () =>
    useQuery({
      queryKey: ["orders"],
      queryFn: async () => {
        const response = await client.rider.orders.actives.$get();
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        return response.json();
      },
    });

  const markAsPickedUpMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await client.rider.orders[":id"].pickup.$post({
        param: { id: orderId },
      });
      if (!response.ok) {
        throw new Error("Failed to mark as picked up");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: async ({
      orderId,
      confirmationCode,
    }: {
      orderId: string;
      confirmationCode?: number;
    }) => {
      const response = await client.rider.orders[":id"].deliver.$post({
        param: { id: orderId },
        json: confirmationCode ? { confirmationCode } : {},
      });
      if (!response.ok) {
        throw new Error("Failed to mark as delivered");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    useProfile,
    useActiveOrders,
    markAsPickedUpMutation,
    markAsDeliveredMutation,
  };
};
