import Reservation from "../../components/HotelReservation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

 const ReservationList = () => {
  const queryClient = new QueryClient();
  return (
      <QueryClientProvider client={queryClient}>
        <Reservation />
      </QueryClientProvider>
    );
 };
 
 export default ReservationList;