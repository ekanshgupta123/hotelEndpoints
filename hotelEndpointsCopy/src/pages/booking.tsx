import HotelBooking from "@/components/HotelBooking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const page = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <HotelBooking />
    </QueryClientProvider>
  );
};

export default page;
