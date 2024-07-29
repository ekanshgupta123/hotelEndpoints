import FetchInfiniteQuery from "../components/test";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const searchResults = () => {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <div>
                <FetchInfiniteQuery />
            </div>
        </QueryClientProvider>
    )
};

export default searchResults;